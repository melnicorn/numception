// Golden-seed fixtures (AD-6): the format, how a case is realised, and the checks
// shared by the Node test (packages/core/test/golden.test.ts), the WebKit harness
// (tools/golden-harness) and `pnpm golden:update`. Pure: no I/O, so it runs
// unchanged in Node and in a browser page.
import type { NodeId } from '../../src/generator/node-id';
import type { Puzzle, PuzzleClamp, PuzzleRoles } from '../../src/generator/puzzle';
import type { PuzzleBand, PuzzleSpec } from '../../src/generator/puzzle-spec';
import type { PuzzleVersions } from '../../src/generator/puzzle-versions';
import { realise } from '../../src/generator/realise';
import { serialiseRational } from '../../src/numbers/rational';
import { deriveSeed } from '../../src/random/derive-seed';
import type { PlanRequest } from '../../src/rounds/round-plan';
import { planRound, realiseRoundNode } from '../../src/rounds/round-types';
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

/**
 * What a round-plan case plans: round `ordinal` of a run from `rootSeed` (the round
 * seed is `deriveSeed(rootSeed, ordinal)`), the plan request, a tuning fixture name
 * and pinned versions (as for puzzle cases).
 */
export type GoldenPlanInput = {
  readonly rootSeed: number;
  readonly ordinal: number;
  readonly request: PlanRequest;
  readonly tuning: string;
  readonly versions: PuzzleVersions;
};

/** A planned or lazily realised puzzle in its stable serialised form: the whole record, cells as AD-5 strings. */
export type GoldenPlanPuzzle = {
  readonly seed: number;
  readonly nodeId: NodeId;
  readonly spec: PuzzleSpec;
  readonly cells: readonly string[];
  readonly roles: PuzzleRoles;
  readonly answerIndex: number;
  readonly servedBand: number;
  readonly clamp?: PuzzleClamp;
  readonly nearMisses: number;
  readonly versions: PuzzleVersions;
};

/**
 * The stable serialised form of a plan: the round seed, every node top-down
 * (contract and/or planned puzzle), the versions, and leaf (1, 0) realised lazily
 * in the tuning's highest band (`firstLeaf`, so leaf realisation and its clamp are
 * pinned too). An expected planning failure is `{ error: 'unplannable' }`.
 */
export type GoldenPlanExpected =
  | {
      readonly roundSeed: number;
      readonly tiers: number;
      readonly startBand: number;
      readonly nodes: readonly { readonly nodeId: NodeId; readonly contract?: number; readonly puzzle?: GoldenPlanPuzzle }[];
      readonly firstLeaf: GoldenPlanPuzzle & { readonly band: number };
      readonly versions: PuzzleVersions;
    }
  | { readonly error: string };

export type GoldenPlanCase = { readonly name: string; readonly input: GoldenPlanInput; readonly expected: GoldenPlanExpected };

