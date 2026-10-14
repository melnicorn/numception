// AD-19 generator benchmark gate (epic-puzzle-generator Done-when 3), run by
// `pnpm bench:generator` on a single worker, not by `pnpm test`.
// - Plan: 100 Tower rounds at n = 9 per operator; every plan ≤ 50 ms (AD-19 sets no
//   percentile). The five slowest plans are re-timed (best of 3), so one GC pause or
//   scheduler hiccup on a shared runner doesn't fail CI; a genuinely slow plan stays slow.
// - Realisation: every leaf of those rounds, lazily, at every band; p95 ≤ 10 ms per node.
// - Sampling stops at a time budget, so even a uniformly slowed generator reaches the
//   gate and prints its verdict instead of hitting the test timeout.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { expect, it } from 'vitest';
import { deriveSeed, parseTuning, planRound, realiseRoundNode, versionsFor } from '../../packages/core/src/index.ts';
import { TUNING_DIR } from '../tuning-content.mjs';
import { evaluateBenchmark } from './evaluate-benchmark.mjs';

const ROUNDS = 100;
const ROOT_SEED = 20261013;
const BUDGET_MS = 60_000;
const PLAN_LIMIT_MS = 50;

it('meets the AD-19 generator benchmark', () => {
  const parsed = parseTuning(JSON.parse(readFileSync(join(TUNING_DIR, '1.json'), 'utf8')));
  if (!parsed.ok) throw new Error(parsed.error.message);
  const tuning = parsed.value;
  const versions = versionsFor(tuning);
  const n = tuning.generation.n.max;
  const bands = tuning.generation.bands.map((b) => b.band);
  const plans: { operator: (typeof tuning.generation.operators)[number]; ordinal: number; ms: number }[] = [];
  const realiseMs: number[] = [];
  const started = performance.now();
  let budgetHit = false;

  outer: for (const operator of tuning.generation.operators) {
    // Warm up the JIT so timings measure generation.
    for (let o = 0; o < 10; o += 1) planRound({ type: 'tower', n, operator }, tuning, deriveSeed(1, o), versions);
    for (let ordinal = 0; ordinal < ROUNDS; ordinal += 1) {
      if (performance.now() - started > BUDGET_MS) {
        budgetHit = true;
        break outer;
      }
      const t0 = performance.now();
      const plan = planRound({ type: 'tower', n, operator }, tuning, deriveSeed(ROOT_SEED, ordinal), versions);
      plans.push({ operator, ordinal, ms: performance.now() - t0 });
      expect(plan.ok, plan.ok ? '' : plan.error.message).toBe(true);
      if (!plan.ok) continue;
      for (const leaf of plan.value.nodes.filter((node) => node.nodeId.tier === 1)) {
        for (const band of bands) {
          const t1 = performance.now();
          const puzzle = realiseRoundNode(plan.value, leaf.nodeId, band, tuning);
          realiseMs.push(performance.now() - t1);
          expect(puzzle.ok, puzzle.ok ? '' : puzzle.error.message).toBe(true);
        }
      }
    }
  }

  // Re-time the five slowest plans and keep their best of 3 runs.
  const slowest = [...plans].sort((a, b) => b.ms - a.ms).slice(0, 5);
  for (const p of slowest) {
    let best = p.ms;
    for (let r = 0; r < 3; r += 1) {
      const t = performance.now();
      planRound({ type: 'tower', n, operator: p.operator }, tuning, deriveSeed(ROOT_SEED, p.ordinal), versions);
      best = Math.min(best, performance.now() - t);
    }
    p.ms = best;
  }
  const planMs = plans.map((p) => p.ms);
  const planMax = Math.max(...planMs);

  const result = evaluateBenchmark([{ name: 'leaf realisation per node', samples: realiseMs, p95LimitMs: 10 }]);
  const planOk = planMax <= PLAN_LIMIT_MS;
  const lines = [
    `${planOk ? '✔' : '✘'} tower n=${n} round plan: n=${planMs.length} max ${planMax.toFixed(2)} ms after re-timing the 5 slowest (limit ${PLAN_LIMIT_MS} ms per plan)`,
    ...result.lines,
    ...(budgetHit ? [`✘ sampling stopped at the ${BUDGET_MS / 1000} s budget: the generator is far too slow`] : []),
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
  expect(planOk && result.ok && !budgetHit, lines.join('\n')).toBe(true);
});
