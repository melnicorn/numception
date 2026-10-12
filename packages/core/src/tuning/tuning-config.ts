import * as v from 'valibot';
import { OPERATORS } from '../generator/operator';
import { MAX_ATTEMPTS, MAX_N, MIN_N } from './generation-limits';
import { MAX_TUNING_VALUE } from './max-tuning-value';

export { MAX_ATTEMPTS, MAX_N, MIN_N };

const int = (min: number, max: number) => v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max));

/**
 * One difficulty band: every cell's value lies in `minValue..maxValue`, and the
 * triple has at most `maxCarries` column carries (or borrows, for −). `maxValue`
 * is at least `minValue + 2`, the smallest range holding three distinct cells
 * (e.g. 1, 2, 3).
 */
const BandSchema = v.pipe(
  v.strictObject({
    band: int(1, Number.MAX_SAFE_INTEGER),
    minValue: int(1, MAX_TUNING_VALUE),
    maxValue: int(3, MAX_TUNING_VALUE),
    maxCarries: int(0, Number.MAX_SAFE_INTEGER),
  }),
  v.forward(
    v.partialCheck(
      [['minValue'], ['maxValue']],
      (b) => b.maxValue >= b.minValue + 2,
      'maxValue must be at least minValue + 2 (room for three distinct values)',
    ),
    ['maxValue'],
  ),
);

/**
 * The generation section (AD-7): everything the realiser reads (via `specFor`). Strict
 * throughout, so a typo can't silently fall back to a default.
 *
 * - `operators`: non-empty, unique, from + and − only (no × or ÷ in a POC build).
 * - `n`: the range of cells per puzzle, `3 <= min <= max <= 9`.
 * - `bands`: ordered by `band`, numbered contiguously from 1.
 * - `distractors`: `nearMissDelta` is how close a distractor must be to some cell
 *   pair's sum or difference to count as a near-miss; `nearMissShare` is the target
 *   fraction of the n − 3 distractors that are near-misses. A float because it's a
 *   tuning weight, never generation arithmetic: `specFor` quantises it to an integer count before use (AD-3).
 * - `retries.maxAttempts`: realisation attempts before falling back a band.
 */
const GenerationSchema = v.strictObject({
  operators: v.pipe(
    v.array(v.picklist(OPERATORS)),
    v.minLength(1, 'at least one operator must be enabled'),
    v.check((ops) => new Set(ops).size === ops.length, 'operators must not repeat'),
  ),
  n: v.pipe(
    v.strictObject({ min: int(MIN_N, MAX_N), max: int(MIN_N, MAX_N) }),
    v.forward(
      v.partialCheck([['min'], ['max']], (n) => n.min <= n.max, 'n.max must be at least n.min'),
      ['max'],
    ),
  ),
  bands: v.pipe(
    v.array(BandSchema),
    v.minLength(1, 'at least one band is required'),
    v.check((bands) => bands.every((b, i) => b.band === i + 1), 'bands must be ordered and numbered contiguously from 1'),
  ),
  distractors: v.strictObject({
    nearMissDelta: int(1, MAX_TUNING_VALUE),
    nearMissShare: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  }),
  retries: v.strictObject({
    maxAttempts: int(1, MAX_ATTEMPTS),
  }),
});

/**
 * TuningConfig schema, schemaVersion 1 (AD-7). For now only the generation section;
 * scoring, ratings and durations arrive with the epics that consume them. v1 is
 * unshipped, so it is still extended in place. Unknown keys are rejected anywhere.
 */
export const TuningConfigSchema = v.strictObject({
  kind: v.literal('TuningConfig'),
  schemaVersion: v.literal(1),
  tuningVersion: int(1, Number.MAX_SAFE_INTEGER),
  generation: GenerationSchema,
});

/** A validated tuning config. Obtain one with `parseTuning`. */
export type TuningConfig = v.InferOutput<typeof TuningConfigSchema>;

/** One validated band of a tuning config. */
export type TuningBand = TuningConfig['generation']['bands'][number];
