import { describe, expect, it } from 'vitest';
import { parseSave } from '../save/parse-save';
import { serializeGame } from '../save/serialize-game';
import { KILN_TOKENS } from '../theme/kiln-tokens';
import type { ThemeCatalog } from '../theme/theme-catalog';
import { parseTuning } from '../tuning/parse-tuning';
import { selectView } from '../view/select-view';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import { completePresentation } from './complete-presentation';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';
import { withGame } from './with-game';

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

/** A dark Zen theme beside Kiln (a test stand-in for content/themes/moonwater.json). */
const MOON = Object.freeze({ ...KILN_TOKENS, themeId: 'moonwater', name: 'Moonwater', surface: '#16242C' });
const THEMES: ThemeCatalog = [MOON, KILN_TOKENS];

function ctx(i: number, rootSeed: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [rootSeed, i] } };
}

function activeRound(state: AppState): Round {
  const game = state.profiles[state.activeProfileId ?? ''];
  const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  if (round === undefined) throw new Error('no round');
  return round;
}

/** Plays `rounds` whole rounds from a new profile seeded `rootSeed`; returns each round's theme and the end state. */
function play(rootSeed: number, rounds: number): { themes: string[]; state: AppState; roundStartFrom: (string | undefined)[] } {
  let k = 0;
  const run = (state: AppState, command: Command) => {
    const r = step(state, { command, ctx: ctx(k++, rootSeed) }, tuning, THEMES);
    const bad = r.events.find((e) => e.type === 'CommandRejected');
    if (bad !== undefined) throw new Error(JSON.stringify(bad));
    return r.state;
  };
  let state = run(initialAppState(), { type: 'StartSession' });
  const themes = [activeRound(state).themeId];
  const roundStartFrom: (string | undefined)[] = [];
  for (let guard = 0; themes.length <= rounds; guard += 1) {
    if (guard > 200) throw new Error(`no round change after ${guard} taps: ${JSON.stringify(activeRound(state).viewPath)} ${activeRound(state).presentation.kind}`);
    const round = activeRound(state);
    const node = round.viewPath[round.viewPath.length - 1];
    const puzzle = node === undefined ? undefined : roundPuzzle(round, node);
    if (node === undefined || puzzle === undefined) throw new Error('no puzzle in view');
    state = run(state, { type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex });
    // Tick to the end of the solve beat; a solve of the top opens the next round on roundStart.
    state = run(state, { type: 'Tick', elapsedMs: 600 });
    const next = activeRound(state);
    if (next.roundId !== round.roundId) {
      themes.push(next.themeId);
      const view = selectView(state, tuning, THEMES);
      expect(view?.presentation.kind).toBe('roundStart');
      roundStartFrom.push(view?.presentation.from?.theme.themeId);
      expect(view?.presentation.to?.theme.themeId).toBe(next.themeId);
    }
    state = completePresentation(state, tuning, THEMES).state;
  }
  return { themes, state, roundStartFrom };
}

describe('a new theme each round (AD-15, FR-25)', () => {
  it('opens in Kiln and alternates with Moonwater, round after round; the round change draws the old theme to the new', () => {
    const { themes, roundStartFrom } = play(4242, 3);
    expect(themes).toEqual(['kiln', 'moonwater', 'kiln', 'moonwater']);
    expect(roundStartFrom).toEqual(['kiln', 'moonwater', 'kiln']);
  });

  it('gives the same theme sequence for the same rootSeed', () => {
    expect(play(99, 2).themes).toEqual(play(99, 2).themes);
  });

  it('draws the view in the round’s theme, and a save reopens it in the same theme', () => {
    const { state } = play(7, 1);
    const round = activeRound(state);
    expect(round.themeId).toBe('moonwater');
    expect(selectView(state, tuning, THEMES)?.theme).toBe(MOON);
    const game = state.profiles[state.activeProfileId ?? ''] as GameState;
    const loaded = parseSave(JSON.stringify(serializeGame(game, 1)));
    if (!loaded.ok) throw new Error(loaded.error.message);
    const resumed = step(initialAppState(), { command: { type: 'StartSession', restore: loaded.value.game }, ctx: ctx(999, 7) }, tuning, THEMES).state;
    expect(activeRound(resumed).themeId).toBe('moonwater');
    expect(selectView(resumed, tuning, THEMES)?.theme.themeId).toBe('moonwater');
  });

  it('falls back to the built-in Kiln when the saved theme is not in the catalogue, and the next round differs from that drawn Kiln', () => {
    const { state } = play(7, 1);
    const id = activeRound(state).roundId;
    const game = state.profiles[state.activeProfileId ?? ''] as GameState;
    const gone: AppState = withGame(state, { ...game, rounds: { ...game.rounds, byId: { [id]: { ...activeRound(state), themeId: 'retired' } } } });
    expect(selectView(gone, tuning, THEMES)?.theme).toBe(KILN_TOKENS);
    // Finish that round: the next is drawn after Kiln (what was on screen), so it is Moonwater.
    let s = gone;
    let k = 500;
    while (activeRound(s).roundId === id) {
      if (k > 600) throw new Error('round never finished');
      const round = activeRound(s);
      const node = round.viewPath[round.viewPath.length - 1];
      const puzzle = node === undefined ? undefined : roundPuzzle(round, node);
      if (node === undefined || puzzle === undefined) throw new Error('no puzzle');
      s = step(s, { command: { type: 'TapCell', nodeId: node, cellIndex: puzzle.answerIndex }, ctx: ctx(k++, 7) }, tuning, THEMES).state;
      s = step(s, { command: { type: 'Tick', elapsedMs: 5000 }, ctx: ctx(k++, 7) }, tuning, THEMES).state;
    }
    expect(activeRound(s).previousThemeId).toBe('kiln');
    expect(activeRound(s).themeId).toBe('moonwater');
  });
});
