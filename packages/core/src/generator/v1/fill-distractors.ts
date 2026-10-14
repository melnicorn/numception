import { nextInt } from '../../random/next-int';
import type { RandomStream } from '../../random/random-stream';
import type { PuzzleBand } from '../puzzle-spec';
import { directChecks, TABLE_RANGE, tableChecks } from './distractor-checks';
import { absDiff } from './int-math';

/** Bands at most this wide try every value for a distractor slot (from a random start). */
export const DISTRACTOR_ENUM_RANGE = 128;
/** Wider bands draw this many candidates per slot visit. */
export const SLOT_SAMPLES = 24;
/** Candidate values tested per fill, across all slots and backtracking (large pools). */
export const TEST_BUDGET = 192;
/**
 * A narrow band whose distractor sets number at most this many
 * (C(free values, count)) is searched exhaustively instead: each set is visited at
 * most once (values taken in increasing rotated order within plain and within
 * near-miss slots), so the work is bounded by a few times this limit.
 */
export const EXHAUSTIVE_LIMIT = 20000;

/** C(n, k), stopping early once it passes `cap` (k is at most 6 here). */
function binomialAtMost(n: number, k: number, cap: number): number {
  let c = 1;
  for (let i = 0; i < k; i += 1) {
    c = (c * (n - i)) / (i + 1);
    if (c > cap) return cap + 1;
  }
  return c;
}

/** What to add to a triple: `count` distractors, exactly `nearMisses` of them near-misses. */
export type DistractorRequest = {
  readonly band: PuzzleBand;
  readonly count: number;
  readonly nearMisses: number;
  readonly nearMissDelta: number;
};

/**
 * Adds `request.count` distractors to `triple` (its three values): distinct values
 * in the band, none forming a second valid triple, exactly `request.nearMisses`
 * of them near-misses and the rest not. Plain distractors are placed first (easier
 * while few cells exist), then near-misses.
 *
 * A bounded depth-first search: each slot tries candidates (every band value from
 * a random start in narrow bands; `SLOT_SAMPLES` draws otherwise, near-misses
 * built from a random cell pair's sum or difference ± 1..delta), backtracking on a
 * dead end, at most `TEST_BUDGET` candidates in all. Each candidate keeps the
 * invariants: it completes no triple, it is a near-miss exactly when its slot asks,
 * and it turns no placed plain distractor into a near-miss (a near-miss stays one
 * as cells are added). Bands at most `TABLE_RANGE` wide test candidates against
 * lookup tables, wider ones by direct scan (`distractor-checks`); both give the
 * same answers, so the choice never changes the output.
 *
 * When the band is narrow and the distractor sets few (`EXHAUSTIVE_LIMIT`), the
 * search is exhaustive with no budget, so it fails only when no completion exists.
 *
 * Returns the values (triple first, then the distractors in placement order), or
 * undefined when the budget runs out.
 */
export function fillDistractors(
  stream: RandomStream,
  triple: readonly number[],
  request: DistractorRequest,
): [values: number[] | undefined, next: RandomStream] {
  const { band, count, nearMisses, nearMissDelta: delta } = request;
  const lo = band.minValue;
  const hi = band.maxValue;
  const width = hi - lo + 1;
  const enumerate = width <= DISTRACTOR_ENUM_RANGE;
  const firstNear = count - nearMisses;
  const exhaustive = enumerate && binomialAtMost(width - triple.length, count, EXHAUSTIVE_LIMIT) <= EXHAUSTIVE_LIMIT;
  const checks = width <= TABLE_RANGE ? tableChecks(triple, band, delta) : directChecks(triple, band, delta);
  const { cells } = checks;
  let s = stream;
  let tests = 0;

  const draw = (from: number, to: number): number => {
    const [value, next] = nextInt(s, from, to);
    s = next;
    return value;
  };

  const drawNear = (): number => {
    const i = draw(0, cells.length - 1);
    const j0 = draw(0, cells.length - 2);
    const j = j0 >= i ? j0 + 1 : j0;
    const x = cells[i] as number;
    const y = cells[j] as number;
    const base = draw(0, 1) === 0 ? x + y : absDiff(x, y);
    const offset = draw(1, delta);
    return draw(0, 1) === 0 ? base + offset : base - offset;
  };

  const tryCandidate = (d: number, slot: number, wantNear: boolean, nextFrom: number): boolean => {
    if (!checks.fits(d, wantNear)) return false;
    checks.push(d, !wantNear);
    if (place(slot + 1, nextFrom)) return true;
    checks.pop(!wantNear);
    return false;
  };

  // Exhaustive mode: one rotation for the whole fill; within a slot type, values
  // are taken in increasing rotated position (`from`), so no set is tried twice.
  const rotation = exhaustive ? draw(0, width - 1) : 0;

  function place(slot: number, from: number): boolean {
    if (slot === count) return true;
    const wantNear = slot >= firstNear;
    if (exhaustive) {
      const first = slot === firstNear ? 0 : from;
      for (let i = first; i < width; i += 1) {
        if (tryCandidate(lo + ((rotation + i) % width), slot, wantNear, i + 1)) return true;
      }
      return false;
    }
    if (enumerate) {
      const start = draw(0, width - 1);
      for (let i = 0; i < width; i += 1) {
        if (tests >= TEST_BUDGET) return false;
        tests += 1;
        if (tryCandidate(lo + ((start + i) % width), slot, wantNear, 0)) return true;
      }
      return false;
    }
    for (let t = 0; t < SLOT_SAMPLES; t += 1) {
      if (tests >= TEST_BUDGET) return false;
      tests += 1;
      if (tryCandidate(wantNear ? drawNear() : draw(lo, hi), slot, wantNear, 0)) return true;
    }
    return false;
  }

  return [place(0, 0) ? [...cells] : undefined, s];
}
