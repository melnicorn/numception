import { describe, expect, it } from 'vitest';
import type { PresentationKind } from '../presentation/presentation';
import { SHAPES } from '../layout/shapes/shapes';
import type { AppState } from '../state/app-state';
import type { CommandContext } from '../state/command-context';
import { completePresentation } from '../state/complete-presentation';
import { initialAppState } from '../state/initial-app-state';
import { roundPuzzle } from '../state/round-puzzle';
import { step } from '../state/step';
import { parseTuning } from '../tuning/parse-tuning';
import { boundsOf, contentBox, contextCamera, idleCamera, relativeCamera } from './camera-rect';
import type { PlayVM } from './play-vm';
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
  presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 },
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;

let k = 0;
function ctx(): CommandContext {
  k += 1;
  return { nowMs: k, localDate: '2026-10-14', utcDate: '2026-10-14', entropy: { ids: [`a${k}`, `b${k}`], seed32: [777 + k, k] } };
}

function viewOf(state: AppState): PlayVM {
  const vm = selectView(state, tuning);
  if (vm === null) throw new Error('no view');
  return vm;
}

function tap(state: AppState): AppState {
  const game = state.profiles[state.activeProfileId ?? ''];
  const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
  const node = round?.viewPath[round.viewPath.length - 1];
  const puzzle = round === undefined || node === undefined ? undefined : roundPuzzle(round, node);
  if (puzzle === undefined) throw new Error('no puzzle in view');
  return step(state, { command: { type: 'TapCell', nodeId: puzzle.nodeId, cellIndex: puzzle.answerIndex }, ctx: ctx() }, tuning).state;
}

/** Ticks 10 ms at a time until the view is half-way through a `kind` beat. */
function midBeat(state: AppState, kind: PresentationKind): AppState {
  let s = state;
  for (let i = 0; i < 2000; i += 1) {
    const p = viewOf(s).presentation;
    if (p.kind === kind && p.progress >= 0.5) return s;
    s = step(s, { command: { type: 'Tick', elapsedMs: 10 }, ctx: ctx() }, tuning).state;
  }
  throw new Error(`never reached ${kind}`);
}

function settle(state: AppState): AppState {
  return completePresentation(state, tuning).state;
}

function solveAndSettle(state: AppState): AppState {
  return settle(tap(state));
}

const start = step(initialAppState(), { command: { type: 'StartSession' }, ctx: ctx() }, tuning).state;
const layout = SHAPES['3A'];

describe('camera rects', () => {
  it('the idle camera is the whole shape box; a child of a becomes-cell sits on its cell polygon', () => {
    expect(relativeCamera(layout, [], [])).toEqual(contentBox(layout));
    for (const cell of layout.cells) {
      const rect = relativeCamera(layout, [cell.index], []);
      const box = boundsOf(cell.polygon);
      expect(rect.x).toBeCloseTo(box.x, 9);
      expect(rect.y).toBeCloseTo(box.y, 9);
      expect(rect.width).toBeCloseTo(box.width, 9);
      expect(rect.height).toBeCloseTo(box.height, 9);
    }
  });

  it('a sibling sits beside the view at the same size; a parent-level frame is n times larger', () => {
    const sibling = relativeCamera(layout, [0, 1], [0, 0]);
    const box = contentBox(layout);
    expect(sibling.width).toBeCloseTo(box.width, 9);
    expect(sibling.height).toBeCloseTo(box.height, 9);
    expect(sibling.x).toBeGreaterThan(box.x);
    expect(sibling.y).toBeGreaterThan(box.y);
    // Tier-2 node 0 seen from leaf 3 (cell 0 of tier-2 node 1): twice the size.
    const uncle = relativeCamera(layout, [0], [1, 0]);
    expect(uncle.width).toBeCloseTo(2 * box.width, 9);
  });
});

describe('idle cameras', () => {
  it('the top’s is its whole shape; a child’s is its context camera, in its parent’s box and in its own', () => {
    expect(idleCamera(layout, [], [])).toEqual(contentBox(layout));
    const inParent = idleCamera(layout, [2], []);
    const expected = contextCamera(layout, 2);
    expect(inParent.x).toBeCloseTo(expected.x, 9);
    expect(inParent.y).toBeCloseTo(expected.y, 9);
    expect(inParent.width).toBeCloseTo(expected.width, 9);
    // In the child's own box it holds the child's whole shape, grown by 1 / 0.75.
    const own = idleCamera(layout, [2], [2]);
    const box = contentBox(layout);
    expect(own.width).toBeCloseTo(box.width / 0.75, 9);
    expect(own.x).toBeLessThan(box.x);
    expect(own.x + own.width).toBeGreaterThan(box.x + box.width);
  });
});

