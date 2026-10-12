import { describe, expect, it } from 'vitest';
import { rational, serialiseRational } from './rational';

describe('Rational (POC integers)', () => {
  it('carries an integer with d = 1', () => {
    expect(rational(7)).toEqual({ n: 7, d: 1 });
  });

  it('serialises as "n"', () => {
    expect(serialiseRational(rational(42))).toBe('42');
  });
});
