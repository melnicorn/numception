// The inputs `pnpm golden:update` realises into a version's fixture. Editing them
// only matters for versions not yet shipped: a shipped fixture never changes.
import { DIFFICULTY_MODEL_VERSION } from '../../src/generator/difficulty-model-version';
import type { NodeId } from '../../src/generator/node-id';
import { parseTuning } from '../../src/tuning/parse-tuning';
import { type GoldenCaseInput, type GoldenTunings, specForTuning } from './golden-seeds';

const SEEDS = [0, 1, 2, 7, 42, 1000, 20261011, 0x7fffffff, 0x80000000, 0xffffffff];
const NODES: NodeId[] = [
  { tier: 1, index: 0 },
  { tier: 1, index: 1 },
  { tier: 1, index: 8 },
  { tier: 2, index: 0 },
  { tier: 3, index: 2 },
  { tier: 9, index: 0xffffffff },
];

/** Which seeds and nodes run under each tuning fixture: every pair for `small`, a slice for the rest. */
const PLAN: { tuning: string; seeds: number[]; nodes: NodeId[] }[] = [
  { tuning: 'small', seeds: SEEDS, nodes: NODES },
  { tuning: 'wide', seeds: SEEDS.slice(0, 6), nodes: NODES.slice(0, 3) },
  { tuning: 'tiny', seeds: SEEDS.slice(0, 4), nodes: NODES.slice(3, 4) },
  { tuning: 'extreme', seeds: SEEDS.slice(6), nodes: NODES.slice(4) },
];

/**
 * The golden case inputs for `generatorVersion`: each spec from its tuning fixture
 * (`specForTuning`), versions pinned to `generatorVersion`, this build's
 * difficultyModelVersion and the tuning's tuningVersion. Every version so far takes
 * the same inputs; a later version that needs other specs branches here.
 */
export function goldenInputs(generatorVersion: number, tunings: GoldenTunings): GoldenCaseInput[] {
  return PLAN.flatMap(({ tuning, seeds, nodes }) => {
    const parsed = parseTuning(tunings[tuning]);
    if (!parsed.ok) throw new Error(`tuning fixture "${tuning}": ${parsed.error.message}`);
    const spec = specForTuning(parsed.value);
    const versions = { generatorVersion, difficultyModelVersion: DIFFICULTY_MODEL_VERSION, tuningVersion: parsed.value.tuningVersion };
    return seeds.flatMap((seed) => nodes.map((nodeId) => ({ seed, nodeId, spec, tuning, versions })));
  });
}
