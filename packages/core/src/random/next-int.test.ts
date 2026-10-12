import { describe, expect, it } from 'vitest';
import { nextInt } from './next-int';
import { randomStream } from './random-stream';

describe('nextInt', () => {
  it('stays within the inclusive bounds and reaches both ends', () => {
    let s = randomStream(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i += 1) {
      const [v, next] = nextInt(s, 3, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
      s = next;
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('returns from when the range is a single value', () => {
    expect(nextInt(randomStream(9), 5, 5)[0]).toBe(5);
  });

  it('is deterministic: same stream and bounds, same value and next stream', () => {
    const [a, nextA] = nextInt(randomStream(11), 0, 1_000_000);
    const [b, nextB] = nextInt(randomStream(11), 0, 1_000_000);
    expect(a).toBe(b);
    expect(nextInt(nextA, 0, 1_000_000)[0]).toBe(nextInt(nextB, 0, 1_000_000)[0]);
  });

  it('never advances the stream it was given (pure style)', () => {
    const s = randomStream(7);
    const [first, next] = nextInt(s, 1, 1_000_000);
    // Drawing from `s` again repeats the first draw, however often it is used.
    for (let i = 0; i < 5; i += 1) expect(nextInt(s, 1, 1_000_000)[0]).toBe(first);
    // The returned stream moves on.
    const following = [nextInt(next, 1, 1_000_000)[0], nextInt(nextInt(next, 1, 1_000_000)[1], 1, 1_000_000)[0]];
    expect(following).not.toEqual([first, first]);
  });
});
