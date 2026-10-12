import type { NodeId } from '../generator/node-id';
import { fmix32, GOLDEN } from './mix32';
import { randomStream, type RandomStream } from './random-stream';

/**
 * The 32-bit seed of a node's stream. The documented mix (generatorVersion 1):
 *
 * ```text
 * h0 = fmix32(seed)
 * h1 = fmix32((h0 ^ tier)  + GOLDEN)   (mod 2^32)
 * h2 = fmix32((h1 ^ index) + GOLDEN)   (mod 2^32)
 * ```
 *
 * where every input is taken as uint32, `fmix32` is MurmurHash3's finaliser and
 * GOLDEN is 0x9e3779b9. Changing it is an output change (AD-6).
 */
export function nodeSeed(seed: number, nodeId: NodeId): number {
  const h0 = fmix32(seed);
  const h1 = fmix32(((h0 ^ nodeId.tier) >>> 0) + GOLDEN);
  return fmix32(((h1 ^ nodeId.index) >>> 0) + GOLDEN);
}

/**
 * The random stream for one node of a round (AD-4): xoroshiro128plus seeded with
 * `nodeSeed(seed, nodeId)`. Same inputs, same stream.
 */
export function nodeStream(seed: number, nodeId: NodeId): RandomStream {
  return randomStream(nodeSeed(seed, nodeId));
}