describe('beat views', () => {
  it('idle: no from, to or camera', () => {
    const p = viewOf(start).presentation;
    expect(p.kind).toBe('idle');
    expect(p.cellIndex).toBeNull();
    expect(p.from).toBeUndefined();
    expect(p.to).toBeUndefined();
    expect(p.camera).toBeUndefined();
  });

  it('solve: carries the tapped answer cell and no views', () => {
    const vm = viewOf(tap(start));
    expect(vm.presentation.kind).toBe('solve');
    const game = start.profiles[start.activeProfileId ?? ''];
    const round = game?.rounds.byId[game.rounds.activeRoundId ?? ''];
    expect(vm.presentation.cellIndex).toBe(round?.puzzles['1.0']?.answerIndex);
    expect(vm.presentation.from).toBeUndefined();
  });

  it('advance: from the solved leaf (fused) to the next, panning between sibling cells', () => {
    const vm = viewOf(midBeat(tap(start), 'advance'));
    const { from, to, camera } = vm.presentation;
    expect(from?.nodeId).toEqual({ tier: 1, index: 0 });
    expect(from?.solvedAnswer).not.toBeNull();
    expect(from?.presentation.from).toBeUndefined();
    expect(to?.nodeId).toEqual({ tier: 1, index: 1 });
    expect(to?.solvedAnswer).toBeNull();
    // Both ends are the idle framings inside the shared parent: a straight pan.
    expect(camera?.to).toEqual(idleCamera(layout, [1], [1]));
    expect(camera?.from).toEqual(idleCamera(layout, [0], [1]));
    expect(camera?.from.width).toBeCloseTo(camera?.to.width ?? 0, 9);
    expect(camera?.fromBox).toEqual(relativeCamera(layout, [0], [1]));
    // Both carry their context: the same parent, in their own cells.
    expect(from?.context?.parent.nodeId).toEqual({ tier: 2, index: 0 });
    expect(from?.context?.cellIndex).toBe(0);
    expect(from?.context?.parent.cells[0]?.state).toBe('solved');
    expect(to?.context?.parent.nodeId).toEqual({ tier: 2, index: 0 });
    expect(to?.context?.cellIndex).toBe(1);
  });

  it('collapse: the last child (fused) into its cell of the parent, which takes over', () => {
    let s = start;
    s = solveAndSettle(s);
    s = solveAndSettle(s);
    const vm = viewOf(midBeat(tap(s), 'collapse'));
    const { from, to, camera } = vm.presentation;
    expect(vm.nodeId).toEqual({ tier: 2, index: 0 });
    expect(from?.nodeId).toEqual({ tier: 1, index: 2 });
    expect(from?.solvedAnswer).not.toBeNull();
    expect(to?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(to?.kind).toBe('puzzle');
    expect(vm.presentation.cellIndex).toBe(2);
    // The pull-out starts on the child's context framing (no jump) and lands on the
    // parent filling the frame (Classic: the top has no context).
    expect(from?.context?.parent.nodeId).toEqual({ tier: 2, index: 0 });
    expect(camera?.from).toEqual(from?.context?.camera);
    expect(camera?.fromBox).toEqual(relativeCamera(layout, [2], []));
    expect(camera?.to).toEqual(contentBox(layout));
    expect(to?.context).toBeUndefined();
  });

  it('Tower collapse into a tier-2 node lands on its own context framing in the top', () => {
    let s = start;
    for (let i = 0; i < 4; i += 1) s = solveAndSettle(s); // round 0, Classic
    for (let i = 0; i < 2; i += 1) s = solveAndSettle(s);
    const vm = viewOf(midBeat(tap(s), 'collapse'));
    const { from, to, camera } = vm.presentation;
    expect(from?.nodeId).toEqual({ tier: 1, index: 2 });
    expect(to?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(to?.context?.parent.nodeId).toEqual({ tier: 3, index: 0 });
    for (const key of ['x', 'y', 'width', 'height'] as const) expect(camera?.from[key]).toBeCloseTo(from?.context?.camera[key] ?? Number.NaN, 9);
    expect(camera?.to).toEqual(idleCamera(layout, [0], [0]));
    expect(camera?.to.width).toBeGreaterThan(contentBox(layout).width);
  });

  it('roundStart: from the solved top of the round before to the new first leaf; no camera', () => {
    let s = start;
    for (let i = 0; i < 3; i += 1) s = solveAndSettle(s);
    const top = viewOf(s);
    const vm = viewOf(midBeat(tap(s), 'roundStart'));
    const { from, to, camera } = vm.presentation;
    expect(from?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(from?.cells.map((c) => c.text)).toEqual(top.cells.map((c) => c.text));
    expect(from?.solvedAnswer).not.toBeNull();
    expect(to?.nodeId).toEqual({ tier: 1, index: 0 });
    expect(camera).toBeUndefined();
  });

  it('Tower: after a group collapses, the advance leaves the tier-2 puzzle for the next group’s first leaf', () => {
    let s = start;
    for (let i = 0; i < 4; i += 1) s = solveAndSettle(s); // round 0, Classic
    for (let i = 0; i < 2; i += 1) s = solveAndSettle(s);
    const vm = viewOf(midBeat(tap(s), 'advance'));
    const { from, to, camera } = vm.presentation;
    expect(from?.nodeId).toEqual({ tier: 2, index: 0 });
    expect(from?.solvedAnswer).toBeNull();
    expect(to?.nodeId).toEqual({ tier: 1, index: 3 });
    expect(camera?.fromBox).toEqual(relativeCamera(layout, [0], [1, 0]));
    expect(camera?.from).toEqual(idleCamera(layout, [0], [1, 0]));
    expect(camera?.to).toEqual(idleCamera(layout, [1, 0], [1, 0]));
    // The parents differ: the top around the tier-2 puzzle, tier-2 node 1 around the leaf.
    expect(from?.context?.parent.nodeId).toEqual({ tier: 3, index: 0 });
    expect(to?.context?.parent.nodeId).toEqual({ tier: 2, index: 1 });
  });
});
