// FR-8 property: a point inside a cell and clear of its shared edges hits that
// cell; a point within tolerance of a shared edge never hits.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { distanceToSegment } from './geometry/edge-distance';
import { pointInPolygon } from './geometry/point-in-polygon';
import { sharedSegments } from './geometry/shared-segments';
import { hitTest } from './hit-test';
import { SHAPE_IDS } from './shape-id';
import type { LayoutPoint } from './shape-layout';
import { SHAPES } from './shapes/shapes';

describe('hitTest (property)', () => {
  it('hits the cell under a point away from shared edges, and nothing on them', () => {
    const unit = fc.double({ min: 0, max: 1, noNaN: true });
    fc.assert(
      fc.property(fc.constantFrom(...SHAPE_IDS), fc.nat(), unit, unit, fc.double({ min: 0, max: 0.03, noNaN: true }), (id, k, u, v, tol) => {
        const layout = SHAPES[id];
        const cell = layout.cells[k % layout.n]!;
        const xs = cell.polygon.map((p) => p[0]);
        const ys = cell.polygon.map((p) => p[1]);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const p: LayoutPoint = [minX + u * (Math.max(...xs) - minX), minY + v * (Math.max(...ys) - minY)];
        fc.pre(pointInPolygon(p, cell.polygon));
        const others = [layout.operator.polygon, ...layout.cells.filter((c) => c !== cell).map((c) => c.polygon)];
        // Distances in drawn proportions (x scaled by aspect), as hitTest measures them.
        const drawn = (q: LayoutPoint): LayoutPoint => [q[0] * layout.aspect, q[1]];
        const nearest = Math.min(
          ...sharedSegments(cell.polygon, others).map(([a, b]) => distanceToSegment(drawn(p), [drawn(a), drawn(b)])),
        );
        if (nearest > Math.max(tol, 1e-9) + 1e-12) expect(hitTest(layout, p, tol)).toBe(cell.index);
        if (nearest <= tol) expect(hitTest(layout, p, tol)).toBeNull();
      }),
      { numRuns: 2000 },
    );
  });
});
