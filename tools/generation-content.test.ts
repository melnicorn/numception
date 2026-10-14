// Generation under the bundled tuning (AD-7, AD-19, NFR-1): 1,000 puzzles per n and
// operator, spread across every band of content/tuning/1.json, each with exactly
// one valid triple, and none slower than 10 ms to realise on a laptop. The CI
// benchmark gate (p95 per node) is tools/bench/generator.bench-test.ts; this is the
// generous ceiling.
//
// Timing: a single wall-clock sample can catch a GC pause or a busy test worker,
// so the slowest few inputs are re-timed and judged by their best of 5 runs (the
// work the input needs, not the machine's noise). The p95 is asserted as sampled.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTuning, type Puzzle, realise, specFor, versionsFor } from '../packages/core/src/index.ts';
import { TUNING_DIR } from './tuning-content.mjs';

const parsed = parseTuning(JSON.parse(readFileSync(join(TUNING_DIR, '1.json'), 'utf8')));
if (!parsed.ok) throw new Error(parsed.error.message);
const tuning = parsed.value;
const versions = versionsFor(tuning);
const PER_N_AND_OPERATOR = 1000;

function validTriples(values: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      for (let k = j + 1; k < values.length; k += 1) {
        const [x, y, z] = [values[i]!, values[j]!, values[k]!];
        if (x + y === z || x + z === y || y + z === x) count += 1;
      }
    }
  }
  return count;
}

describe('generation under content/tuning/1.json', () => {
  const { n, operators, bands } = tuning.generation;
  const combos = operators.flatMap((operator) => Array.from({ length: n.max - n.min + 1 }, (_, i) => ({ operator, n: n.min + i })));

  it.each(combos)('$operator, n $n: 1,000 puzzles across all bands, each with exactly one valid triple, each under 10 ms', ({ operator, n }) => {
    const specs = bands.map((b) => {
      const spec = specFor(tuning, { n, operator, band: b.band });
      if (!spec.ok) throw new Error(spec.error.message);
      return spec.value;
    });
    // Warm up so the timings measure generation, not the JIT.
    for (let seed = 0; seed < 20; seed += 1) realise(seed, { tier: 1, index: 0 }, specs[seed % specs.length]!, versions);

    const timings: { elapsed: number; run: () => unknown }[] = [];
    for (let i = 0; i < PER_N_AND_OPERATOR; i += 1) {
      const spec = specs[i % specs.length]!;
      const seed = (i * 2654435761) >>> 0;
      const nodeId = { tier: 1 + (i % 3), index: i };
      const run = () => realise(seed, nodeId, spec, versions);
      const started = performance.now();
      const result = run();
      timings.push({ elapsed: performance.now() - started, run });
      expect(result.ok, result.ok ? '' : result.error.message).toBe(true);
      const p = result.ok ? result.value : (undefined as unknown as Puzzle);
      const values = p.cells.map((c) => c.n);
      expect(values).toHaveLength(n);
      expect(new Set(values).size).toBe(n);
      expect(validTriples(values)).toBe(1);
      expect(p.servedBand).toBe(spec.band.band);
    }
    timings.sort((x, y) => y.elapsed - x.elapsed);
    expect(timings[Math.floor(PER_N_AND_OPERATOR * 0.05)]!.elapsed).toBeLessThan(10);
    for (const { run } of timings.slice(0, 5)) {
      let best = Number.POSITIVE_INFINITY;
      for (let k = 0; k < 5; k += 1) {
        const started = performance.now();
        run();
        best = Math.min(best, performance.now() - started);
      }
      expect(best).toBeLessThan(10);
    }
  });
});
