import { describe, expect, it } from 'vitest';
import type { NodeId } from '../generator/node-id';
import type { Puzzle } from '../generator/puzzle';
import { deriveSeed } from '../random/derive-seed';
import { parseTuning } from '../tuning/parse-tuning';
import type { TuningConfig } from '../tuning/tuning-config';
import type { AppState } from './app-state';
import type { Command } from './command';
import type { CommandContext } from './command-context';
import { completePresentation } from './complete-presentation';
import type { GameEvent } from './game-event';
import type { GameState } from './game-state';
import { initialAppState } from './initial-app-state';
import type { Round } from './round';
import { roundPuzzle } from './round-puzzle';
import { step } from './step';

/** Band 1 of content/tuning/1.json at n = 3, with its presentation section (tools/round-content.test.ts uses the real file). */
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
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning: TuningConfig = parsed.value;

/** The Kid default is Calm: every beat but a collapse is 1.25 × the tuning's duration (collapses keep FR-9's caps). */
const CALM = { solve: 475, advance: 500, firstCollapse: 3000, collapse: 1200, roundStart: 500 };

/** A deterministic context: dispatch `i` gets ids `id-<i>-a`, `id-<i>-b` and seeds derived from `i`. */
function ctx(i: number): CommandContext {
  return {
    nowMs: 1_700_000_000_000 + i * 997,
    localDate: '2026-10-14',
    utcDate: '2026-10-14',
    entropy: { ids: [`id-${i}-a`, `id-${i}-b`], seed32: [(0x9e3779b9 * (i + 1)) >>> 0, (i * 7919) >>> 0] },
  };
}

/** A command folder with a running context counter and an event log. */
class Play {
  state: AppState;
  events: GameEvent[] = [];
  private i = 0;

  constructor(state: AppState = initialAppState()) {
    this.state = state;
  }

  do(command: Command): readonly GameEvent[] {
    const r = step(this.state, { command, ctx: ctx(this.i++) }, tuning);
    this.state = r.state;
    this.events.push(...r.events);
    return r.events;
  }

  tick(elapsedMs: number): readonly GameEvent[] {
    return this.do({ type: 'Tick', elapsedMs });
  }

  /** Ticks exactly to the end of the running beat; returns the events. */
  finishBeat(): readonly GameEvent[] {
    const p = round(this.state).presentation;
    return this.tick(p.startedAtMs + p.durationMs - game(this.state).clockMs);
  }

  /** Ticks beat by beat until idle; returns each beat's kind and duration. */
  settle(): { kind: string; durationMs: number }[] {
    const beats: { kind: string; durationMs: number }[] = [];
    while (round(this.state).presentation.kind !== 'idle') {
      const { kind, durationMs } = round(this.state).presentation;
      beats.push({ kind, durationMs });
      this.finishBeat();
    }
    return beats;
  }

  /** Taps the answer of the puzzle in view and waits out every beat; returns the beats. */
  solve(): { kind: string; durationMs: number }[] {
    const events = this.do(tapAnswer(this.state));
    expect(events.map((e) => e.type)).toEqual(['PuzzleSolved']);
    return this.settle();
  }
}

function game(state: AppState): GameState {
  const g = state.profiles[state.activeProfileId ?? ''];
  if (g === undefined) throw new Error('no profile');
  return g;
}

function round(state: AppState): Round {
  const g = game(state);
  const r = g.rounds.byId[g.rounds.activeRoundId ?? ''];
  if (r === undefined) throw new Error('no active round');
  return r;
}

function nodeInView(state: AppState): NodeId {
  const r = round(state);
  const node = r.viewPath[r.viewPath.length - 1];
  if (node === undefined) throw new Error('nothing in view');
  return node;
}

function puzzleInView(state: AppState): Puzzle {
  const puzzle = roundPuzzle(round(state), nodeInView(state));
  if (puzzle === undefined) throw new Error('no puzzle in view');
  return puzzle;
}

function tapAnswer(state: AppState): Command {
  const puzzle = puzzleInView(state);
  return { type: 'TapCell', nodeId: puzzle.nodeId, cellIndex: puzzle.answerIndex };
}

