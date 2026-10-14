import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import { SHAPES } from '../layout/shapes/shapes';
import type { AppState } from '../state/app-state';
import type { CommandContext } from '../state/command-context';
import type { Command } from '../state/command';
import { completePresentation } from '../state/complete-presentation';
import { initialAppState } from '../state/initial-app-state';
import type { Round } from '../state/round';
import { roundPuzzle } from '../state/round-puzzle';
import { step } from '../state/step';
import { parseTuning } from '../tuning/parse-tuning';
import { boundsOf, CONTEXT_CELL_SHARE, contextCamera } from './camera-rect';
import { hitTestView } from './hit-test-view';
import { KILN_TOKENS } from './kiln-tokens';
import { selectView } from './select-view';
import { tapCommand } from './tap-command';

const parsed = parseTuning({
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
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

function ctx(i: number): CommandContext {
  return { nowMs: i, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${i}`, `b${i}`], seed32: [12345 + i, i] } };
}

function round(state: AppState): Round {
  const game = state.profiles[state.activeProfileId ?? ''];
  const r = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  if (r === undefined) throw new Error('no round');
  return r;
}

function puzzleInView(state: AppState): Puzzle {
  const r = round(state);
  const p = roundPuzzle(r, r.viewPath[r.viewPath.length - 1] ?? { tier: 0, index: 0 });
  if (p === undefined) throw new Error('no puzzle');
  return p;
}

const start = step(initialAppState(), { command: { type: 'StartSession' }, ctx: ctx(0) }, tuning).state;

function run(state: AppState, command: Command, k: number): AppState {
  return step(state, { command, ctx: ctx(k) }, tuning).state;
}

/** Taps the answer in view, then ticks through every beat. */
function solveAndSettle(state: AppState, k: number): AppState {
  const p = puzzleInView(state);
  let s = run(state, { type: 'TapCell', nodeId: p.nodeId, cellIndex: p.answerIndex }, k);
  s = completePresentation(s, tuning).state;
  return s;
}

describe('selectView', () => {
  it('is null before a round exists', () => {
    expect(selectView(initialAppState(), tuning)).toBeNull();
  });

  it('shows the first leaf on 3A in Kiln, cells from core/layout with displayValue text', () => {
    const vm = selectView(start, tuning);
    const puzzle = puzzleInView(start);
    expect(vm).not.toBeNull();
    if (vm === null) return;
    expect(vm.nodeId).toEqual({ tier: 1, index: 0 });
    expect(vm.shapeId).toBe('3A');
    expect(vm.aspect).toBe(SHAPES['3A'].aspect);
    expect(vm.kind).toBe('puzzle');
    expect(vm.inputLocked).toBe(false);
    expect(vm.presentation).toEqual({ kind: 'idle', progress: 1, durationMs: 0, transitionId: 'none', cellIndex: null });
    expect(vm.theme).toBe(KILN_TOKENS);
    expect(vm.operator.symbol).toBe('+');
    expect(vm.operator.polygon).toEqual(SHAPES['3A'].operator.polygon);
    expect(vm.cells).toHaveLength(3);
    vm.cells.forEach((cell, i) => {
      const geometry = SHAPES['3A'].cells[i];
      expect(cell).toEqual({
        index: i,
        polygon: geometry?.polygon,
        labelPoint: geometry?.labelPoint,
        inscribedRadius: geometry?.inscribedRadius,
        text: String(puzzle.cells[i]?.n),
        state: 'unsolved',
        enters: null,
      });
      expect(vm.solvedAnswer).toBeNull();
    });
  });

  it("shows the tier-2 puzzle with each solved child's answer, as solved cells", () => {
    let state = start;
    for (let k = 1; k <= 3; k += 1) state = solveAndSettle(state, k);
    const vm = selectView(state, tuning);
    expect(vm?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(vm?.kind).toBe('puzzle');
    const r = round(state);
    vm?.cells.forEach((cell, j) => {
      const leaf = r.puzzles[`1.${j}`] as Puzzle;
      expect(cell.text).toBe(String(leaf.cells[leaf.answerIndex]?.n));
      expect(cell.state).toBe('solved');
    });
  });
});

function contains(outer: { x: number; y: number; width: number; height: number }, inner: typeof outer): boolean {
  const e = 1e-9;
  return inner.x >= outer.x - e && inner.y >= outer.y - e && inner.x + inner.width <= outer.x + outer.width + e && inner.y + inner.height <= outer.y + outer.height + e;
}

describe('selectView: context (the parent around the puzzle, entry 9)', () => {
  it('a first leaf has its parent as context: an overview of empty tiles, the cell it fills, and a camera around that cell', () => {
    const vm = selectView(start, tuning);
    const context = vm?.context;
    expect(context).toBeDefined();
    if (context === undefined) return;
    expect(context.parent.nodeId).toEqual({ tier: 2, index: 0 });
    expect(context.parent.kind).toBe('overview');
    expect(context.parent.context).toBeUndefined();
    expect(context.parent.solvedAnswer).toBeNull();
    expect(context.parent.cells.map((c) => [c.text, c.state, c.enters])).toEqual([
      ['', 'unsolved', null],
      ['', 'unsolved', null],
      ['', 'unsolved', null],
    ]);
    expect(context.cellIndex).toBe(0);
    expect(context.camera).toEqual(contextCamera(SHAPES['3A'], 0));
    // The camera holds the whole cell, which takes CONTEXT_CELL_SHARE of it, centred.
    const cell = boundsOf(SHAPES['3A'].cells[0]?.polygon ?? []);
    expect(contains(context.camera, cell)).toBe(true);
    expect(cell.width / context.camera.width).toBeCloseTo(CONTEXT_CELL_SHARE, 9);
    expect(cell.height / context.camera.height).toBeCloseTo(CONTEXT_CELL_SHARE, 9);
    expect(context.camera.x + context.camera.width / 2).toBeCloseTo(cell.x + cell.width / 2, 9);
    expect(CONTEXT_CELL_SHARE).toBeGreaterThanOrEqual(0.7);
    expect(CONTEXT_CELL_SHARE).toBeLessThanOrEqual(0.8);
  });

  it('a later leaf fills its own cell, and its solved sibling shows its answer in the parent', () => {
    const state = solveAndSettle(start, 1);
    const vm = selectView(state, tuning);
    expect(vm?.nodeId).toEqual({ tier: 1, index: 1 });
    expect(vm?.context?.cellIndex).toBe(1);
    const leaf = round(state).puzzles['1.0'] as Puzzle;
    expect(vm?.context?.parent.cells.map((c) => [c.text, c.state])).toEqual([
      [String(leaf.cells[leaf.answerIndex]?.n), 'solved'],
      ['', 'unsolved'],
      ['', 'unsolved'],
    ]);
    const camera = vm?.context?.camera;
    const cell = boundsOf(SHAPES['3A'].cells[1]?.polygon ?? []);
    expect(camera !== undefined && contains(camera, cell)).toBe(true);
  });

  it('the round top has no context (Classic tier 2, Tower top); a Tower leaf’s context is its tier-2 node', () => {
    let state = start;
    for (let k = 1; k <= 3; k += 1) state = solveAndSettle(state, k);
    expect(selectView(state, tuning)?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(selectView(state, tuning)?.context).toBeUndefined();
    state = solveAndSettle(state, 4); // round 1: Tower
    for (let k = 5; k <= 8; k += 1) state = solveAndSettle(state, k);
    const leaf = selectView(state, tuning);
    expect(leaf?.nodeId).toEqual({ tier: 1, index: 4 });
    expect(leaf?.context?.parent.nodeId).toEqual({ tier: 2, index: 1 });
    expect(leaf?.context?.cellIndex).toBe(1);
    // Leaf 1.3 is solved: cell 0 of tier-2 node 1 shows its answer.
    expect(leaf?.context?.parent.cells[0]?.state).toBe('solved');
    for (let k = 9; k <= 13; k += 1) state = solveAndSettle(state, k);
    const tier2 = selectView(state, tuning);
    expect(tier2?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(tier2?.context?.parent.nodeId).toEqual({ tier: 3, index: 0 });
    expect(tier2?.context?.cellIndex).toBe(0);
    for (let k = 14; k <= 16; k += 1) state = solveAndSettle(state, k);
    const top = selectView(state, tuning);
    expect(top?.nodeId).toEqual({ tier: 3, index: 0 });
    expect(top?.context).toBeUndefined();
  });
});

describe('selectView: overview and presentation', () => {
  it('shows the parent as an overview after ZoomOut: solved cells show answers, unsolved ones no numeral and enter their leaf', () => {
    const solvedOne = solveAndSettle(start, 1);
    const state = run(solvedOne, { type: 'ZoomOut' }, 2);
    const vm = selectView(state, tuning);
    expect(vm?.kind).toBe('overview');
    expect(vm?.nodeId).toEqual({ tier: 2, index: 0 });
    const leaf = round(state).puzzles['1.0'] as Puzzle;
    expect(vm?.cells.map((c) => ({ text: c.text, state: c.state, enters: c.enters }))).toEqual([
      { text: String(leaf.cells[leaf.answerIndex]?.n), state: 'solved', enters: null },
      { text: '', state: 'unsolved', enters: { tier: 1, index: 1 } },
      { text: '', state: 'unsolved', enters: { tier: 1, index: 2 } },
    ]);
    // Same geometry as the puzzle view.
    expect(vm?.cells.map((c) => c.polygon)).toEqual(SHAPES['3A'].cells.map((c) => c.polygon));
  });

  it('locks input during a beat and reports its progress from Tick time', () => {
    const p = puzzleInView(start);
    let state = run(start, { type: 'TapCell', nodeId: p.nodeId, cellIndex: p.answerIndex }, 1);
    let vm = selectView(state, tuning);
    expect(vm?.inputLocked).toBe(true);
    expect(vm?.presentation).toEqual({ kind: 'solve', progress: 0, durationMs: 475, transitionId: 'default', cellIndex: p.answerIndex });
    state = run(state, { type: 'Tick', elapsedMs: 190 }, 2);
    vm = selectView(state, tuning);
    expect(vm?.presentation.progress).toBeCloseTo(0.4);
    if (vm === null) throw new Error('no view');
    expect(hitTestView(vm, vm.cells[0]?.labelPoint ?? [0, 0], 0.01)).toBeNull();
    state = run(state, { type: 'Tick', elapsedMs: 285 }, 3);
    vm = selectView(state, tuning);
    expect(vm?.presentation).toMatchObject({ kind: 'advance', progress: 0, durationMs: 500 });
    expect(vm?.nodeId).toEqual({ tier: 1, index: 1 });
  });
});

describe('tapCommand', () => {
  it('maps a puzzle cell to TapCell and an enterable overview cell to EnterPuzzle; nothing while locked or for another view', () => {
    const vm = selectView(start, tuning);
    if (vm === null) throw new Error('no view');
    expect(tapCommand(vm, { nodeId: vm.nodeId, cellIndex: 2 })).toEqual({ type: 'TapCell', nodeId: vm.nodeId, cellIndex: 2 });
    expect(tapCommand({ ...vm, inputLocked: true }, { nodeId: vm.nodeId, cellIndex: 2 })).toBeNull();
    expect(tapCommand(vm, { nodeId: { tier: 1, index: 1 }, cellIndex: 2 })).toBeNull();

    const overview = selectView(run(solveAndSettle(start, 1), { type: 'ZoomOut' }, 2), tuning);
    if (overview === null) throw new Error('no view');
    expect(tapCommand(overview, { nodeId: overview.nodeId, cellIndex: 0 })).toBeNull();
    expect(tapCommand(overview, { nodeId: overview.nodeId, cellIndex: 2 })).toEqual({ type: 'EnterPuzzle', nodeId: { tier: 1, index: 2 } });
  });
});

describe('hitTestView', () => {
  const vm = selectView(start, tuning);
  if (vm === null) throw new Error('no view');

  it('maps a cell label point to that cell of the puzzle in view', () => {
    for (const cell of vm.cells) {
      expect(hitTestView(vm, cell.labelPoint, 0.01)).toEqual({ nodeId: vm.nodeId, cellIndex: cell.index });
    }
  });

  it('is null on the operator, outside the shape, on a shared edge, and while input is locked', () => {
    expect(hitTestView(vm, vm.operator.labelPoint, 0.01)).toBeNull();
    expect(hitTestView(vm, [0.02, 0.02], 0.01)).toBeNull();
    // A vertex the top cell shares with the operator: the midpoint of the top-right edge.
    const shared = vm.operator.polygon[0];
    if (shared === undefined) throw new Error('no operator vertex');
    expect(hitTestView(vm, [shared[0], shared[1] - 0.001], 0.01)).toBeNull();
    const cell = vm.cells[0];
    if (cell === undefined) throw new Error('no cell');
    expect(hitTestView({ ...vm, inputLocked: true }, cell.labelPoint, 0.01)).toBeNull();
  });
});
