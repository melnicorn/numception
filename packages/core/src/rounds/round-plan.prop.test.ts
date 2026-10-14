// AD-19 round-consistency property (fast-check): over random root seeds and round
// ordinals, every Classic and Tower plan under the POC bands is consistent at every
// tier (roundPlanProblems re-derives every rule with its own brute force) and
// deterministic.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Operator } from '../generator/operator';
import { deriveSeed } from '../random/derive-seed';
import { parseTuning } from '../tuning/parse-tuning';
import { roundPlanProblems } from './plan-problems';
import { planRound } from './round-types';

/** Same bands as content/tuning/1.json (tools/round-content.test.ts plans with the real file). */
const parsed = parseTuning({
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
});
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;
const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };

const rootArb = fc.integer({ min: 0, max: 0xffffffff });
const ordinalArb = fc.integer({ min: 0, max: 0xffffffff });
const operatorArb: fc.Arbitrary<Operator> = fc.constantFrom('add', 'sub');
const nArb = fc.integer({ min: 3, max: 9 });

describe('AD-19 round consistency over seeds and ordinals', () => {
  it.each(['classic', 'tower'] as const)('%s: every plan is consistent at every tier and deterministic', (type) => {
    fc.assert(
      fc.property(rootArb, ordinalArb, nArb, operatorArb, (root, ordinal, n, operator) => {
        const roundSeed = deriveSeed(root, ordinal);
        const result = planRound({ type, n, operator }, tuning, roundSeed, versions);
        expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
        if (!result.ok) return;
        const plan = result.value;
        expect(plan.roundSeed).toBe(roundSeed);
        expect(plan.nodes).toHaveLength(type === 'classic' ? n + 1 : n * n + n + 1);
        expect(roundPlanProblems(plan, tuning)).toEqual([]);
        expect(planRound({ type, n, operator }, tuning, roundSeed, versions)).toEqual(result);
      }),
      { numRuns: type === 'classic' ? 200 : 60 },
    );
  });

  it('a fixed top cell taken from a free plan is always honoured', () => {
    fc.assert(
      fc.property(rootArb, ordinalArb, nArb, operatorArb, fc.constantFrom('classic', 'tower'), fc.nat(), (root, ordinal, n, operator, type, pick) => {
        const roundSeed = deriveSeed(root, ordinal);
        const free = planRound({ type, n, operator }, tuning, roundSeed, versions);
        if (!free.ok) throw new Error(free.error.message);
        const top = free.value.nodes[0]!.puzzle!;
        const value = top.cells[pick % n]!.n;
        const childIndex = (pick >>> 4) % n;
        const pinned = planRound({ type, n, operator, fixedTopCell: { childIndex, value } }, tuning, roundSeed, versions);
        // The free top itself is a candidate only if the search draws it, so unplannable is allowed, never an inconsistent plan.
        if (!pinned.ok) {
          expect(pinned.error.code).toBe('unplannable');
          return;
        }
        expect(pinned.value.nodes[0]!.puzzle!.cells[childIndex]!.n).toBe(value);
        expect(roundPlanProblems(pinned.value, tuning)).toEqual([]);
      }),
      { numRuns: 60 },
    );
  });
});
