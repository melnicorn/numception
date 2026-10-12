import { describe, expect, it } from 'vitest';
import { goldenInputs } from './golden-inputs';
import {
  buildGoldenSeeds,
  canonical,
  caseName,
  checkGoldenCoverage,
  compareGoldenSeeds,
  formatGoldenSeeds,
  type GoldenCaseInput,
  type GoldenSeeds,
  versionOfFixtureFile,
} from './golden-seeds';
import { goldenTunings } from './golden-tunings';
import { parseTuning } from '../../src/tuning/parse-tuning';
import { specFor } from '../../src/spec/spec-for';

const tunings = {
  t: {
    kind: 'TuningConfig',
    schemaVersion: 1,
    tuningVersion: 5,
    generation: {
      operators: ['add', 'sub'],
      n: { min: 3, max: 9 },
      bands: [
        { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 },
        { band: 2, minValue: 5, maxValue: 99, maxCarries: 1 },
      ],
      distractors: { nearMissDelta: 2, nearMissShare: 0.5 },
      retries: { maxAttempts: 20 },
    },
  },
};

function specOf(request: GoldenCaseInput['request']): GoldenCaseInput['spec'] {
  const parsed = parseTuning(tunings.t);
  if (!parsed.ok) throw new Error(parsed.error.message);
  const spec = specFor(parsed.value, request);
  if (!spec.ok) throw new Error(spec.error.message);
  return spec.value;
}

const request = { n: 5, operator: 'add', band: 2 } as const;
const input: GoldenCaseInput = {
  seed: 1,
  nodeId: { tier: 1, index: 0 },
  request,
  spec: specOf(request),
  tuning: 't',
  versions: { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 5 },
};

function fixture(): GoldenSeeds {
  return buildGoldenSeeds(1, [input, { ...input, seed: 2 }], tunings);
}

/** A deep copy through the formatted text, as a fixture file would be read. */
function reread(f: GoldenSeeds): GoldenSeeds {
  return JSON.parse(formatGoldenSeeds(f)) as GoldenSeeds;
}

describe('compareGoldenSeeds', () => {
  it('passes a freshly built fixture', () => {
    expect(compareGoldenSeeds('generator-v1.json', reread(fixture()), tunings)).toEqual([]);
  });

  it('fails on output drift, naming the case', () => {
    const f = reread(fixture());
    const drifted = { ...f, cases: [f.cases[0], { ...f.cases[1], expected: { ...f.cases[1]!.expected, answerIndex: 9 } }] };
    const problems = compareGoldenSeeds('generator-v1.json', drifted, tunings);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^generator-v1\.json case "s2\/t1i0\/t\/addn5b2": expected .*"answerIndex":9.*, got /);
  });

  it('fails on a drifted cell value or version', () => {
    const f = reread(fixture());
    const c = f.cases[0]!;
    const cells = [...c.expected.cells];
    cells[0] = `${Number(cells[0]) + 1}`;
    const versions = { ...c.expected.versions, tuningVersion: 6 };
    expect(compareGoldenSeeds('generator-v1.json', { ...f, cases: [{ ...c, expected: { ...c.expected, cells } }] }, tunings)).toHaveLength(1);
    expect(compareGoldenSeeds('generator-v1.json', { ...f, cases: [{ ...c, expected: { ...c.expected, versions } }] }, tunings)).toHaveLength(1);
  });

  it('fails when the fixture names another version than its file', () => {
    expect(compareGoldenSeeds('generator-v2.json', reread(fixture()), tunings)).toEqual([
      'generator-v2.json: generatorVersion 1 does not match the file name (v2)',
    ]);
  });

  it('fails for a fixture of an unregistered version (realise rejects it)', () => {
    const f = reread(fixture());
    const cases = f.cases.map((c) => ({ ...c, input: { ...c.input, versions: { ...c.input.versions, generatorVersion: 99 } } }));
    const problems = compareGoldenSeeds('generator-v99.json', { ...f, generatorVersion: 99, cases }, tunings);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/unsupported-version/);
  });

  it('fails on a malformed fixture, an unknown tuning and duplicate names', () => {
    expect(compareGoldenSeeds('generator-v1.json', { kind: 'Other' }, tunings)).toHaveLength(1);
    expect(compareGoldenSeeds('golden.json', fixture(), tunings)).toHaveLength(1);
    const f = reread(fixture());
    const unknownTuning = { ...f, cases: [{ ...f.cases[0]!, name: 's1/t1i0/nope/addn5b2', input: { ...f.cases[0]!.input, tuning: 'nope' } }] };
    expect(compareGoldenSeeds('generator-v1.json', unknownTuning, tunings)).toEqual([
      'generator-v1.json case "s1/t1i0/nope/addn5b2": unknown tuning fixture "nope"',
    ]);
    const dup = { ...f, cases: [f.cases[0]!, f.cases[0]!] };
    expect(compareGoldenSeeds('generator-v1.json', dup, tunings)).toEqual(['generator-v1.json case "s1/t1i0/t/addn5b2": duplicate case name']);
  });
});

