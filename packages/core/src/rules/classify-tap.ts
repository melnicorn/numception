import type { Puzzle } from '../generator/puzzle';
import type { DomainError } from '../result/domain-error';
import { err, ok, type Result } from '../result/result';
import type { TapOutcome } from './tap-outcome';

/**
 * Judges a tap on cell `cellIndex` (placement order) of a realised puzzle (FR-4).
 * The answer cell is correct; in a − puzzle the soft-miss cell `b` (which also
 * satisfies `a − c = b`) is a soft miss; everything else is wrong. + puzzles have no
 * soft miss. A cell index outside `0..n − 1` is an `invalid-cell` error; never throws.
 */
export function classifyTap(puzzle: Puzzle, cellIndex: number): Result<TapOutcome, DomainError> {
  if (typeof cellIndex !== 'number' || !Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= puzzle.cells.length) {
    return err({
      code: 'invalid-cell',
      message: `cellIndex must be an integer in 0..${puzzle.cells.length - 1}, got ${typeof cellIndex === 'number' ? cellIndex : typeof cellIndex}`,
    });
  }
  if (cellIndex === puzzle.answerIndex) return ok('correct');
  if (puzzle.spec.operator === 'sub' && cellIndex === puzzle.roles.b) return ok('softMiss');
  return ok('wrong');
}
