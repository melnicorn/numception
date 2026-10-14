import { describe, expect, it } from 'vitest';
import { edgesOf } from './geometry/edge-distance';
import { sharedSegments } from './geometry/shared-segments';
import { hitTest } from './hit-test';
import { SHAPE_IDS } from './shape-id';
import type { LayoutPoint, ShapeLayout } from './shape-layout';
import { SHAPES } from './shapes/shapes';

const TOL = 0.01;

function othersOf(layout: ShapeLayout, index: number) {
  return [layout.operator.polygon, ...layout.cells.filter((c) => c.index !== index).map((c) => c.polygon)];
}

const mid = ([a, b]: readonly [LayoutPoint, LayoutPoint]): LayoutPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

describe.each(SHAPE_IDS)('hitTest on %s', (id) => {
  const layout = SHAPES[id];

  it('hits each cell at its label point', () => {
    for (const c of layout.cells) expect(hitTest(layout, c.labelPoint, TOL)).toBe(c.index);
  });

  it('ignores taps on shared edges', () => {
    let shared = 0;
    for (const c of layout.cells) {
      for (const s of sharedSegments(c.polygon, othersOf(layout, c.index))) {
        shared += 1;
        expect(hitTest(layout, mid(s), TOL)).toBeNull();
        expect(hitTest(layout, mid(s), 0)).toBeNull();
      }
    }
    expect(shared).toBeGreaterThan(0);
  });

  it('hits just inside the outer rim', () => {
    let outer = 0;
    for (const c of layout.cells) {
      const shared = sharedSegments(c.polygon, othersOf(layout, c.index));
      for (const e of edgesOf(c.polygon)) {
        const m = mid(e);
        // An outer edge: no shared segment runs through its midpoint.
        if (shared.some((s) => sharedSegments([s[0], s[1], s[0]], [[e[0], e[1], e[0]]]).length > 0)) continue;
        outer += 1;
        const d = Math.hypot(c.labelPoint[0] - m[0], c.labelPoint[1] - m[1]);
        const k = 0.002 / d;
        const p: LayoutPoint = [m[0] + k * (c.labelPoint[0] - m[0]), m[1] + k * (c.labelPoint[1] - m[1])];
        expect(hitTest(layout, p, TOL)).toBe(c.index);
      }
    }
    expect(outer).toBeGreaterThan(0);
  });

  it('never answers with the operator or outside the shape', () => {
    expect(hitTest(layout, [0.5, 0.5], TOL)).toBeNull();
    expect(hitTest(layout, layout.operator.labelPoint, 0)).toBeNull();
    expect(hitTest(layout, [-0.1, 0.5], TOL)).toBeNull();
    expect(hitTest(layout, [0.5, 1.2], TOL)).toBeNull();
    expect(hitTest(layout, [Number.NaN, 0.5], TOL)).toBeNull();
  });

  it('treats a negative or non-finite tolerance as the floor', () => {
    const c = layout.cells[0]!;
    expect(hitTest(layout, c.labelPoint, -1)).toBe(c.index);
    expect(hitTest(layout, c.labelPoint, Number.NaN)).toBe(c.index);
  });
});

describe('hitTest tolerance in drawn proportions', () => {
  /**
   * A point `d` (drawn-height units) from the midpoint of the seam between cells
   * `from` and `to`, perpendicular to it as drawn (x scaled by aspect), on `from`'s side.
   */
  function offSeam(layout: ShapeLayout, from: number, to: number, d: number): LayoutPoint {
    const [s] = sharedSegments(layout.cells[from]!.polygon, [layout.cells[to]!.polygon]);
    const a = layout.aspect;
    const [m0, m1] = mid(s!);
    const dx = (s![1][0] - s![0][0]) * a;
    const dy = s![1][1] - s![0][1];
    const len = Math.hypot(dx, dy);
    const label = layout.cells[from]!.labelPoint;
    // Normal in drawn space, pointed towards `from`'s label.
    let nx = -dy / len;
    let ny = dx / len;
    if (nx * (label[0] - m0) * a + ny * (label[1] - m1) < 0) [nx, ny] = [-nx, -ny];
    return [(m0 * a + nx * d) / a, m1 + ny * d];
  }

  it('gives a diagonal 4A seam the same dead zone as an axis-aligned 8A seam', () => {
    const cases: [ShapeLayout, number, number][] = [
      [SHAPES['4A'], 0, 1], // diagonal seam, aspect 0.8
      [SHAPES['8A'], 0, 1], // vertical seam, aspect 1
    ];
    for (const [layout, from, to] of cases) {
      expect(hitTest(layout, offSeam(layout, from, to, TOL * 0.95), TOL)).toBeNull();
      expect(hitTest(layout, offSeam(layout, from, to, TOL * 1.05), TOL)).toBe(from);
    }
  });
});
