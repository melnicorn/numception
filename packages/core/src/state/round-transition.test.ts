import { describe, expect, it } from 'vitest';
import { parseSave } from '../save/parse-save';
import { serializeGame } from '../save/serialize-game';
import { KILN_TOKENS } from '../theme/kiln-tokens';
import type { ThemeCatalog } from '../theme/theme-catalog';
import type { Transition } from '../transition/transition';
import type { TransitionCatalog } from '../transition/transition-catalog';
import { parseTuning } from '../tuning/parse-tuning';
import { selectView } from '../view/select-view';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 2,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 1200, collapseMs: 800, roundTransitionMs: 900, calmMotionScale: 1.25, softMissMs: 600 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

const THEMES: ThemeCatalog = [KILN_TOKENS, Object.freeze({ ...KILN_TOKENS, themeId: 'moonwater', name: 'Moonwater', surface: '#16242C' })];

function transition(transitionId: string, tag: Transition['tag'] = 'calm'): Transition {
  return { kind: 'Transition', schemaVersion: 1, transitionId, name: transitionId, tag, start: 'after-tap', maxFlashesPerSecond: 1, audioCue: 'whoosh' };
}
/** The shipped calm set, the Minimal crossfade and an intense one Zen must never draw. */
const TRANSITIONS: TransitionCatalog = ['crossfade', 'fade', 'interpolate', 'ripple', 'snow'].map((id) => transition(id)).concat(transition('radiate', 'intense'));
const CALM_ROTATION = ['fade', 'interpolate', 'ripple', 'snow'];

function ctx(i: number, rootSeed: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [rootSeed, i] } };
}

function activeRound(state: AppState): Round {
  const game = state.profiles[state.activeProfileId ?? ''];
  const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  if (round === undefined) throw new Error('no round');
  return round;
}

type Run = { transitions: string[]; beats: string[]; started: GameEvent[]; state: AppState };

/** Plays `rounds` round changes from a new profile seeded `rootSeed`, after `setup` commands. */
function play(rootSeed: number, rounds: number, setup: readonly Command[] = []): Run {
  let k = 0;
  const started: GameEvent[] = [];
  const run = (state: AppState, command: Command) => {
    const r = step(state, { command, ctx: ctx(k++, rootSeed) }, tuning, THEMES, {}, TRANSITIONS);
    const bad = r.events.find((e) => e.type === 'CommandRejected');
    if (bad !== undefined) throw new Error(JSON.stringify(bad));
    started.push(...r.events.filter((e) => e.type === 'RoundStarted'));
    return r.state;
  };
  let state = run(initialAppState(), { type: 'StartSession' });
  for (const command of setup) state = run(state, command);
  const transitions: string[] = [];
  const beats: string[] = [];
  for (let guard = 0; transitions.length < rounds; guard += 1) {
    if (guard > 400) throw new Error('no round change');
    const round = activeRound(state);
    const node = round.viewPath[round.viewPath.length - 1];
    const puzzle = node === undefined ? undefined : roundPuzzle(round, node);
    if (node === undefined || puzzle === undefined) throw new Error('no puzzle in view');
    state = run(state, { type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex });
    state = run(state, { type: 'Tick', elapsedMs: 600 });
    const next = activeRound(state);
    if (next.roundId !== round.roundId) {
      transitions.push(next.transitionId);
      expect(next.presentation.kind).toBe('roundStart');
      beats.push(next.presentation.transitionId);
      expect(selectView(state, tuning, THEMES)?.presentation.transitionId).toBe(next.transitionId);
    }
    state = run(state, { type: 'Tick', elapsedMs: 5000 });
  }
  return { transitions, beats, started, state };
}

