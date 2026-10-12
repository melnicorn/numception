// Golden-seed fixtures (AD-6): the format, how a case is realised, and the checks
// shared by the Node test (packages/core/test/golden.test.ts), the WebKit harness
// (tools/golden-harness) and `pnpm golden:update`. Pure: no I/O, so it runs
// unchanged in Node and in a browser page.
import type { NodeId } from '../../src/generator/node-id';
import type { PuzzleClamp, PuzzleRoles } from '../../src/generator/puzzle';
import type { PuzzleBand, PuzzleSpec } from '../../src/generator/puzzle-spec';
import type { PuzzleVersions } from '../../src/generator/puzzle-versions';
import { realise } from '../../src/generator/realise';
import { serialiseRational } from '../../src/numbers/rational';
import { type SpecRequest, specFor } from '../../src/spec/spec-for';
import { parseTuning } from '../../src/tuning/parse-tuning';
import type { TuningConfig } from '../../src/tuning/tuning-config';

/**
 * What a case realises. `tuning` names a file in packages/core/test/fixtures/tuning
 * (without `.json`); `request` is the node's ask (n, operator, band, contract?);
 * `spec` must be the one `specFor(tuning, request)` derives, and `versions` are
 * pinned (generatorVersion the fixture's, tuningVersion the tuning's) so a later
 * difficulty-model bump never changes a replay.
 */
export type GoldenCaseInput = {
  readonly seed: number;
  readonly nodeId: NodeId;
  readonly request: SpecRequest;
  readonly spec: PuzzleSpec;
  readonly tuning: string;
  readonly versions: PuzzleVersions;
};

/**
 * The stable serialised form of a realised puzzle: cells (AD-5 strings) in
 * placement order, the triple's roles, the served band (and clamp, if any) and the
 * near-misses placed.
 */
export type GoldenExpected = {
  readonly cells: readonly string[];
  readonly roles: PuzzleRoles;
  readonly answerIndex: number;
  readonly servedBand: number;
  readonly clamp?: PuzzleClamp;
  readonly nearMisses: number;
  readonly versions: PuzzleVersions;
};

export type GoldenCase = { readonly name: string; readonly input: GoldenCaseInput; readonly expected: GoldenExpected };

/** One fixture file, `generator-v<N>.json`. */
export type GoldenSeeds = {
  readonly kind: 'GoldenSeeds';
  readonly schemaVersion: 1;
  readonly generatorVersion: number;
  readonly cases: readonly GoldenCase[];
};

/** Tuning fixtures by name, as loaded JSON (validated per case with `parseTuning`). */
export type GoldenTunings = { readonly [name: string]: unknown };

/** The fixture file name for a generatorVersion. */
export function fixtureFileName(generatorVersion: number): string {
  return `generator-v${generatorVersion}.json`;
}

const FIXTURE_FILE = /^generator-v([1-9][0-9]*)\.json$/;

/** The generatorVersion a fixture file name stands for, or undefined if it isn't one. */
export function versionOfFixtureFile(file: string): number | undefined {
  const match = FIXTURE_FILE.exec(file);
  return match ? Number(match[1]) : undefined;
}

/**
 * A case's name, unique within a fixture:
 * `s<seed>/t<tier>i<index>/<tuning>/<operator>n<n>b<band>[c<contract>]`.
 */
export function caseName(input: GoldenCaseInput): string {
  const r: Partial<SpecRequest> = isObject(input.request) ? input.request : {};
  const contract = r.contract === undefined ? '' : `c${r.contract}`;
  return `s${input.seed}/t${input.nodeId.tier}i${input.nodeId.index}/${input.tuning}/${r.operator}n${r.n}b${r.band}${contract}`;
}

function parseCaseTuning(input: GoldenCaseInput, tunings: GoldenTunings): TuningConfig | string {
  if (!Object.hasOwn(tunings, input.tuning)) return `unknown tuning fixture "${input.tuning}"`;
  const parsed = parseTuning(tunings[input.tuning]);
  return parsed.ok ? parsed.value : `tuning fixture "${input.tuning}": ${parsed.error.message}`;
}

/**
 * Realises one case of generatorVersion `fileVersion`'s fixture with the case's
 * pinned versions and returns its serialised form, or a message saying why it
 * couldn't. The inputs must agree with themselves: versions.generatorVersion is
 * `fileVersion`, versions.tuningVersion and the spec come from the tuning fixture.
 */