function tapWrong(state: AppState): Command {
  const puzzle = puzzleInView(state);
  return { type: 'TapCell', nodeId: puzzle.nodeId, cellIndex: (puzzle.answerIndex + 1) % puzzle.cells.length };
}

/** `state` with the active profile's game patched. */
function patchGame(state: AppState, patch: Partial<GameState>): AppState {
  const g = game(state);
  return { ...state, profiles: { ...state.profiles, [g.profileId]: { ...g, ...patch } } };
}

/** `state` with the active round patched. */
function patchRound(state: AppState, patch: Partial<Round>): AppState {
  const g = game(state);
  const r = round(state);
  return patchGame(state, { rounds: { ...g.rounds, byId: { ...g.rounds.byId, [r.roundId]: { ...r, ...patch } } } });
}

function started(): Play {
  const play = new Play();
  play.do({ type: 'StartSession' });
  return play;
}

const key = (n: NodeId) => `${n.tier}.${n.index}`;

describe('step: StartSession', () => {
  it('creates the default Kid profile from ctx entropy, with Kid defaults', () => {
    const play = started();
    expect(play.state.activeProfileId).toBe('id-0-a');
    expect(play.state.device.activeProfileId).toBe('id-0-a');
    expect(game(play.state)).toMatchObject({
      profileId: 'id-0-a',
      profileKind: 'kid',
      rootSeed: ctx(0).entropy.seed32[0],
      settings: { mode: 'zen', motion: 'calm' },
      roundOrdinal: 0,
      clockMs: 0,
      firstCollapseSeen: false,
      rounds: { activeRoundId: 'id-0-b' },
    });
    expect(play.events).toEqual([
      { type: 'ProfileCreated', profileId: 'id-0-a' },
      { type: 'RoundStarted', roundId: 'id-0-b', roundOrdinal: 0 },
    ]);
  });

  it('plans round 0 as Classic n = 3 + seeded deriveSeed(rootSeed, 0), idle on its first leaf', () => {
    const r = round(started().state);
    expect(r).toMatchObject({ roundId: 'id-0-b', type: 'classic', mode: 'zen', tuningVersion: 1, solved: [], shownAtMs: 0, nextRoundId: null });
    expect(r.presentation.kind).toBe('idle');
    expect(r.seed).toBe(deriveSeed(ctx(0).entropy.seed32[0], 0));
    expect(r.plan).toMatchObject({ type: 'classic', n: 3, operator: 'add', tiers: 2, startBand: 1, roundSeed: r.seed });
    expect(r.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
    ]);
    expect(Object.keys(r.puzzles)).toEqual(['1.0']);
    expect(r.puzzles['1.0']?.servedBand).toBe(1);
  });

  it('keeps an existing profile and its active round', () => {
    const play = started();
    const before = play.state;
    expect(play.do({ type: 'StartSession' })).toEqual([]);
    expect(play.state).toEqual(before);
  });
});

