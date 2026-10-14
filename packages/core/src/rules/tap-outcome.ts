/**
 * How a tap on a puzzle cell is judged (FR-4).
 *
 * - `correct`: the answer cell `c`.
 * - `softMiss`: the other valid reading of a − puzzle (`b`, where `a − c = b` also
 *   holds). Never a wrong tap: no power cut, no rating loss (the play loop applies
 *   the consequences).
 * - `wrong`: any other cell.
 */
export type TapOutcome = 'correct' | 'softMiss' | 'wrong';
