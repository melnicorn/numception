import type { Operator } from '../generator/operator';

/**
 * The smallest answer contract a node on `tier` can possibly be planned with, from
 * the puzzle definitions alone (epic Notes: cells are distinct positive integers):
 *
 * - tier 1 (a leaf): `add` needs a < b < c, so c >= 1 + 2 = 3; `sub` needs c >= 1.
 * - tier k >= 2: the triple's cells are themselves contracts of tier k − 1, so each
 *   is at least `f = contractFloor(op, k − 1)`. `add` then needs c = a + b with
 *   a ≠ b, so c >= f + (f + 1) = 2f + 1; `sub`'s answer c is itself a cell, so c >= f.
 *
 * A necessary condition only: the planner uses it to reject a node or cell that
 * cannot succeed before spending realisations on it (e.g. a Tower `add` top cell
 * of 5 would otherwise cost a full attempt loop at tier 2, since every split of 5
 * uses a 1 or a 2).
 */
export function contractFloor(operator: Operator, tier: number): number {
  let floor = operator === 'add' ? 3 : 1;
  for (let k = 2; k <= tier; k += 1) floor = operator === 'add' ? 2 * floor + 1 : floor;
  return floor;
}
