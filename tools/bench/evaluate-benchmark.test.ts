import { describe, expect, it } from 'vitest';
import { evaluateBenchmark, percentile } from './evaluate-benchmark.mjs';

describe('percentile', () => {
  it('uses nearest rank', () => {
    const s = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(s, 0.95)).toBe(95);
    expect(percentile(s, 0.5)).toBe(50);
    expect(percentile(s, 1)).toBe(100);
    expect(percentile([7], 0.95)).toBe(7);
  });
  it('rejects no samples', () => expect(() => percentile([], 0.5)).toThrow());
});

describe('evaluateBenchmark', () => {
  const fast = Array.from({ length: 100 }, () => 1);
  it('passes when every p95 is within its limit, even with one slow outlier', () => {
    const r = evaluateBenchmark([{ name: 'plan', samples: [...fast.slice(1), 400], p95LimitMs: 50 }]);
    expect(r.ok).toBe(true);
    expect(r.lines[0]).toMatch(/^✔ plan: n=100 .*max 400\.00 ms$/);
  });
  it('fails when a slowed generator pushes p95 over the limit', () => {
    const slowed = fast.map((x, i) => (i % 10 === 0 ? x : 12)); // 90% of samples at 12 ms
    const r = evaluateBenchmark([
      { name: 'plan', samples: fast, p95LimitMs: 50 },
      { name: 'realise', samples: slowed, p95LimitMs: 10 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.lines[1]).toMatch(/^✘ realise: .*p95 12\.00 ms \(limit 10 ms\)/);
  });
});
