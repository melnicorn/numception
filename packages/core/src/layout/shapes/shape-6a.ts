import type { ShapeLayout } from '../shape-layout';
import { cell, operator, regular } from './region';

// 6A honeycomb flower (DESIGN.md § Shapes): seven flat-topped hexagons, the
// centre one the operator (a natural peer space), six around it sharing an edge
// each, from 12 o'clock clockwise. Sized so the farthest vertices (√7·r out)
// touch the circle r 0.5. Hex cells hold the near-hexagonal flower: they become.
const R = 0.5 / Math.sqrt(7);
const HEX_START = Math.PI / 6; // flat top: a vertex at 3 o'clock, none at 12

const CENTRES = regular(6, Math.sqrt(3) * R, 0);

function hex(i: number) {
  return cell(i, regular(6, R, HEX_START, CENTRES[i]), true);
}

/** 6A: honeycomb flower, n = 6. */
export const SHAPE_6A: ShapeLayout = {
  shapeId: '6A',
  n: 6,
  aspect: 1,
  nesting: 'becomes',
  cells: [hex(0), hex(1), hex(2), hex(3), hex(4), hex(5)],
  operator: operator(regular(6, R, HEX_START)),
};
