// AD-19 property tests for generator v1 (fast-check). The checks here re-derive
// everything from the cells with their own brute force, so they don't trust the
// generator's helpers.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { NodeId } from './node-id';
import type { Operator } from './operator';
import type { Puzzle } from './puzzle';
import type { PuzzleBand, PuzzleSpec } from './puzzle-spec';
import { realise } from './realise';

const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };

/** The POC bands, as in content/tuning/1.json (tools/generation-content.test.ts runs the real file). */
const POC_BANDS: readonly PuzzleBand[] = [
  { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 },
  { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 },
  { band: 3, minValue: 5, maxValue: 99, maxCarries: 1 },
  { band: 4, minValue: 10, maxValue: 999, maxCarries: 2 },
];

/** Lower bands, nearest first, as specFor builds them. */
function fallbacksOf(bands: readonly PuzzleBand[], requested: number): PuzzleBand[] {
  return bands.filter((b) => b.band < requested).sort((x, y) => y.band - x.band);
}

/** Column carries of x + y, written independently of the generator's. */
function carries(x: number, y: number): number {
  const xs = String(x).split('').reverse().map(Number);
  const ys = String(y).split('').reverse().map(Number);
  let carry = 0;
  let count = 0;
  for (let i = 0; i < Math.max(xs.length, ys.length); i += 1) {
    carry = (xs[i] ?? 0) + (ys[i] ?? 0) + carry >= 10 ? 1 : 0;
    count += carry;
  }
  return count;
}

function validTriples(values: readonly number[]): number[][] {
  const found: number[][] = [];
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      for (let k = j + 1; k < values.length; k += 1) {
        const [x, y, z] = [values[i]!, values[j]!, values[k]!];
        if (x + y === z || x + z === y || y + z === x) found.push([i, j, k]);
      }
    }
  }
  return found;
}

function nearMisses(values: readonly number[], distractors: readonly number[], delta: number): number {
  return distractors.filter((d) => {
    for (let i = 0; i < values.length; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        if (i === d || j === d) continue;
        for (const target of [values[i]! + values[j]!, Math.abs(values[i]! - values[j]!)]) {
          const gap = Math.abs(values[d]! - target);
          if (gap >= 1 && gap <= delta) return true;
        }
      }
    }
    return false;
  }).length;
}

/** Every AD-19 invariant of a realised puzzle against its spec. */
function expectWellFormed(p: Puzzle, spec: PuzzleSpec): void {
  const values = p.cells.map((c) => {
    expect(c.d).toBe(1);
    return c.n;
  });
  expect(values).toHaveLength(spec.n);
  for (const v of values) expect(Number.isSafeInteger(v) && v >= 1).toBe(true);
  expect(new Set(values).size).toBe(spec.n);

  // Served band: the requested one (no clamp), or a fallback (clamp recorded).
  const served = [spec.band, ...spec.fallbackBands].find((b) => b.band === p.servedBand);
  expect(served).toBeDefined();
  if (p.servedBand === spec.band.band) expect(p.clamp).toBeUndefined();
  else expect(p.clamp).toEqual({ requestedBand: spec.band.band, servedBand: p.servedBand });
  for (const v of values) {
    expect(v).toBeGreaterThanOrEqual(served!.minValue);
    expect(v).toBeLessThanOrEqual(served!.maxValue);
  }

  // Exactly one valid triple, and it is the one the roles name.
  const triples = validTriples(values);
  expect(triples).toHaveLength(1);
  const { a, b, c } = p.roles;
  expect([a, b, c].sort((x, y) => x - y)).toEqual(triples[0]);
  expect(p.answerIndex).toBe(c);
  const [va, vb, vc] = [values[a]!, values[b]!, values[c]!];
  if (spec.operator === 'add') {
    expect(va + vb).toBe(vc);
    expect(vc).toBe(Math.max(va, vb, vc));
    expect(carries(va, vb)).toBeLessThanOrEqual(served!.maxCarries);
  } else {
    expect(va - vb).toBe(vc);
    expect(va).toBe(Math.max(va, vb, vc));
    expect(vb).not.toBe(vc);
    // Borrows of a − b are the carries of b + c.
    expect(carries(vb, vc)).toBeLessThanOrEqual(served!.maxCarries);
  }
  if (spec.contract !== undefined) expect(vc).toBe(spec.contract);

  // Near-misses: as recorded, never more than asked.
  const distractors = values.map((_, i) => i).filter((i) => i !== a && i !== b && i !== c);
  expect(nearMisses(values, distractors, spec.nearMissDelta)).toBe(p.nearMisses);
  expect(p.nearMisses).toBeLessThanOrEqual(spec.nearMissCount);
}

const seedArb = fc.integer({ min: 0, max: 0xffffffff });
const nodeArb: fc.Arbitrary<NodeId> = fc.record({ tier: fc.integer({ min: 1, max: 20 }), index: fc.integer({ min: 0, max: 0xffffffff }) });
const operatorArb: fc.Arbitrary<Operator> = fc.constantFrom('add', 'sub');
const nArb = fc.integer({ min: 3, max: 9 });

/** A set of bands numbered 1..k, each a random value range and carry allowance. */
function bandsArb(maxWidth: number): fc.Arbitrary<PuzzleBand[]> {
  const one = fc
    .record({ minValue: fc.integer({ min: 1, max: 40 }), width: fc.integer({ min: 2, max: maxWidth }), maxCarries: fc.integer({ min: 0, max: 3 }) })
    .map(({ minValue, width, maxCarries }) => ({ minValue, maxValue: minValue + width, maxCarries }));
  return fc.array(one, { minLength: 1, maxLength: 4 }).map((bs) => bs.map((b, i) => ({ band: i + 1, ...b })));
}

