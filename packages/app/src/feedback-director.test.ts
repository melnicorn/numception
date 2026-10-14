import { type GameEvent, initialAppState, type NodeId, parseTuning, step } from '@numception/core';
import { describe, expect, it } from 'vitest';
import type { AudioChannels, AudioPort, CueId, CueParams } from './audio-port';
import { createFeedbackDirector, cuesFor, hapticsFor, solveStep } from './feedback-director';
import { DEFAULT_FEEDBACK_FLAGS, type FeedbackFlags, feedbackFlagsOf } from './feedback-flags';
import { type HapticKind, type HapticsPort, noHaptics } from './haptics-port';

type Call =
  | { readonly fn: 'play'; readonly cue: CueId; readonly params?: CueParams }
  | { readonly fn: 'setEnabled'; readonly channels: AudioChannels }
  | { readonly fn: 'unlock' | 'suspend' | 'resume' };

function recordingAudio(): { audio: AudioPort; calls: Call[] } {
  const calls: Call[] = [];
  const audio: AudioPort = {
    unlock: () => calls.push({ fn: 'unlock' }),
    play: (cue, params) => calls.push(params === undefined ? { fn: 'play', cue } : { fn: 'play', cue, params }),
    setEnabled: (channels) => calls.push({ fn: 'setEnabled', channels }),
    suspend: () => calls.push({ fn: 'suspend' }),
    resume: () => calls.push({ fn: 'resume' }),
  };
  return { audio, calls };
}

function recordingHaptics(): { haptics: HapticsPort; impacts: HapticKind[] } {
  const impacts: HapticKind[] = [];
  return { haptics: { impact: (kind) => impacts.push(kind) }, impacts };
}

const parsedTuning = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsedTuning.ok) throw new Error(parsedTuning.error.message);
const TUNING = parsedTuning.value;

const node = (tier: number, index = 0): NodeId => ({ tier, index });
const tap = { roundId: 'r', cellIndex: 0, responseMs: 100 };
const solved = (tier: number): GameEvent => ({ type: 'PuzzleSolved', nodeId: node(tier), ...tap });
const plays = (calls: readonly Call[]) => calls.filter((c) => c.fn === 'play');

describe('cuesFor', () => {
  it.each<[string, readonly GameEvent[], ReturnType<typeof cuesFor>]>([
    ['PuzzleSolved at tier 1', [solved(1)], [{ cue: 'solve', params: { step: 0 } }]],
    ['SoftMiss', [{ type: 'SoftMiss', nodeId: node(1), ...tap }], [{ cue: 'softMiss' }]],
    ['WrongTap (Zen)', [{ type: 'WrongTap', nodeId: node(1), ...tap }], [{ cue: 'wrongZen' }]],
    [
      'a round change',
      [
        { type: 'RoundCompleted', roundId: 'r', roundOrdinal: 0 },
        { type: 'RoundStarted', roundId: 's', roundOrdinal: 1 },
      ],
      [{ cue: 'whoosh' }],
    ],
    ['a session opening its first round', [{ type: 'ProfileCreated', profileId: 'p' }, { type: 'RoundStarted', roundId: 'r', roundOrdinal: 0 }], []],
    ['RoundCollapsed', [{ type: 'RoundCollapsed', roundId: 'r', nodeId: node(2) }], []],
    ['InputDropped', [{ type: 'InputDropped', command: 'TapCell', presentation: 'solve' }], []],
    [
      'a lifecycle pause that completes a round change',
      [
        { type: 'RoundCompleted', roundId: 'r', roundOrdinal: 0 },
        { type: 'RoundStarted', roundId: 's', roundOrdinal: 1 },
        { type: 'Paused', reason: 'lifecycle', pauseReasons: ['lifecycle'] },
      ],
      [],
    ],
  ])('%s', (_name, events, expected) => {
    expect(cuesFor(events)).toEqual(expected);
  });

  it('steps the solve down one scale step per tier', () => {
    expect([1, 2, 3, 4].map(solveStep)).toEqual([0, 1, 2, 3]);
    expect(cuesFor([solved(1), solved(2), solved(3)]).map((c) => c.params?.step)).toEqual([0, 1, 2]);
  });
});

describe('hapticsFor', () => {
  it.each<[string, readonly GameEvent[], readonly HapticKind[]]>([
    ['PuzzleSolved', [solved(1)], ['light']],
    ['two solves in one batch (a collapse)', [solved(1), { type: 'RoundCollapsed', roundId: 'r', nodeId: node(2) }, solved(2)], ['light', 'light']],
    ['SoftMiss', [{ type: 'SoftMiss', nodeId: node(1), ...tap }], []],
    ['WrongTap', [{ type: 'WrongTap', nodeId: node(1), ...tap }], []],
    [
      'a round change',
      [
        { type: 'RoundCompleted', roundId: 'r', roundOrdinal: 0 },
        { type: 'RoundStarted', roundId: 's', roundOrdinal: 1 },
      ],
      [],
    ],
    ['RoundCollapsed', [{ type: 'RoundCollapsed', roundId: 'r', nodeId: node(2) }], []],
    ['a lifecycle pause', [solved(1), { type: 'Paused', reason: 'lifecycle', pauseReasons: ['lifecycle'] }], []],
  ])('%s', (_name, events, expected) => {
    expect(hapticsFor(events)).toEqual(expected);
  });
});

