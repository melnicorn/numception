// The inputs `pnpm golden:update` realises into a version's fixture. Editing them
// only matters for versions not yet shipped: a shipped fixture never changes.
import { DIFFICULTY_MODEL_VERSION } from '../../src/generator/difficulty-model-version';
import type { NodeId } from '../../src/generator/node-id';
import type { Operator } from '../../src/generator/operator';
import { type SpecRequest, specFor } from '../../src/spec/spec-for';
import { parseTuning } from '../../src/tuning/parse-tuning';
import type { GoldenCaseInput, GoldenTunings } from './golden-seeds';

const SEEDS = [0, 1, 2, 7, 42, 1000, 20261011, 0x7fffffff, 0x80000000, 0xffffffff];
const NODES: NodeId[] = [
  { tier: 1, index: 0 },
  { tier: 1, index: 1 },
  { tier: 1, index: 8 },
  { tier: 2, index: 0 },
  { tier: 3, index: 2 },
  { tier: 9, index: 0xffffffff },
];
const OPERATORS: Operator[] = ['add', 'sub'];

/** Every operator × n × band combination listed. */
function grid(ns: number[], bands: number[], operators: Operator[] = OPERATORS): SpecRequest[] {
  return operators.flatMap((operator) => ns.flatMap((n) => bands.map((band) => ({ n, operator, band }))));
}

/**
 * Which requests run under each tuning fixture, and how many (seed, NodeId) pairs
 * each gets. Covers n 3..9, both operators, every band, answer contracts (met in
 * the requested band) and clamps (a contract only a lower band can host).
 */
const PLAN: { tuning: string; requests: SpecRequest[]; pairs: number }[] = [
  { tuning: 'small', requests: grid([3, 4, 5, 6, 7, 8, 9], [1, 2, 3]), pairs: 2 },
  {
    tuning: 'small',
    requests: [
      { n: 3, operator: 'add', band: 2, contract: 12 },
      { n: 6, operator: 'sub', band: 1, contract: 7 },
      { n: 9, operator: 'add', band: 1, contract: 18 },
      { n: 5, operator: 'sub', band: 2, contract: 2 },
      // Clamps: band 3 starts at 5, so these contracts are served by band 2.
      { n: 3, operator: 'add', band: 3, contract: 3 },
      { n: 7, operator: 'sub', band: 3, contract: 4 },
    ],
    pairs: 2,
  },
  { tuning: 'wide', requests: grid([3, 6, 9], [1, 2]), pairs: 2 },
  {
    tuning: 'wide',
    requests: [
      { n: 4, operator: 'add', band: 2, contract: 5000 },
      { n: 8, operator: 'sub', band: 2, contract: 150 },
      // Clamp: band 2 starts at 100.
      { n: 5, operator: 'sub', band: 2, contract: 50 },
    ],
    pairs: 2,
  },
  { tuning: 'tiny', requests: [{ n: 3, operator: 'add', band: 1 }], pairs: 4 },
  { tuning: 'extreme', requests: grid([3, 9], [1]), pairs: 3 },
];

/**
 * The golden case inputs for `generatorVersion`: each request's spec from its
 * tuning fixture (`specFor`), versions pinned to `generatorVersion`, this build's
 * difficultyModelVersion and the tuning's tuningVersion. (seed, NodeId) pairs cycle
 * through SEEDS and NODES so cases spread across both. Every version so far takes
 * the same inputs; a later version that needs others branches here.
 */
export function goldenInputs(generatorVersion: number, tunings: GoldenTunings): GoldenCaseInput[] {
  let next = 0;
  return PLAN.flatMap(({ tuning, requests, pairs }) => {
    const parsed = parseTuning(tunings[tuning]);
    if (!parsed.ok) throw new Error(`tuning fixture "${tuning}": ${parsed.error.message}`);
    const versions = { generatorVersion, difficultyModelVersion: DIFFICULTY_MODEL_VERSION, tuningVersion: parsed.value.tuningVersion };
    return requests.flatMap((request) => {
      const spec = specFor(parsed.value, request);
      if (!spec.ok) throw new Error(`tuning fixture "${tuning}", request ${JSON.stringify(request)}: ${spec.error.message}`);
      return Array.from({ length: pairs }, () => {
        const i = next;
        next += 1;
        const seed = SEEDS[i % SEEDS.length] as number;
        const nodeId = NODES[(i * 7 + (i - (i % SEEDS.length)) / SEEDS.length) % NODES.length] as NodeId;
        return { seed, nodeId, request, spec: spec.value, tuning, versions };
      });
    });
  });
}
