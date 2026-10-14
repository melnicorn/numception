import { describe, expect, it } from 'vitest';
import { nextRoundRequest } from './next-round-request';

describe('nextRoundRequest', () => {
  it('alternates Classic (even ordinals) and Tower (odd) at n = 3, +, band 1', () => {
    expect([0, 1, 2, 3, 4, 5].map((roundOrdinal) => nextRoundRequest({ roundOrdinal }).type)).toEqual([
      'classic',
      'tower',
      'classic',
      'tower',
      'classic',
      'tower',
    ]);
    expect(nextRoundRequest({ roundOrdinal: 7 })).toEqual({ type: 'tower', n: 3, operator: 'add', band: 1 });
  });
});
