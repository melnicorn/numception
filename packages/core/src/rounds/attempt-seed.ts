import { fmix32, GOLDEN } from '../random/mix32';

/**
 * The seed a plan-time realisation uses on attempt `attempt` (0, 1, …) of an
 * upper-tier node. Attempt 0 is the round seed itself; later attempts mix the
 * counter in (generatorVersion 1):
 *
 * ```text
 * attemptSeed(seed, 0) = seed
 * attemptSeed(seed, k) = fmix32((fmix32(seed) ^ k) + GOLDEN)   (mod 2^32), k >= 1
 * ```
 *
 * The node stream is then `nodeStream(attemptSeed, nodeId)`, so each attempt draws a
 * different puzzle, deterministically. The realised puzzle records the seed it used.
 * Changing this is an output change (AD-6).
 */
export function attemptSeed(seed: number, attempt: number): number {
  if (attempt === 0) return seed;
  return fmix32(((fmix32(seed) ^ attempt) >>> 0) + GOLDEN);
}
