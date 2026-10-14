// @ts-check
// The AD-19 generator benchmark gate as a pure function, so a slow generator is
// provably caught (tools/bench/evaluate-benchmark.test.ts) without relying on CI timing.

/**
 * Percentile of `samples` (ms) by nearest rank: the value at ceil(p × N) − 1 after sorting.
 * @param {readonly number[]} samples
 * @param {number} p in (0, 1]
 */
export function percentile(samples, p) {
  if (samples.length === 0) throw new Error('percentile of no samples');
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

/**
 * @typedef {{ name: string, samples: readonly number[], p95LimitMs: number }} Metric
 * @param {readonly Metric[]} metrics
 * @returns {{ ok: boolean, lines: string[] }}
 */
export function evaluateBenchmark(metrics) {
  const lines = [];
  let ok = true;
  for (const m of metrics) {
    const p50 = percentile(m.samples, 0.5);
    const p95 = percentile(m.samples, 0.95);
    const max = percentile(m.samples, 1);
    const pass = p95 <= m.p95LimitMs;
    if (!pass) ok = false;
    lines.push(
      `${pass ? '✔' : '✘'} ${m.name}: n=${m.samples.length} p50 ${p50.toFixed(2)} ms, p95 ${p95.toFixed(2)} ms (limit ${m.p95LimitMs} ms), max ${max.toFixed(2)} ms`,
    );
  }
  return { ok, lines };
}
