// Entropy for the game's command envelopes (AD-22), backed by crypto.getRandomValues.
// Lives in the composition root: core and app never read ambient randomness.
import type { EntropySource } from '@numception/app';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A ULID: 48-bit millisecond time then 80 random bits, Crockford base32 (26 chars). */
export function ulid(nowMs: number, random: (bytes: Uint8Array<ArrayBuffer>) => void): string {
  let time = '';
  let t = Math.max(0, Math.floor(nowMs));
  for (let i = 0; i < 10; i += 1) {
    time = CROCKFORD.charAt(t % 32) + time;
    t = Math.floor(t / 32);
  }
  const bytes = new Uint8Array(16);
  random(bytes);
  let rand = '';
  for (let i = 0; i < 16; i += 1) rand += CROCKFORD.charAt((bytes[i] ?? 0) % 32);
  return time + rand;
}

/** An `EntropySource` drawing two ULIDs and two uint32 seeds per dispatch. */
export function webEntropy(now: () => number): EntropySource {
  const random = (bytes: Uint8Array<ArrayBuffer>) => {
    crypto.getRandomValues(bytes);
  };
  return () => {
    const seeds = new Uint32Array(2);
    crypto.getRandomValues(seeds);
    const ms = now();
    return { ids: [ulid(ms, random), ulid(ms, random)], seed32: [seeds[0] ?? 0, seeds[1] ?? 0] };
  };
}
