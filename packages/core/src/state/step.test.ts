import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import { deriveSeed } from '../random/derive-seed';
import { parseTuning } from '../tuning/parse-tuning';
import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import type { GameEvent } from './game-event';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

/** Band 1 of content/tuning/1.json at n = 3 (tools/round-content.test.ts uses the real file). */
const parsed = parseTuning({
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 3 },
    bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 1 }] }],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning: TuningConfig = parsed.value;

/** A deterministic context: dispatch `i` gets ids `id-<i>-a`, `id-<i>-b` and seeds derived from `i`. */
function ctx(i: number): CommandContext {
  return {
    nowMs: 1_700_000_000_000 + i,
    localDate: '2026-10-14',
    utcDate: '2026-10-14',
    entropy: { ids: [`id-${i}-a`, `id-${i}-b`], seed32: [(0x9e3779b9 * (i + 1)) >>> 0, (i * 7919) >>> 0] },
  };
}

/** Folds commands over `state`, numbering contexts from `start`. */
function run(state: AppState, commands: readonly Command[], start = 0) {
  const events: GameEvent[] = [];
  let s = state;
  commands.forEach((command, k) => {
    const r = step(s, { command, ctx: ctx(start + k) }, tuning);
    s = r.state;
    events.push(...r.events);
  });
  return { state: s, events };
}

function activeRound(state: AppState): Round {
  const game = state.profiles[state.activeProfileId ?? ''];
  const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  if (round === undefined) throw new Error('no active round');
  return round;
}

function inView(state: AppState): { round: Round; puzzle: Puzzle } {
  const round = activeRound(state);
  const node = round.viewPath[round.viewPath.length - 1];
  const puzzle = node === undefined ? undefined : roundPuzzle(round, node);
  if (puzzle === undefined) throw new Error('nothing in view');
  return { round, puzzle };
}

function tapAnswer(state: AppState): Command {
  const { puzzle } = inView(state);
  return { type: 'TapCell', nodeId: puzzle.nodeId, cellIndex: puzzle.answerIndex };
}

function tapWrong(state: AppState): Command {
  const { puzzle } = inView(state);
  return { type: 'TapCell', nodeId: puzzle.nodeId, cellIndex: (puzzle.answerIndex + 1) % puzzle.cells.length };
}

const started = run(initialAppState(), [{ type: 'StartSession' }]);

describe('step: StartSession', () => {
  it('creates the default Kid profile from ctx entropy, with Kid defaults', () => {
    const { state, events } = started;
    expect(state.activeProfileId).toBe('id-0-a');
    expect(state.device.activeProfileId).toBe('id-0-a');
    const game = state.profiles['id-0-a'];
    expect(game).toMatchObject({
      profileId: 'id-0-a',
      profileKind: 'kid',
      rootSeed: ctx(0).entropy.seed32[0],
      settings: { mode: 'zen', motion: 'calm' },
      roundOrdinal: 0,
      rounds: { activeRoundId: 'id-0-b' },
    });
    expect(events).toEqual([
      { type: 'ProfileCreated', profileId: 'id-0-a' },
      { type: 'RoundStarted', roundId: 'id-0-b', roundOrdinal: 0 },
    ]);
  });

  it('plans a Classic n = 3 + round seeded deriveSeed(rootSeed, 0), viewing its first leaf', () => {
    const round = activeRound(started.state);
    expect(round).toMatchObject({ roundId: 'id-0-b', type: 'classic', mode: 'zen', tuningVersion: 1, solved: [] });
    expect(round.seed).toBe(deriveSeed(ctx(0).entropy.seed32[0], 0));
    expect(round.plan).toMatchObject({ type: 'classic', n: 3, operator: 'add', tiers: 2, roundSeed: round.seed });
    expect(round.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
    ]);
    expect(Object.keys(round.puzzles)).toEqual(['1.0']);
    expect(round.puzzles['1.0']?.servedBand).toBe(1);
  });

  it('keeps an existing profile and its active round', () => {
    const again = step(started.state, { command: { type: 'StartSession' }, ctx: ctx(1) }, tuning);
    expect(again.state).toEqual(started.state);
    expect(again.events).toEqual([]);
  });
});

