import { describe, expect, it } from 'vitest';
import { completesTriple, countValidTriples } from './count-triples';

describe('countValidTriples', () => {
  it.each([
    [[1, 2, 3], 1],
    [[3, 1, 2], 1],
    [[1, 2, 4], 0],
    [[1, 2, 3, 5], 2],
    [[1, 2, 3, 4], 2],
    [[10, 11, 12, 13], 0],
    [[2, 4, 6, 8, 10], 4],
    [[], 0],
  ])('%j has %i', (values, count) => {
    expect(countValidTriples(values)).toBe(count);
  });
});

describe('completesTriple', () => {
  it('is true for a pair sum or difference, false otherwise', () => {
    expect(completesTriple([3, 8], 11)).toBe(true);
    expect(completesTriple([3, 8], 5)).toBe(true);
    expect(completesTriple([3, 8], 6)).toBe(false);
    expect(completesTriple([3], 3)).toBe(false);
  });
});
