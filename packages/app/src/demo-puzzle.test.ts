import { describe, expect, it } from 'vitest';
import { DEMO_SEED, demoPuzzle } from './demo-puzzle';

// Same shape as content/tuning/1.json (app never imports content; the client passes
// it in, AD-7). tools/tuning-content.test.ts validates the real file.
const tuningV1 = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: { operators: ['add'], maxValue: 20 },
};

describe('demoPuzzle', () => {
  it('realises the demo puzzle from tuning v1', () => {
    const result = demoPuzzle(tuningV1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { view } = result;
    expect(view.seed).toBe(DEMO_SEED);
    expect(view.nodeId).toEqual({ tier: 1, index: 0 });
    expect(view.n).toBe(3);
    expect(view.operator).toBe('add');
    expect(view.operatorSymbol).toBe('+');
    expect(view.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });

    expect(view.cells).toHaveLength(3);
    expect(view.cells.filter((c) => c.isAnswer)).toHaveLength(1);
    expect(view.cells[view.answerIndex]?.isAnswer).toBe(true);
    const values = view.cells.map((c) => Number(c.text));
    const answer = values[view.answerIndex] as number;
    const others = values.filter((_, i) => i !== view.answerIndex);
    expect(answer).toBe((others[0] as number) + (others[1] as number));
    expect(new Set(values).size).toBe(3);
  });

  it('is the same on every call (fixed demo seed)', () => {
    expect(demoPuzzle(tuningV1)).toEqual(demoPuzzle(tuningV1));
  });

  it('follows the seed', () => {
    const views = new Set<string>();
    for (let seed = 0; seed < 50; seed += 1) {
      const r = demoPuzzle(tuningV1, seed);
      if (r.ok) views.add(r.view.cells.map((c) => c.text).join(','));
    }
    expect(views.size).toBeGreaterThan(5);
  });

  it('returns the tuning error instead of throwing', () => {
    const result = demoPuzzle({ kind: 'Nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-tuning');
  });

  it('returns the realise error for a bad seed', () => {
    const result = demoPuzzle(tuningV1, -1);
    expect(!result.ok && result.error.code).toBe('invalid-seed');
  });
});
