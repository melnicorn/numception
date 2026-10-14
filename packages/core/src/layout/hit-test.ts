import { distanceToSegment, type Segment } from './geometry/edge-distance';
import { pointInPolygon } from './geometry/point-in-polygon';
import { sharedSegments } from './geometry/shared-segments';
import type { LayoutPoint, ShapeLayout } from './shape-layout';

/** The smallest edge tolerance applied, absorbing float noise on exact edges. */
const MIN_EDGE_TOLERANCE = 1e-9;

/**
 * The cell index under `point` (unit-box coordinates), or null (FR-8). Null for a
 * point outside every cell, inside the operator (never an answer), or within
 * `edgeTolerance` of an edge the cell shares with another cell or the operator:
 * shared edges are no-ops. Outer-boundary edges are not shared, so a tap just
 * inside the rim still hits.
 *
 * Edge distance is measured in drawn proportions: x is scaled by
 * `layout.aspect`, so `edgeTolerance` is in units of the drawn height and means
 * the same on-screen dead zone on every seam, diagonal or not. The caller
 * converts with `edgeTolerance = tolerancePx / drawnHeightPx` (likewise in pt),
 * and passes `point` in unit-box coordinates:
 * `[(px − left) / drawnWidthPx, (py − top) / drawnHeightPx]`, where
 * `drawnWidthPx = aspect × drawnHeightPx`. It is floored at `MIN_EDGE_TOLERANCE`, so a point on a
 * shared edge is a no-op even at 0 despite float noise; a negative or
 * non-finite tolerance counts as that floor.
 */
export function hitTest(layout: ShapeLayout, point: LayoutPoint, edgeTolerance: number): number | null {
  const tolerance = Number.isFinite(edgeTolerance) && edgeTolerance > MIN_EDGE_TOLERANCE ? edgeTolerance : MIN_EDGE_TOLERANCE;
  if (pointInPolygon(point, layout.operator.polygon)) return null;
  const hit = layout.cells.find((c) => pointInPolygon(point, c.polygon));
  if (hit === undefined) return null;
  const others = [layout.operator.polygon, ...layout.cells.filter((c) => c !== hit).map((c) => c.polygon)];
  const drawn = (p: LayoutPoint): LayoutPoint => [p[0] * layout.aspect, p[1]];
  const at = drawn(point);
  const nearShared = sharedSegments(hit.polygon, others).some(
    ([a, b]) => distanceToSegment(at, [drawn(a), drawn(b)] as Segment) <= tolerance,
  );
  return nearShared ? null : hit.index;
}
