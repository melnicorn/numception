import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { MAX_TUNING_VALUE } from '../tuning/max-tuning-value';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';
import { registeredGeneratorVersions } from './registered-generator-versions';
import { GENERATORS } from './registry';

const UINT32_MAX = 0xffffffff;

function isIntIn(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

/**
 * A short description of an input value for an error message. Never throws: it
 * formats primitives only and names the type of anything else, so no getter,
 * `toString`, `toJSON`, bigint or cycle is ever touched.
 */
function describeValue(x: unknown): string {
  switch (typeof x) {
    case 'number':
    case 'boolean':
      return `${x}`;
    case 'bigint':
      return `${x}n`;
    case 'string':
      return JSON.stringify(x);
    case 'undefined':
      return 'undefined';
    default:
      return x === null ? 'null' : typeof x;
  }
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
  if (spec.n !== 3 || spec.operator !== 'add' || !isIntIn(spec.maxValue, 3, MAX_TUNING_VALUE)) {
    return {
      code: 'invalid-spec',
      message:
        `spec must be n 3, operator add, integer maxValue in 3..${MAX_TUNING_VALUE}, ` +
        `got n ${describeValue(spec.n)}, operator ${describeValue(spec.operator)}, maxValue ${describeValue(spec.maxValue)}`,
    };
  }
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
  return ok(generator(seed, nodeId, spec, versions));
}
