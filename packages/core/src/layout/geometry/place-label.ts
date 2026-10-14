import type { LayoutPoint, LayoutPolygon } from '../shape-layout';
import { distanceToEdges } from './edge-distance';
import { pointInPolygon } from './point-in-polygon';

const SAMPLES = 64;
const REFINE_STEPS = 60;

/** Distance to the nearest edge, or −∞ outside the polygon. */
function clearance(point: LayoutPoint, polygon: LayoutPolygon): number {
  return pointInPolygon(point, polygon) ? distanceToEdges(point, polygon) : Number.NEGATIVE_INFINITY;
}

/**
 * The label point on the segment `from`→`to` (the region's axis of symmetry)
 * that is farthest from every edge, and that distance (the inscribed radius
 * there). Deterministic: a fixed sample sweep, then a fixed golden-section
 * refinement. Pass `from === to` to place the label at a known centre.
 */
export function placeLabel(
  polygon: LayoutPolygon,
  from: LayoutPoint,
  to: LayoutPoint = from,
): { readonly labelPoint: LayoutPoint; readonly inscribedRadius: number } {
  const at = (t: number): LayoutPoint => [from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1])];
  let bestT = 0;
  let best = clearance(at(0), polygon);
  for (let i = 1; i <= SAMPLES; i += 1) {
    const c = clearance(at(i / SAMPLES), polygon);
    if (c > best) {
      best = c;
      bestT = i / SAMPLES;
    }
  }
  let lo = Math.max(0, bestT - 1 / SAMPLES);
  let hi = Math.min(1, bestT + 1 / SAMPLES);
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < REFINE_STEPS; i += 1) {
    const m1 = hi - g * (hi - lo);
    const m2 = lo + g * (hi - lo);
    if (clearance(at(m1), polygon) < clearance(at(m2), polygon)) lo = m1;
    else hi = m2;
  }
  const mid = (lo + hi) / 2;
  const t = clearance(at(mid), polygon) > best ? mid : bestT;
  const labelPoint = at(t);
  return { labelPoint, inscribedRadius: distanceToEdges(labelPoint, polygon) };
}
