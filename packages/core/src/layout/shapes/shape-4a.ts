import { midpoint } from '../geometry/points';
import type { LayoutPoint, ShapeLayout } from '../shape-layout';
import { cell, operator } from './region';

// 4A diamond of diamonds (DESIGN.md § Shapes; mockups/shape-n4-diamonds.html):
// the box's inscribed diamond split at its edge midpoints into four diamonds
// (top, right, bottom, left), with a centre diamond carved out for the operator
// at 18% of the half-diagonals. Drawn at 1 : 1.25 (aspect 0.8), so in the unit
// box it is square. Every cell is a diamond: true fractal, it becomes.
const CARVE = 0.18 * 0.5;
const c = 0.5;
const tips: LayoutPoint[] = [
  [c, 0],
  [1, c],
  [c, 1],
  [0, c],
];
const carve: LayoutPoint[] = [
  [c, c - CARVE],
  [c + CARVE, c],
  [c, c + CARVE],
  [c - CARVE, c],
];
/** Edge midpoint between tip i and tip i + 1, and where that seam meets the carve. */
const mids = tips.map((t, i) => midpoint(t, tips[(i + 1) % 4]!));
const notches = carve.map((p, i) => midpoint(p, carve[(i + 1) % 4]!));

/** Cell i: tip i, the seams either side of it, cut back to the carve. */
function diamond(i: number) {
  const prev = (i + 3) % 4;
  return cell(i, [tips[i]!, mids[i]!, notches[i]!, carve[i]!, notches[prev]!, mids[prev]!], true, [tips[i]!, carve[i]!]);
}

/** 4A: diamond of diamonds with a carved centre, n = 4. */
export const SHAPE_4A: ShapeLayout = {
  shapeId: '4A',
  n: 4,
  aspect: 0.8,
  nesting: 'becomes',
  cells: [diamond(0), diamond(1), diamond(2), diamond(3)],
  operator: operator(carve),
};
