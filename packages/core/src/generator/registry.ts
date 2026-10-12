import type { GeneratorImpl } from './generator-impl';
import { realiseV1 } from './v1/realise-v1';

/**
 * Every generatorVersion this build can realise, keyed by version (AD-6). Each
 * shipped version stays registered so its puzzles reproduce forever; a new version
 * is added beside the old ones, never in place of them. Every entry needs a golden
 * fixture (packages/core/test/fixtures/golden-seeds/generator-v<N>.json).
 */
export const GENERATORS: { readonly [version: number]: GeneratorImpl } = Object.freeze({
  1: realiseV1,
});
