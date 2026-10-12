import { describe, expect, it } from 'vitest';
import { nextInt } from './next-int';
import { nodeSeed, nodeStream } from './node-stream';

describe('nodeSeed', () => {
  it('pins the documented mix (an output change needs a generatorVersion bump, AD-6)', () => {
    expect([
      nodeSeed(0, { tier: 1, index: 0 }),
      nodeSeed(20261011, { tier: 1, index: 0 }),
      nodeSeed(20261011, { tier: 2, index: 5 }),
      nodeSeed(0xffffffff, { tier: 9, index: 0xffffffff }),
    ]).toMatchInlineSnapshot(`
      [
        2339934983,
        1314713809,
        994943615,
        13095590,
      ]
    `);
  });

  it('is a uint32', () => {
    for (const seed of [0, 1, 123456789, 0xffffffff]) {
      const h = nodeSeed(seed, { tier: 3, index: 7 });
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('separates seeds, tiers and indices', () => {
    const seeds = new Set<number>();
    for (let seed = 0; seed < 10; seed += 1) {
      for (let tier = 1; tier <= 4; tier += 1) {
        for (let index = 0; index < 10; index += 1) seeds.add(nodeSeed(seed, { tier, index }));
      }
    }
    expect(seeds.size).toBe(400);
  });

  it('does not treat tier and index symmetrically', () => {
    expect(nodeSeed(1, { tier: 2, index: 3 })).not.toBe(nodeSeed(1, { tier: 3, index: 2 }));
  });
});

describe('nodeStream', () => {
  it('gives the same stream for the same seed and node', () => {
    const a = nodeStream(99, { tier: 1, index: 4 });
    const b = nodeStream(99, { tier: 1, index: 4 });
    let sa = a;
    let sb = b;
    for (let i = 0; i < 10; i += 1) {
      const [va, na] = nextInt(sa, 0, 1_000_000);
      const [vb, nb] = nextInt(sb, 0, 1_000_000);
      expect(va).toBe(vb);
      sa = na;
      sb = nb;
    }
  });
});
