import { counterClockwise } from '../geometry/orientation';
import { placeLabel } from '../geometry/place-label';
import { vertexMean } from '../geometry/points';
import type { CellGeometry, LayoutPoint, LayoutPolygon, OperatorGeometry } from '../shape-layout';

/**
 * A cell from its vertices (any winding; stored counter-clockwise). The label is
 * placed on `axis` (default: the vertex mean, right for regular cells).
 */
export function cell(
  index: number,
  vertices: LayoutPolygon,
  becomes: boolean,
  axis: readonly [LayoutPoint, LayoutPoint] = [vertexMean(vertices), vertexMean(vertices)],
): CellGeometry {
  const polygon = counterClockwise(vertices);
  return { index, polygon, becomes, ...placeLabel(polygon, axis[0], axis[1]) };
}

/** The operator region, labelled at the box centre (0.5, 0.5). */
export function operator(vertices: LayoutPolygon): OperatorGeometry {
  const polygon = counterClockwise(vertices);
  return { polygon, ...placeLabel(polygon, [0.5, 0.5]) };
}

/** `count` vertices of a regular polygon around the box centre, the first at `start`. */
export function regular(count: number, r: number, start: number, centre: LayoutPoint = [0.5, 0.5]): LayoutPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const a = start + (2 * Math.PI * i) / count;
    return [centre[0] + r * Math.sin(a), centre[1] - r * Math.cos(a)] as const;
  });
}
