import { describe, expect, it } from 'vitest';
import { randomStream } from '../../random/random-stream';
import type { PuzzleBand } from '../puzzle-spec';
import { countCarries } from './count-carries';
import { pickTriple, startOffset, type Triple, tripleCarries, tripleSource } from './pick-triple';

const band: PuzzleBand = { band: 1, minValue: 1, maxValue: 20, maxCarries: 0 };

function allPicks(b: PuzzleBand, operator: 'add' | 'sub', contract?: number): Triple[] {
  const source = tripleSource(b, operator, contract);
  if (source.kind !== 'list') throw new Error(`expected a list source, got ${source.kind}`);
  return [...source.triples];
}

describe('tripleSource', () => {
  it('enumerates every unconstrained add triple in a narrow band, within its carries', () => {
    const triples = allPicks(band, 'add');
    // 1..20 with no carries: brute force agrees.
    let expected = 0;
    for (let c = 3; c <= 20; c += 1) for (let a = 1; a < c - a; a += 1) if (countCarries(a, c - a) === 0) expected += 1;
    expect(triples).toHaveLength(expected);
    for (const t of triples) {
      expect(t.a + t.b).toBe(t.c);
      expect(t.a).toBeLessThan(t.b);
      expect(countCarries(t.a, t.b)).toBe(0);
    }
  });

  it('lists the splits of an add contract, or none when no split fits the carries', () => {
    expect(allPicks(band, 'add', 12).map((t) => [t.a, t.b])).toEqual([
      [1, 11],
      [2, 10],
    ]);
    // Every split of 10 carries in the units column.
    expect(tripleSource(band, 'add', 10).kind).toBe('none');
  });

  it('lists the splits of a sub contract with b != c and a in the band', () => {
    const triples = allPicks({ ...band, maxCarries: 1 }, 'sub', 5);
    expect(triples.map((t) => t.b)).toEqual([1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    for (const t of triples) expect(t.a).toBe(t.b + 5);
  });

  it('is none for contracts below the operator minimum or outside the band', () => {
    expect(tripleSource(band, 'add', 2).kind).toBe('none');
    expect(tripleSource(band, 'add', 21).kind).toBe('none');
    expect(tripleSource(band, 'sub', 0).kind).toBe('none');
    expect(tripleSource(band, 'sub', 20).kind).toBe('none');
    expect(tripleSource({ band: 2, minValue: 5, maxValue: 99, maxCarries: 1 }, 'sub', 4).kind).toBe('none');
    expect(tripleSource({ band: 2, minValue: 10, maxValue: 20, maxCarries: 1 }, 'add').kind).toBe('none');
  });

  it('samples in wide bands and big contracts', () => {
    const wide: PuzzleBand = { band: 4, minValue: 10, maxValue: 999, maxCarries: 2 };
    expect(tripleSource(wide, 'add').kind).toBe('sample');
    expect(tripleSource(wide, 'add', 990).kind).toBe('list');
    expect(tripleSource({ ...wide, maxValue: 9999 }, 'add', 9000).kind).toBe('sample');
  });
});

describe('pickTriple', () => {
  it('walks a list source from its offset, designating sub answers per attempt', () => {
    const source = tripleSource(band, 'sub');
    if (source.kind !== 'list') throw new Error('expected list');
    let s = randomStream(1);
    const [offset, s0] = startOffset(source, s);
    s = s0;
    const seen = new Set<string>();
    for (let attempt = 0; attempt < source.triples.length; attempt += 1) {
      const [t, next] = pickTriple(source, band, 'sub', attempt, offset, s);
      s = next;
      if (!t) throw new Error('no triple');
      expect(t.a).toBe(t.b + t.c);
      expect(t.b).not.toBe(t.c);
      seen.add([t.a, Math.min(t.b, t.c), Math.max(t.b, t.c)].join());
    }
    expect(seen.size).toBe(source.triples.length);
  });

  it('samples triples within the band and its carries', () => {
    const wide: PuzzleBand = { band: 4, minValue: 10, maxValue: 999, maxCarries: 1 };
    let s = randomStream(7);
    for (const operator of ['add', 'sub'] as const) {
      const source = tripleSource(wide, operator);
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const [t, next] = pickTriple(source, wide, operator, attempt, 0, s);
        s = next;
        if (!t) continue;
        for (const v of [t.a, t.b, t.c]) {
          expect(v).toBeGreaterThanOrEqual(10);
          expect(v).toBeLessThanOrEqual(999);
        }
        expect(tripleCarries(operator, t)).toBeLessThanOrEqual(1);
        expect(operator === 'add' ? t.a + t.b : t.b + t.c).toBe(operator === 'add' ? t.c : t.a);
      }
    }
  });
});
