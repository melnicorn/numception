// Layout invariants (A4, AD-13), checked for every shape in the registry.
import { describe, expect, it } from 'vitest';
import { distanceToEdges, edgesOf, type Segment } from '../geometry/edge-distance';
import { signedArea } from '../geometry/orientation';
import { pointInPolygon } from '../geometry/point-in-polygon';
import { SHAPE_IDS } from '../shape-id';
import type { LayoutPoint, LayoutPolygon } from '../shape-layout';
import { SHAPES } from './shapes';

const EPS = 1e-9;

function cross(o: LayoutPoint, a: LayoutPoint, b: LayoutPoint): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Segments meet at a point interior to both (a proper crossing, not a touch). */
function properlyCross([a, b]: Segment, [c, d]: Segment): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS));
}

/** Segments share any point (touching included). */
function touch(s: Segment, t: Segment): boolean {
  if (properlyCross(s, t)) return true;
  const onSeg = (p: LayoutPoint, [a, b]: Segment) =>
    Math.abs(cross(a, b, p)) < EPS &&
    p[0] >= Math.min(a[0], b[0]) - EPS &&
    p[0] <= Math.max(a[0], b[0]) + EPS &&
    p[1] >= Math.min(a[1], b[1]) - EPS &&
    p[1] <= Math.max(a[1], b[1]) + EPS;
  return onSeg(s[0], t) || onSeg(s[1], t) || onSeg(t[0], s) || onSeg(t[1], s);
}

function isSimple(polygon: LayoutPolygon): boolean {
  const edges = edgesOf(polygon);
  const k = edges.length;
  if (k < 3) return false;
  for (let i = 0; i < k; i += 1) {
    const [a, b] = edges[i]!;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < EPS) return false;
    for (let j = i + 1; j < k; j += 1) {
      const adjacent = j === i + 1 || (i === 0 && j === k - 1);
      if (adjacent) {
        // Adjacent edges meet only at their shared vertex: no fold-back.
        const [c, d] = edges[j]!;
        const shared = j === i + 1 ? b : a;
        const far1 = j === i + 1 ? a : b;
        const far2 = j === i + 1 ? d : c;
        const dot = (far1[0] - shared[0]) * (far2[0] - shared[0]) + (far1[1] - shared[1]) * (far2[1] - shared[1]);
        if (Math.abs(cross(shared, far1, far2)) < EPS && dot > 0) return false;
      } else if (touch(edges[i]!, edges[j]!)) return false;
    }
  }
  return true;
}

describe.each(SHAPE_IDS)('shape %s', (id) => {
  const layout = SHAPES[id];
  const regions = [...layout.cells.map((c) => c.polygon), layout.operator.polygon];
  const labelled = [...layout.cells, layout.operator];

  it('has its id, n cells indexed 0..n − 1 and one operator', () => {
    expect(layout.shapeId).toBe(id);
    expect(layout.n).toBe(Number(id[0]));
    expect(layout.cells.map((c) => c.index)).toEqual(Array.from({ length: layout.n }, (_, i) => i));
    expect(layout.operator.polygon.length).toBeGreaterThanOrEqual(3);
  });

  it('has only simple, counter-clockwise polygons inside the unit box', () => {
    for (const polygon of regions) {
      expect(isSimple(polygon)).toBe(true);
      expect(signedArea(polygon)).toBeLessThan(0); // y down: counter-clockwise on screen
      for (const [x, y] of polygon) {
        expect(x).toBeGreaterThanOrEqual(-EPS);
        expect(x).toBeLessThanOrEqual(1 + EPS);
        expect(y).toBeGreaterThanOrEqual(-EPS);
        expect(y).toBeLessThanOrEqual(1 + EPS);
      }
    }
  });

  it('has no overlapping regions (shared edges allowed)', () => {
    for (let i = 0; i < regions.length; i += 1) {
      for (let j = i + 1; j < regions.length; j += 1) {
        for (const e of edgesOf(regions[i]!)) for (const f of edgesOf(regions[j]!)) expect(properlyCross(e, f)).toBe(false);
        expect(pointInPolygon(labelled[i]!.labelPoint, regions[j]!)).toBe(false);
        expect(pointInPolygon(labelled[j]!.labelPoint, regions[i]!)).toBe(false);
      }
    }
    // Every grid point clear of all edges lies inside at most one region.
    const steps = 101;
    for (let gx = 0; gx < steps; gx += 1) {
      for (let gy = 0; gy < steps; gy += 1) {
        const p: LayoutPoint = [(gx + 0.5) / steps, (gy + 0.5) / steps];
        const inside = regions.filter((r) => pointInPolygon(p, r) && distanceToEdges(p, r) > 1e-6);
        expect(inside.length).toBeLessThanOrEqual(1);
      }
    }
    const total = regions.reduce((s, r) => s - signedArea(r), 0);
    expect(total).toBeLessThanOrEqual(1 + EPS);
  });

  it("has nesting 'becomes' exactly when some cell becomes", () => {
    expect(layout.nesting === 'becomes').toBe(layout.cells.some((c) => c.becomes));
  });

  it('puts the operator round the centre', () => {
    expect(pointInPolygon([0.5, 0.5], layout.operator.polygon)).toBe(true);
    expect(layout.operator.labelPoint).toEqual([0.5, 0.5]);
  });

  it('places every label inside its region with a positive inscribed radius', () => {
    for (const region of labelled) {
      expect(region.inscribedRadius).toBeGreaterThan(0);
      expect(pointInPolygon(region.labelPoint, region.polygon)).toBe(true);
      for (const e of edgesOf(region.polygon)) {
        const d = distanceToEdges(region.labelPoint, [e[0], e[1], e[0]]);
        expect(d).toBeGreaterThanOrEqual(region.inscribedRadius - 1e-12);
      }
    }
  });
});

describe('nesting and aspect', () => {
  it('follows DESIGN.md § Shapes', () => {
    const becomes = Object.fromEntries(SHAPE_IDS.map((id) => [id, SHAPES[id].cells.map((c) => c.becomes)]));
    expect(becomes['3A']).toEqual([true, true, true]);
    expect(becomes['4A']).toEqual([true, true, true, true]);
    expect(becomes['5B']).toEqual([false, false, false, false, false]);
    expect(becomes['6A']).toEqual(Array(6).fill(true));
    expect(becomes['7A']).toEqual(Array(7).fill(false));
    expect(becomes['8A']).toEqual(Array(8).fill(true));
    expect(becomes['9B']).toEqual(Array(9).fill(false));
    expect(SHAPE_IDS.map((id) => SHAPES[id].nesting)).toEqual(['becomes', 'becomes', 'contains', 'becomes', 'contains', 'becomes', 'contains']);
  });

  it('draws 4A at 1 : 1.25 and the rest square', () => {
    expect(SHAPES['4A'].aspect).toBe(0.8);
    for (const id of SHAPE_IDS.filter((i) => i !== '4A')) expect(SHAPES[id].aspect).toBe(1);
  });
});
