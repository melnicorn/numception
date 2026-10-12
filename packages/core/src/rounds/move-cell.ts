import type { Puzzle, PuzzleRoles } from '../generator/puzzle';

/** Where index `i` lands when cells `from` and `to` swap. */
function swapped(i: number, from: number, to: number): number {
  if (i === from) return to;
  if (i === to) return from;
  return i;
}

/**
 * `puzzle` with cells `from` and `to` swapped, and its roles and answerIndex moved
 * with them (OQ-4's deterministic move of a fixed top cell). A permutation of the
 * cells, so the puzzle keeps exactly one valid triple. Callers pass indices in
 * 0..n − 1.
 */
export function moveCell(puzzle: Puzzle, from: number, to: number): Puzzle {
  const cells = puzzle.cells.map((_, i) => puzzle.cells[swapped(i, from, to)]!);
  const roles: PuzzleRoles = {
    a: swapped(puzzle.roles.a, from, to),
    b: swapped(puzzle.roles.b, from, to),
    c: swapped(puzzle.roles.c, from, to),
  };
  return { ...puzzle, cells, roles, answerIndex: roles.c };
}
