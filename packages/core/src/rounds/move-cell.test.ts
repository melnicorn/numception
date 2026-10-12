import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../generator/puzzle';
import { realise } from '../generator/realise';
import { rational } from '../numbers/rational';
import { moveCell } from './move-cell';

const spec = {
  n: 5,
  operator: 'add',
  band: { band: 1, minValue: 1, maxValue: 99, maxCarries: 1 },
  fallbackBands: [],
  nearMissCount: 1,
  nearMissDelta: 2,
  maxAttempts: 100,
} as const;

function puzzle(): Puzzle {
  const result = realise(7, { tier: 2, index: 0 }, spec, { generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: 1 });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe('moveCell', () => {
  it('swaps two cells and moves the roles and answerIndex with them', () => {
    const p = puzzle();
    for (let from = 0; from < 5; from += 1) {
      for (let to = 0; to < 5; to += 1) {
        const moved = moveCell(p, from, to);
        expect(moved.cells[to]).toEqual(p.cells[from]);
        expect(moved.cells[from]).toEqual(p.cells[to]);
        expect([...moved.cells].map((c) => c.n).sort()).toEqual([...p.cells].map((c) => c.n).sort());
        for (const role of ['a', 'b', 'c'] as const) expect(moved.cells[moved.roles[role]]).toEqual(p.cells[p.roles[role]]);
        expect(moved.answerIndex).toBe(moved.roles.c);
      }
    }
  });

  it('leaves the puzzle unchanged when from = to, and never mutates its input', () => {
    const p = puzzle();
    const copy = JSON.parse(JSON.stringify(p)) as Puzzle;
    expect(moveCell(p, 2, 2)).toEqual(p);
    moveCell(p, 0, 4);
    expect(p).toEqual(copy);
    expect(moveCell({ ...p, cells: [rational(1), ...p.cells.slice(1)] }, 0, 1).cells[1]).toEqual(rational(1));
  });
});
