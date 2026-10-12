import { describe, expect, it } from 'vitest';
import { err, ok } from './result';

describe('Result', () => {
  it('wraps a value', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });

  it('wraps an error', () => {
    expect(err({ code: 'x' })).toEqual({ ok: false, error: { code: 'x' } });
  });
});
