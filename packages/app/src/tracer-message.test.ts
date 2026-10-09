import { describe, expect, it } from 'vitest';
import { tracerMessage } from './tracer-message';

describe('tracerMessage', () => {
  it('returns the value computed in core', () => {
    expect(tracerMessage()).toBe('5/6');
  });
});
