/**
 * The versions a realised puzzle records (AD-6). All positive integers.
 * `generatorVersion` picks the generator: `realise` accepts any registered version
 * (see `GENERATORS`), not only this build's `GENERATOR_VERSION`, so old puzzles
 * replay. `difficultyModelVersion` and `tuningVersion` are recorded, not dispatched on.
 */
export type PuzzleVersions = {
  readonly generatorVersion: number;
  readonly difficultyModelVersion: number;
  readonly tuningVersion: number;
};