describe('a transition each round change (AD-15, FR-26)', () => {
  it('Zen at Calm (the Kid default) only ever draws calm transitions, never the Minimal crossfade, never twice running', () => {
    for (const seed of [1, 42, 9001]) {
      const { transitions, beats } = play(seed, 24);
      for (const id of transitions) expect(CALM_ROTATION).toContain(id);
      expect(beats).toEqual(transitions);
      for (let i = 1; i < transitions.length; i += 1) expect(transitions[i], `seed ${seed} change ${i}`).not.toBe(transitions[i - 1]);
      expect(new Set(transitions).size).toBeGreaterThan(2);
    }
  });

  it('Zen at Full draws calm transitions too: intense ones wait for Normal', () => {
    const { transitions } = play(5, 24, [{ type: 'SetSetting', key: 'motion', value: 'full' }]);
    for (const id of transitions) expect(CALM_ROTATION).toContain(id);
  });

  it('Minimal (the setting or OS Reduce Motion) always crossfades', () => {
    expect(play(3, 6, [{ type: 'SetSetting', key: 'motion', value: 'minimal' }]).transitions).toEqual(Array(6).fill('crossfade'));
    expect(play(3, 6, [{ type: 'SetOsPreferences', reduceMotion: true }]).transitions).toEqual(Array(6).fill('crossfade'));
  });

  it('is deterministic per rootSeed', () => {
    expect(play(77, 10).transitions).toEqual(play(77, 10).transitions);
  });

  it('RoundStarted carries the transition, so the feedback director can play its cue', () => {
    const { started, transitions } = play(8, 3);
    expect(started.map((e) => (e.type === 'RoundStarted' ? e.transitionId : null)).slice(1)).toEqual(transitions);
  });

  it('a dev override forces its transition while it is in the pool; Minimal still crossfades; null clears it', () => {
    expect(play(11, 4, [{ type: 'SetTransitionOverride', transitionId: 'ripple' }]).transitions).toEqual(['ripple', 'ripple', 'ripple', 'ripple']);
    // Not in a Zen pool (intense) or not registered: the usual draw.
    for (const transitionId of ['radiate', 'nowhere']) {
      for (const id of play(11, 6, [{ type: 'SetTransitionOverride', transitionId }]).transitions) expect(CALM_ROTATION).toContain(id);
    }
    const minimal = play(11, 2, [{ type: 'SetTransitionOverride', transitionId: 'ripple' }, { type: 'SetSetting', key: 'motion', value: 'minimal' }]);
    expect(minimal.transitions).toEqual(['crossfade', 'crossfade']);
    const cleared = play(11, 6, [{ type: 'SetTransitionOverride', transitionId: 'ripple' }, { type: 'SetTransitionOverride', transitionId: null }]);
    expect(cleared.transitions).toEqual(play(11, 6).transitions);
  });

  it('rejects a malformed override, and works without a profile as runtime state', () => {
    const bad = step(initialAppState(), { command: { type: 'SetTransitionOverride', transitionId: 7 } as unknown as Command, ctx: ctx(0, 1) }, tuning);
    expect(bad.events).toMatchObject([{ type: 'CommandRejected', command: 'SetTransitionOverride', code: 'invalid-command' }]);
    const set = step(initialAppState(), { command: { type: 'SetTransitionOverride', transitionId: 'fade' }, ctx: ctx(0, 1) }, tuning);
    expect(set.state.overrides.transitionId).toBe('fade');
    expect(set.events).toEqual([]);
  });

  it('keeps the round’s transition across save and load, and the next change avoids it', () => {
    const { state, transitions } = play(21, 2);
    const game = state.profiles[state.activeProfileId ?? ''] as GameState;
    const loaded = parseSave(JSON.stringify(serializeGame(game, 1)));
    if (!loaded.ok) throw new Error(loaded.error.message);
    const resumed = step(initialAppState(), { command: { type: 'StartSession', restore: loaded.value.game }, ctx: ctx(999, 21) }, tuning, THEMES, {}, TRANSITIONS).state;
    expect(activeRound(resumed).transitionId).toBe(transitions[1]);
  });
});
