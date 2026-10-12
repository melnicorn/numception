import { describe, expect, it } from 'vitest';
import { parseTuning } from './parse-tuning';

const valid = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: { operators: ['add'], maxValue: 20 },
};

function withGeneration(generation: unknown): unknown {
  return { ...valid, generation };
}

describe('parseTuning', () => {
  it('accepts a minimal valid config', () => {
    expect(parseTuning(valid)).toEqual({ ok: true, value: valid });
  });

  it('accepts maxValue 3, the smallest that fits three distinct positive cells', () => {
    expect(parseTuning(withGeneration({ operators: ['add'], maxValue: 3 })).ok).toBe(true);
  });

  const bad: [string, unknown][] = [
    ['missing generation', { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 1 }],
    ['wrong kind', { ...valid, kind: 'Theme' }],
    ['wrong schemaVersion', { ...valid, schemaVersion: 2 }],
    ['tuningVersion 0', { ...valid, tuningVersion: 0 }],
    ['maxValue below 3', withGeneration({ operators: ['add'], maxValue: 2 })],
    ['non-integer maxValue', withGeneration({ operators: ['add'], maxValue: 10.5 })],
    ['maxValue above int32', withGeneration({ operators: ['add'], maxValue: 2 ** 31 })],
    ['operator other than add', withGeneration({ operators: ['add', 'mul'], maxValue: 20 })],
    ['subtract not enabled yet', withGeneration({ operators: ['sub'], maxValue: 20 })],
    ['no operators', withGeneration({ operators: [], maxValue: 20 })],
    ['unknown key', { ...valid, extra: true }],
    ['null', null],
    ['a string', 'TuningConfig'],
    ['undefined', undefined],
  ];

  it.each(bad)('returns an invalid-tuning error, without throwing, for %s', (_name, input) => {
    const result = parseTuning(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid-tuning');
      expect(result.error.message).toMatch(/^Invalid TuningConfig: /);
    }
  });

  it('names the offending path', () => {
    const result = parseTuning(withGeneration({ operators: ['add'], maxValue: 2 }));
    expect(!result.ok && result.error.code === 'invalid-tuning' && result.error.issues[0]).toMatch(/^generation\.maxValue: /);
  });
});
