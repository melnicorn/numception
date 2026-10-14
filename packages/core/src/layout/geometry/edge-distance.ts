import type { LayoutPoint, LayoutPolygon } from '../shape-layout';

/** A line segment from `a` to `b`. */
export type Segment = readonly [a: LayoutPoint, b: LayoutPoint];

/** Euclidean distance from `point` to the closed segment `[a, b]`. */
export function distanceToSegment(point: LayoutPoint, [a, b]: Segment): number {
  const [px, py] = point;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/** The polygon's edges, each from vertex i to vertex i + 1 (wrapping). */
export function edgesOf(polygon: LayoutPolygon): Segment[] {
  return polygon.map((p, i) => [p, polygon[(i + 1) % polygon.length]!] as const);
}

/** Distance from `point` to the nearest edge of `polygon`. */
export function distanceToEdges(point: LayoutPoint, polygon: LayoutPolygon): number {
  return edgesOf(polygon).reduce((m, e) => Math.min(m, distanceToSegment(point, e)), Number.POSITIVE_INFINITY);
}
