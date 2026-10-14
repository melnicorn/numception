import { describe, expect, it } from 'vitest';
import { columnSteps } from './column-steps';

describe('columnSteps', () => {
  it.each([
    [12, 34, 0], [17, 25, 1], [5, 5, 1], [99, 1, 2], [999, 1, 3], [0, 0, 0],
  ])('carries of %i + %i = %i', (x, y, c) => expect(columnSteps(x, y, 'carry')).toBe(c));
  it.each([
    [46, 12, 0], [42, 17, 1], [100, 1, 2], [1000, 1, 3], [7, 7, 0],
  ])('borrows of %i − %i = %i', (x, y, c) => expect(columnSteps(x, y, 'borrow')).toBe(c));
  it('borrows of x − y equal carries of y + (x − y)', () => {
    for (let x = 0; x <= 300; x += 7) for (let y = 0; y <= x; y += 3) expect(columnSteps(x, y, 'borrow')).toBe(columnSteps(y, x - y, 'carry'));
  });
});
