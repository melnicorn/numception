import { nextInt } from '../../random/next-int';
import type { RandomStream } from '../../random/random-stream';
import type { PuzzleRoles } from '../puzzle';

/** A seeded Fisher–Yates shuffle of `0..length−1`, returned with the next stream. */
export function permutation(stream: RandomStream, length: number): [order: number[], next: RandomStream] {
  const order = Array.from({ length }, (_, i) => i);
  let s = stream;
  for (let i = length - 1; i > 0; i -= 1) {
    const [j, next] = nextInt(s, 0, i);
    s = next;
    const tmp = order[i] as number;
    order[i] = order[j] as number;
    order[j] = tmp;
  }
  return [order, s];
}

/**
 * Places `values` (the triple's a, b, c first, then the distractors) into cells by
 * a seeded permutation of all of them, so the answer's position varies. Returns
 * the cell values and where a, b and c landed.
 */
export function placeCells(
  stream: RandomStream,
  values: readonly number[],
): [placed: { cells: number[]; roles: PuzzleRoles }, next: RandomStream] {
  const [order, next] = permutation(stream, values.length);
  const cells = order.map((source) => values[source] as number);
  const roles = { a: order.indexOf(0), b: order.indexOf(1), c: order.indexOf(2) };
  return [{ cells, roles }, next];
}
