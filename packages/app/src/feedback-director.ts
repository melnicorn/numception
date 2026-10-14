import type { GameEvent } from '@numception/core';
import type { AudioPort, CueId, CueParams } from './audio-port';
import { DEFAULT_FEEDBACK_FLAGS, type FeedbackFlags } from './feedback-flags';
import type { HapticsPort } from './haptics-port';

export type FeedbackDirectorOptions = {
  readonly audio: AudioPort;
  /** Wired now, used from entry 3 (haptics). */
  readonly haptics: HapticsPort;
  readonly flags?: FeedbackFlags;
};

/** The one mapper from events to the audio and haptics ports (AD-16). */
export type FeedbackDirector = {
  /** Plays the feedback for one dispatch's events (the batch the renderer sees). */
  readonly handle: (events: readonly GameEvent[]) => void;
  /** From a user gesture: unlocks the audio output. */
  readonly unlock: () => void;
  readonly flags: () => FeedbackFlags;
  readonly setFlags: (flags: FeedbackFlags) => void;
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
 * Creates the feedback director (AD-16): the only place events turn into
 * `AudioPort` (and, from entry 3, `HapticsPort`) calls, gated by the effects and
 * music flags. A lifecycle pause suspends the audio output; the resume resumes it.
 */
export function createFeedbackDirector(options: FeedbackDirectorOptions): FeedbackDirector {
  const { audio } = options;
  let flags = options.flags ?? DEFAULT_FEEDBACK_FLAGS;
  audio.setEnabled(flags);

  return {
    handle(events) {
      for (const event of events) {
        if (event.type === 'Paused' && event.reason === 'lifecycle') audio.suspend();
        if (event.type === 'Resumed' && event.reason === 'lifecycle') audio.resume();
      }
      if (!flags.effects) return;
      for (const { cue, params } of cuesFor(events)) {
        if (params === undefined) audio.play(cue);
        else audio.play(cue, params);
      }
    },
    unlock: () => audio.unlock(),
    flags: () => flags,
    setFlags(next) {
      flags = { effects: next.effects, music: next.music };
      audio.setEnabled(flags);
    },
  };
}
