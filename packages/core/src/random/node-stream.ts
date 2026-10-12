import type { NodeId } from '../generator/node-id';
import { randomStream, type RandomStream } from './random-stream';

/** 2^32 / golden ratio, the usual odd constant that decorrelates successive mixes. */
const GOLDEN = 0x9e3779b9;

/**
 * Low 32 bits of `a * b`, written out in 16-bit halves so it stays exact in
 * doubles (core/random reads nothing from `Math`, AD-3).
 */
function mul32(a: number, b: number): number {
  const al = a & 0xffff;
  const ah = (a >>> 16) & 0xffff;
  const bl = b & 0xffff;
  const bh = (b >>> 16) & 0xffff;
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) >>> 0;
}

/** MurmurHash3's 32-bit finaliser (fmix32): a bijective avalanche mix on uint32. */
function fmix32(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = mul32(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = mul32(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

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