export function realiseCase(
  fileVersion: number,
  input: GoldenCaseInput,
  tunings: GoldenTunings,
): { ok: true; value: GoldenExpected } | { ok: false; error: string } {
  const tuning = parseCaseTuning(input, tunings);
  if (typeof tuning === 'string') return { ok: false, error: tuning };
  const versions: unknown = input.versions;
  if (!isObject(versions)) return { ok: false, error: 'input.versions must be an object' };
  if (versions.generatorVersion !== fileVersion) {
    return { ok: false, error: `input generatorVersion ${canonical(versions.generatorVersion)} is not the fixture's v${fileVersion}` };
  }
  if (versions.tuningVersion !== tuning.tuningVersion) {
    return {
      ok: false,
      error: `input tuningVersion ${canonical(versions.tuningVersion)} is not tuning fixture "${input.tuning}"'s ${tuning.tuningVersion}`,
    };
  }
  if (!isObject(input.request)) return { ok: false, error: 'input.request must be an object' };
  const derived = specFor(tuning, input.request);
  if (!derived.ok) return { ok: false, error: `input request ${canonical(input.request)}: ${derived.error.message}` };
  if (canonical(input.spec) !== canonical(derived.value)) {
    return {
      ok: false,
      error: `input spec ${canonical(input.spec)} is not ${canonical(derived.value)}, derived from tuning fixture "${input.tuning}" and the request`,
    };
  }
  const result = realise(input.seed, input.nodeId, input.spec, input.versions);
  if (!result.ok) return { ok: false, error: `${result.error.code}: ${result.error.message}` };
  const p = result.value;
  if (canonical(p.seed) !== canonical(input.seed) || canonical(p.nodeId) !== canonical(input.nodeId) || canonical(p.spec) !== canonical(input.spec)) {
    return { ok: false, error: 'the realised puzzle does not echo its inputs' };
  }
  return {
    ok: true,
    value: {
      cells: p.cells.map(serialiseRational),
      roles: { a: p.roles.a, b: p.roles.b, c: p.roles.c },
      answerIndex: p.answerIndex,
      servedBand: p.servedBand,
      ...(p.clamp === undefined ? {} : { clamp: { requestedBand: p.clamp.requestedBand, servedBand: p.clamp.servedBand } }),
      nearMisses: p.nearMisses,
      versions: {
        generatorVersion: p.versions.generatorVersion,
        difficultyModelVersion: p.versions.difficultyModelVersion,
        tuningVersion: p.versions.tuningVersion,
      },
    },
  };
}

/** JSON with object keys sorted, so equal values give equal strings whatever their key order. */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Realises every case of the fixture `file` and compares it with the fixture.
 * Returns one message per problem, each naming the file and the case; an empty
 * list means the generator reproduces the fixture exactly.
 */
export function compareGoldenSeeds(file: string, fixture: unknown, tunings: GoldenTunings): string[] {
  const fileVersion = versionOfFixtureFile(file);
  if (fileVersion === undefined) return [`${file}: not a generator-v<N>.json fixture name`];
  if (!isObject(fixture) || fixture.kind !== 'GoldenSeeds' || fixture.schemaVersion !== 1 || !Array.isArray(fixture.cases)) {
    return [`${file}: not a GoldenSeeds schemaVersion 1 fixture with a cases array`];
  }
  if (fixture.generatorVersion !== fileVersion) {
    return [`${file}: generatorVersion ${String(fixture.generatorVersion)} does not match the file name (v${fileVersion})`];
  }
  const problems: string[] = [];
  const names = new Set<string>();
  fixture.cases.forEach((c: unknown, i) => {
    if (!isObject(c) || typeof c.name !== 'string' || !isObject(c.input) || !isObject(c.expected)) {
      problems.push(`${file} case #${i}: needs name, input and expected`);
      return;
    }
    const label = `${file} case "${c.name}"`;
    if (names.has(c.name)) problems.push(`${label}: duplicate case name`);
    const input = c.input as GoldenCaseInput;
    if (isObject(input.nodeId) && c.name !== caseName(input)) problems.push(`${label}: name does not match its inputs (expected "${caseName(input)}")`);
    names.add(c.name);
    const actual = realiseCase(fileVersion, input, tunings);
    if (!actual.ok) {
      problems.push(`${label}: ${actual.error}`);
    } else if (canonical(actual.value) !== canonical(c.expected)) {
      problems.push(`${label}: expected ${canonical(c.expected)}, got ${canonical(actual.value)}`);
    }
  });
  return problems;
}

