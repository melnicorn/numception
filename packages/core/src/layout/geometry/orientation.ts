import type { LayoutPolygon } from '../shape-layout';

/**
 * The shoelace sum Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ) / 2. With y down (layout space) it is
 * negative for a polygon that runs counter-clockwise on screen.
 */
export function signedArea(polygon: LayoutPolygon): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, y1] = polygon[i]!;
    const [x2, y2] = polygon[(i + 1) % polygon.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** `polygon` in screen counter-clockwise order (the layout convention). */
export function counterClockwise(polygon: LayoutPolygon): LayoutPolygon {
  return signedArea(polygon) > 0 ? [...polygon].reverse() : polygon;
}
