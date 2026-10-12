import type { NodeId } from './node-id';
import type { Puzzle } from './puzzle';
import type { PuzzleSpec } from './puzzle-spec';
import type { PuzzleVersions } from './puzzle-versions';

/**
 * One generatorVersion's realisation (AD-6). `realise` validates the inputs before
 * dispatching, so an implementation may assume they are well formed. It must be
 * pure and deterministic (AD-3) and, once its version ships, never change output.
 */
export type GeneratorImpl = (seed: number, nodeId: NodeId, spec: PuzzleSpec, versions: PuzzleVersions) => Puzzle;