/**
 * Every registered generatorVersion has a fixture and every fixture a registered
 * version (AD-6). Returns one message per gap.
 */
export function checkGoldenCoverage(registered: readonly number[], fixtureFiles: readonly string[]): string[] {
  const problems: string[] = [];
  const fixtureVersions = new Set<number>();
  for (const file of fixtureFiles) {
    const version = versionOfFixtureFile(file);
    if (version === undefined) problems.push(`${file}: not a generator-v<N>.json fixture name`);
    else fixtureVersions.add(version);
  }
  for (const version of registered) {
    if (!fixtureVersions.has(version)) {
      problems.push(`generatorVersion ${version} is registered but has no fixture ${fixtureFileName(version)}`);
    }
  }
  for (const version of [...fixtureVersions].sort((a, b) => a - b)) {
    if (!registered.includes(version)) {
      problems.push(`${fixtureFileName(version)} has no registered generatorVersion ${version}`);
    }
  }
  return problems;
}

/** Builds generatorVersion's fixture by realising each input. Throws if one can't be realised. */
export function buildGoldenSeeds(generatorVersion: number, inputs: readonly GoldenCaseInput[], tunings: GoldenTunings): GoldenSeeds {
  const cases = inputs.map((input) => {
    const actual = realiseCase(generatorVersion, input, tunings);
    if (!actual.ok) throw new Error(`cannot realise ${caseName(input)} with generatorVersion ${generatorVersion}: ${actual.error}`);
    return { name: caseName(input), input, expected: actual.value };
  });
  return { kind: 'GoldenSeeds', schemaVersion: 1, generatorVersion, cases };
}

/**
 * The fixture's file text: stable (fixed key order, one case per line, trailing
 * newline), so the same fixture always hashes the same in shipped.lock.json.
 */
export function formatGoldenSeeds(fixture: GoldenSeeds): string {
  const band = (b: PuzzleBand) => ({ band: b.band, minValue: b.minValue, maxValue: b.maxValue, maxCarries: b.maxCarries });
  const line = (c: GoldenCase): string =>
    JSON.stringify({
      name: c.name,
      input: {
        seed: c.input.seed,
        nodeId: { tier: c.input.nodeId.tier, index: c.input.nodeId.index },
        request: {
          n: c.input.request.n,
          operator: c.input.request.operator,
          band: c.input.request.band,
          ...(c.input.request.contract === undefined ? {} : { contract: c.input.request.contract }),
        },
        spec: {
          n: c.input.spec.n,
          operator: c.input.spec.operator,
          band: band(c.input.spec.band),
          fallbackBands: c.input.spec.fallbackBands.map(band),
          ...(c.input.spec.contract === undefined ? {} : { contract: c.input.spec.contract }),
          nearMissCount: c.input.spec.nearMissCount,
          nearMissDelta: c.input.spec.nearMissDelta,
          maxAttempts: c.input.spec.maxAttempts,
        },
        tuning: c.input.tuning,
        versions: {
          generatorVersion: c.input.versions.generatorVersion,
          difficultyModelVersion: c.input.versions.difficultyModelVersion,
          tuningVersion: c.input.versions.tuningVersion,
        },
      },
      expected: {
        cells: c.expected.cells,
        roles: { a: c.expected.roles.a, b: c.expected.roles.b, c: c.expected.roles.c },
        answerIndex: c.expected.answerIndex,
        servedBand: c.expected.servedBand,
        ...(c.expected.clamp === undefined
          ? {}
          : { clamp: { requestedBand: c.expected.clamp.requestedBand, servedBand: c.expected.clamp.servedBand } }),
        nearMisses: c.expected.nearMisses,
        versions: {
          generatorVersion: c.expected.versions.generatorVersion,
          difficultyModelVersion: c.expected.versions.difficultyModelVersion,
          tuningVersion: c.expected.versions.tuningVersion,
        },
      },
    });
  return [
    '{',
    `  "kind": "GoldenSeeds",`,
    `  "schemaVersion": 1,`,
    `  "generatorVersion": ${fixture.generatorVersion},`,
    '  "cases": [',
    fixture.cases.map((c) => `    ${line(c)}`).join(',\n'),
    '  ]',
    '}',
    '',
  ].join('\n');
}