describe('step: TapCell and the solve beat', () => {
  it('a correct tap emits PuzzleSolved and starts the solve beat; its end applies the solve and advances', () => {
    const play = started();
    const answer = puzzleInView(play.state).answerIndex;
    play.tick(1200);
    const events = play.do(tapAnswer(play.state));
    expect(events).toEqual([{ type: 'PuzzleSolved', roundId: 'id-0-b', nodeId: { tier: 1, index: 0 }, cellIndex: answer, responseMs: 1200 }]);
    let r = round(play.state);
    expect(r.presentation).toEqual({ kind: 'solve', startedAtMs: 1200, durationMs: CALM.solve, transitionId: 'default' });
    expect(r.solved).toEqual([]);

    // One ms short of the end: still solving.
    expect(play.tick(CALM.solve - 1)).toEqual([]);
    expect(round(play.state).presentation.kind).toBe('solve');
    play.tick(1);
    r = round(play.state);
    expect(r.solved).toEqual(['1.0']);
    expect(r.presentation).toEqual({ kind: 'advance', startedAtMs: 1200 + CALM.solve, durationMs: CALM.advance, transitionId: 'default' });
    expect(r.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 1 },
    ]);
    expect(Object.keys(r.puzzles).sort()).toEqual(['1.0', '1.1']);
    expect(r.shownAtMs).toBeNull();

    play.finishBeat();
    r = round(play.state);
    expect(r.presentation.kind).toBe('idle');
    expect(r.shownAtMs).toBe(1200 + CALM.solve + CALM.advance);
  });

  it('one long Tick crosses several beats, each starting where the last ended', () => {
    const play = started();
    play.do(tapAnswer(play.state));
    play.tick(5000);
    const r = round(play.state);
    expect(r.presentation.kind).toBe('idle');
    expect(r.shownAtMs).toBe(CALM.solve + CALM.advance);
    expect(game(play.state).clockMs).toBe(5000);
    // responseMs counts from when the next puzzle was shown, not from the Tick.
    const events = play.do(tapWrong(play.state));
    expect(events[0]).toMatchObject({ type: 'WrongTap', responseMs: 5000 - CALM.solve - CALM.advance });
  });

  it('a wrong tap emits WrongTap with responseMs and changes nothing else', () => {
    const play = started();
    play.tick(250);
    const before = play.state;
    const r = step(before, { command: tapWrong(before), ctx: ctx(9) }, tuning);
    expect(r.state).toBe(before);
    expect(r.events).toEqual([expect.objectContaining({ type: 'WrongTap', responseMs: 250 })]);
  });

  it('a soft miss emits SoftMiss with responseMs and changes nothing else', () => {
    // Classic + has no soft-miss cell, so build a − puzzle in view by hand.
    const play = started();
    const leaf = round(play.state).puzzles['1.0'] as Puzzle;
    const subLeaf: Puzzle = { ...leaf, spec: { ...leaf.spec, operator: 'sub' }, roles: { a: 0, b: 1, c: 2 }, answerIndex: 2 };
    const state = patchRound(play.state, { puzzles: { '1.0': subLeaf } });
    const r = step(state, { command: { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 1 }, ctx: ctx(1) }, tuning);
    expect(r.state).toBe(state);
    expect(r.events).toEqual([{ type: 'SoftMiss', roundId: 'id-0-b', nodeId: { tier: 1, index: 0 }, cellIndex: 1, responseMs: 0 }]);
  });

  it('responseMs is Tick time: wall-clock nowMs does not count, and only Ticks after the puzzle was shown do', () => {
    const play = started();
    // ctx(i).nowMs moves ~1 s per dispatch; no Tick, so no play time passes.
    play.do({ type: 'StartSession' });
    play.do({ type: 'StartSession' });
    expect(play.do(tapWrong(play.state))[0]).toMatchObject({ responseMs: 0 });
    play.tick(40);
    play.tick(60);
    expect(play.do(tapAnswer(play.state))[0]).toMatchObject({ type: 'PuzzleSolved', responseMs: 100 });
  });

  it('rejects a tap on a puzzle not in view, an invalid cell, an overview, or with no round, leaving state unchanged', () => {
    const play = started();
    const before = play.state;
    const cases: Command[] = [
      { type: 'TapCell', nodeId: { tier: 1, index: 2 }, cellIndex: 0 },
      { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 7 },
    ];
    for (const command of cases) {
      const r = step(before, { command, ctx: ctx(1) }, tuning);
      expect(r.state).toBe(before);
      expect(r.events.map((e) => e.type)).toEqual(['CommandRejected']);
    }
    const overview = step(before, { command: { type: 'ZoomOut' }, ctx: ctx(1) }, tuning).state;
    const onOverview = step(overview, { command: { type: 'TapCell', nodeId: { tier: 2, index: 0 }, cellIndex: 0 }, ctx: ctx(2) }, tuning);
    expect(onOverview.state).toBe(overview);
    expect(onOverview.events[0]).toMatchObject({ type: 'CommandRejected', message: expect.stringMatching(/overview/) });
    const empty = initialAppState();
    const r = step(empty, { command: { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 0 }, ctx: ctx(0) }, tuning);
    expect(r.state).toBe(empty);
    expect(r.events[0]).toMatchObject({ type: 'CommandRejected', code: 'invalid-command' });
  });
});

