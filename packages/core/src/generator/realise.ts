import { UINT32_MAX } from '../random/uint32-max';
import { describeValue } from '../result/describe-value';
import type { DomainError } from '../result/domain-error';
import { err, type Result } from '../result/result';
import { MAX_TUNING_VALUE } from '../tuning/max-tuning-value';
import { MAX_ATTEMPTS, MAX_N, MIN_N } from '../tuning/generation-limits';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import { OPERATORS } from './operator';
import type { PuzzleBand, PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';
import { registeredGeneratorVersions } from './registered-generator-versions';
import { GENERATORS } from './registry';

function isIntIn(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

function isBand(x: unknown): x is PuzzleBand {
  return typeof x === 'object' && x !== null;
}

/** What is wrong with a band, as `<field> ...`, or undefined. */
function bandProblem(path: string, b: unknown): string | undefined {
  if (!isBand(b)) return `${path} must be an object, got ${describeValue(b)}`;
  if (!isIntIn(b.band, 1, Number.MAX_SAFE_INTEGER)) return `${path}.band must be a positive integer, got ${describeValue(b.band)}`;
  if (!isIntIn(b.minValue, 1, MAX_TUNING_VALUE)) {
    return `${path}.minValue must be an integer in 1..${MAX_TUNING_VALUE}, got ${describeValue(b.minValue)}`;
  }
  if (!isIntIn(b.maxValue, b.minValue + 2, MAX_TUNING_VALUE)) {
    return `${path}.maxValue must be an integer in minValue + 2..${MAX_TUNING_VALUE}, got ${describeValue(b.maxValue)}`;
  }
  if (!isIntIn(b.maxCarries, 0, Number.MAX_SAFE_INTEGER)) {
    return `${path}.maxCarries must be a non-negative integer, got ${describeValue(b.maxCarries)}`;
  }
  return undefined;
}

/** What is wrong with a spec, as `<field> ...`, or undefined. Reads primitives only. */
function specProblem(spec: PuzzleSpec): string | undefined {
  if (!isIntIn(spec.n, MIN_N, MAX_N)) return `n must be an integer in ${MIN_N}..${MAX_N}, got ${describeValue(spec.n)}`;
  if (typeof spec.operator !== 'string' || !(OPERATORS as readonly string[]).includes(spec.operator)) {
    return `operator must be one of ${OPERATORS.join(', ')}, got ${describeValue(spec.operator)}`;
  }
  const band = bandProblem('band', spec.band);
  if (band !== undefined) return band;
  const fallbacks: unknown = spec.fallbackBands;
  if (!Array.isArray(fallbacks)) return `fallbackBands must be an array, got ${describeValue(fallbacks)}`;
  let above = spec.band.band;
  for (let i = 0; i < fallbacks.length; i += 1) {
    const fallback: unknown = fallbacks[i];
    const problem = bandProblem(`fallbackBands.${i}`, fallback);
    if (problem !== undefined) return problem;
    const number = (fallback as PuzzleBand).band;
    if (number >= above) {
      return `fallbackBands.${i}.band must be below ${above} (lower bands, nearest first), got ${number}`;
    }
    above = number;
  }
  if (spec.contract !== undefined && !Number.isSafeInteger(spec.contract)) {
    return `contract must be absent or a safe integer, got ${describeValue(spec.contract)}`;
  }
  if (!isIntIn(spec.nearMissCount, 0, spec.n - 3)) {
    return `nearMissCount must be an integer in 0..n − 3 (${spec.n - 3}), got ${describeValue(spec.nearMissCount)}`;
  }
  if (!isIntIn(spec.nearMissDelta, 1, MAX_TUNING_VALUE)) {
    return `nearMissDelta must be an integer in 1..${MAX_TUNING_VALUE}, got ${describeValue(spec.nearMissDelta)}`;
  }
  if (!isIntIn(spec.maxAttempts, 1, MAX_ATTEMPTS)) {
    return `maxAttempts must be an integer in 1..${MAX_ATTEMPTS}, got ${describeValue(spec.maxAttempts)}`;
  }
  return undefined;
}

function isRegistered(version: unknown): version is number {
  return typeof version === 'number' && Object.hasOwn(GENERATORS, version);
}

/** Shared input validation for every generatorVersion. */
function validate(seed: number, nodeId: NodeId, spec: PuzzleSpec, versions: PuzzleVersions): DomainError | undefined {
  if (!isIntIn(seed, 0, UINT32_MAX)) {
    return { code: 'invalid-seed', message: `seed must be an integer in 0..${UINT32_MAX}, got ${describeValue(seed)}` };
  }
  if (typeof nodeId !== 'object' || nodeId === null) {
    return { code: 'invalid-node-id', message: `nodeId must be an object, got ${describeValue(nodeId)}` };
  }
  if (!isIntIn(nodeId.tier, 1, UINT32_MAX) || !isIntIn(nodeId.index, 0, UINT32_MAX)) {
    return {
      code: 'invalid-node-id',
      message: `nodeId needs integer tier >= 1 and index >= 0, got tier ${describeValue(nodeId.tier)}, index ${describeValue(nodeId.index)}`,
    };
  }
  if (typeof spec !== 'object' || spec === null) {
    return { code: 'invalid-spec', message: `spec must be an object, got ${describeValue(spec)}` };
  }
  const problem = specProblem(spec);
  if (problem !== undefined) return { code: 'invalid-spec', message: `spec.${problem}` };
  if (typeof versions !== 'object' || versions === null) {
    return { code: 'unsupported-version', message: `versions must be an object, got ${describeValue(versions)}` };
  }
  if (!isRegistered(versions.generatorVersion)) {
    return {
      code: 'unsupported-version',
      message: `this build realises generatorVersion ${registeredGeneratorVersions().join(' | ')}, got ${describeValue(versions.generatorVersion)}`,
    };
  }
  if (!isIntIn(versions.difficultyModelVersion, 1, Number.MAX_SAFE_INTEGER)) {
    return {
      code: 'unsupported-version',
      message: `difficultyModelVersion must be a positive integer, got ${describeValue(versions.difficultyModelVersion)}`,
    };
  }
  if (!isIntIn(versions.tuningVersion, 1, Number.MAX_SAFE_INTEGER)) {
    return {
      code: 'unsupported-version',
      message: `tuningVersion must be a positive integer, got ${describeValue(versions.tuningVersion)}`,
    };
  }
  return undefined;
}

/**
 * Realises one puzzle (AD-4) with the generator `versions.generatorVersion` names
 * (AD-6): validates the inputs, then dispatches to that version's implementation
 * in `GENERATORS`. An unregistered version is an `unsupported-version` error;
 * difficultyModelVersion and tuningVersion are only recorded (any positive integer).
 * A malformed spec is `invalid-spec`; a well-formed one no band can host (e.g. an
 * unreachable answer contract) is `unrealisable`.
 *
 * Pure and deterministic (AD-3): same inputs, same puzzle. Never throws on bad
 * input; it returns a `DomainError` instead.
 */
export function realise(seed: number, nodeId: NodeId, spec: PuzzleSpec, versions: PuzzleVersions): Result<Puzzle, DomainError> {
  const invalid = validate(seed, nodeId, spec, versions);
  if (invalid) return err(invalid);
  const generator = GENERATORS[versions.generatorVersion];
  if (!generator) {
    // Unreachable: validate checked the version is registered.
    return err({ code: 'unsupported-version', message: `no generator for version ${versions.generatorVersion}` });
  }
  return generator(seed, nodeId, spec, versions);
}
