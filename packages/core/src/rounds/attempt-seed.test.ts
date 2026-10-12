import { describe, expect, it } from 'vitest';
import { attemptSeed } from './attempt-seed';

describe('attemptSeed', () => {
  it('is the seed itself on attempt 0', () => {
    expect(attemptSeed(0, 0)).toBe(0);
    expect(attemptSeed(123456, 0)).toBe(123456);
  });

  it('pins the documented mix (an output change needs a generatorVersion bump, AD-6)', () => {
    expect([attemptSeed(0, 1), attemptSeed(0, 2), attemptSeed(20261011, 1), attemptSeed(0xffffffff, 63)]).toMatchInlineSnapshot(`
      [
        2527132011,
        3024231355,
        843219299,
        317407393,
      ]
    `);
  });

  it('gives a distinct uint32 per attempt', () => {
    const seen = new Set<number>();
    for (let attempt = 0; attempt < 64; attempt += 1) {
      const s = attemptSeed(42, attempt);
      expect(Number.isInteger(s) && s >= 0 && s <= 0xffffffff).toBe(true);
      seen.add(s);
    }
    expect(seen.size).toBe(64);
  });
});
