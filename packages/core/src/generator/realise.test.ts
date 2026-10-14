import { describe, expect, it } from 'vitest';
import { serialiseRational } from '../numbers/rational';
import type { TuningConfig } from '../tuning/tuning-config';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleBand, PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';
import { realise } from './realise';
import { versionsFor } from './versions-for';

const band1: PuzzleBand = { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 };
const band2: PuzzleBand = { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 };
const band3: PuzzleBand = { band: 3, minValue: 5, maxValue: 99, maxCarries: 1 };
const spec: PuzzleSpec = { n: 3, operator: 'add', band: band1, fallbackBands: [], nearMissCount: 0, nearMissDelta: 2, maxAttempts: 100 };
const versions: PuzzleVersions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };
const leaf: NodeId = { tier: 1, index: 0 };

function mustRealise(seed: number, nodeId: NodeId = leaf, s: PuzzleSpec = spec): Puzzle {
  const result = realise(seed, nodeId, s, versions);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

/** A compact, comparable form: cells in placement order, the answer marked with `*`. */
function shape(p: Puzzle): string {
  return p.cells.map((c, i) => `${serialiseRational(c)}${i === p.answerIndex ? '*' : ''}`).join(' ');
}

describe('realise: determinism', () => {
  it('returns an identical puzzle for the same seed, NodeId, spec and versions', () => {
    const big: PuzzleSpec = { ...spec, n: 9, operator: 'sub', band: band3, fallbackBands: [band2, band1], nearMissCount: 3 };
    for (const seed of [0, 1, 20261011, 0xffffffff]) {
      expect(mustRealise(seed)).toEqual(mustRealise(seed));
      expect(mustRealise(seed, leaf, big)).toEqual(mustRealise(seed, leaf, big));
    }
  });

  it('records its inputs and versions', () => {
    const p = mustRealise(5, { tier: 2, index: 3 });
    expect(p.seed).toBe(5);
    expect(p.nodeId).toEqual({ tier: 2, index: 3 });
    expect(p.spec).toEqual(spec);
    expect(p.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
    expect(p.servedBand).toBe(1);
    expect(p.clamp).toBeUndefined();
  });

  it('pins a few outputs (a change needs a generatorVersion bump once v1 ships, AD-6)', () => {
    expect([
      shape(mustRealise(20261011)),
      shape(mustRealise(0)),
      shape(mustRealise(1, { tier: 1, index: 1 }, { ...spec, operator: 'sub' })),
      shape(mustRealise(1, { tier: 2, index: 0 }, { ...spec, n: 6, band: band3, nearMissCount: 2 })),
      shape(mustRealise(7, leaf, { ...spec, n: 9, operator: 'sub', band: band2, contract: 12, nearMissCount: 3 })),
    ]).toMatchInlineSnapshot(`
      [
        "4 16* 12",
        "3* 1 2",
        "2 3* 5",
        "20* 11 66 7 5 13",
        "41 46 50 12* 45 35 47 18 48",
      ]
    `);
  });
});

describe('realise: recorded versions', () => {
  it('accepts any positive difficultyModelVersion, records it and realises the same cells', () => {
    const base = mustRealise(11);
    const result = realise(11, leaf, spec, { ...versions, difficultyModelVersion: 2 });
    expect(result.ok && result.value.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 2, tuningVersion: 1 });
    expect(result.ok && result.value.cells).toEqual(base.cells);
    expect(result.ok && result.value.answerIndex).toBe(base.answerIndex);
  });

  it('accepts the versions built from a tuning config', () => {
    const tuning: TuningConfig = { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 4, generation: { operators: ['add'], n: { min: 3, max: 3 }, bands: [{ band: 1, ranges: [{ nMin: 3, nMax: 3, minValue: 1, maxValue: 20, maxCarries: 0 }] }], distractors: { nearMissDelta: 1, nearMissShare: 0 }, retries: { maxAttempts: 1 } }, presentation: { solveMs: 380, advanceMs: 400, firstCollapseMs: 3000, collapseMs: 1200, roundTransitionMs: 400, calmMotionScale: 1.25 } };
    const result = realise(1, leaf, spec, versionsFor(tuning));
    expect(result.ok && result.value.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 4 });
  });
});