describe('AD-19 property 1: exactly one valid triple, well formed, for every n and operator', () => {
  it('holds for the POC bands, every n 3..9 and both operators (always realisable)', () => {
    fc.assert(
      fc.property(seedArb, nodeArb, nArb, operatorArb, fc.constantFrom(1, 2, 3, 4), (seed, nodeId, n, operator, band) => {
        const spec: PuzzleSpec = {
          n,
          operator,
          band: POC_BANDS[band - 1]!,
          fallbackBands: fallbacksOf(POC_BANDS, band),
          nearMissCount: Math.round(0.5 * (n - 3)),
          nearMissDelta: 2,
          maxAttempts: 100,
        };
        const result = realise(seed, nodeId, spec, versions);
        expect(result.ok).toBe(true);
        if (result.ok) expectWellFormed(result.value, spec);
      }),
      { numRuns: 500 },
    );
  });

  it('holds for random bands, near-miss counts and deltas, or the result is unrealisable', () => {
    fc.assert(
      fc.property(
        seedArb,
        nodeArb,
        nArb,
        operatorArb,
        bandsArb(400),
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 30 }),
        (seed, nodeId, n, operator, bands, nearMissWant, nearMissDelta, maxAttempts) => {
          const top = bands[bands.length - 1]!;
          const spec: PuzzleSpec = {
            n,
            operator,
            band: top,
            fallbackBands: fallbacksOf(bands, top.band),
            nearMissCount: Math.min(nearMissWant, n - 3),
            nearMissDelta,
            maxAttempts,
          };
          const result = realise(seed, nodeId, spec, versions);
          if (result.ok) expectWellFormed(result.value, spec);
          else expect(result.error.code).toBe('unrealisable');
          // Same inputs, same outcome (AD-3).
          expect(realise(seed, nodeId, spec, versions)).toEqual(result);
        },
      ),
      { numRuns: 300 },
    );
  });
});

/** Whether `band` can host a triple whose answer is `contract`, by brute force. */
function hosts(band: PuzzleBand, operator: Operator, contract: number): boolean {
  const { minValue: lo, maxValue: hi, maxCarries } = band;
  if (contract < lo || contract > hi) return false;
  if (operator === 'add') {
    for (let a = lo; a < contract - a; a += 1) if (carries(a, contract - a) <= maxCarries) return true;
    return false;
  }
  for (let b = lo; b + contract <= hi; b += 1) if (b !== contract && carries(b, contract) <= maxCarries) return true;
  return false;
}

describe('AD-19 property 2: a contract is met at the requested band, clamped, or unrealisable exactly when no band hosts it', () => {
  it('holds exactly at n 3 for random bands and contracts in a range', () => {
    fc.assert(
      fc.property(seedArb, nodeArb, operatorArb, bandsArb(80), fc.integer({ min: -3, max: 130 }), (seed, nodeId, operator, bands, contract) => {
        const top = bands[bands.length - 1]!;
        const order = [top, ...fallbacksOf(bands, top.band)];
        const spec: PuzzleSpec = { n: 3, operator, band: top, fallbackBands: order.slice(1), contract, nearMissCount: 0, nearMissDelta: 1, maxAttempts: 1 };
        const result = realise(seed, nodeId, spec, versions);
        const firstHost = order.find((b) => hosts(b, operator, contract));
        if (firstHost === undefined) {
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.code).toBe('unrealisable');
          expect(result.error.message).toContain(`contract ${contract}`);
          expect(result.error.message).toContain(`bands ${order.map((b) => b.band).join(', ')}`);
          return;
        }
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expectWellFormed(result.value, spec);
        // Served by the first band that can host it: the requested one, or a recorded clamp.
        expect(result.value.servedBand).toBe(firstHost.band);
      }),
      { numRuns: 1000 },
    );
  });

  it('at every n, is served at the requested band, clamped to a hosting band, or unrealisable; never realised where no band hosts it', () => {
    fc.assert(
      fc.property(seedArb, nodeArb, nArb, operatorArb, fc.constantFrom(1, 2, 3, 4), fc.integer({ min: -3, max: 1100 }), (seed, nodeId, n, operator, band, contract) => {
        const order = [POC_BANDS[band - 1]!, ...fallbacksOf(POC_BANDS, band)];
        const spec: PuzzleSpec = {
          n,
          operator,
          band: order[0]!,
          fallbackBands: order.slice(1),
          contract,
          nearMissCount: Math.round(0.5 * (n - 3)),
          nearMissDelta: 2,
          maxAttempts: 100,
        };
        const result = realise(seed, nodeId, spec, versions);
        const anyHost = order.some((b) => hosts(b, operator, contract));
        if (!result.ok) {
          // A band can also run out of room for distractors at large n, so only
          // "no band hosts the triple ⇒ unrealisable" is exact here.
          expect(result.error.code).toBe('unrealisable');
          return;
        }
        expect(anyHost).toBe(true);
        expectWellFormed(result.value, spec);
        const served = order.find((b) => b.band === result.value.servedBand)!;
        expect(hosts(served, operator, contract)).toBe(true);
      }),
      { numRuns: 500 },
    );
  });
});
