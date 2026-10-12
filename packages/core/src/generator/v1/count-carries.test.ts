import { describe, expect, it } from 'vitest';
import { countBorrows, countCarries } from './count-carries';

describe('countCarries', () => {
  it.each([
    [0, 0, 0],
    [1, 2, 0],
    [12, 34, 0],
    [5, 5, 1],
    [9, 1, 1],
    [19, 1, 1],
    [99, 1, 2],
    [999, 1, 3],
    [45, 55, 2],
    [123, 877, 3],
    [500, 500, 1],
    [0x7fffffff, 0, 0],
    [999999999, 1, 9],
  ])('%i + %i has %i carries', (x, y, carries) => {
    expect(countCarries(x, y)).toBe(carries);
    expect(countCarries(y, x)).toBe(carries);
  });
});

describe('countBorrows', () => {
  it.each([
    [0, 0, 0],
    [3, 2, 0],
    [10, 1, 1],
    [100, 1, 2],
    [1000, 1, 3],
    [52, 27, 1],
    [1000, 999, 3],
    [64, 64, 0],
  ])('%i − %i has %i borrows', (x, y, borrows) => {
    expect(countBorrows(x, y)).toBe(borrows);
  });

  it('equals the carries of b + c for every a − b = c up to 400', () => {
    for (let a = 0; a <= 400; a += 1) {
      for (let b = 0; b <= a; b += 1) expect(countBorrows(a, b)).toBe(countCarries(b, a - b));
    }
  });
});
