import { describe, expect, it } from 'vitest';
import { randomStream } from '../../random/random-stream';
import type { PuzzleBand } from '../puzzle-spec';
import { countValidTriples } from './count-triples';
import { fillDistractors } from './fill-distractors';
import { countNearMisses } from './near-miss';

describe('fillDistractors', () => {
  it.each([
    ['narrow', { band: 2, minValue: 1, maxValue: 50, maxCarries: 1 }, [4, 9, 13]],
    ['wide', { band: 4, minValue: 10, maxValue: 999, maxCarries: 2 }, [120, 345, 465]],
    ['wider than the lookup tables', { band: 5, minValue: 10, maxValue: 99999, maxCarries: 4 }, [1200, 34500, 35700]],
  ] as [string, PuzzleBand, number[]][])('keeps one triple and exactly the near-misses asked (%s band)', (_name, band, triple) => {
    let s = randomStream(11);
    let filled = 0;
    for (let i = 0; i < 100; i += 1) {
      const nearMisses = i % 4;
      const [values, next] = fillDistractors(s, triple, { band, count: 6, nearMisses, nearMissDelta: 2 });
      s = next;
      if (!values) continue;
      filled += 1;
      expect(values.slice(0, 3)).toEqual(triple);
      expect(values).toHaveLength(9);
      expect(new Set(values).size).toBe(9);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(band.minValue);
        expect(v).toBeLessThanOrEqual(band.maxValue);
      }
      expect(countValidTriples(values)).toBe(1);
      expect(countNearMisses(values, [3, 4, 5, 6, 7, 8], 2)).toBe(nearMisses);
    }
    expect(filled).toBeGreaterThan(10);
  });

  it('gives up within its budget when the band has no room', () => {
    const [values] = fillDistractors(randomStream(1), [1, 2, 3], { band: { band: 1, minValue: 1, maxValue: 5, maxCarries: 0 }, count: 4, nearMisses: 0, nearMissDelta: 1 });
    expect(values).toBeUndefined();
  });
});
