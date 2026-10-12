// The Node golden-seed check (AD-6): every registered generatorVersion reproduces
// its fixture exactly, and fixtures and registered versions match one to one.
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

  it.each(files)('%s: at least 50 cases, spread across seeds, NodeIds and tunings', (file) => {
    const { cases } = goldenFixtures[file] as GoldenSeeds;
    expect(cases.length).toBeGreaterThanOrEqual(50);
    expect(new Set(cases.map((c) => c.input.seed)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(cases.map((c) => `${c.input.nodeId.tier}/${c.input.nodeId.index}`)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(cases.map((c) => c.input.tuning)).size).toBeGreaterThanOrEqual(2);
  });
});
