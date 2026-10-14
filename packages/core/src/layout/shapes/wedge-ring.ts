import { midpoint } from '../geometry/points';
import type { CellGeometry, OperatorGeometry } from '../shape-layout';
import { cell, operator, regular } from './region';

/**
 * A regular `count`-gon (r 0.5, vertex at 12 o'clock) cut into wedges from the
 * centre, with a concentric `count`-gon of radius `carve` removed for the
 * operator. Wedge i runs clockwise from vertex i, so it is a trapezoid. Wedges
 * are not the whole's shape: they contain the next tier (FR-9).
 */
export function wedgeRing(count: number, carve: number): { cells: CellGeometry[]; operator: OperatorGeometry } {
  const outer = regular(count, 0.5, 0);
  const inner = regular(count, carve, 0);
  const cells = outer.map((o, i) => {
    const j = (i + 1) % count;
    const vertices = [o, outer[j]!, inner[j]!, inner[i]!];
    return cell(i, vertices, false, [midpoint(inner[i]!, inner[j]!), midpoint(o, outer[j]!)]);
  });
  return { cells, operator: operator(inner) };
}