/** One fixture file, `generator-v<N>.json`: puzzle cases and round-plan cases. */
export type GoldenSeeds = {
  readonly kind: 'GoldenSeeds';
  readonly schemaVersion: 1;
  readonly generatorVersion: number;
  readonly cases: readonly GoldenCase[];
  readonly plans: readonly GoldenPlanCase[];
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

/**
 * A plan case's name, unique within a fixture:
 * `r<rootSeed>o<ordinal>/<tuning>/<type>-<operator>n<n>b<band>[f<childIndex>v<value>]`.
 */
export function planCaseName(input: GoldenPlanInput): string {
  const r: Partial<PlanRequest> = isObject(input.request) ? input.request : {};
  const fixed = r.fixedTopCell === undefined ? '' : `f${r.fixedTopCell.childIndex}v${r.fixedTopCell.value}`;
  return `r${input.rootSeed}o${input.ordinal}/${input.tuning}/${r.type}-${r.operator}n${r.n}b${r.band ?? 1}${fixed}`;
}

function serialiseBand(b: PuzzleBand): PuzzleBand {
  return { band: b.band, minValue: b.minValue, maxValue: b.maxValue, maxCarries: b.maxCarries };
}

function serialiseVersions(v: PuzzleVersions): PuzzleVersions {
  return { generatorVersion: v.generatorVersion, difficultyModelVersion: v.difficultyModelVersion, tuningVersion: v.tuningVersion };
}

function serialiseClamp(c: PuzzleClamp | undefined): { clamp?: PuzzleClamp } {
  return c === undefined ? {} : { clamp: { requestedBand: c.requestedBand, servedBand: c.servedBand } };
}

function serialisePlanPuzzle(p: Puzzle): GoldenPlanPuzzle {
  return {
    seed: p.seed,
    nodeId: { tier: p.nodeId.tier, index: p.nodeId.index },
    spec: {
      n: p.spec.n,
      operator: p.spec.operator,
      band: serialiseBand(p.spec.band),
      fallbackBands: p.spec.fallbackBands.map(serialiseBand),
      ...(p.spec.contract === undefined ? {} : { contract: p.spec.contract }),
      nearMissCount: p.spec.nearMissCount,
      nearMissDelta: p.spec.nearMissDelta,
      maxAttempts: p.spec.maxAttempts,
    },
    cells: p.cells.map(serialiseRational),
    roles: { a: p.roles.a, b: p.roles.b, c: p.roles.c },
    answerIndex: p.answerIndex,
    servedBand: p.servedBand,
    ...serialiseClamp(p.clamp),
    nearMisses: p.nearMisses,
    versions: serialiseVersions(p.versions),
  };
}

/**
 * Plans one round-plan case of generatorVersion `fileVersion`'s fixture and returns
 * its serialised form, or a message saying why it couldn't. As for puzzle cases, the
 * pinned versions must agree with the fixture and the tuning. `unplannable` is a
 * result (`{ error: 'unplannable' }`), so expected failures are pinned too; any other
 * planning error (a mistyped request, say) is a broken case, reported as one.
 */
export function planCase(
  fileVersion: number,
  input: GoldenPlanInput,
  tunings: GoldenTunings,
): { ok: true; value: GoldenPlanExpected } | { ok: false; error: string } {
  const tuning = caseTuning(fileVersion, input, tunings);
  if (typeof tuning === 'string') return { ok: false, error: tuning };
  const result = planRound(input.request, tuning, deriveSeed(input.rootSeed, input.ordinal), input.versions);
  if (!result.ok) {
    // Only `unplannable` is an outcome worth pinning; any other code means the case itself is wrong.
    if (result.error.code === 'unplannable') return { ok: true, value: { error: result.error.code } };
    return { ok: false, error: `${result.error.code}: ${result.error.message}` };
  }
  const plan = result.value;
  const band = tuning.generation.bands.reduce((top, b) => (b.band > top ? b.band : top), 1);
  const leaf = realiseRoundNode(plan, { tier: 1, index: 0 }, band, tuning);
  if (!leaf.ok) return { ok: false, error: `leaf (1, 0) in band ${band}: ${leaf.error.code}: ${leaf.error.message}` };
  return {
    ok: true,
    value: {
      roundSeed: plan.roundSeed,
      tiers: plan.tiers,
      startBand: plan.startBand,
      nodes: plan.nodes.map((node) => ({
        nodeId: { tier: node.nodeId.tier, index: node.nodeId.index },
        ...(node.contract === undefined ? {} : { contract: node.contract }),
        ...(node.puzzle === undefined ? {} : { puzzle: serialisePlanPuzzle(node.puzzle) }),
      })),
      firstLeaf: { band, ...serialisePlanPuzzle(leaf.value) },
      versions: serialiseVersions(plan.versions),
    },
  };
}

/**
 * A case's tuning fixture, parsed, or a message saying why the case is broken: the
 * fixture is unknown or invalid, or the case's pinned versions disagree with the
 * fixture file (`fileVersion`) or the tuning.
 */
function caseTuning(
  fileVersion: number,
  input: { readonly tuning: string; readonly versions: PuzzleVersions },
  tunings: GoldenTunings,
): TuningConfig | string {
  if (!Object.hasOwn(tunings, input.tuning)) return `unknown tuning fixture "${input.tuning}"`;
  const parsed = parseTuning(tunings[input.tuning]);
  if (!parsed.ok) return `tuning fixture "${input.tuning}": ${parsed.error.message}`;
  const versions: unknown = input.versions;
  if (!isObject(versions)) return 'input.versions must be an object';
  if (versions.generatorVersion !== fileVersion) return `input generatorVersion ${canonical(versions.generatorVersion)} is not the fixture's v${fileVersion}`;
  if (versions.tuningVersion !== parsed.value.tuningVersion) {
    return `input tuningVersion ${canonical(versions.tuningVersion)} is not tuning fixture "${input.tuning}"'s ${parsed.value.tuningVersion}`;
  }
  return parsed.value;
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
  const tuning = caseTuning(fileVersion, input, tunings);
  if (typeof tuning === 'string') return { ok: false, error: tuning };
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
      ...serialiseClamp(p.clamp),
      nearMisses: p.nearMisses,
      versions: serialiseVersions(p.versions),
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
  if (
    !isObject(fixture) ||
    fixture.kind !== 'GoldenSeeds' ||
    fixture.schemaVersion !== 1 ||
    !Array.isArray(fixture.cases) ||
    !Array.isArray(fixture.plans)
  ) {
    return [`${file}: not a GoldenSeeds schemaVersion 1 fixture with cases and plans arrays`];
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
  const planNames = new Set<string>();
  fixture.plans.forEach((c: unknown, i) => {
    if (!isObject(c) || typeof c.name !== 'string' || !isObject(c.input) || !isObject(c.expected)) {
      problems.push(`${file} plan #${i}: needs name, input and expected`);
      return;
    }
    const label = `${file} plan "${c.name}"`;
    if (planNames.has(c.name)) problems.push(`${label}: duplicate plan name`);
    planNames.add(c.name);
    const input = c.input as GoldenPlanInput;
    if (c.name !== planCaseName(input)) problems.push(`${label}: name does not match its inputs (expected "${planCaseName(input)}")`);
    const actual = planCase(fileVersion, input, tunings);
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

/**
 * Builds generatorVersion's fixture by realising each puzzle input and planning each
 * plan input. Throws if one can't be realised or planned (an `unplannable` plan is
 * an expected outcome: recorded, not thrown).
 */
export function buildGoldenSeeds(
  generatorVersion: number,
  inputs: readonly GoldenCaseInput[],
  tunings: GoldenTunings,
  planInputs: readonly GoldenPlanInput[] = [],
): GoldenSeeds {
  const cases = inputs.map((input) => {
    const actual = realiseCase(generatorVersion, input, tunings);
    if (!actual.ok) throw new Error(`cannot realise ${caseName(input)} with generatorVersion ${generatorVersion}: ${actual.error}`);
    return { name: caseName(input), input, expected: actual.value };
  });
  const plans = planInputs.map((input) => {
    const actual = planCase(generatorVersion, input, tunings);
    if (!actual.ok) throw new Error(`cannot plan ${planCaseName(input)} with generatorVersion ${generatorVersion}: ${actual.error}`);
    return { name: planCaseName(input), input, expected: actual.value };
  });
  return { kind: 'GoldenSeeds', schemaVersion: 1, generatorVersion, cases, plans };
}

/**
 * The fixture's file text: stable (fixed key order, one case per line, trailing
 * newline), so the same fixture always hashes the same in shipped.lock.json.
 */
export function formatGoldenSeeds(fixture: GoldenSeeds): string {
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
          band: serialiseBand(c.input.spec.band),
          fallbackBands: c.input.spec.fallbackBands.map(serialiseBand),
          ...(c.input.spec.contract === undefined ? {} : { contract: c.input.spec.contract }),
          nearMissCount: c.input.spec.nearMissCount,
          nearMissDelta: c.input.spec.nearMissDelta,
          maxAttempts: c.input.spec.maxAttempts,
        },
        tuning: c.input.tuning,
        versions: serialiseVersions(c.input.versions),
      },
      expected: {
        cells: c.expected.cells,
        roles: { a: c.expected.roles.a, b: c.expected.roles.b, c: c.expected.roles.c },
        answerIndex: c.expected.answerIndex,
        servedBand: c.expected.servedBand,
        ...serialiseClamp(c.expected.clamp),
        nearMisses: c.expected.nearMisses,
        versions: serialiseVersions(c.expected.versions),
      },
    });
  const planLine = (c: GoldenPlanCase): string => {
    const r = c.input.request;
    return JSON.stringify({
      name: c.name,
      input: {
        rootSeed: c.input.rootSeed,
        ordinal: c.input.ordinal,
        request: {
          type: r.type,
          n: r.n,
          operator: r.operator,
          ...(r.band === undefined ? {} : { band: r.band }),
          ...(r.fixedTopCell === undefined ? {} : { fixedTopCell: { childIndex: r.fixedTopCell.childIndex, value: r.fixedTopCell.value } }),
        },
        tuning: c.input.tuning,
        versions: serialiseVersions(c.input.versions),
      },
      // Built in a fixed key order by planCase (and kept by JSON.parse), so stable as is.
      expected: c.expected,
    });
  };
  const { plans } = fixture;
  return [
    '{',
    `  "kind": "GoldenSeeds",`,
    `  "schemaVersion": 1,`,
    `  "generatorVersion": ${fixture.generatorVersion},`,
    '  "cases": [',
    fixture.cases.map((c) => `    ${line(c)}`).join(',\n'),
    '  ],',
    plans.length === 0 ? '  "plans": []' : '  "plans": [',
    ...(plans.length === 0 ? [] : [plans.map((c) => `    ${planLine(c)}`).join(',\n'), '  ]']),
    '}',
    '',
  ].join('\n');
}
