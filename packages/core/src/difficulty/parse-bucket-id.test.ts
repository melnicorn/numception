import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatBucketId } from './format-bucket-id';
import { parseBucketId } from './parse-bucket-id';

describe('parseBucketId', () => {
  it('parses a canonical id', () => {
    expect(parseBucketId('dm1|add|d2|c1|n5|nm1')).toEqual({
      ok: true,
      value: { difficultyModelVersion: 1, operator: 'add', digits: 2, carries: 1, n: 5, nearMisses: 1 },
    });
  });
  it.each([
    'dm1|mul|d2|c1|n5|nm1', 'dm0|add|d2|c1|n5|nm1', 'dm1|add|d02|c1|n5|nm1', 'dm1|add|d2|c1|n5', 'dm1|add|d2|c1|n5|nm1|x',
    'DM1|add|d2|c1|n5|nm1', '', 'dm1|add|d2|c-1|n5|nm1', 'dm99999999999999999999|add|d2|c1|n5|nm1', 42 as unknown as string,
  ])('rejects %s without throwing', (id) => {
    const r = parseBucketId(id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid-bucket-id');
  });
  it('every accepted id formats back to itself (exact inverse)', () => {
    const id = fc
      .tuple(fc.integer({ min: 1, max: 1e6 }), fc.constantFrom('add', 'sub'), fc.integer({ min: 1, max: 16 }), fc.integer({ min: 0, max: 16 }), fc.integer({ min: 1, max: 99 }), fc.integer({ min: 0, max: 99 }))
      .map(([dm, op, d, c, n, nm]) => `dm${dm}|${op}|d${d}|c${c}|n${n}|nm${nm}`);
    fc.assert(
      fc.property(id, (s) => {
        const r = parseBucketId(s);
        expect(r.ok).toBe(true);
        if (r.ok) expect(formatBucketId(r.value)).toBe(s);
      }),
    );
  });
});
