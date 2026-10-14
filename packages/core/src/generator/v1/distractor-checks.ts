import type { PuzzleBand } from '../puzzle-spec';
import { completesTriple } from './count-triples';
import { absDiff } from './int-math';
import { isNear, nearsSomePair } from './near-miss';

/** Bands at most this wide test candidates against lookup tables (`tableChecks`). */
export const TABLE_RANGE = 1024;

/**
 * The cells of a distractor fill so far, and the test `fillDistractors` puts each
 * candidate through. `fits(d, wantNear)` holds when `d` is in the band, is not
 * already a cell, completes no triple, is a near-miss exactly when `wantNear`,
 * and turns no placed plain distractor into a near-miss.
 *
 * `push` adds a cell (`plain`: a distractor that must not be a near-miss); `pop`
 * removes the last one pushed, with the same `plain`. The two implementations
 * answer `fits` identically; they differ only in cost.
 */
export type DistractorChecks = {
  readonly cells: readonly number[];
  fits(d: number, wantNear: boolean): boolean;
  push(d: number, plain: boolean): void;
  pop(plain: boolean): void;
};

/** The checks by direct scan over the cells: O(cells²) per candidate, any band width. */
export function directChecks(triple: readonly number[], band: PuzzleBand, delta: number): DistractorChecks {
  const lo = band.minValue;
  const hi = band.maxValue;
  const cells = [...triple];
  const plain: number[] = [];

  const turnsPlainNear = (d: number): boolean => {
    for (const e of plain) {
      const ev = cells[e] as number;
      for (let i = 0; i < cells.length; i += 1) {
        if (i === e) continue;
        const p = cells[i] as number;
        if (isNear(ev, d + p, delta) || isNear(ev, absDiff(d, p), delta)) return true;
      }
    }
    return false;
  };

  return {
    cells,
    fits: (d, wantNear) =>
      d >= lo && d <= hi && !cells.includes(d) && !completesTriple(cells, d) && nearsSomePair(cells, d, delta, -1) === wantNear && !turnsPlainNear(d),
    push: (d, isPlain) => {
      if (isPlain) plain.push(cells.length);
      cells.push(d);
    },
    pop: (isPlain) => {
      cells.pop();
      if (isPlain) plain.pop();
    },
  };
}

/**
 * The same checks from per-value counters over the band, kept up to date as cells
 * are pushed and popped: O(1) per candidate, O(cells · min(delta, width)) per
 * push or pop. For bands at most `TABLE_RANGE` wide. Counters, for each band value v:
 *
 * - `present`: v is a cell;
 * - `completes`: cell pairs whose sum or difference is v (v would complete a triple);
 * - `near`: cell pairs whose sum or difference is within delta of v, but not v (v
 *   would be a near-miss);
 * - `danger`: (plain distractor e, other cell p) pairs for which v + p or |v − p|
 *   would be within delta of e, but not e (v would turn e into a near-miss).
 */
export function tableChecks(triple: readonly number[], band: PuzzleBand, delta: number): DistractorChecks {
  const lo = band.minValue;
  const hi = band.maxValue;
  const width = hi - lo + 1;
  const present = new Int32Array(width);
  const completes = new Int32Array(width);
  const near = new Int32Array(width);
  const danger = new Int32Array(width);
  const cells: number[] = [];
  const plain: number[] = [];

  const bump = (table: Int32Array, v: number, by: number): void => {
    if (v >= lo && v <= hi) table[v - lo] = (table[v - lo] as number) + by;
  };
  /** Adds `by` to every value in `from..to` (clamped to the band) except `skip`. */
  const bumpRange = (table: Int32Array, from: number, to: number, skip: number, by: number): void => {
    const first = from > lo ? from : lo;
    const last = to < hi ? to : hi;
    for (let v = first; v <= last; v += 1) if (v !== skip) table[v - lo] = (table[v - lo] as number) + by;
  };
  /** Pair (x, y) of cells: its sum and difference, and the values near them. */
  const pair = (x: number, y: number, by: number): void => {
    const sum = x + y;
    const diff = absDiff(x, y);
    bump(completes, sum, by);
    bump(completes, diff, by);
    bumpRange(near, sum - delta, sum + delta, sum, by);
    bumpRange(near, diff - delta, diff + delta, diff, by);
  };
  /** The candidates d for which plain distractor `e` turns near through cell `p`. */
  const dangerOf = (e: number, p: number, by: number): void => {
    // d + p within delta of e (not e).
    bumpRange(danger, e - delta - p, e + delta - p, e - p, by);
    // |d − p| = s, s within delta of e (not e): d = p + s for s >= 0, d = p − s for s >= 1.
    const s0 = e - delta > 0 ? e - delta : 0;
    bumpRange(danger, p + s0, p + e + delta, p + e, by);
    const s1 = s0 > 1 ? s0 : 1;
    bumpRange(danger, p - e - delta, p - s1, p - e, by);
  };
  const update = (d: number, isPlain: boolean, by: number): void => {
    for (const p of cells) pair(d, p, by);
    for (const e of plain) dangerOf(e, d, by);
    if (isPlain) for (const p of cells) dangerOf(d, p, by);
    bump(present, d, by);
  };

  const checks: DistractorChecks = {
    cells,
    fits: (d, wantNear) =>
      d >= lo &&
      d <= hi &&
      present[d - lo] === 0 &&
      completes[d - lo] === 0 &&
      (near[d - lo] as number) > 0 === wantNear &&
      danger[d - lo] === 0,
    push: (d, isPlain) => {
      update(d, isPlain, 1);
      cells.push(d);
      if (isPlain) plain.push(d);
    },
    pop: (isPlain) => {
      const d = cells.pop() as number;
      if (isPlain) plain.pop();
      update(d, isPlain, -1);
    },
  };
  for (const v of triple) checks.push(v, false);
  return checks;
}
