import { nextInt } from '../../random/next-int';
import type { RandomStream } from '../../random/random-stream';
import type { Operator } from '../operator';
import type { PuzzleBand } from '../puzzle-spec';
import { countBorrows, countCarries } from './count-carries';
import { half } from './int-math';

/** A valid triple by value and role: `add` reads a + b = c, `sub` reads a − b = c. */
export type Triple = { readonly a: number; readonly b: number; readonly c: number };

/** Bands at most this wide enumerate every unconstrained triple (at most ~4,100). */
export const TRIPLE_ENUM_RANGE = 128;
/** A contract with at most this many splits enumerates them all. */
export const SPLIT_ENUM_LIMIT = 1024;
/**
 * Independent draws per sampled attempt looking for a triple within the band's
 * carries (a fresh sum and split each time when unconstrained, a fresh split of
 * the contract otherwise).
 */
export const SPLIT_SCAN = 64;

/**
 * The smallest contract each operator accepts. `add` needs a < b < c distinct
 * positive integers, so c >= 1 + 2 = 3. `sub` needs a = b + c with b != c, so any
 * c >= 1 (e.g. 3 − 2 = 1).
 */
export const MIN_CONTRACT: { readonly [op in Operator]: number } = { add: 3, sub: 1 };

/** Indexed pairs `(p, q)` of a triple's two smaller cells; `k` in `0..size−1`. */
type Splits = { readonly size: number; readonly pairAt: (k: number) => readonly [number, number] };

/**
 * Splits of a sum `z` inside the band: `(x, z − x)` with `minValue <= x < z − x`.
 * Empty unless `2·minValue + 1 <= z <= maxValue`.
 */
function sumSplits(band: PuzzleBand, z: number): Splits {
  const lo = band.minValue;
  const size = z > band.maxValue || z < 2 * lo + 1 ? 0 : half(z - 1) - lo + 1;
  return { size, pairAt: (k) => [lo + k, z - lo - k] };
}

/**
 * Splits for a `sub` answer `c`: `(b, c)` with `b` in `minValue..maxValue − c`,
 * `b != c`, so `a = b + c` stays in the band. Empty unless c is in the band.
 */
function differenceSplits(band: PuzzleBand, c: number): Splits {
  const lo = band.minValue;
  const hi = band.maxValue - c;
  if (c < lo || hi < lo) return { size: 0, pairAt: () => [0, 0] };
  const skipsC = c <= hi;
  const size = hi - lo + 1 - (skipsC ? 1 : 0);
  return {
    size,
    pairAt: (k) => {
      const b = lo + k;
      return [skipsC && b >= c ? b + 1 : b, c];
    },
  };
}

/** Column carries of a + b (`add`) or borrows of a − b (`sub`). */
export function tripleCarries(operator: Operator, t: Triple): number {
  return operator === 'add' ? countCarries(t.a, t.b) : countBorrows(t.a, t.b);
}

/**
 * Where an attempt's triple comes from, for one band:
 *
 * - `none`: the band can't host the request (definitive).
 * - `list`: every triple the band can host, enumerated (narrow bands, small
 *   contracts). Attempt i takes entry `(offset + i) mod length`, so the first
 *   `length` attempts try each once.
 * - `sample`: drawn per attempt (wide bands); `splits` is fixed under a contract,
 *   else a fresh sum is drawn first.
 *
 * `designate`: an unconstrained `sub` triple, whose answer is drawn from its two
 * smaller cells per attempt.
 */
export type TripleSource =
  | { readonly kind: 'none' }
  | { readonly kind: 'list'; readonly triples: readonly Triple[]; readonly designate: boolean }
  | {
      readonly kind: 'sample';
      readonly splits: Splits | undefined;
      readonly toTriple: (pair: readonly [number, number]) => Triple;
      readonly designate: boolean;
    };

const NONE: TripleSource = { kind: 'none' };