describe('step: dropped input', () => {
  it('drops taps, EnterPuzzle and ZoomOut during a solve beat with InputDropped, changing nothing', () => {
    const play = started();
    const next = round(play.state).viewPath;
    play.do(tapAnswer(play.state));
    const solving = play.state;
    const inputs: Command[] = [
      { type: 'TapCell', nodeId: { tier: 1, index: 0 }, cellIndex: 0 },
      { type: 'TapCell', nodeId: { tier: 9, index: 9 }, cellIndex: 99 },
      { type: 'EnterPuzzle', nodeId: { tier: 1, index: 1 } },
      { type: 'ZoomOut' },
    ];
    for (const command of inputs) {
      const r = step(solving, { command, ctx: ctx(5) }, tuning);
      expect(r.state).toBe(solving);
      expect(r.events).toEqual([{ type: 'InputDropped', command: command.type, presentation: 'solve' }]);
    }
    expect(next).toEqual(round(solving).viewPath);
  });

  it('drops taps during a collapse and during advance', () => {
    const play = started();
    play.solve();
    play.solve();
    play.do(tapAnswer(play.state));
    play.finishBeat();
    expect(round(play.state).presentation.kind).toBe('collapse');
    const collapsing = play.state;
    const tap = step(collapsing, { command: { type: 'TapCell', nodeId: { tier: 2, index: 0 }, cellIndex: 0 }, ctx: ctx(50) }, tuning);
    expect(tap.state).toBe(collapsing);
    expect(tap.events).toEqual([{ type: 'InputDropped', command: 'TapCell', presentation: 'collapse' }]);

    const other = started();
    other.do(tapAnswer(other.state));
    other.finishBeat();
    expect(round(other.state).presentation.kind).toBe('advance');
    const advancing = other.state;
    const r = step(advancing, { command: tapAnswer(advancing), ctx: ctx(60) }, tuning);
    expect(r.state).toBe(advancing);
    expect(r.events).toEqual([{ type: 'InputDropped', command: 'TapCell', presentation: 'advance' }]);
  });
});

