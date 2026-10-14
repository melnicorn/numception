import { mul32 } from '../random/mix32';
import { canonicalJson } from './canonical-json';

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * The save checksum (AD-10): FNV-1a-32 over the UTF-8 bytes of
 * `canonicalJson(payload)` (keys sorted at every depth, no whitespace), as an
 * unsigned 32-bit integer. Stable across engines: integer-only, no `Math`, and
 * the UTF-8 encoding is written out here (lone surrogates encode as U+FFFD).
 *
 * ```text
 * h = 0x811c9dc5
 * for each byte b: h = (h XOR b) * 0x01000193   (mod 2^32)
 * ```
 */
export function saveChecksum(payload: unknown): number {
  let h = FNV_OFFSET;
  const add = (byte: number) => {
    h = mul32((h ^ byte) >>> 0, FNV_PRIME);
  };
  const text = canonicalJson(payload);
  for (let i = 0; i < text.length; i += 1) {
    let cp = text.codePointAt(i) ?? 0;
    if (cp > 0xffff) i += 1;
    else if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd;
    if (cp < 0x80) add(cp);
    else if (cp < 0x800) {
      add(0xc0 | (cp >>> 6));
      add(0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      add(0xe0 | (cp >>> 12));
      add(0x80 | ((cp >>> 6) & 0x3f));
      add(0x80 | (cp & 0x3f));
    } else {
      add(0xf0 | (cp >>> 18));
      add(0x80 | ((cp >>> 12) & 0x3f));
      add(0x80 | ((cp >>> 6) & 0x3f));
      add(0x80 | (cp & 0x3f));
    }
  }
  return h >>> 0;
}
