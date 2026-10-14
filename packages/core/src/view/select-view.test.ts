import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import { SHAPES } from '../layout/shapes/shapes';
import type { AppState } from '../state/app-state';
import type { CommandContext } from '../state/command-context';
import { initialAppState } from '../state/initial-app-state';
import type { Round } from '../state/round';
import { roundPuzzle } from '../state/round-puzzle';
import { step } from '../state/step';
import { parseTuning } from '../tuning/parse-tuning';
import { hitTestView } from './hit-test-view';
import { KILN_TOKENS } from './kiln-tokens';
import { selectView } from './select-view';

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
    expect(vm.inputLocked).toBe(false);
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
      });
    });
  });

  it("shows the tier-2 puzzle with each solved child's answer, as solved cells", () => {
    let state = start;
    for (let k = 1; k <= 3; k += 1) {
      const p = puzzleInView(state);
      state = step(state, { command: { type: 'TapCell', nodeId: p.nodeId, cellIndex: p.answerIndex }, ctx: ctx(k) }, tuning).state;
    }
    const vm = selectView(state, tuning);
    expect(vm?.nodeId).toEqual({ tier: 2, index: 0 });
    const r = round(state);
    vm?.cells.forEach((cell, j) => {
      const leaf = r.puzzles[`1.${j}`] as Puzzle;
      expect(cell.text).toBe(String(leaf.cells[leaf.answerIndex]?.n));
      expect(cell.state).toBe('solved');
    });
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
