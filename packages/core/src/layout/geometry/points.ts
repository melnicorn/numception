import type { LayoutPoint } from '../shape-layout';

/** The midpoint of `a` and `b`. */
export function midpoint(a: LayoutPoint, b: LayoutPoint): LayoutPoint {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** The vertex mean of a polygon (its centre, for a regular one). */
export function vertexMean(points: readonly LayoutPoint[]): LayoutPoint {
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / points.length, sy / points.length];
}
