// tableChecks must answer `fits` exactly as directChecks does, for every value in
// and around the band, after any sequence of pushes and pops: fillDistractors picks
// the table for narrow bands, and generator output must not depend on which it used.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { type DistractorChecks, directChecks, tableChecks } from './distractor-checks';

type Op = { readonly push: boolean; readonly pick: number; readonly plain: boolean };

const scenario = fc.record({
  lo: fc.integer({ min: 1, max: 60 }),
  width: fc.oneof(fc.integer({ min: 3, max: 160 }), fc.integer({ min: 161, max: 1024 })),
  delta: fc.oneof(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 5, max: 300 }), fc.integer({ min: 301, max: 2000 })),
  triplePicks: fc.tuple(fc.nat(), fc.nat(), fc.nat()),
  ops: fc.array(fc.record({ push: fc.boolean(), pick: fc.nat(), plain: fc.boolean() }), { maxLength: 12 }),
});

function disagreement(direct: DistractorChecks, table: DistractorChecks, lo: number, hi: number): string | undefined {
  for (let d = lo - 5; d <= hi + 5; d += 1) {
    for (const wantNear of [false, true]) {
      if (direct.fits(d, wantNear) !== table.fits(d, wantNear)) return `fits(${d}, ${wantNear}) with cells ${direct.cells.join(',')}`;
    }
  }
  return undefined;
}

describe('tableChecks', () => {
  it('agrees with directChecks on every candidate after any pushes and pops', () => {
    fc.assert(
      fc.property(scenario, ({ lo, width, delta, triplePicks, ops }) => {
        const hi = lo + width - 1;
        const free = Array.from({ length: width }, (_, i) => lo + i);
        const triple = triplePicks.map((p) => free.splice(p % free.length, 1)[0] as number);
        const band = { band: 1, minValue: lo, maxValue: hi, maxCarries: 0 };
        const direct = directChecks(triple, band, delta);
        const table = tableChecks(triple, band, delta);
        const plainStack: boolean[] = [];
        expect(disagreement(direct, table, lo, hi)).toBeUndefined();
        for (const op of ops as Op[]) {
          if (op.push && free.length > 0) {
            const d = free.splice(op.pick % free.length, 1)[0] as number;
            direct.push(d, op.plain);
            table.push(d, op.plain);
            plainStack.push(op.plain);
          } else if (!op.push && plainStack.length > 0) {
            const plain = plainStack.pop() as boolean;
            free.push(direct.cells[direct.cells.length - 1] as number);
            direct.pop(plain);
            table.pop(plain);
          }
          expect(table.cells).toEqual(direct.cells);
          expect(disagreement(direct, table, lo, hi)).toBeUndefined();
        }
      }),
      { numRuns: 300 },
    );
  });
});
