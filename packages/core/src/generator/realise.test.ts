import { describe, expect, it } from 'vitest';
import { serialiseRational } from '../numbers/rational';
import type { TuningConfig } from '../tuning/tuning-config';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';
import { realise } from './realise';
import { versionsFor } from './versions-for';

const spec: PuzzleSpec = { n: 3, operator: 'add', maxValue: 20 };
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
    for (const seed of [0, 1, 20261011, 0xffffffff]) {
      expect(mustRealise(seed)).toEqual(mustRealise(seed));
    }
  });

  it('records its inputs and versions', () => {
    const p = mustRealise(5, { tier: 2, index: 3 });
    expect(p.seed).toBe(5);
    expect(p.nodeId).toEqual({ tier: 2, index: 3 });
    expect(p.spec).toEqual(spec);
    expect(p.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
  });

  it('pins a few outputs (a change needs a generatorVersion bump, AD-6)', () => {
    expect([
      shape(mustRealise(20261011)),
      shape(mustRealise(0)),
      shape(mustRealise(1, { tier: 1, index: 1 })),
      shape(mustRealise(1, { tier: 2, index: 0 }, { n: 3, operator: 'add', maxValue: 1000 })),
    ]).toMatchInlineSnapshot(`
      [
        "1 3* 2",
        "9* 2 7",
        "8* 3 5",
        "445* 89 356",
      ]
    `);
  });
});

describe('realise: variety', () => {
  it('differs across seeds', () => {
    const shapes = new Set<string>();
    for (let seed = 0; seed < 200; seed += 1) shapes.add(shape(mustRealise(seed)));
    expect(shapes.size).toBeGreaterThan(50);
  });

  it('differs across NodeIds of one seed', () => {
    const shapes = new Set<string>();
    for (let index = 0; index < 100; index += 1) shapes.add(shape(mustRealise(7, { tier: 1, index })));
    for (let tier = 2; tier < 50; tier += 1) shapes.add(shape(mustRealise(7, { tier, index: 0 })));
    expect(shapes.size).toBeGreaterThan(50);
  });

  it('places the answer in every position across a sample', () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 100; seed += 1) positions.add(mustRealise(seed).answerIndex);
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });
});

describe('realise: validity', () => {
  function expectValid(p: Puzzle, maxValue: number): void {
    expect(p.cells).toHaveLength(3);
    const values = p.cells.map((c) => {
      expect(c.d).toBe(1);
      return c.n;
    });
    for (const v of values) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(maxValue);
    }
    expect(new Set(values).size).toBe(3);
    const answer = values[p.answerIndex] as number;
    const others = values.filter((_, i) => i !== p.answerIndex);
    expect(answer).toBe((others[0] as number) + (others[1] as number));
  }

  it('gives three distinct integers in 1..maxValue, the answer the sum of the other two', () => {
    for (let seed = 0; seed < 2000; seed += 1) {
      expectValid(mustRealise(seed, { tier: 1 + (seed % 5), index: seed % 17 }), spec.maxValue);
    }
  });

  it('holds at the smallest range, maxValue 3 (only 1 + 2 = 3)', () => {
    const tiny: PuzzleSpec = { n: 3, operator: 'add', maxValue: 3 };
    for (let seed = 0; seed < 50; seed += 1) {
      const p = mustRealise(seed, leaf, tiny);
      expectValid(p, 3);
      expect(p.cells.map((c) => c.n).sort()).toEqual([1, 2, 3]);
    }
  });

  it('holds at the largest range, maxValue 2^31 − 1', () => {
    const big: PuzzleSpec = { n: 3, operator: 'add', maxValue: 0x7fffffff };
    for (let seed = 0; seed < 200; seed += 1) expectValid(mustRealise(seed, leaf, big), 0x7fffffff);
  });

  it('accepts the versions built from a tuning config', () => {
    const tuning: TuningConfig = { kind: 'TuningConfig', schemaVersion: 1, tuningVersion: 4, generation: { operators: ['add'], maxValue: 20 } };
    const result = realise(1, leaf, spec, versionsFor(tuning));
    expect(result.ok && result.value.versions).toEqual({ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 4 });
  });
});


function circularSpec(): PuzzleSpec {
  const spec: Record<string, unknown> = { n: 3, operator: 'add', maxValue: 2 };
  spec.self = spec;
  return spec as unknown as PuzzleSpec;
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
    ['n other than 3', () => realise(1, leaf, { ...spec, n: 4 as 3 }, versions), 'invalid-spec'],
    ['operator other than add', () => realise(1, leaf, { ...spec, operator: 'mul' as 'add' }, versions), 'invalid-spec'],
    ['maxValue below 3', () => realise(1, leaf, { ...spec, maxValue: 2 }, versions), 'invalid-spec'],
    ['maxValue above int32', () => realise(1, leaf, { ...spec, maxValue: 2 ** 31 }, versions), 'invalid-spec'],
    [
      'unknown generatorVersion',
      () => realise(1, leaf, spec, { ...versions, generatorVersion: 2 as 1 }),
      'unsupported-version',
    ],
    ['tuningVersion 0', () => realise(1, leaf, spec, { ...versions, tuningVersion: 0 }), 'unsupported-version'],
    ['bigint seed', () => realise(1n as unknown as number, leaf, spec, versions), 'invalid-seed'],
    ['bigint NodeId field', () => realise(1, { tier: 1n as unknown as number, index: 0 }, spec, versions), 'invalid-node-id'],
    ['bigint spec field', () => realise(1, leaf, { ...spec, maxValue: 20n as unknown as number }, versions), 'invalid-spec'],
    ['circular spec', () => realise(1, leaf, circularSpec(), versions), 'invalid-spec'],
    ['missing spec', () => realise(1, leaf, null as unknown as PuzzleSpec, versions), 'invalid-spec'],
    ['missing versions', () => realise(1, leaf, spec, undefined as unknown as PuzzleVersions), 'unsupported-version'],
  ];

  it.each(cases)('%s', (_name, run, code) => {
    let result: ReturnType<typeof realise> | undefined;
    expect(() => {
      result = run();
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error.code).toBe(code);
  });
});