describe('step: round flow', () => {
  it('plays round 0 as Classic: three leaves, a collapse into the top, the top, then round 1 with no end state', () => {
    const play = started();
    expect(play.solve()).toEqual([
      { kind: 'solve', durationMs: CALM.solve },
      { kind: 'advance', durationMs: CALM.advance },
    ]);
    play.solve();
    // The third leaf completes the group: it collapses into the top, the next puzzle, so no advance.
    expect(play.solve()).toEqual([
      { kind: 'solve', durationMs: CALM.solve },
      { kind: 'collapse', durationMs: CALM.firstCollapse },
    ]);
    const r = round(play.state);
    expect(r.viewPath).toEqual([{ tier: 2, index: 0 }]);
    expect(r.solved).toEqual(['1.0', '1.1', '1.2']);
    expect(game(play.state).firstCollapseSeen).toBe(true);
    // The tier-2 puzzle's cells are the leaves' answers.
    const top = puzzleInView(play.state);
    for (let j = 0; j < 3; j += 1) {
      const leaf = r.puzzles[`1.${j}`] as Puzzle;
      expect(top.cells[j]).toEqual(leaf.cells[leaf.answerIndex]);
    }

    expect(play.do(tapAnswer(play.state)).map((e) => e.type)).toEqual(['PuzzleSolved']);
    const reserved = round(play.state).nextRoundId;
    expect(reserved).toMatch(/^id-\d+-a$/);
    const endEvents = play.finishBeat();
    expect(endEvents).toEqual([
      { type: 'RoundCompleted', roundId: 'id-0-b', roundOrdinal: 0 },
      { type: 'RoundStarted', roundId: reserved, roundOrdinal: 1 },
    ]);
    const g = game(play.state);
    expect(g.roundOrdinal).toBe(1);
    expect(Object.keys(g.rounds.byId)).toEqual([reserved]);
    const next = round(play.state);
    expect(next.presentation).toMatchObject({ kind: 'roundStart', durationMs: CALM.roundStart });
    expect(next.seed).toBe(deriveSeed(g.rootSeed, 1));
    expect(next.type).toBe('tower');
    expect(play.settle()).toEqual([{ kind: 'roundStart', durationMs: CALM.roundStart }]);
    expect(round(play.state).shownAtMs).toBe(g.clockMs + CALM.roundStart);
  });

  it('plays round 1 as Tower n = 3: 9 leaves, then 3 tier-2 puzzles, then the top, collapsing after each group and the tier-2 level', () => {
    const play = started();
    for (let k = 0; k < 4; k += 1) play.solve();
    expect(round(play.state).type).toBe('tower');
    expect(round(play.state).plan).toMatchObject({ type: 'tower', n: 3, operator: 'add', tiers: 3, startBand: 1 });
    expect(round(play.state).viewPath).toEqual([
      { tier: 3, index: 0 },
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
    ]);
    play.events = [];

    const order: string[] = [];
    const collapseBeats: number[] = [];
    for (let k = 0; k < 13; k += 1) {
      order.push(key(nodeInView(play.state)));
      const beats = play.solve();
      collapseBeats.push(...beats.filter((b) => b.kind === 'collapse').map((b) => b.durationMs));
    }
    expect(order).toEqual(['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '2.0', '2.1', '2.2', '3.0']);
    expect(play.events.filter((e) => e.type === 'RoundCollapsed').map((e) => 'nodeId' in e && key(e.nodeId))).toEqual(['2.0', '2.1', '2.2', '3.0']);
    // The profile's first collapse was in round 0, so every Tower collapse is a later one.
    expect(collapseBeats).toEqual([CALM.collapse, CALM.collapse, CALM.collapse, CALM.collapse]);
    expect(play.events.filter((e) => e.type === 'PuzzleSolved')).toHaveLength(13);
    expect(play.events.filter((e) => e.type === 'RoundCompleted')).toEqual([expect.objectContaining({ roundOrdinal: 1 })]);
    // Straight into round 2, Classic again: no end state.
    expect(round(play.state).type).toBe('classic');
    expect(game(play.state).roundOrdinal).toBe(2);
    expect(round(play.state).presentation.kind).toBe('idle');
  });

  it('views a Tower leaf with its full path, and a collapsed group as its tier-2 cell', () => {
    const play = started();
    for (let k = 0; k < 4; k += 1) play.solve();
    play.solve();
    play.solve();
    play.do(tapAnswer(play.state));
    play.finishBeat();
    expect(round(play.state).presentation.kind).toBe('collapse');
    expect(round(play.state).viewPath).toEqual([
      { tier: 3, index: 0 },
      { tier: 2, index: 0 },
    ]);
    play.settle();
    // Breadth-first: after the first group, the fourth leaf, not the tier-2 puzzle.
    expect(round(play.state).viewPath).toEqual([
      { tier: 3, index: 0 },
      { tier: 2, index: 1 },
      { tier: 1, index: 3 },
    ]);
  });

  it('alternates Classic and Tower: rounds 0, 2 are Classic, 1, 3 are Tower', () => {
    const play = started();
    const types: string[] = [round(play.state).type];
    for (const puzzles of [4, 13, 4]) {
      for (let k = 0; k < puzzles; k += 1) play.solve();
      types.push(round(play.state).type);
    }
    expect(types).toEqual(['classic', 'tower', 'classic', 'tower']);
    expect(game(play.state).roundOrdinal).toBe(3);
  });

  it('uses firstCollapseMs only for the first collapse, then collapseMs; Full motion is unscaled', () => {
    const full = new Play(patchGame(started().state, { settings: { mode: 'zen', motion: 'full' } }));
    const beats = [...full.solve(), ...full.solve(), ...full.solve()];
    expect(beats).toEqual([
      { kind: 'solve', durationMs: 380 },
      { kind: 'advance', durationMs: 400 },
      { kind: 'solve', durationMs: 380 },
      { kind: 'advance', durationMs: 400 },
      { kind: 'solve', durationMs: 380 },
      { kind: 'collapse', durationMs: 3000 },
    ]);
    expect(full.solve()).toEqual([
      { kind: 'solve', durationMs: 380 },
      { kind: 'roundStart', durationMs: 400 },
    ]);
    full.solve();
    full.solve();
    expect(full.solve()).toEqual([
      { kind: 'solve', durationMs: 380 },
      { kind: 'collapse', durationMs: 1200 },
      { kind: 'advance', durationMs: 400 },
    ]);
  });
});

describe('step: EnterPuzzle and ZoomOut', () => {
  it('zooms out to the parent overview and enters any unsolved leaf from it', () => {
    const play = started();
    play.tick(100);
    expect(play.do({ type: 'ZoomOut' })).toEqual([]);
    let r = round(play.state);
    expect(r.viewPath).toEqual([{ tier: 2, index: 0 }]);
    expect(r.shownAtMs).toBeNull();
    play.tick(50);
    expect(play.do({ type: 'EnterPuzzle', nodeId: { tier: 1, index: 2 } })).toEqual([]);
    r = round(play.state);
    expect(r.viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 2 },
    ]);
    expect(r.presentation.kind).toBe('idle');
    expect(r.shownAtMs).toBe(150);
    expect(Object.keys(r.puzzles).sort()).toEqual(['1.0', '1.2']);
    play.tick(30);
    expect(play.do(tapAnswer(play.state))[0]).toMatchObject({ type: 'PuzzleSolved', nodeId: { tier: 1, index: 2 }, responseMs: 30 });
    play.settle();
    // Auto-advance goes to the first unsolved puzzle in play order, the sibling left behind.
    expect(round(play.state).viewPath).toEqual([
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
    ]);
  });

  it('rejects entering a node with unsolved children, a solved node, or a node outside the overview', () => {
    const play = started();
    play.solve();
    play.do({ type: 'ZoomOut' });
    const overview = play.state;
    const bad: [NodeId | unknown, RegExp][] = [
      [{ tier: 1, index: 0 }, /already solved/],
      [{ tier: 2, index: 0 }, /not a cell of the overview/],
      [{ tier: 1, index: 3 }, /not a node of the active round/],
      ['1.1', /not a node of the active round/],
    ];
    for (const [nodeId, message] of bad) {
      const r = step(overview, { command: { type: 'EnterPuzzle', nodeId } as Command, ctx: ctx(20) }, tuning);
      expect(r.state).toBe(overview);
      expect(r.events).toEqual([expect.objectContaining({ type: 'CommandRejected', command: 'EnterPuzzle', message: expect.stringMatching(message) })]);
    }
    // A Tower top overview whose tier-2 children still have unsolved leaves.
    const tower = started();
    for (let k = 0; k < 4; k += 1) tower.solve();
    const topOverview = patchRound(tower.state, { viewPath: [{ tier: 3, index: 0 }], shownAtMs: null });
    const r = step(topOverview, { command: { type: 'EnterPuzzle', nodeId: { tier: 2, index: 1 } }, ctx: ctx(30) }, tuning);
    expect(r.state).toBe(topOverview);
    expect(r.events[0]).toMatchObject({ type: 'CommandRejected', message: expect.stringMatching(/unsolved children/) });
  });

  it('rejects ZoomOut from an overview or from the top', () => {
    const play = started();
    play.do({ type: 'ZoomOut' });
    const overview = play.state;
    const again = step(overview, { command: { type: 'ZoomOut' }, ctx: ctx(9) }, tuning);
    expect(again.state).toBe(overview);
    expect(again.events[0]).toMatchObject({ type: 'CommandRejected', command: 'ZoomOut' });

    const top = started();
    top.solve();
    top.solve();
    top.solve();
    expect(round(top.state).viewPath).toEqual([{ tier: 2, index: 0 }]);
    const atTop = step(top.state, { command: { type: 'ZoomOut' }, ctx: ctx(9) }, tuning);
    expect(atTop.state).toBe(top.state);
    expect(atTop.events[0]).toMatchObject({ type: 'CommandRejected', command: 'ZoomOut' });
  });
});

