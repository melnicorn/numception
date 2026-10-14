import * as v from 'valibot';
import { OPERATORS } from '../generator/operator';
import { MAX_ATTEMPTS, MAX_N, MIN_N } from './generation-limits';
import { MAX_TUNING_VALUE } from './max-tuning-value';

export { MAX_ATTEMPTS, MAX_N, MIN_N };

const int = (min: number, max: number) => v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max));

/**
 * One band's values for a run of puzzle sizes `nMin..nMax`: every cell's value lies
 * in `minValue..maxValue`, and the triple has at most `maxCarries` column carries
 * (or borrows, for −). `maxValue` is at least `minValue + 2`, the smallest range
 * holding three distinct cells (e.g. 1, 2, 3).
 */
const BandRangeSchema = v.pipe(
  v.strictObject({
    nMin: int(MIN_N, MAX_N),
    nMax: int(MIN_N, MAX_N),
    minValue: int(1, MAX_TUNING_VALUE),
    maxValue: int(3, MAX_TUNING_VALUE),
    maxCarries: int(0, Number.MAX_SAFE_INTEGER),
  }),
  v.forward(
    v.partialCheck([['nMin'], ['nMax']], (r) => r.nMax >= r.nMin, 'nMax must be at least nMin'),
    ['nMax'],
  ),
  v.forward(
    v.partialCheck(
      [['minValue'], ['maxValue']],
      (r) => r.maxValue >= r.minValue + 2,
      'maxValue must be at least minValue + 2 (room for three distinct values)',
    ),
    ['maxValue'],
  ),
);

type BandRangeInput = { readonly nMin: number; readonly nMax: number };

/** Whether `ranges` run in n order with no gap or overlap (each starts one past the last). */
function rangesContiguous(ranges: readonly BandRangeInput[]): boolean {
  return ranges.every((r, i) => i === 0 || r.nMin === (ranges[i - 1] as BandRangeInput).nMax + 1);
}

/**
 * One difficulty band (number `band`), with per-n value ranges (epic Notes,
 * 2026-10-14: number ranges depend on puzzle size). `ranges` are ordered by n and
 * contiguous; together they cover the tuning's `n.min..n.max` exactly once (checked
 * on the generation section, which knows the n range).
 */
const BandSchema = v.pipe(
  v.strictObject({
    band: int(1, Number.MAX_SAFE_INTEGER),
    ranges: v.pipe(v.array(BandRangeSchema), v.minLength(1, 'at least one range is required')),
  }),
  v.forward(
    v.partialCheck(
      [['band'], ['ranges']],
      (b) => rangesContiguous(b.ranges),
      (issue) => `the ranges of band ${issue.input.band} must be ordered by n, with no gap or overlap (each nMin is the previous nMax + 1)`,
    ),
    ['ranges'],
  ),
);

type BandsInput = readonly { readonly band: number; readonly ranges: readonly BandRangeInput[] }[];

/** The bands whose ranges don't start at `min` and end at `max`. */
function uncoveredBands(n: { readonly min: number; readonly max: number }, bands: BandsInput): number[] {
  return bands
    .filter((b) => b.ranges[0]?.nMin !== n.min || b.ranges[b.ranges.length - 1]?.nMax !== n.max)
    .map((b) => b.band);
}

/**
 * The generation section (AD-7): everything the realiser reads (via `specFor`). Strict
 * throughout, so a typo can't silently fall back to a default.
 *
 * - `operators`: non-empty, unique, from + and − only (no × or ÷ in a POC build).
 * - `n`: the range of cells per puzzle, `3 <= min <= max <= 9`.
 * - `bands`: ordered by `band`, numbered contiguously from 1; each band's ranges
 *   cover `n.min..n.max` exactly once (no gap, no overlap).
 * - `distractors`: `nearMissDelta` is how close a distractor must be to some cell
 *   pair's sum or difference to count as a near-miss; `nearMissShare` is the target
 *   fraction of the n − 3 distractors that are near-misses. A float because it's a
 *   tuning weight, never generation arithmetic: `specFor` quantises it to an integer count before use (AD-3).
 * - `retries.maxAttempts`: realisation attempts before falling back a band.
 */
const GenerationSchema = v.pipe(
  v.strictObject({
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
  }),
  v.forward(
    v.partialCheck(
      [['n', 'min'], ['n', 'max'], ['bands']],
      (g) => uncoveredBands(g.n, g.bands).length === 0,
      (issue) => {
        const g = issue.input;
        const bands = uncoveredBands(g.n, g.bands);
        return `the ranges of band${bands.length > 1 ? 's' : ''} ${bands.join(', ')} must cover n ${g.n.min}..${g.n.max} exactly (first nMin ${g.n.min}, last nMax ${g.n.max})`;
      },
    ),
    ['bands'],
  ),
);

/** The longest presentation beat a tuning may set, ms (one minute). */
export const MAX_PRESENTATION_MS = 60_000;

const durationMs = () => int(0, MAX_PRESENTATION_MS);

/**
 * The presentation section (AD-7, AD-20): the durations of the play view's beats,
 * in Tick ms at Full motion (epic Notes, 2026-10-14; EXPERIENCE OQ-6).
 *
 * - `solveMs`: the solve beat after a correct tap.
 * - `advanceMs`: the move to the next unsolved puzzle.
 * - `firstCollapseMs`: the profile's first-ever collapse (FR-9: at most 3 s).
 * - `collapseMs`: every later collapse (FR-9: at most 1.2 s).
 * - `roundTransitionMs`: the crossfade into the next round.
 * - `calmMotionScale`: the multiplier applied at Calm motion to every beat except
 *   collapses (which keep FR-9's caps at every Motion level). A float because it's
 *   a tuning weight; durations are rounded to integer ms.
 */
const PresentationSchema = v.strictObject({
  solveMs: durationMs(),
  advanceMs: durationMs(),
  firstCollapseMs: durationMs(),
  collapseMs: durationMs(),
  roundTransitionMs: durationMs(),
  calmMotionScale: v.pipe(v.number(), v.minValue(0.25), v.maxValue(4)),
});

/**
 * TuningConfig schema, schemaVersion 1 (AD-7): the generation and presentation
 * sections; scoring and ratings arrive with the epics that consume them. v1 is
 * unshipped, so it is still extended in place. Unknown keys are rejected anywhere.
 */
export const TuningConfigSchema = v.strictObject({
  kind: v.literal('TuningConfig'),
  schemaVersion: v.literal(1),
  tuningVersion: int(1, Number.MAX_SAFE_INTEGER),
  generation: GenerationSchema,
  presentation: PresentationSchema,
});

/** A validated tuning config. Obtain one with `parseTuning`. */
export type TuningConfig = v.InferOutput<typeof TuningConfigSchema>;

/** One validated band of a tuning config, with its per-n ranges. */
export type TuningBand = TuningConfig['generation']['bands'][number];

/** One validated per-n range of a band. */
export type TuningBandRange = TuningBand['ranges'][number];

/** The validated presentation section. */
export type TuningPresentation = TuningConfig['presentation'];
