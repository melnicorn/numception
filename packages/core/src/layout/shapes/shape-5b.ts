import type { LayoutPoint, ShapeLayout } from '../shape-layout';
import { cell, operator, regular } from './region';

// 5B pentagon flower (DESIGN.md § Shapes): a regular centre pentagon (apex at
// 12 o'clock) is the operator, a natural peer space; five petals are that
// pentagon mirrored across each of its edges, so they meet only at vertices
// (the gaps between petals). Sized so the petal tips touch the circle r 0.5:
// tip = 2·apothem + r = r(1 + 2cos 36°). Petals are pentagons but the flower is
// star-like, so nesting is only partial: the petals do not become (FR-9).
// DESIGN.md lists 5B as "Becomes, partial", but the only peer that matches the
// whole is the centre pentagon, which is the operator, not a cell. No cell
// becomes, so the layout's nesting is 'contains': the next tier is drawn inside
// each petal.
const R = 0.5 / (1 + 2 * Math.cos(Math.PI / 5));
const centre = regular(5, R, 0);

/** Mirrors `p` across the line through `a` and `b`. */
function mirror(p: LayoutPoint, a: LayoutPoint, b: LayoutPoint): LayoutPoint {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const fx = a[0] + t * dx;
  const fy = a[1] + t * dy;
  return [2 * fx - p[0], 2 * fy - p[1]];
}

/** Petal i: the centre pentagon mirrored across its edge i (centred at 36° + 72°·i). */
function petal(i: number) {
  const a = centre[i]!;
  const b = centre[(i + 1) % 5]!;
  return cell(
    i,
    centre.map((p) => mirror(p, a, b)),
    false,
  );
}

/** 5B: pentagon flower, n = 5. */
export const SHAPE_5B: ShapeLayout = {
  shapeId: '5B',
  n: 5,
  aspect: 1,
  nesting: 'contains',
  cells: [petal(0), petal(1), petal(2), petal(3), petal(4)],
  operator: operator(centre),
};