describe('realise: variety', () => {
  const wide: PuzzleSpec = { ...spec, band: band2 };

  it('differs across seeds', () => {
    const shapes = new Set<string>();
    for (let seed = 0; seed < 200; seed += 1) shapes.add(shape(mustRealise(seed, leaf, wide)));
    expect(shapes.size).toBeGreaterThan(50);
  });

  it('differs across NodeIds of one seed', () => {
    const shapes = new Set<string>();
    for (let index = 0; index < 100; index += 1) shapes.add(shape(mustRealise(7, { tier: 1, index }, wide)));
    for (let tier = 2; tier < 50; tier += 1) shapes.add(shape(mustRealise(7, { tier, index: 0 }, wide)));
    expect(shapes.size).toBeGreaterThan(50);
  });

  it('places the answer in every position across a sample', () => {
    for (const n of [3, 9]) {
      const positions = new Set<number>();
      const s: PuzzleSpec = { ...spec, n, band: band3, nearMissCount: n === 9 ? 3 : 0 };
      for (let seed = 0; seed < 200; seed += 1) positions.add(mustRealise(seed, leaf, s).answerIndex);
      expect([...positions].sort()).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });
});

describe('realise: the matrix', () => {
  const values = (p: Puzzle) => p.cells.map((c) => c.n);

  it('meets an add contract: the answer cell holds it', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const p = mustRealise(seed, leaf, { ...spec, band: band2, contract: 12 });
      expect(values(p)[p.answerIndex]).toBe(12);
      expect(p.clamp).toBeUndefined();
    }
  });

  it('meets a sub contract with a = b + c and b != c', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const p = mustRealise(seed, leaf, { ...spec, n: 5, operator: 'sub', band: band2, contract: 7, nearMissCount: 1 });
      const v = values(p);
      expect(v[p.roles.c]).toBe(7);
      expect(v[p.roles.a]).toBe((v[p.roles.b] as number) + 7);
      expect(v[p.roles.b]).not.toBe(7);
    }
  });

  it('returns unrealisable for an add contract below 3, naming it and the bands', () => {
    const result = realise(1, leaf, { ...spec, band: band2, fallbackBands: [band1], contract: 2 }, versions);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('unrealisable');
    expect(result.error.message).toBe('no add puzzle with n 3 and contract 2 could be realised in bands 2, 1');
  });

  it('returns unrealisable for a contract no band reaches, or that zero or negative', () => {
    for (const contract of [0, -5, 100]) {
      const result = realise(1, leaf, { ...spec, operator: 'sub', band: band2, fallbackBands: [band1], contract }, versions);
      expect(!result.ok && result.error.code).toBe('unrealisable');
    }
  });

  it('clamps to a lower band when only it can host the contract, and records it', () => {
    // Band 3 starts at 5, so 1 + 2 = 3 only fits band 2.
    const p = mustRealise(3, leaf, { ...spec, band: band3, fallbackBands: [band2, band1], contract: 3 });
    expect(p.servedBand).toBe(2);
    expect(p.clamp).toEqual({ requestedBand: 3, servedBand: 2 });
    expect(values(p)[p.answerIndex]).toBe(3);
  });

  it('keeps a no-carry band free of carries and borrows', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      for (const operator of ['add', 'sub'] as const) {
        const p = mustRealise(seed, leaf, { ...spec, operator, n: 4, nearMissCount: 1 });
        const v = values(p);
        const [small, large] = operator === 'add' ? [v[p.roles.a], v[p.roles.b]] : [v[p.roles.b], v[p.roles.c]];
        // No column of the two summands reaches 10.
        expect(((small as number) % 10) + ((large as number) % 10)).toBeLessThan(10);
        expect(Math.floor((small as number) / 10) + Math.floor((large as number) / 10)).toBeLessThan(10);
      }
    }
  });

  it('places exactly nearMissCount near-misses when it can', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const p = mustRealise(seed, leaf, { ...spec, n: 9, band: band3, nearMissCount: 4 });
      expect(p.nearMisses).toBe(4);
    }
  });
});

function circularSpec(): PuzzleSpec {
  const s: Record<string, unknown> = { ...spec, n: 10 };
  s.self = s;
  return s as unknown as PuzzleSpec;
}

