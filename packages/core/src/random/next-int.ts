import { uniformInt } from 'pure-rand/distribution/uniformInt';
import type { RandomGenerator } from 'pure-rand/types/RandomGenerator';
import { purify } from 'pure-rand/utils/purify';
import type { RandomStream } from './random-stream';

const pureUniformInt = purify(uniformInt);

/**
 * Draws an integer uniformly from `from..to` (both included) and returns it with
 * the next stream. `stream` itself is not advanced: `purify` draws from a clone
 * (pure style, AD-3). Integer distribution only: core never draws floats for
 * generation.
 *
 * Callers pass safe integers with `from <= to`.
 */
export function nextInt(stream: RandomStream, from: number, to: number): [value: number, next: RandomStream] {
  // A RandomStream is a pure-rand generator behind the brand (see randomStream);
  // this is the one other place that looks behind it.
  const [value, next] = pureUniformInt(stream as unknown as RandomGenerator, from, to);
  return [value, next as unknown as RandomStream];
}
