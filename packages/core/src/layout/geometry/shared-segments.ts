import type { LayoutPolygon } from '../shape-layout';
import { edgesOf, type Segment } from './edge-distance';

const EPS = 1e-9;

/**
 * The parts of `polygon`'s edges that lie along an edge of any of `others`
 * (collinear overlap of positive length). These are the shared edges that make
 * a tap a no-op (FR-8); a lone shared vertex is not an edge.
 */
export function sharedSegments(polygon: LayoutPolygon, others: readonly LayoutPolygon[]): Segment[] {
  const out: Segment[] = [];
  const otherEdges = others.flatMap(edgesOf);
  for (const [a, b] of edgesOf(polygon)) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < EPS) continue;
    for (const [r, s] of otherEdges) {
      // Both ends of the other edge must sit on this edge's line.
      const cr = (dx * (r[1] - a[1]) - dy * (r[0] - a[0])) / len;
      const cs = (dx * (s[1] - a[1]) - dy * (s[0] - a[0])) / len;
      if (Math.abs(cr) > EPS || Math.abs(cs) > EPS) continue;
      const tr = ((r[0] - a[0]) * dx + (r[1] - a[1]) * dy) / (len * len);
      const ts = ((s[0] - a[0]) * dx + (s[1] - a[1]) * dy) / (len * len);
      const lo = Math.max(0, Math.min(tr, ts));
      const hi = Math.min(1, Math.max(tr, ts));
      if ((hi - lo) * len <= EPS) continue;
      out.push([
        [a[0] + lo * dx, a[1] + lo * dy],
        [a[0] + hi * dx, a[1] + hi * dy],
      ]);
    }
  }
  return out;
}