describe('realise: bad input returns an error, never throws', () => {
  const cases: [string, () => ReturnType<typeof realise>, string][] = [
    ['negative seed', () => realise(-1, leaf, spec, versions), 'invalid-seed'],
    ['fractional seed', () => realise(1.5, leaf, spec, versions), 'invalid-seed'],
    ['seed above uint32', () => realise(2 ** 32, leaf, spec, versions), 'invalid-seed'],
    ['NaN seed', () => realise(Number.NaN, leaf, spec, versions), 'invalid-seed'],
    ['tier 0', () => realise(1, { tier: 0, index: 0 }, spec, versions), 'invalid-node-id'],
    ['negative index', () => realise(1, { tier: 1, index: -1 }, spec, versions), 'invalid-node-id'],
    ['missing nodeId', () => realise(1, undefined as unknown as NodeId, spec, versions), 'invalid-node-id'],
    ['n 2', () => realise(1, leaf, { ...spec, n: 2 }, versions), 'invalid-spec'],
    ['n 10', () => realise(1, leaf, { ...spec, n: 10 }, versions), 'invalid-spec'],
    ['fractional n', () => realise(1, leaf, { ...spec, n: 3.5 }, versions), 'invalid-spec'],
    ['operator mul', () => realise(1, leaf, { ...spec, operator: 'mul' as 'add' }, versions), 'invalid-spec'],
    ['operator div', () => realise(1, leaf, { ...spec, operator: 'div' as 'add' }, versions), 'invalid-spec'],
    ['missing band', () => realise(1, leaf, { ...spec, band: undefined as unknown as PuzzleBand }, versions), 'invalid-spec'],
    ['band minValue 0', () => realise(1, leaf, { ...spec, band: { ...band1, minValue: 0 } }, versions), 'invalid-spec'],
    ['band maxValue below minValue + 2', () => realise(1, leaf, { ...spec, band: { ...band1, minValue: 5, maxValue: 6 } }, versions), 'invalid-spec'],
    ['band maxValue above int32', () => realise(1, leaf, { ...spec, band: { ...band1, maxValue: 2 ** 31 } }, versions), 'invalid-spec'],
    ['negative maxCarries', () => realise(1, leaf, { ...spec, band: { ...band1, maxCarries: -1 } }, versions), 'invalid-spec'],
    ['fallbackBands not an array', () => realise(1, leaf, { ...spec, fallbackBands: band1 as unknown as PuzzleBand[] }, versions), 'invalid-spec'],
    ['fallback band not lower', () => realise(1, leaf, { ...spec, band: band2, fallbackBands: [band3] }, versions), 'invalid-spec'],
    ['fallback bands not nearest first', () => realise(1, leaf, { ...spec, band: band3, fallbackBands: [band1, band2] }, versions), 'invalid-spec'],
    ['malformed fallback band', () => realise(1, leaf, { ...spec, band: band2, fallbackBands: [{ ...band1, maxValue: 1 }] }, versions), 'invalid-spec'],
    ['fractional contract', () => realise(1, leaf, { ...spec, contract: 12.5 }, versions), 'invalid-spec'],
    ['NaN contract', () => realise(1, leaf, { ...spec, contract: Number.NaN }, versions), 'invalid-spec'],
    ['string contract', () => realise(1, leaf, { ...spec, contract: '12' as unknown as number }, versions), 'invalid-spec'],
    ['nearMissCount above n − 3', () => realise(1, leaf, { ...spec, n: 5, nearMissCount: 3 }, versions), 'invalid-spec'],
    ['negative nearMissCount', () => realise(1, leaf, { ...spec, nearMissCount: -1 }, versions), 'invalid-spec'],
    ['nearMissDelta 0', () => realise(1, leaf, { ...spec, nearMissDelta: 0 }, versions), 'invalid-spec'],
    ['maxAttempts 0', () => realise(1, leaf, { ...spec, maxAttempts: 0 }, versions), 'invalid-spec'],
    ['maxAttempts 1001', () => realise(1, leaf, { ...spec, maxAttempts: 1001 }, versions), 'invalid-spec'],
    ['unknown generatorVersion', () => realise(1, leaf, spec, { ...versions, generatorVersion: 2 }), 'unsupported-version'],
    ['unregistered generatorVersion 99', () => realise(1, leaf, spec, { ...versions, generatorVersion: 99 }), 'unsupported-version'],
    [
      'generatorVersion naming an Object.prototype key',
      () => realise(1, leaf, spec, { ...versions, generatorVersion: 'toString' as unknown as number }),
      'unsupported-version',
    ],
    ['difficultyModelVersion 0', () => realise(1, leaf, spec, { ...versions, difficultyModelVersion: 0 }), 'unsupported-version'],
    ['fractional difficultyModelVersion', () => realise(1, leaf, spec, { ...versions, difficultyModelVersion: 1.5 }), 'unsupported-version'],
    ['tuningVersion 0', () => realise(1, leaf, spec, { ...versions, tuningVersion: 0 }), 'unsupported-version'],
    ['bigint seed', () => realise(1n as unknown as number, leaf, spec, versions), 'invalid-seed'],
    ['bigint NodeId field', () => realise(1, { tier: 1n as unknown as number, index: 0 }, spec, versions), 'invalid-node-id'],
    ['bigint spec field', () => realise(1, leaf, { ...spec, n: 3n as unknown as number }, versions), 'invalid-spec'],
    ['bigint band field', () => realise(1, leaf, { ...spec, band: { ...band1, maxValue: 20n as unknown as number } }, versions), 'invalid-spec'],
    ['circular spec', () => realise(1, leaf, circularSpec(), versions), 'invalid-spec'],
    ['missing spec', () => realise(1, leaf, null as unknown as PuzzleSpec, versions), 'invalid-spec'],
    ['missing versions', () => realise(1, leaf, spec, undefined as unknown as PuzzleVersions), 'unsupported-version'],
  ];

  it('names the registered versions in the unsupported-version message', () => {
    const result = realise(1, leaf, spec, { ...versions, generatorVersion: 99 });
    expect(!result.ok && result.error.message).toBe('this build realises generatorVersion 1, got 99');
  });

  it('names the failing spec field', () => {
    const result = realise(1, leaf, { ...spec, n: 10 }, versions);
    expect(!result.ok && result.error.message).toBe('spec.n must be an integer in 3..9, got 10');
    const fallback = realise(1, leaf, { ...spec, band: band2, fallbackBands: [band3] }, versions);
    expect(!fallback.ok && fallback.error.message).toBe('spec.fallbackBands.0.band must be below 2 (lower bands, nearest first), got 3');
  });

  it.each(cases)('%s', (_name, run, code) => {
    let result: ReturnType<typeof realise> | undefined;
    expect(() => {
      result = run();
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error.code).toBe(code);
  });
});