describe('step: TapCell', () => {
  it('a correct tap marks the leaf solved and views the next leaf, realised lazily', () => {
    const before = started.state;
    const { state, events } = run(before, [tapAnswer(before)], 1);
    const round = activeRound(state);
    expect(events).toEqual([{ type: 'PuzzleSolved', roundId: 'id-0-b', nodeId: { tier: 1, index: 0 }, cellIndex: inView(before).puzzle.answerIndex }]);
    expect(round.solved).toEqual(['1.0']);
    expect(round.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 1 },
    ]);
    expect(Object.keys(round.puzzles).sort()).toEqual(['1.0', '1.1']);
    // Realised leaves are frozen: the first one is untouched.
    expect(round.puzzles['1.0']).toEqual(activeRound(before).puzzles['1.0']);
  });

  it('a wrong tap emits WrongTap and changes nothing else', () => {
    const before = started.state;
    const r = step(before, { command: tapWrong(before), ctx: ctx(1) }, tuning);
    expect(r.state).toBe(before);
    expect(r.events).toHaveLength(1);
    expect(r.events[0]?.type).toBe('WrongTap');
  });

  it('a soft miss emits SoftMiss and changes nothing else', () => {
    // Classic + has no soft-miss cell, so build a − puzzle in view by hand.
    const before = started.state;
    const round = activeRound(before);
    const leaf = round.puzzles['1.0'] as Puzzle;
    const subLeaf: Puzzle = { ...leaf, spec: { ...leaf.spec, operator: 'sub' }, roles: { a: 0, b: 1, c: 2 }, answerIndex: 2 };
    const game = before.profiles[before.activeProfileId ?? ''];
    if (game === undefined) throw new Error('no game');
    const state: AppState = {
      ...before,
      profiles: { [game.profileId]: { ...game, rounds: { ...game.rounds, byId: { [round.roundId]: { ...round, puzzles: { '1.0': subLeaf } } } } } },
    };
    const r = step(state, { command: { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 1 }, ctx: ctx(1) }, tuning);
    expect(r.state).toBe(state);
    expect(r.events).toEqual([{ type: 'SoftMiss', roundId: round.roundId, nodeId: { tier: 1, index: 0 }, cellIndex: 1 }]);
  });

  it('rejects a tap on a puzzle not in view, an invalid cell, or with no round, leaving state unchanged', () => {
    const before = started.state;
    const cases: Command[] = [
      { type: 'TapCell', nodeId: { tier: 1, index: 2 }, cellIndex: 0 },
      { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 7 },
    ];
    for (const command of cases) {
      const r = step(before, { command, ctx: ctx(1) }, tuning);
      expect(r.state).toBe(before);
      expect(r.events.map((e) => e.type)).toEqual(['CommandRejected']);
    }
    const empty = initialAppState();
    const r = step(empty, { command: { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 0 }, ctx: ctx(0) }, tuning);
    expect(r.state).toBe(empty);
    expect(r.events[0]).toMatchObject({ type: 'CommandRejected', code: 'invalid-command' });
  });

  it('plays the full Classic loop: three leaves, the tier-2 puzzle, then the next round', () => {
    let state = started.state;
    let i = 1;
    for (let leaf = 0; leaf < 3; leaf += 1) {
      state = run(state, [tapAnswer(state)], i++).state;
    }
    const round = activeRound(state);
    expect(round.viewPath).toEqual([{ tier: 2, index: 0 }]);
    expect(round.solved).toEqual(['1.0', '1.1', '1.2']);
    // The tier-2 puzzle's cells are the leaves' answers.
    const top = inView(state).puzzle;
    for (let j = 0; j < 3; j += 1) {
      const leaf = round.puzzles[`1.${j}`] as Puzzle;
      expect(top.cells[j]).toEqual(leaf.cells[leaf.answerIndex]);
    }

    const done = run(state, [tapAnswer(state)], i);
    expect(done.events).toEqual([
      { type: 'PuzzleSolved', roundId: 'id-0-b', nodeId: { tier: 2, index: 0 }, cellIndex: top.answerIndex },
      { type: 'RoundCompleted', roundId: 'id-0-b', roundOrdinal: 0 },
      { type: 'RoundStarted', roundId: `id-${i}-a`, roundOrdinal: 1 },
    ]);
    const game = done.state.profiles['id-0-a'];
    expect(game?.roundOrdinal).toBe(1);
    expect(Object.keys(game?.rounds.byId ?? {})).toEqual([`id-${i}-a`]);
    const next = activeRound(done.state);
    expect(next.seed).toBe(deriveSeed(game?.rootSeed ?? 0, 1));
    expect(next.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
    ]);
    expect(next.solved).toEqual([]);
  });

  it('is deterministic: the same entropy and commands give identical states and events', () => {
    function play() {
      let r = run(initialAppState(), [{ type: 'StartSession' }]);
      const all = [...r.events];
      for (let k = 1; k <= 9; k += 1) {
        const command = k % 3 === 0 ? tapWrong(r.state) : tapAnswer(r.state);
        r = run(r.state, [command], k);
        all.push(...r.events);
      }
      return { state: r.state, events: all };
    }
    expect(play()).toEqual(play());
  });
});

describe('step: bad input', () => {
  it('rejects a malformed context or an unknown command without throwing', () => {
    const state = initialAppState();
    const badCtx = { ...ctx(0), entropy: { ids: ['only-one'], seed32: [1, 2] } } as unknown as CommandContext;
    expect(step(state, { command: { type: 'StartSession' }, ctx: badCtx }, tuning).events[0]).toMatchObject({ type: 'CommandRejected' });
    const unknown = { type: 'Fly' } as unknown as Command;
    expect(step(state, { command: unknown, ctx: ctx(0) }, tuning).events[0]).toMatchObject({ type: 'CommandRejected', command: 'Fly' });
    expect(step(state, null as never, tuning).state).toBe(state);
  });
});