function feasibleTriples(operator: Operator, band: PuzzleBand, splits: Splits, toTriple: (pair: readonly [number, number]) => Triple, into: Triple[]): void {
  for (let k = 0; k < splits.size; k += 1) {
    const t = toTriple(splits.pairAt(k));
    if (tripleCarries(operator, t) <= band.maxCarries) into.push(t);
  }
}

/**
 * The triple source for `band` under `operator` and an optional answer contract.
 * Bounded work: enumeration only below `TRIPLE_ENUM_RANGE` / `SPLIT_ENUM_LIMIT`.
 */
export function tripleSource(band: PuzzleBand, operator: Operator, contract?: number): TripleSource {
  // Unconstrained and add-under-contract triples come from sum splits (p, q):
  // add reads p + q = z; sub reads z − q = p before designation.
  const fromSum = (pair: readonly [number, number]): Triple =>
    operator === 'add' ? { a: pair[0], b: pair[1], c: pair[0] + pair[1] } : { a: pair[0] + pair[1], b: pair[1], c: pair[0] };

  if (contract === undefined) {
    const lo = band.minValue;
    const hi = band.maxValue;
    if (2 * lo + 1 > hi) return NONE;
    const designate = operator === 'sub';
    if (hi - lo + 1 > TRIPLE_ENUM_RANGE) return { kind: 'sample', splits: undefined, toTriple: fromSum, designate };
    const triples: Triple[] = [];
    for (let z = 2 * lo + 1; z <= hi; z += 1) feasibleTriples(operator, band, sumSplits(band, z), fromSum, triples);
    return triples.length === 0 ? NONE : { kind: 'list', triples, designate };
  }

  if (contract < MIN_CONTRACT[operator] || contract > band.maxValue) return NONE;
  const splits = operator === 'add' ? sumSplits(band, contract) : differenceSplits(band, contract);
  const toTriple = operator === 'add' ? fromSum : (pair: readonly [number, number]): Triple => ({ a: pair[0] + pair[1], b: pair[0], c: pair[1] });
  if (splits.size <= 0) return NONE;
  if (splits.size > SPLIT_ENUM_LIMIT) return { kind: 'sample', splits, toTriple, designate: false };
  const triples: Triple[] = [];
  feasibleTriples(operator, band, splits, toTriple, triples);
  return triples.length === 0 ? NONE : { kind: 'list', triples, designate: false };
}

/** The per-band start offset into a `list` source (one draw), else 0 (no draw). */
export function startOffset(source: TripleSource, stream: RandomStream): [offset: number, next: RandomStream] {
  if (source.kind !== 'list') return [0, stream];
  return nextInt(stream, 0, source.triples.length - 1);
}

function designated(t: Triple, designate: boolean, stream: RandomStream): [Triple, RandomStream] {
  if (!designate) return [t, stream];
  const [flip, next] = nextInt(stream, 0, 1);
  return [flip === 1 ? { a: t.a, b: t.c, c: t.b } : t, next];
}

/**
 * Attempt `attempt`'s triple from a non-`none` source, or undefined when a sampled
 * attempt finds none within the band's carries in `SPLIT_SCAN` draws.
 */
export function pickTriple(
  source: TripleSource,
  band: PuzzleBand,
  operator: Operator,
  attempt: number,
  offset: number,
  stream: RandomStream,
): [triple: Triple | undefined, next: RandomStream] {
  if (source.kind === 'none') return [undefined, stream];
  if (source.kind === 'list') {
    const t = source.triples[(offset + attempt) % source.triples.length] as Triple;
    return designated(t, source.designate, stream);
  }
  let s = stream;
  for (let i = 0; i < SPLIT_SCAN; i += 1) {
    let splits = source.splits;
    if (splits === undefined) {
      const [z, s1] = nextInt(s, 2 * band.minValue + 1, band.maxValue);
      s = s1;
      splits = sumSplits(band, z);
    }
    const [k, s2] = nextInt(s, 0, splits.size - 1);
    s = s2;
    const t = source.toTriple(splits.pairAt(k));
    if (tripleCarries(operator, t) <= band.maxCarries) return designated(t, source.designate, s);
  }
  return [undefined, s];
}