describe('compareGoldenSeeds: inputs must agree with themselves', () => {
  function withInput(change: Record<string, unknown>, name?: string): unknown {
    const f = reread(fixture());
    const c = f.cases[0]!;
    return { ...f, cases: [{ ...c, name: name ?? c.name, input: { ...c.input, ...change } }] };
  }

  it("fails when a case's name doesn't match its inputs", () => {
    expect(compareGoldenSeeds('generator-v1.json', withInput({}, 's9/t1i0/t/addn5b2'), tunings)).toEqual([
      'generator-v1.json case "s9/t1i0/t/addn5b2": name does not match its inputs (expected "s1/t1i0/t/addn5b2")',
    ]);
  });

  it("fails when the spec isn't the one specFor derives from the case's tuning and request", () => {
    const tampered = withInput({ spec: { ...input.spec, maxAttempts: 19 } });
    const problems = compareGoldenSeeds('generator-v1.json', tampered, tunings);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/input spec .* is not .*derived from tuning fixture "t" and the request/);
    // A request naming another band, with the spec left as it was, is caught the same way.
    const otherBand = { n: 5, operator: 'add', band: 1 } as const;
    const moved = withInput({ request: otherBand }, caseName({ ...input, request: otherBand }));
    expect(compareGoldenSeeds('generator-v1.json', moved, tunings)[0]).toMatch(/input spec .* is not /);
  });

  it('fails when the request is missing or specFor rejects it', () => {
    expect(compareGoldenSeeds('generator-v1.json', withInput({ request: undefined }, caseName({ ...input, request: undefined as never })), tunings)[0]).toMatch(
      /input\.request must be an object/,
    );
    const bad = { n: 10, operator: 'add', band: 2 } as const;
    expect(compareGoldenSeeds('generator-v1.json', withInput({ request: bad }, caseName({ ...input, request: bad })), tunings)[0]).toMatch(
      /input request .*: n must be an integer in 3\.\.9/,
    );
  });

  it("fails when the pinned versions disagree with the fixture or the tuning", () => {
    const wrongGenerator = withInput({ versions: { generatorVersion: 2, difficultyModelVersion: 1, tuningVersion: 5 } });
    expect(compareGoldenSeeds('generator-v1.json', wrongGenerator, tunings)[0]).toMatch(/input generatorVersion 2 is not the fixture's v1/);
    const wrongTuning = withInput({ versions: { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 6 } });
    expect(compareGoldenSeeds('generator-v1.json', wrongTuning, tunings)[0]).toMatch(/input tuningVersion 6 is not tuning fixture "t"'s 5/);
    expect(compareGoldenSeeds('generator-v1.json', withInput({ versions: undefined }), tunings)[0]).toMatch(/input\.versions must be an object/);
  });

  it('replays a case pinned to another difficultyModelVersion, recording it', () => {
    const pinned = { ...input, versions: { ...input.versions, difficultyModelVersion: 7 } };
    const built = reread(buildGoldenSeeds(1, [pinned], tunings));
    expect(built.cases[0]!.expected.versions.difficultyModelVersion).toBe(7);
    expect(compareGoldenSeeds('generator-v1.json', built, tunings)).toEqual([]);
  });
});

describe('checkGoldenCoverage', () => {
  it('passes when versions and fixtures match', () => {
    expect(checkGoldenCoverage([1, 2], ['generator-v2.json', 'generator-v1.json'])).toEqual([]);
  });

  it('fails for a registered version with no fixture', () => {
    expect(checkGoldenCoverage([1, 2], ['generator-v1.json'])).toEqual([
      'generatorVersion 2 is registered but has no fixture generator-v2.json',
    ]);
  });

  it('fails for a fixture with no registered version', () => {
    expect(checkGoldenCoverage([1], ['generator-v1.json', 'generator-v3.json'])).toEqual([
      'generator-v3.json has no registered generatorVersion 3',
    ]);
  });
});

describe('fixture helpers', () => {
  it('reads the version from a fixture file name only', () => {
    expect(versionOfFixtureFile('generator-v12.json')).toBe(12);
    expect(versionOfFixtureFile('generator-v0.json')).toBeUndefined();
    expect(versionOfFixtureFile('generator-v1.json.bak')).toBeUndefined();
  });

  it('canonicalises key order', () => {
    expect(canonical({ b: 1, a: { d: 2, c: 3 } })).toBe(canonical({ a: { c: 3, d: 2 }, b: 1 }));
  });

  it('formats a fixture as stable, parseable text', () => {
    const text = formatGoldenSeeds(fixture());
    expect(formatGoldenSeeds(JSON.parse(text) as GoldenSeeds)).toBe(text);
    expect(text.endsWith('}\n')).toBe(true);
  });

  it('builds at least 90 golden inputs from the tuning fixtures, all distinct', () => {
    const inputs = goldenInputs(1, goldenTunings);
    expect(inputs.length).toBeGreaterThanOrEqual(90);
    expect(new Set(inputs.map((i) => canonical(i))).size).toBe(inputs.length);
    expect(new Set(inputs.map((i) => caseName(i))).size).toBe(inputs.length);
  });

  it('covers n 3..9, both operators, several bands, contracts and a clamp', () => {
    const inputs = goldenInputs(1, goldenTunings);
    expect([...new Set(inputs.map((i) => i.request.n))].sort()).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect([...new Set(inputs.map((i) => i.request.operator))].sort()).toEqual(['add', 'sub']);
    expect(new Set(inputs.map((i) => `${i.tuning}/${i.request.band}`)).size).toBeGreaterThanOrEqual(5);
    expect(inputs.filter((i) => i.request.contract !== undefined).length).toBeGreaterThanOrEqual(10);
    const fixture = buildGoldenSeeds(1, inputs, goldenTunings);
    expect(fixture.cases.some((c) => c.expected.clamp !== undefined)).toBe(true);
  });
});
