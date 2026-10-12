import { describe, expect, it } from 'vitest';
import { contractFloor } from './contract-floor';

describe('contractFloor', () => {
  it('is 3 for an add leaf and 2f + 1 per tier above', () => {
    expect([1, 2, 3].map((tier) => contractFloor('add', tier))).toEqual([3, 7, 15]);
  });

  it('is 1 at every tier for sub', () => {
    expect([1, 2, 3].map((tier) => contractFloor('sub', tier))).toEqual([1, 1, 1]);
  });
});
