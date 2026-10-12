import { describe, expect, it } from 'vitest';
import type { TuningConfig } from '../tuning/tuning-config';
import { nearMissCountFor, type SpecRequest, specFor } from './spec-for';

const tuning: TuningConfig = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 9 },
    bands: [
      { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 },
      { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 },
      { band: 3, minValue: 5, maxValue: 99, maxCarries: 1 },
      { band: 4, minValue: 10, maxValue: 999, maxCarries: 2 },
    ],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
};

function mustSpec(request: SpecRequest, t: TuningConfig = tuning) {
  const result = specFor(t, request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('specFor', () => {
  it('builds the integer spec from tuning: band, lower bands nearest first, delta, attempts', () => {
    expect(mustSpec({ n: 7, operator: 'sub', band: 3 })).toEqual({
      n: 7,
      operator: 'sub',
      band: { band: 3, minValue: 5, maxValue: 99, maxCarries: 1 },
      fallbackBands: [
        { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 },
        { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 },
      ],
      nearMissCount: 2,
      nearMissDelta: 2,
      maxAttempts: 100,
    });
  });

  it('has no fallback for band 1, and carries the contract only when given', () => {
    const s = mustSpec({ n: 3, operator: 'add', band: 1 });
    expect(s.fallbackBands).toEqual([]);
    expect('contract' in s).toBe(false);
    expect(mustSpec({ n: 3, operator: 'add', band: 2, contract: 12 }).contract).toBe(12);
  });

  it('copies the bands rather than aliasing the tuning', () => {
    const s = mustSpec({ n: 3, operator: 'add', band: 2 });
    expect(s.band).not.toBe(tuning.generation.bands[1]);
  });

  it('passes contracts it cannot judge on to realise (unrealisable is realise’s call)', () => {
    expect(mustSpec({ n: 3, operator: 'add', band: 1, contract: 2 }).contract).toBe(2);
    expect(mustSpec({ n: 3, operator: 'sub', band: 1, contract: -4 }).contract).toBe(-4);
  });

  it.each([
    ['n 10', { n: 10, operator: 'add', band: 1 }, /n must be an integer in 3\.\.9/],
    ['n 2', { n: 2, operator: 'add', band: 1 }, /n must be an integer in 3\.\.9/],
    ['fractional n', { n: 4.5, operator: 'add', band: 1 }, /n must be an integer/],
    ['operator mul', { n: 3, operator: 'mul', band: 1 }, /operator must be one of add, sub/],
    ['band 0', { n: 3, operator: 'add', band: 0 }, /band must be one of 1\.\.4/],
    ['band 5', { n: 3, operator: 'add', band: 5 }, /band must be one of 1\.\.4/],
    ['fractional contract', { n: 3, operator: 'add', band: 1, contract: 12.5 }, /contract must be absent or a safe integer/],
    ['NaN contract', { n: 3, operator: 'add', band: 1, contract: Number.NaN }, /contract must be absent or a safe integer/],
  ] as [string, SpecRequest, RegExp][])('rejects %s as invalid-spec', (_name, request, message) => {
    const result = specFor(tuning, request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('invalid-spec');
    expect(result.error.message).toMatch(message);
  });

  it('validates n and operator against this tuning, not just the global limits', () => {
    const narrow: TuningConfig = { ...tuning, generation: { ...tuning.generation, operators: ['add'], n: { min: 4, max: 6 } } };
    expect(specFor(narrow, { n: 3, operator: 'add', band: 1 }).ok).toBe(false);
    expect(specFor(narrow, { n: 7, operator: 'add', band: 1 }).ok).toBe(false);
    expect(specFor(narrow, { n: 5, operator: 'sub', band: 1 }).ok).toBe(false);
    expect(specFor(narrow, { n: 5, operator: 'add', band: 1 }).ok).toBe(true);
  });

  it('returns an error rather than throwing on a non-object request', () => {
    const result = specFor(tuning, null as unknown as SpecRequest);
    expect(!result.ok && result.error.code).toBe('invalid-spec');
  });
});

describe('nearMissCountFor', () => {
  it.each([
    // share, n, count: share × (n − 3) rounded half up.
    [0.5, 3, 0],
    [0.5, 4, 1], // 0.5 → 1
    [0.5, 5, 1],
    [0.5, 6, 2], // 1.5 → 2
    [0.5, 9, 3],
    [0, 9, 0],
    [1, 9, 6],
    [1, 3, 0],
    [0.25, 5, 1], // 0.5 → 1
    [0.25, 9, 2], // 1.5 → 2
    [0.2, 9, 1], // 1.2 → 1
    [0.75, 7, 3],
    [0.1, 4, 0],
  ])('share %f at n %i gives %i', (share, n, count) => {
    expect(nearMissCountFor(share, n)).toBe(count);
  });

  it('is an integer in 0..n − 3 for every share', () => {
    for (let n = 3; n <= 9; n += 1) {
      for (let i = 0; i <= 100; i += 1) {
        const count = nearMissCountFor(i / 100, n);
        expect(Number.isInteger(count)).toBe(true);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(n - 3);
      }
    }
  });

  it('feeds specFor', () => {
    const quarter: TuningConfig = { ...tuning, generation: { ...tuning.generation, distractors: { nearMissDelta: 3, nearMissShare: 0.25 } } };
    expect(mustSpec({ n: 9, operator: 'add', band: 4 }, quarter).nearMissCount).toBe(2);
    expect(mustSpec({ n: 9, operator: 'add', band: 4 }, quarter).nearMissDelta).toBe(3);
  });
});
