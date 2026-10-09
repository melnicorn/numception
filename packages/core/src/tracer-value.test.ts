import { describe, expect, it } from 'vitest';
import { tracerValue } from './tracer-value';

describe('tracerValue', () => {
  it('computes 1/2 + 1/3 exactly as 5/6', () => {
    expect(tracerValue()).toBe('5/6');
  });

  it('reduces by the integer gcd', () => {
    expect(tracerValue([1, 6], [1, 3])).toBe('1/2');
  });

  it('drops the denominator when it reduces to 1', () => {
    expect(tracerValue([1, 2], [1, 2])).toBe('1');
  });
});
