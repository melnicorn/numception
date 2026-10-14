import { describe, expect, it } from 'vitest';
import { canonicalJson } from './canonical-json';
import { saveChecksum } from './save-checksum';

describe('canonicalJson', () => {
  it('sorts keys at every depth and drops undefined properties, as JSON does', () => {
    expect(canonicalJson({ b: 1, a: { d: [{ z: 1, y: 2 }], c: undefined } })).toBe('{"a":{"d":[{"y":2,"z":1}]},"b":1}');
  });
});

describe('saveChecksum', () => {
  it('is FNV-1a-32 over the UTF-8 canonical JSON', () => {
    // Reference values: FNV-1a-32 of the bytes of "{}" and of "\"é\"" (0x22 0xc3 0xa9 0x22).
    const fnv = (bytes: number[]) => bytes.reduce((h, b) => Number((BigInt((h ^ b) >>> 0) * 0x01000193n) & 0xffffffffn), 0x811c9dc5);
    expect(saveChecksum({})).toBe(fnv([0x7b, 0x7d]));
    expect(saveChecksum('é')).toBe(fnv([0x22, 0xc3, 0xa9, 0x22]));
    expect(saveChecksum('😀')).toBe(fnv([0x22, 0xf0, 0x9f, 0x98, 0x80, 0x22]));
  });

  it('ignores key order and changes with any value', () => {
    expect(saveChecksum({ a: 1, b: [1, 2] })).toBe(saveChecksum({ b: [1, 2], a: 1 }));
    expect(saveChecksum({ a: 1, b: [1, 2] })).not.toBe(saveChecksum({ a: 1, b: [2, 1] }));
    expect(saveChecksum({ a: 1 })).not.toBe(saveChecksum({ a: 2 }));
  });
});
