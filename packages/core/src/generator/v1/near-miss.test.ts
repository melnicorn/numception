import { describe, expect, it } from 'vitest';
import { countNearMisses, isNear, nearsSomePair } from './near-miss';

describe('near-misses', () => {
  it('isNear is within delta but not equal', () => {
    expect(isNear(10, 10, 2)).toBe(false);
    expect(isNear(11, 10, 2)).toBe(true);
    expect(isNear(8, 10, 2)).toBe(true);
    expect(isNear(13, 10, 2)).toBe(false);
  });

  it('nearsSomePair checks pair sums and differences, skipping one index', () => {
    // 3 + 8 = 11, 8 − 3 = 5.
    expect(nearsSomePair([3, 8], 12, 1, -1)).toBe(true);
    expect(nearsSomePair([3, 8], 4, 1, -1)).toBe(true);
    expect(nearsSomePair([3, 8], 7, 1, -1)).toBe(false);
    expect(nearsSomePair([3, 8, 12], 12, 1, 2)).toBe(true);
    expect(nearsSomePair([3, 8, 12], 12, 1, 1)).toBe(false);
  });

  it('counts only the listed distractors, each against the other cells', () => {
    // Triple 2 + 5 = 7. 13 is one off 5 + 7 = 12; 20 is near no pair; 19 is one off 13 + 5.
    expect(countNearMisses([2, 5, 7, 13], [3], 1)).toBe(1);
    expect(countNearMisses([2, 5, 7, 20], [3], 1)).toBe(0);
    expect(countNearMisses([2, 5, 7, 13, 19], [3, 4], 1)).toBe(2);
    expect(countNearMisses([2, 5, 7, 13, 19], [4], 1)).toBe(1);
  });
});
