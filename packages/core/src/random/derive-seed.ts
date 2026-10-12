import { fmix32 } from './mix32';

/**
 * Salt that keeps round seeds apart from node seeds: xxHash32's PRIME32_2, an odd
 * constant unrelated to the GOLDEN step `nodeSeed` adds.
 */
const ROUND_SALT = 0x85ebca77;

/**
 * The seed of round `roundOrdinal` (0, 1, 2, …) of a run started from `rootSeed`
 * (AD-4). The documented mix (generatorVersion 1):
 *
 * ```text
 * h0 = fmix32(rootSeed)
 * h1 = fmix32((h0 ^ roundOrdinal) + ROUND_SALT)   (mod 2^32)
 * ```
 *
 * where both inputs are taken as uint32, `fmix32` is MurmurHash3's finaliser and
 * ROUND_SALT is 0x85ebca77. The result is a uint32; each node of the round then
 * draws from `nodeStream(roundSeed, nodeId)`. Changing it is an output change (AD-6).
 */
export function deriveSeed(rootSeed: number, roundOrdinal: number): number {
  const h0 = fmix32(rootSeed);
  return fmix32(((h0 ^ roundOrdinal) >>> 0) + ROUND_SALT);
}
