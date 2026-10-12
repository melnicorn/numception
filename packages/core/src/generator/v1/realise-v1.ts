import { rational } from '../../numbers/rational';
import { nextInt } from '../../random/next-int';
import { nodeStream } from '../../random/node-stream';
import type { RandomStream } from '../../random/random-stream';
import type { GeneratorImpl } from '../generator-impl';

/** A seeded Fisher–Yates shuffle of `0..length−1`, returned with the next stream. */
function permutation(stream: RandomStream, length: number): [order: number[], next: RandomStream] {
  const order = Array.from({ length }, (_, i) => i);
  let s = stream;
  for (let i = length - 1; i > 0; i -= 1) {
    const [j, next] = nextInt(s, 0, i);
    s = next;
    const tmp = order[i] as number;
    order[i] = order[j] as number;
    order[j] = tmp;
  }
  return [order, s];
}

/**
 * generatorVersion 1 (AD-6): an n = 3 `add` puzzle with three distinct positive
 * integers a + b = c, all within `spec.maxValue`.
 *
 * Draws, in order, from `nodeStream(seed, nodeId)`:
 * 1. `c` uniformly in `3..maxValue`;
 * 2. `a` uniformly in `1..⌊(c − 1) / 2⌋`, so `b = c − a` is strictly greater than `a`
 *    (and `a < b < c`, none zero);
 * 3. a Fisher–Yates permutation placing `[a, b, c]` into the three cells.
 *
 * Pure and deterministic (AD-3). Inputs are validated by `realise`. Its output is
 * pinned by golden-seeds/generator-v1.json: once v1 ships, it never changes.
 */
export const realiseV1: GeneratorImpl = (seed, nodeId, spec, versions) => {
  const s0 = nodeStream(seed, nodeId);
  const [c, s1] = nextInt(s0, 3, spec.maxValue);
  // maxValue <= 2^31 − 1, so the shift is an exact floor((c − 1) / 2).
  const [a, s2] = nextInt(s1, 1, (c - 1) >> 1);
  const b = c - a;
  const [order] = permutation(s2, 3);

  const values = [a, b, c];
  const cells = order.map((source) => rational(values[source] as number));
  const answerIndex = order.indexOf(2);

  return {
    seed,
    nodeId: { tier: nodeId.tier, index: nodeId.index },
    spec: { n: spec.n, operator: spec.operator, maxValue: spec.maxValue },
    cells,
    answerIndex,
    versions: {
      generatorVersion: versions.generatorVersion,
      difficultyModelVersion: versions.difficultyModelVersion,
      tuningVersion: versions.tuningVersion,
    },
  };
};
