// Loaded by tools/golden-update.mjs through Vite's module runner: everything that
// script needs from core, as fixture text ready to write.
import { registeredGeneratorVersions } from '../../src/generator/registered-generator-versions';
import { goldenInputs } from './golden-inputs';
import { buildGoldenSeeds, fixtureFileName, formatGoldenSeeds } from './golden-seeds';
import { goldenTunings } from './golden-tunings';

export { registeredGeneratorVersions };

/** The file name and text of `generatorVersion`'s fixture, freshly realised. */
export function buildFixture(generatorVersion: number): { file: string; text: string } {
  const fixture = buildGoldenSeeds(generatorVersion, goldenInputs(generatorVersion, goldenTunings), goldenTunings);
  return { file: fixtureFileName(generatorVersion), text: formatGoldenSeeds(fixture) };
}
