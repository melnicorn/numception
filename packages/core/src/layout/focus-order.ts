import type { ShapeLayout } from './shape-layout';

const TURN = 2 * Math.PI;
const EPS = 1e-9;

/**
 * Keyboard focus order: every cell index once. Rule: clockwise on screen by the
 * angle of the cell's `labelPoint` around the centre (0.5, 0.5), starting with
 * the first cell clockwise from 12 o'clock (angle 0 inclusive, so a cell
 * centred at 12 o'clock comes first; where a seam sits there, as in 5B, 7A and
 * 9B, the cell just clockwise of it does). Equal angles go nearer the centre
 * first, then by index. The operator is not focusable.
 */
export function focusOrder(layout: ShapeLayout): number[] {
  const keyed = layout.cells.map((c) => {
    const dx = c.labelPoint[0] - 0.5;
    const dy = c.labelPoint[1] - 0.5;
    let angle = Math.atan2(dx, -dy); // y down: 0 at 12 o'clock, growing clockwise
    if (angle < 0) angle += TURN;
    if (angle > TURN - EPS) angle = 0;
    return { index: c.index, angle, distance: Math.hypot(dx, dy) };
  });
  keyed.sort((a, b) => {
    if (Math.abs(a.angle - b.angle) > EPS) return a.angle - b.angle;
    if (Math.abs(a.distance - b.distance) > EPS) return a.distance - b.distance;
    return a.index - b.index;
  });
  return keyed.map((k) => k.index);
}