describe('createFeedbackDirector', () => {
  it('taps a light impact once per solve, haptics on by default, and nothing for other events', () => {
    const { audio } = recordingAudio();
    const { haptics, impacts } = recordingHaptics();
    const director = createFeedbackDirector({ audio, haptics });
    director.handle([solved(1)]);
    director.handle([{ type: 'SoftMiss', nodeId: node(1), ...tap }]);
    director.handle([{ type: 'WrongTap', nodeId: node(1), ...tap }]);
    director.handle([
      { type: 'RoundCompleted', roundId: 'r', roundOrdinal: 0 },
      { type: 'RoundStarted', roundId: 's', roundOrdinal: 1 },
    ]);
    director.handle([solved(2)]);
    expect(impacts).toEqual(['light', 'light']);
  });

  it('taps nothing with haptics off, independently of the sound effects', () => {
    const { audio, calls } = recordingAudio();
    const { haptics, impacts } = recordingHaptics();
    let flags: FeedbackFlags = { effects: true, music: false, haptics: false };
    const director = createFeedbackDirector({ audio, haptics, flags: () => flags });
    director.handle([solved(1)]);
    expect(impacts).toEqual([]);
    expect(plays(calls)).toHaveLength(1);
    flags = { effects: false, music: false, haptics: true };
    director.handle([solved(1)]);
    expect(impacts).toEqual(['light']);
    expect(plays(calls)).toHaveLength(1);
    expect(director.flags()).toEqual({ effects: false, music: false, haptics: true });
    // The audio port hears its channels only.
    expect(calls.at(-1)).toEqual({ fn: 'setEnabled', channels: { effects: false, music: false } });
  });

  it('plays each batch’s cues on the audio port, effects on by default', () => {
    const { audio, calls } = recordingAudio();
    const director = createFeedbackDirector({ audio, haptics: noHaptics });
    expect(director.flags()).toEqual(DEFAULT_FEEDBACK_FLAGS);
    expect(calls).toEqual([{ fn: 'setEnabled', channels: { effects: true, music: false } }]);
    director.handle([solved(2)]);
    director.handle([{ type: 'WrongTap', nodeId: node(1), ...tap }]);
    expect(plays(calls)).toEqual([
      { fn: 'play', cue: 'solve', params: { step: 1 } },
      { fn: 'play', cue: 'wrongZen' },
    ]);
  });

  it('plays nothing with effects off, and again once they are back on', () => {
    const { audio, calls } = recordingAudio();
    let flags: FeedbackFlags = { effects: false, music: false, haptics: true };
    const director = createFeedbackDirector({ audio, haptics: noHaptics, flags: () => flags });
    director.handle([solved(1), { type: 'SoftMiss', nodeId: node(1), ...tap }]);
    expect(plays(calls)).toEqual([]);
    // The settings change (e.g. a SetSetting in the batch): the channels follow before the batch plays.
    flags = { effects: true, music: false, haptics: true };
    director.handle([solved(1)]);
    expect(calls.at(-2)).toEqual({ fn: 'setEnabled', channels: { effects: true, music: false } });
    expect(plays(calls)).toHaveLength(1);
    flags = { effects: false, music: true, haptics: true };
    director.handle([solved(1)]);
    expect(plays(calls)).toHaveLength(1);
    // Unchanged channels are not set again.
    const sets = calls.filter((c) => c.fn === 'setEnabled').length;
    director.handle([solved(1)]);
    expect(calls.filter((c) => c.fn === 'setEnabled')).toHaveLength(sets);
  });

  it('suspends on a lifecycle pause and resumes on its return; other pause reasons leave the audio alone', () => {
    const { audio, calls } = recordingAudio();
    const director = createFeedbackDirector({ audio, haptics: noHaptics });
    director.handle([{ type: 'Paused', reason: 'panel', pauseReasons: ['panel'] }]);
    director.handle([{ type: 'Paused', reason: 'lifecycle', pauseReasons: ['panel', 'lifecycle'] }]);
    director.handle([{ type: 'Resumed', reason: 'lifecycle', pauseReasons: ['panel'] }]);
    director.unlock();
    expect(calls.slice(1).map((c) => c.fn)).toEqual(['suspend', 'resume', 'unlock']);
  });

  it('reads the active profile’s settings as its flags, the defaults before a profile', () => {
    expect(feedbackFlagsOf(initialAppState())).toEqual(DEFAULT_FEEDBACK_FLAGS);
    const ctx = { nowMs: 0, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: ['a', 'b'], seed32: [1, 2] } } as const;
    let state = step(initialAppState(), { command: { type: 'StartSession' }, ctx }, TUNING).state;
    expect(feedbackFlagsOf(state)).toEqual({ effects: true, music: false, haptics: true });
    state = step(state, { command: { type: 'SetSetting', key: 'effects', value: false }, ctx }, TUNING).state;
    state = step(state, { command: { type: 'SetSetting', key: 'haptics', value: false }, ctx }, TUNING).state;
    expect(feedbackFlagsOf(state)).toEqual({ effects: false, music: false, haptics: false });
  });
});
