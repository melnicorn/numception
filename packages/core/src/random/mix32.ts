// 32-bit integer mixing shared by the seed derivations (nodeSeed, deriveSeed).
// Integer-only and written without `Math` (core/random reads nothing from it, AD-3).
// Changing anything here is an output change (AD-6).

/** 2^32 / golden ratio, the usual odd constant that decorrelates successive mixes. */
export const GOLDEN = 0x9e3779b9;

/**
 * Low 32 bits of `a * b`, written out in 16-bit halves so it stays exact in
 * doubles.
 */
export function mul32(a: number, b: number): number {
  const al = a & 0xffff;
  const ah = (a >>> 16) & 0xffff;
  const bl = b & 0xffff;
  const bh = (b >>> 16) & 0xffff;
  return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) >>> 0;
}

/** MurmurHash3's 32-bit finaliser (fmix32): a bijective avalanche mix on uint32. */
export function fmix32(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = mul32(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = mul32(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
