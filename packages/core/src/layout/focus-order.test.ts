import { describe, expect, it } from 'vitest';
import { focusOrder } from './focus-order';
import { SHAPE_IDS } from './shape-id';
import type { CellGeometry, ShapeLayout } from './shape-layout';
import { SHAPES } from './shapes/shapes';

describe('focusOrder', () => {
  it.each(SHAPE_IDS)('visits every cell of %s once', (id) => {
    const order = focusOrder(SHAPES[id]);
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: SHAPES[id].n }, (_, i) => i));
  });

  it('starts with the first cell clockwise from 12 o’clock (by label-point angle) and goes clockwise', () => {
    expect(focusOrder(SHAPES['3A'])).toEqual([0, 1, 2]);
    expect(focusOrder(SHAPES['4A'])).toEqual([0, 1, 2, 3]);
    expect(focusOrder(SHAPES['5B'])).toEqual([0, 1, 2, 3, 4]);
    expect(focusOrder(SHAPES['6A'])).toEqual([0, 1, 2, 3, 4, 5]);
    expect(focusOrder(SHAPES['7A'])).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // Grid read row by row; focus starts top-middle and circles clockwise.
    expect(focusOrder(SHAPES['8A'])).toEqual([1, 2, 4, 7, 6, 5, 3, 0]);
    expect(focusOrder(SHAPES['9B'])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('breaks angle ties by distance from the centre', () => {
    const at = (index: number, x: number, y: number): CellGeometry => ({
      index,
      polygon: [],
      labelPoint: [x, y],
      inscribedRadius: 0.01,
      becomes: false,
    });
    const layout: ShapeLayout = {
      ...SHAPES['3A'],
      cells: [at(0, 0.9, 0.5), at(1, 0.5, 0.1), at(2, 0.5, 0.3), at(3, 0.1, 0.5)],
    };
    expect(focusOrder(layout)).toEqual([2, 1, 0, 3]);
  });
});
