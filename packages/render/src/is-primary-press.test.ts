import { describe, expect, it } from 'vitest';
import { isPrimaryPress } from './is-primary-press';

describe('isPrimaryPress', () => {
  it('accepts the primary pointer with the main button (mouse left, first touch, pen tip)', () => {
    expect(isPrimaryPress({ button: 0, isPrimary: true })).toBe(true);
  });

  it('ignores right and middle clicks, other buttons and secondary touches', () => {
    expect(isPrimaryPress({ button: 2, isPrimary: true })).toBe(false);
    expect(isPrimaryPress({ button: 1, isPrimary: true })).toBe(false);
    expect(isPrimaryPress({ button: 5, isPrimary: true })).toBe(false);
    expect(isPrimaryPress({ button: 0, isPrimary: false })).toBe(false);
  });
});
