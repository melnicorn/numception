import { describe, expect, it } from 'vitest';
import { DEMO_SEED, demoPuzzle } from './demo-puzzle';

// Same shape as content/tuning/1.json (app never imports content; the client passes
// it in, AD-7). tools/tuning-content.test.ts validates the real file.
const tuningV1 = {
  kind: 'TuningConfig',
  schemaVersion: 1,
  tuningVersion: 1,
  generation: {
    operators: ['add', 'sub'],
    n: { min: 3, max: 9 },
    bands: [
      {
        band: 1,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 1, maxValue: 20, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 1, maxValue: 30, maxCarries: 1 },
          { nMin: 7, nMax: 8, minValue: 1, maxValue: 60, maxCarries: 1 },
          { nMin: 9, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 },
        ],
      },
      {
        band: 2,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 1, maxValue: 50, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 5, maxValue: 99, maxCarries: 1 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 199, maxCarries: 1 },
        ],
      },
      {
        band: 3,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 5, maxValue: 99, maxCarries: 1 },
          { nMin: 5, nMax: 6, minValue: 10, maxValue: 199, maxCarries: 2 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 499, maxCarries: 2 },
        ],
      },
      {
        band: 4,
        ranges: [
          { nMin: 3, nMax: 4, minValue: 10, maxValue: 199, maxCarries: 2 },
          { nMin: 5, nMax: 6, minValue: 10, maxValue: 499, maxCarries: 2 },
          { nMin: 7, nMax: 9, minValue: 10, maxValue: 999, maxCarries: 2 },
        ],
      },
    ],
    distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
    retries: { maxAttempts: 100 },
  },
};

/** tuningV1 with the maxValue of band 1's n = 3 range (its first) replaced. */
function withBand1Max(maxValue: number): typeof tuningV1 {
  const [band1, ...rest] = tuningV1.generation.bands;
  const [range, ...ranges] = band1!.ranges;
  return { ...tuningV1, generation: { ...tuningV1.generation, bands: [{ ...band1!, ranges: [{ ...range!, maxValue }, ...ranges] }, ...rest] } };
}

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

  it("takes its value range from band 1's maxValue", () => {
    const result = demoPuzzle(tuningV1);
    expect(result.ok && result.view.maxValue).toBe(20);
    // The demo puzzle under tuning v1 (band 1 at n 3: 1..20, at most one carry).
    expect(result.ok && result.view.cells.map((c) => c.text)).toMatchInlineSnapshot(`
      [
        "3",
        "10",
        "7",
      ]
    `);
  });

  it('changes with band 1 maxValue, with no code change (tuning drives output)', () => {
    const base = demoPuzzle(tuningV1);
    const wider = demoPuzzle(withBand1Max(1000));
    expect(base.ok && wider.ok).toBe(true);
    if (!base.ok || !wider.ok) return;
    expect(wider.view.maxValue).toBe(1000);
    expect(wider.view.cells.map((c) => c.text)).not.toEqual(base.view.cells.map((c) => c.text));
    for (const cell of wider.view.cells) expect(Number(cell.text)).toBeLessThanOrEqual(1000);
  });

  it('requests band 1, so higher bands play no part (band 1 has no fallback)', () => {
    const otherBands = { ...tuningV1, generation: { ...tuningV1.generation, bands: tuningV1.generation.bands.slice(0, 1) } };
    expect(demoPuzzle(otherBands)).toEqual(demoPuzzle(tuningV1));
  });

  it('picks add when it is listed, whatever the order', () => {
    const subFirst = { ...tuningV1, generation: { ...tuningV1.generation, operators: ['sub', 'add'] } };
    const result = demoPuzzle(subFirst);
    expect(result.ok && result.view.operator).toBe('add');
    expect(result).toEqual(demoPuzzle(tuningV1));
  });

  it('realises a − puzzle when sub is the only operator', () => {
    const subOnly = { ...tuningV1, generation: { ...tuningV1.generation, operators: ['sub'] } };
    const result = demoPuzzle(subOnly);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.view.operator).toBe('sub');
    expect(result.view.operatorSymbol).toBe('−');
    const values = result.view.cells.map((c) => Number(c.text));
    const answer = values[result.view.answerIndex] as number;
    const others = values.filter((_, i) => i !== result.view.answerIndex);
    // a − b = c: the answer plus the soft-miss cell gives the largest.
    expect(Math.max(...others)).toBe(answer + Math.min(...others));
  });

  it("returns specFor's error when the tuning's n range excludes 3", () => {
    const bands = [{ band: 1, ranges: [{ nMin: 4, nMax: 9, minValue: 1, maxValue: 99, maxCarries: 1 }] }];
    const noThree = { ...tuningV1, generation: { ...tuningV1.generation, n: { min: 4, max: 9 }, bands } };
    const result = demoPuzzle(noThree);
    expect(!result.ok && result.error.code).toBe('invalid-spec');
  });

  it('rejects a tuning naming mul', () => {
    const mul = { ...tuningV1, generation: { ...tuningV1.generation, operators: ['add', 'mul'] } };
    const result = demoPuzzle(mul);
    expect(!result.ok && result.error.message).toMatch(/generation\.operators/);
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
