import type { NodeId } from '../generator/node-id';

/**
 * The soft-miss cue (FR-4) running on a round: the tapped cell (`cellIndex`, the
 * − puzzle's `b`) pulses once and a ghost arrow points from it to the answer
 * (`answerIndex`). Times are the profile's Tick-accumulated play time (AD-17),
 * like a beat's, but it is not a beat: it locks nothing and changes no puzzle state.
 */
export type SoftMissCue = {
  /** The puzzle the cue belongs to; it is shown only while that puzzle is in view. */
  readonly nodeId: NodeId;
  readonly cellIndex: number;
  readonly answerIndex: number;
  readonly startedAtMs: number;
  readonly durationMs: number;
};
