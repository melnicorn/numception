// The one PRNG core uses (AD-3): pure-rand 8.4.2 (exact pin) xoroshiro128plus.
// Changing the algorithm, the pin or the seeding is an output change and needs a
// generatorVersion bump (AD-6).
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

declare const randomStreamBrand: unique symbol;

/**
 * An opaque, immutable random stream. It exposes no methods, so it can't be
 * advanced in place: the only way to draw is `nextInt`, which returns the next
 * stream and leaves the given one untouched (pure style, AD-3). The required brand
 * means a raw (mutable) pure-rand generator doesn't typecheck as a `RandomStream`;
 * only `randomStream` and `nextInt` produce one.
 */
export type RandomStream = { readonly [randomStreamBrand]: true };

/** Starts a stream from a 32-bit integer seed (only the low 32 bits are used). */
export function randomStream(seed32: number): RandomStream {
  return xoroshiro128plus(seed32 | 0) as unknown as RandomStream;
}
