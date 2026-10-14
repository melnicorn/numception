// FR-4 property: classification re-derived from the cell values alone, not from roles.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { realise } from '../generator/realise';
import type { PuzzleSpec } from '../generator/puzzle-spec';
import { serialiseRational } from '../numbers/rational';
import { classifyTap } from './classify-tap';

const versions = { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 };
const band = { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 };

describe('classifyTap (property)', () => {
  it('matches a value-level reading for every n, operator and cell', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.integer({ min: 3, max: 9 }),
        fc.constantFrom('add' as const, 'sub' as const),
        (seed, n, operator) => {
          const spec: PuzzleSpec = { n, operator, band, fallbackBands: [], nearMissCount: 0, nearMissDelta: 2, maxAttempts: 100 };
          const r = realise(seed, { tier: 1, index: 0 }, spec, versions);
          // This band realises every n and operator (checked); a failure here is a bug, not a skip.
          expect(r.ok).toBe(true);
          if (!r.ok) return;
          const p = r.value;
          const values = p.cells.map((c) => Number(serialiseRational(c)));
          // The one valid triple, found by brute force: x + y = z.
          const triples: [number, number, number][] = [];
          for (let i = 0; i < n; i += 1)
            for (let j = i + 1; j < n; j += 1)
              for (let k = 0; k < n; k += 1)
                if (k !== i && k !== j && values[i]! + values[j]! === values[k]) triples.push([i, j, k]);
          expect(triples).toHaveLength(1);
          const [i, j, k] = triples[0]!;
          const answer = p.answerIndex;
          for (let cell = 0; cell < n; cell += 1) {
            const out = classifyTap(p, cell);
            expect(out.ok).toBe(true);
            if (!out.ok) continue;
            let expected: string;
            if (cell === answer) expected = 'correct';
            else if (operator === 'sub' && (cell === i || cell === j) && answer !== k && (answer === i || answer === j)) expected = 'softMiss';
            else expected = 'wrong';
            expect(out.value).toBe(expected);
          }
          // Sanity: + answers the sum; − answers one of the two smaller cells.
          if (operator === 'add') expect(answer).toBe(k);
          else expect([i, j]).toContain(answer);
        },
      ),
      { numRuns: 300 },
    );
  });
});
