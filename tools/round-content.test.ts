// Round planning under the bundled tuning (FR-2, AD-4, AD-7): Classic and Tower
// rounds for every n 3..9 and both operators, 50 round ordinals each, all plan and
// pass the round-consistency check at every tier; a Tower plan at n 9 stays under
// 50 ms on a laptop. The CI benchmark gate (round plan ≤ 50 ms) is
// tools/bench/generator.bench-test.ts; this is the laptop ceiling.
//
// Timing: as in generation-content.test.ts, the slowest few plans are re-timed and
// judged by their best of 5 runs, so a GC pause or a busy worker doesn't fail it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveSeed, parseTuning, planRound, versionsFor } from '../packages/core/src/index.ts';
import { roundPlanProblems } from '../packages/core/src/rounds/plan-problems.ts';
import { TUNING_DIR } from './tuning-content.mjs';

const parsed = parseTuning(JSON.parse(readFileSync(join(TUNING_DIR, '1.json'), 'utf8')));
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;
const versions = versionsFor(tuning);
const ORDINALS = 50;
const ROOT_SEED = 20261012;

describe('round planning under content/tuning/1.json', () => {
  const { n, operators } = tuning.generation;
  const combos = (['classic', 'tower'] as const).flatMap((type) =>
    operators.flatMap((operator) => Array.from({ length: n.max - n.min + 1 }, (_, i) => ({ type, operator, n: n.min + i }))),
  );

  it.each(combos)('$type $operator n $n: 50 ordinals all plan, consistent at every tier', ({ type, operator, n }) => {
    for (let ordinal = 0; ordinal < ORDINALS; ordinal += 1) {
      const result = planRound({ type, n, operator }, tuning, deriveSeed(ROOT_SEED, ordinal), versions);
      expect(result.ok, result.ok ? '' : `ordinal ${ordinal}: ${result.error.message}`).toBe(true);
      if (result.ok) expect(roundPlanProblems(result.value, tuning)).toEqual([]);
    }
  });

  it.each(operators)('tower %s n 9: every plan under 50 ms', (operator) => {
    const max = n.max;
    // Warm up so the timings measure planning, not the JIT.
    for (let ordinal = 0; ordinal < 5; ordinal += 1) planRound({ type: 'tower', n: max, operator }, tuning, deriveSeed(1, ordinal), versions);
    const timings: { elapsed: number; run: () => unknown }[] = [];
    for (let ordinal = 0; ordinal < ORDINALS; ordinal += 1) {
      const run = () => planRound({ type: 'tower', n: max, operator }, tuning, deriveSeed(ROOT_SEED, ordinal), versions);
      const started = performance.now();
      run();
      timings.push({ elapsed: performance.now() - started, run });
    }
    timings.sort((x, y) => y.elapsed - x.elapsed);
    for (const { run } of timings.slice(0, 5)) {
      let best = Number.POSITIVE_INFINITY;
      for (let k = 0; k < 5; k += 1) {
        const started = performance.now();
        run();
        best = Math.min(best, performance.now() - started);
      }
      expect(best).toBeLessThan(50);
    }
  });
});
