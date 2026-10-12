import { describe, expect, it } from 'vitest';
import { deriveSeed } from './derive-seed';
import { nodeSeed } from './node-stream';

describe('deriveSeed', () => {
  it('pins the documented mix (an output change needs a generatorVersion bump, AD-6)', () => {
    expect([deriveSeed(0, 0), deriveSeed(0, 1), deriveSeed(20261011, 0), deriveSeed(20261011, 7), deriveSeed(0xffffffff, 0xffffffff)])
      .toMatchInlineSnapshot(`
        [
          2612203797,
          4132280602,
          3454243090,
          4289620279,
          3081080881,
        ]
      `);
  });

  it('is a uint32 and deterministic', () => {
    for (const [root, ordinal] of [
      [0, 0],
      [1, 2],
      [123456789, 1000],
      [0xffffffff, 0xffffffff],
    ] as const) {
      const h = deriveSeed(root, ordinal);
      expect(Number.isInteger(h) && h >= 0 && h <= 0xffffffff).toBe(true);
      expect(deriveSeed(root, ordinal)).toBe(h);
    }
  });

  it('separates root seeds and ordinals', () => {
    const seeds = new Set<number>();
    for (let root = 0; root < 20; root += 1) {
      for (let ordinal = 0; ordinal < 50; ordinal += 1) seeds.add(deriveSeed(root, ordinal));
    }
    expect(seeds.size).toBe(1000);
  });

  it('does not coincide with the node-seed mix', () => {
    expect(deriveSeed(5, 3)).not.toBe(nodeSeed(5, { tier: 3, index: 0 }));
    expect(deriveSeed(5, 0)).not.toBe(nodeSeed(5, { tier: 0, index: 0 }));
  });
});
