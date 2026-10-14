import { describe, expect, it } from 'vitest';
import { nextRoundRequest } from './next-round-request';

describe('nextRoundRequest', () => {
  it('cycles Classic +, Tower +, Classic −, Tower − at n = 3, band 1', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((roundOrdinal) => {
      const r = nextRoundRequest({ roundOrdinal });
      return `${r.type} ${r.operator}`;
    })).toEqual(['classic add', 'tower add', 'classic sub', 'tower sub', 'classic add', 'tower add', 'classic sub', 'tower sub']);
    expect(nextRoundRequest({ roundOrdinal: 2 })).toEqual({ type: 'classic', n: 3, operator: 'sub', band: 1 });
    expect(nextRoundRequest({ roundOrdinal: 7 })).toEqual({ type: 'tower', n: 3, operator: 'sub', band: 1 });
  });
});
