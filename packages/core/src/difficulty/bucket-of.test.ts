import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import type { PuzzleSpec } from '../generator/puzzle-spec';
import { realise } from '../generator/realise';
import { rational } from '../numbers/rational';
import { bucketOf } from './bucket-of';
import { parseBucketId } from './parse-bucket-id';

const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };
const band = { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 };

/** A hand-built puzzle: only the fields bucketOf reads matter. */
function fixed(cells: number[], roles: { a: number; b: number; c: number }, operator: 'add' | 'sub', nearMisses: number, dm = 1): Puzzle {
  const spec: PuzzleSpec = { n: cells.length, operator, band, fallbackBands: [], nearMissCount: nearMisses, nearMissDelta: 2, maxAttempts: 1 };
  const puzzle: Puzzle = {
    seed: 0, nodeId: { tier: 1, index: 0 }, spec, cells: cells.map((v) => rational(v)), roles, answerIndex: roles.c,
    servedBand: 1, nearMisses, versions: { ...versions, difficultyModelVersion: dm },
  };
  return puzzle;
}

describe('bucketOf', () => {
  it('gives the documented id for a fixed + puzzle', () => {
    // 17 + 25 = 42 (one carry), largest 42 -> 2 digits, n = 5, one near-miss.
    const p = fixed([17, 3, 42, 25, 30], { a: 0, b: 3, c: 2 }, 'add', 1);
    expect(bucketOf(p)).toEqual({
      features: { difficultyModelVersion: 1, operator: 'add', digits: 2, carries: 1, n: 5, nearMisses: 1 },
      bucketId: 'dm1|add|d2|c1|n5|nm1',
    });
  });

  it('counts borrows of a − b for a − puzzle and the largest cell digits', () => {
    // 100 − 1 = 99 (two borrows); largest 100 -> 3 digits.
    const p = fixed([1, 99, 100], { a: 2, b: 0, c: 1 }, 'sub', 0, 3);
    expect(bucketOf(p).bucketId).toBe('dm3|sub|d3|c2|n3|nm0');
  });

  it('round-trips through parseBucketId for realised puzzles across n, operators, bands, near-misses and versions', () => {
    const bands = [
      { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 },
      { band: 2, minValue: 10, maxValue: 199, maxCarries: 2 },
      { band: 3, minValue: 10, maxValue: 999, maxCarries: 3 },
    ];
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.integer({ min: 3, max: 9 }),
        fc.constantFrom('add' as const, 'sub' as const),
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 1, max: 5 }),
        fc.option(fc.integer({ min: 3, max: 400 }), { nil: undefined }),
        (seed, n, operator, bandIndex, nearMissWanted, dm, contract) => {
          const requested = bands[bandIndex]!;
          const spec: PuzzleSpec = {
            n, operator, band: requested,
            fallbackBands: bands.slice(0, bandIndex).reverse(),
            ...(contract === undefined ? {} : { contract }),
            nearMissCount: Math.min(nearMissWanted, n - 3), nearMissDelta: 2, maxAttempts: 50,
          };
          const r = realise(seed, { tier: 1, index: 0 }, spec, { ...versions, difficultyModelVersion: dm });
          if (!r.ok) {
            // Only an unrealisable contract may fail; the band set itself always realises.
            expect(r.error.code).toBe('unrealisable');
            expect(contract).toBeDefined();
            return;
          }
          const { features, bucketId } = bucketOf(r.value);
          expect(parseBucketId(bucketId)).toEqual({ ok: true, value: features });
          expect(features).toMatchObject({ n, operator, difficultyModelVersion: dm, nearMisses: r.value.nearMisses });
          const served = bands.find((b) => b.band === r.value.servedBand)!;
          expect(features.carries).toBeLessThanOrEqual(served.maxCarries);
        },
      ),
      { numRuns: 400 },
    );
  });
});
