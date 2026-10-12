// Pure, deterministic domain: no I/O, clock, randomness, platform or DOM (AD-1, AD-3).
export { tracerValue } from './tracer-value';

export type { DomainError, DomainErrorCode } from './result/domain-error';
export { err, ok, type Result } from './result/result';

export { type RandomStream, randomStream } from './random/random-stream';
export { nextInt } from './random/next-int';
export { nodeSeed, nodeStream } from './random/node-stream';

export { type Rational, rational, serialiseRational } from './numbers/rational';
export { displayValue } from './numbers/display-value';

export { MAX_TUNING_VALUE } from './tuning/max-tuning-value';
export { type TuningConfig, TuningConfigSchema } from './tuning/tuning-config';
export { parseTuning } from './tuning/parse-tuning';

export type { NodeId } from './generator/node-id';
export type { Operator } from './generator/operator';
export type { Puzzle } from './generator/puzzle';
export type { PuzzleSpec } from './generator/puzzle-spec';
export { DIFFICULTY_MODEL_VERSION } from './generator/difficulty-model-version';
export { GENERATOR_VERSION } from './generator/generator-version';
export type { PuzzleVersions } from './generator/puzzle-versions';
export { versionsFor } from './generator/versions-for';
export { realise } from './generator/realise';
