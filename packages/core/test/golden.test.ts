// The Node golden-seed check (AD-6): every registered generatorVersion reproduces
// its fixture exactly (puzzle cases and round plans), and fixtures and registered
// versions match one to one.
// tools/golden-harness runs the same comparison in WebKit.
import { describe, expect, it } from 'vitest';
import { registeredGeneratorVersions } from '../src/generator/registered-generator-versions';
import { goldenFixtures } from './golden/golden-fixtures';
import { checkGoldenCoverage, compareGoldenSeeds, type GoldenSeeds } from './golden/golden-seeds';
import { goldenTunings } from './golden/golden-tunings';

const files = Object.keys(goldenFixtures).sort();

describe('golden seeds', () => {
  it('has a fixture for every registered generatorVersion, and no other', () => {
    expect(checkGoldenCoverage(registeredGeneratorVersions(), files)).toEqual([]);
  });

  it.each(files)('%s: the generator reproduces every case', (file) => {
    expect(compareGoldenSeeds(file, goldenFixtures[file], goldenTunings)).toEqual([]);
  });

  it.each(files)('%s: at least 90 cases, spread across seeds, NodeIds and tunings', (file) => {
    const { cases } = goldenFixtures[file] as GoldenSeeds;
    expect(cases.length).toBeGreaterThanOrEqual(90);
    expect(new Set(cases.map((c) => c.input.seed)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(cases.map((c) => `${c.input.nodeId.tier}/${c.input.nodeId.index}`)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(cases.map((c) => c.input.tuning)).size).toBeGreaterThanOrEqual(2);
  });

  it.each(files)('%s: at least 20 round plans: Classic and Tower, several n, both operators, a fixed top cell', (file) => {
    const { plans } = goldenFixtures[file] as GoldenSeeds;
    expect(plans.length).toBeGreaterThanOrEqual(20);
    const planned = plans.filter((p) => !('error' in p.expected));
    expect(new Set(planned.map((p) => p.input.request.type))).toEqual(new Set(['classic', 'tower']));
    expect(new Set(planned.map((p) => p.input.request.operator))).toEqual(new Set(['add', 'sub']));
    expect(new Set(planned.map((p) => p.input.request.n)).size).toBeGreaterThanOrEqual(4);
    expect(planned.some((p) => p.input.request.type === 'tower' && p.input.request.n === 9)).toBe(true);
    expect(planned.some((p) => p.input.request.fixedTopCell !== undefined)).toBe(true);
  });
});
