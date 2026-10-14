import type { LayoutPoint, ShapeLayout } from '../shape-layout';
import { cell, operator } from './region';

// 8A 3×3 grid (DESIGN.md § Shapes): the unit box in thirds, read row by row;
// the centre square is the operator (a natural space). Square cells hold the
// square grid: they become.
const t = 1 / 3;

function square(col: number, row: number): LayoutPoint[] {
  return [
    [col * t, row * t],
    [col * t, (row + 1) * t],
    [(col + 1) * t, (row + 1) * t],
    [(col + 1) * t, row * t],
  ];
}

const POSITIONS: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

/** 8A: 3×3 grid with the operator in the centre square, n = 8. */
export const SHAPE_8A: ShapeLayout = {
  shapeId: '8A',
  n: 8,
  aspect: 1,
  nesting: 'becomes',
  cells: POSITIONS.map(([col, row], i) => cell(i, square(col, row), true)),
  operator: operator(square(1, 1)),
};