describe('step: Tick', () => {
  it('only accumulates time while idle, and is a no-op with no profile', () => {
    const play = started();
    const r = round(play.state);
    expect(play.tick(16)).toEqual([]);
    expect(game(play.state).clockMs).toBe(16);
    expect(round(play.state)).toEqual(r);
    const empty = initialAppState();
    expect(step(empty, { command: { type: 'Tick', elapsedMs: 16 }, ctx: ctx(0) }, tuning)).toEqual({ state: empty, events: [] });
  });

  it('settles idle with a single CommandRejected when a beat end fails, so the board unlocks', () => {
    const play = started();
    for (let k = 0; k < 3; k += 1) play.solve();
    play.do(tapAnswer(play.state));
    // Force the round's end to fail: no reserved id for the next round.
    play.state = patchRound(play.state, { nextRoundId: null });
    const events = play.tick(10_000);
    expect(events).toEqual([expect.objectContaining({ type: 'CommandRejected', command: 'Tick' })]);
    const r = round(play.state);
    expect(r.presentation.kind).toBe('idle');
    expect(r.shownAtMs).toBe(game(play.state).clockMs);
    expect(r.viewPath).toEqual([{ tier: 2, index: 0 }]);
    // Idle now: later Ticks emit nothing.
    expect(play.tick(16)).toEqual([]);
  });

  it('rejects a negative, fractional or missing elapsedMs', () => {
    const state = started().state;
    for (const elapsedMs of [-1, 1.5, Number.NaN, undefined, '16']) {
      const r = step(state, { command: { type: 'Tick', elapsedMs } as unknown as Command, ctx: ctx(3) }, tuning);
      expect(r.state).toBe(state);
      expect(r.events[0]).toMatchObject({ type: 'CommandRejected', command: 'Tick' });
    }
  });
});

