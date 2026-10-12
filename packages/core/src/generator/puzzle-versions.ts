import type { DIFFICULTY_MODEL_VERSION } from './difficulty-model-version';
import type { GENERATOR_VERSION } from './generator-version';

/** The versions a realised puzzle records (AD-6). */
export type PuzzleVersions = {
  readonly generatorVersion: typeof GENERATOR_VERSION;
  readonly difficultyModelVersion: typeof DIFFICULTY_MODEL_VERSION;
  readonly tuningVersion: number;
};
