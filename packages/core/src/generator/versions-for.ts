import type { TuningConfig } from '../tuning/tuning-config';
import { DIFFICULTY_MODEL_VERSION } from './difficulty-model-version';
import { GENERATOR_VERSION } from './generator-version';
import type { PuzzleVersions } from './puzzle-versions';

/** The versions for a puzzle realised now, by this build, under `tuning`. */
export function versionsFor(tuning: TuningConfig): PuzzleVersions {
  return {
    generatorVersion: GENERATOR_VERSION,
    difficultyModelVersion: DIFFICULTY_MODEL_VERSION,
    tuningVersion: tuning.tuningVersion,
  };
}
