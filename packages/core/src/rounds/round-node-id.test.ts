import { describe, expect, it } from 'vitest';
import { childNodeId, childrenOf, compareTopDown, isInRound, nodeCount, parentOf, tierWidth, topNodeId } from './round-node-id';

describe('round NodeIds (AD-4, bottom-anchored)', () => {
  it('puts the top at (tiers, 0)', () => {
    expect(topNodeId(2)).toEqual({ tier: 2, index: 0 });
    expect(topNodeId(3)).toEqual({ tier: 3, index: 0 });
  });

  it('counts n + 1 nodes for Classic and n² + n + 1 for Tower', () => {
    for (let n = 3; n <= 9; n += 1) {
      expect(nodeCount(2, n)).toBe(n + 1);
      expect(nodeCount(3, n)).toBe(n * n + n + 1);
      expect(tierWidth(3, 1, n)).toBe(n * n);
      expect(tierWidth(3, 2, n)).toBe(n);
      expect(tierWidth(3, 3, n)).toBe(1);
    }
  });

  it('maps cell j of (k, i) to child (k − 1, i·n + j), and back', () => {
    expect(childrenOf({ tier: 2, index: 0 }, 3)).toEqual([
      { tier: 1, index: 0 },
      { tier: 1, index: 1 },
      { tier: 1, index: 2 },
    ]);
    expect(childNodeId({ tier: 2, index: 4 }, 9, 7)).toEqual({ tier: 1, index: 43 });
    for (const n of [3, 5, 9]) {
      for (let i = 0; i < n; i += 1) {
        childrenOf({ tier: 2, index: i }, n).forEach((child, j) => {
          expect(parentOf(child, n)).toEqual({ parent: { tier: 2, index: i }, cell: j });
        });
      }
    }
  });

  it('knows which ids belong to a round', () => {
    expect(isInRound({ tier: 1, index: 8 }, 3, 3)).toBe(true);
    expect(isInRound({ tier: 1, index: 9 }, 3, 3)).toBe(false);
    expect(isInRound({ tier: 3, index: 1 }, 3, 3)).toBe(false);
    expect(isInRound({ tier: 4, index: 0 }, 3, 3)).toBe(false);
    expect(isInRound({ tier: 0, index: 0 }, 3, 3)).toBe(false);
    expect(isInRound({ tier: 1, index: 0.5 }, 3, 3)).toBe(false);
    expect(isInRound(null, 3, 3)).toBe(false);
    expect(isInRound('x', 3, 3)).toBe(false);
  });

  it('orders top-down: tier descending, then index', () => {
    const ids = [
      { tier: 1, index: 1 },
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
      { tier: 3, index: 0 },
    ];
    expect([...ids].sort(compareTopDown)).toEqual([
      { tier: 3, index: 0 },
      { tier: 2, index: 0 },
      { tier: 1, index: 0 },
      { tier: 1, index: 1 },
    ]);
  });
});
