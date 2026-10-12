import { GENERATORS } from './registry';

/** The registered generatorVersions, ascending. */
export function registeredGeneratorVersions(): number[] {
  return Object.keys(GENERATORS)
    .map(Number)
    .sort((a, b) => a - b);
}
