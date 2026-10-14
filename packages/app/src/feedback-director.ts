import type { GameEvent } from '@numception/core';
import type { AudioPort, CueId, CueParams } from './audio-port';
import { DEFAULT_FEEDBACK_FLAGS, type FeedbackFlags } from './feedback-flags';
import type { HapticKind, HapticsPort } from './haptics-port';

export type FeedbackDirectorOptions = {
  readonly audio: AudioPort;
  readonly haptics: HapticsPort;
  /**
   * The current switches, read on every `handle` (the client passes the active
   * profile's settings, `feedbackFlagsOf(game.getState())`); the defaults when omitted.
   */
  readonly flags?: () => FeedbackFlags;
};

/** The one mapper from events to the audio and haptics ports (AD-16). */
export type FeedbackDirector = {
  /** Plays the feedback for one dispatch's events (the batch the renderer sees). */
  readonly handle: (events: readonly GameEvent[]) => void;
  /** From a user gesture: unlocks the audio output. */
  readonly unlock: () => void;
  /** The switches as last applied. */
  readonly flags: () => FeedbackFlags;
};

/** The scale step a solve at `tier` sounds: tier 1 the top note, one step lower per tier. */
export function solveStep(tier: number): number {
  return Math.max(0, Math.floor(tier) - 1);
}

/** A cue to play. */
export type Cue = { readonly cue: CueId; readonly params?: CueParams };

/**
 * The cues for one batch of events, in order (FR-41). `RoundStarted` whooshes only
 * as a round change (with its `RoundCompleted`), not when a session opens. A batch
 * that pauses for the lifecycle plays nothing (the app is leaving). Zen-only for
 * now: every round is Zen, so a wrong tap is the soft `wrongZen` tone.
 */
export function cuesFor(events: readonly GameEvent[]): readonly Cue[] {
  if (events.some((e) => e.type === 'Paused' && e.reason === 'lifecycle')) return [];
  const roundChange = events.some((e) => e.type === 'RoundCompleted');
  const cues: Cue[] = [];
  for (const event of events) {
    switch (event.type) {
      case 'PuzzleSolved':
        cues.push({ cue: 'solve', params: { step: solveStep(event.nodeId.tier) } });
        break;
      case 'SoftMiss':
        cues.push({ cue: 'softMiss' });
        break;
      case 'WrongTap':
        cues.push({ cue: 'wrongZen' });
        break;
      case 'RoundStarted':
        if (roundChange) cues.push({ cue: 'whoosh' });
        break;
      default:
        // RoundCollapsed has no sound (the next tier's solve covers it).
        break;
    }
  }
  return cues;
}

/**
 * The haptic impacts for one batch of events, in order (FR-41): a light tap on each
 * `PuzzleSolved`, nothing else (no haptics on misses, wrong taps or transitions).
 * A batch that pauses for the lifecycle plays nothing, as for the cues.
 */
export function hapticsFor(events: readonly GameEvent[]): readonly HapticKind[] {
  if (events.some((e) => e.type === 'Paused' && e.reason === 'lifecycle')) return [];
  return events.flatMap((e) => (e.type === 'PuzzleSolved' ? ['light' as const] : []));
}

/**
 * Creates the feedback director (AD-16): the only place events turn into
 * `AudioPort` and `HapticsPort` calls, the cues gated by the effects (and music)
 * flags and the impacts by the haptics flag, read from `options.flags` on every
 * batch (a change reaches the audio port's channels before the batch plays). A
 * lifecycle pause suspends the audio output; the resume resumes it.
 */
export function createFeedbackDirector(options: FeedbackDirectorOptions): FeedbackDirector {
  const { audio, haptics } = options;
  const read = options.flags ?? (() => DEFAULT_FEEDBACK_FLAGS);
  let flags = read();
  audio.setEnabled({ effects: flags.effects, music: flags.music });

  /** Takes the current switches, telling the audio port when its channels change. */
  function refresh(): void {
    const next = read();
    if (next.effects !== flags.effects || next.music !== flags.music) audio.setEnabled({ effects: next.effects, music: next.music });
    flags = { effects: next.effects, music: next.music, haptics: next.haptics };
  }

  return {
    handle(events) {
      refresh();
      for (const event of events) {
        if (event.type === 'Paused' && event.reason === 'lifecycle') audio.suspend();
        if (event.type === 'Resumed' && event.reason === 'lifecycle') audio.resume();
      }
      if (flags.effects) {
        for (const { cue, params } of cuesFor(events)) {
          if (params === undefined) audio.play(cue);
          else audio.play(cue, params);
        }
      }
      if (flags.haptics) for (const kind of hapticsFor(events)) haptics.impact(kind);
    },
    unlock: () => audio.unlock(),
    flags: () => flags,
  };
}
