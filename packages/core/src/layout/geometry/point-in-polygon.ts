import type { LayoutPoint, LayoutPolygon } from '../shape-layout';

/**
 * Whether `point` lies inside `polygon` (even-odd ray cast). Points exactly on an
 * edge may fall either way; callers that care treat edges with a tolerance.
 * A non-finite point is outside.
 */
export function pointInPolygon(point: LayoutPoint, polygon: LayoutPolygon): boolean {
  const [px, py] = point;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
