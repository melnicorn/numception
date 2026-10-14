import { describe, expect, it } from 'vitest';
import { defaultShapeFor } from './default-shape-for';

describe('defaultShapeFor', () => {
  it('maps n 3..9 to the POC picks', () => {
    expect([3, 4, 5, 6, 7, 8, 9].map((n) => defaultShapeFor(n))).toEqual(
      ['3A', '4A', '5B', '6A', '7A', '8A', '9B'].map((value) => ({ ok: true, value })),
    );
  });

  it.each([2, 10, 0, -3, 4.5, Number.NaN, Number.POSITIVE_INFINITY, '5' as unknown as number])('rejects n = %s without throwing', (n) => {
    const r = defaultShapeFor(n);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid-shape');
  });
});
