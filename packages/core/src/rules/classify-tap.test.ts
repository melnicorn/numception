import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import { realise } from '../generator/realise';
import type { PuzzleSpec } from '../generator/puzzle-spec';
import { classifyTap } from './classify-tap';

const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };
const band = { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 };

function puzzle(operator: 'add' | 'sub', n = 5, seed = 7): Puzzle {
  const spec: PuzzleSpec = { n, operator, band, fallbackBands: [], nearMissCount: 0, nearMissDelta: 2, maxAttempts: 100 };
  const r = realise(seed, { tier: 1, index: 0 }, spec, versions);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
}

describe('classifyTap', () => {
  it('judges the answer correct, b of a − puzzle a soft miss, everything else wrong', () => {
    const p = puzzle('sub');
    expect(classifyTap(p, p.roles.c)).toEqual({ ok: true, value: 'correct' });
    expect(classifyTap(p, p.roles.b)).toEqual({ ok: true, value: 'softMiss' });
    expect(classifyTap(p, p.roles.a)).toEqual({ ok: true, value: 'wrong' });
  });

  it('has no soft miss in a + puzzle', () => {
    const p = puzzle('add');
    expect(classifyTap(p, p.roles.c)).toEqual({ ok: true, value: 'correct' });
    expect(classifyTap(p, p.roles.b)).toEqual({ ok: true, value: 'wrong' });
    expect(classifyTap(p, p.roles.a)).toEqual({ ok: true, value: 'wrong' });
  });

  it.each([-1, 5, 1.5, Number.NaN, '2' as unknown as number])('rejects cell index %s without throwing', (i) => {
    const r = classifyTap(puzzle('add'), i);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid-cell');
  });
});
