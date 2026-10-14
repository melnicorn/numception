import { midpoint } from '../geometry/points';
import type { ShapeLayout } from '../shape-layout';
import { cell, operator, regular } from './region';

// 3A split triangle (DESIGN.md § Shapes): an equilateral triangle on its
// circumcircle (r 0.5, apex at 12 o'clock) split at its edge midpoints. Three
// outer triangles are the cells (top, lower right, lower left); the inverted
// middle triangle is the operator. Every cell is a triangle: it becomes.
const [top, right, left] = regular(3, 0.5, 0) as [readonly [number, number], readonly [number, number], readonly [number, number]];
const mTR = midpoint(top, right);
const mRL = midpoint(right, left);
const mLT = midpoint(left, top);

/** 3A: split triangle, n = 3. */
export const SHAPE_3A: ShapeLayout = {
  shapeId: '3A',
  n: 3,
  aspect: 1,
  nesting: 'becomes',
  cells: [cell(0, [top, mTR, mLT], true), cell(1, [right, mRL, mTR], true), cell(2, [left, mLT, mRL], true)],
  operator: operator([mTR, mRL, mLT]),
};
