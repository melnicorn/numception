import { rational } from '../numbers/rational';
import { nextInt } from '../random/next-int';
import { nodeStream } from '../random/node-stream';
import type { RandomStream } from '../random/random-stream';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import { MAX_TUNING_VALUE } from '../tuning/max-tuning-value';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleSpec } from './puzzle-spec';
import { DIFFICULTY_MODEL_VERSION } from './difficulty-model-version';
import { GENERATOR_VERSION } from './generator-version';
import type { PuzzleVersions } from './puzzle-versions';

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
  if (versions.generatorVersion !== GENERATOR_VERSION || versions.difficultyModelVersion !== DIFFICULTY_MODEL_VERSION) {
    return {
      code: 'unsupported-version',
      message:
        `this build realises generatorVersion ${GENERATOR_VERSION}, difficultyModelVersion ${DIFFICULTY_MODEL_VERSION}, ` +
        `got ${describeValue(versions.generatorVersion)}, ${describeValue(versions.difficultyModelVersion)}`,
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

/** A seeded Fisher–Yates shuffle of `0..length−1`, returned with the next stream. */
function permutation(stream: RandomStream, length: number): [order: number[], next: RandomStream] {
  const order = Array.from({ length }, (_, i) => i);
  let s = stream;
  for (let i = length - 1; i > 0; i -= 1) {
    const [j, next] = nextInt(s, 0, i);
    s = next;
    const tmp = order[i] as number;
    order[i] = order[j] as number;
    order[j] = tmp;
  }
  return [order, s];
}

/**
 * Realises one puzzle (AD-4), generatorVersion 1: an n = 3 `add` puzzle with three
 * distinct positive integers a + b = c, all within `spec.maxValue`.
 *
 * Draws, in order, from `nodeStream(seed, nodeId)`:
 * 1. `c` uniformly in `3..maxValue`;
 * 2. `a` uniformly in `1..⌊(c − 1) / 2⌋`, so `b = c − a` is strictly greater than `a`
 *    (and `a < b < c`, none zero);
 * 3. a Fisher–Yates permutation placing `[a, b, c]` into the three cells.
 *
 * Pure and deterministic (AD-3): same inputs, same puzzle. Never throws on bad
 * input; it returns a `DomainError` instead.
 */
export function realise(seed: number, nodeId: NodeId, spec: PuzzleSpec, versions: PuzzleVersions): Result<Puzzle, DomainError> {
  const invalid = validate(seed, nodeId, spec, versions);
  if (invalid) return err(invalid);

  const s0 = nodeStream(seed, nodeId);
  const [c, s1] = nextInt(s0, 3, spec.maxValue);
  // maxValue <= 2^31 − 1, so the shift is an exact floor((c − 1) / 2).
  const [a, s2] = nextInt(s1, 1, (c - 1) >> 1);
  const b = c - a;
  const [order] = permutation(s2, 3);

  const values = [a, b, c];
  const cells = order.map((source) => rational(values[source] as number));
  const answerIndex = order.indexOf(2);

  return ok({
    seed,
    nodeId: { tier: nodeId.tier, index: nodeId.index },
    spec: { n: spec.n, operator: spec.operator, maxValue: spec.maxValue },
    cells,
    answerIndex,
    versions: {
      generatorVersion: versions.generatorVersion,
      difficultyModelVersion: versions.difficultyModelVersion,
      tuningVersion: versions.tuningVersion,
    },
  });
}
