import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { describe, expect, it } from 'vitest';
import { nextInt } from './next-int';
import { type RandomStream, randomStream } from './random-stream';

function draw(seed: number, count: number): number[] {
  let s = randomStream(seed);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const [v, next] = nextInt(s, 0, 1000);
    out.push(v);
    s = next;
  }
  return out;
}

describe('randomStream', () => {
  it('is deterministic for a seed', () => {
    expect(draw(42, 20)).toEqual(draw(42, 20));
  });

  it('differs between seeds', () => {
    expect(draw(42, 20)).not.toEqual(draw(43, 20));
  });

  it('pins the pure-rand 8.4.2 xoroshiro128plus output (a PRNG change is an output change, AD-6)', () => {
    expect(draw(42, 8)).toMatchInlineSnapshot(`
      [
        267,
        643,
        521,
        711,
        450,
        963,
        889,
        640,
      ]
    `);
  });

  it('rejects a raw, mutable pure-rand generator at the type level', () => {
    // @ts-expect-error a raw generator lacks the RandomStream brand
    const raw: RandomStream = xoroshiro128plus(1);
    // @ts-expect-error a RandomStream exposes no way to advance it in place
    randomStream(1).next();
    expect(raw).toBeDefined();
  });
});
