import { describe, expect, it } from 'vitest';
import { displayValue } from './display-value';
import { rational } from './rational';

describe('displayValue', () => {
  it('shows the integer without grouping, whatever the locale', () => {
    expect(displayValue(rational(3))).toBe('3');
    expect(displayValue(rational(12345))).toBe('12345');
  });
});