describe('completePresentation', () => {
  it('completes a running beat to its idle end state without adding play time', () => {
    const play = started();
    play.tick(10);
    play.do(tapAnswer(play.state));
    play.tick(100);
    const done = completePresentation(play.state, tuning);
    const g = done.state.profiles['id-0-a'] as GameState;
    const r = g.rounds.byId[g.rounds.activeRoundId ?? ''] as Round;
    expect(g.clockMs).toBe(110);
    expect(r.presentation).toMatchObject({ kind: 'idle', startedAtMs: 110 });
    expect(r.shownAtMs).toBe(110);
    expect(r.solved).toEqual(['1.0']);
    expect(r.viewPath[r.viewPath.length - 1]).toEqual({ tier: 1, index: 1 });
  });

  it('completes the top solve into the next round, and leaves an idle state as it is', () => {
    const play = started();
    for (let k = 0; k < 3; k += 1) play.solve();
    play.do(tapAnswer(play.state));
    const done = completePresentation(play.state, tuning);
    expect(done.events.map((e) => e.type)).toEqual(['RoundCompleted', 'RoundStarted']);
    const after = new Play(done.state);
    expect(round(after.state)).toMatchObject({ type: 'tower', presentation: { kind: 'idle' } });
    const idle = completePresentation(done.state, tuning);
    expect(idle.state).toBe(done.state);
    expect(idle.events).toEqual([]);
  });
});

describe('step: determinism and bad input', () => {
  it('is deterministic: the same entropy and commands give identical states and events', () => {
    function play() {
      const p = started();
      for (let k = 1; k <= 30; k += 1) {
        if (k % 4 === 0) p.do(tapWrong(p.state));
        p.tick(k * 7);
        p.solve();
      }
      return { state: p.state, events: p.events };
    }
    expect(play()).toEqual(play());
  });

  it('rejects a malformed context or an unknown command without throwing', () => {
    const state = initialAppState();
    const badCtx = { ...ctx(0), entropy: { ids: ['only-one'], seed32: [1, 2] } } as unknown as CommandContext;
    expect(step(state, { command: { type: 'StartSession' }, ctx: badCtx }, tuning).events[0]).toMatchObject({ type: 'CommandRejected' });
    const unknown = { type: 'Fly' } as unknown as Command;
    expect(step(state, { command: unknown, ctx: ctx(0) }, tuning).events[0]).toMatchObject({ type: 'CommandRejected', command: 'Fly' });
    expect(step(state, null as never, tuning).state).toBe(state);
  });
});
