import type { DomainError } from '../result/domain-error';
import type { Result } from '../result/result';
import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';

/**
 * One generatorVersion's realisation (AD-6). `realise` validates the inputs before
 * dispatching, so an implementation may assume they are well formed; it returns
 * `unrealisable` when no band can host the spec. It must be pure and deterministic
 * (AD-3), never throw and, once its version ships, never change output.
 */
export type GeneratorImpl = (
  seed: number,
  nodeId: NodeId,
  spec: PuzzleSpec,
  versions: PuzzleVersions,
) => Result<Puzzle, DomainError>;
