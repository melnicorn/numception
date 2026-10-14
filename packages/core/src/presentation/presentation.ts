/**
 * The kinds of beat on the presentation timeline (AD-20):
 *
 * - `idle`: nothing running; input is accepted.
 * - `solve`: the solve beat after a correct tap; its end applies the solve.
 * - `collapse`: a completed group collapsing into its parent's cell.
 * - `advance`: the move to the next unsolved puzzle (AD-25).
 * - `roundStart`: the crossfade into the next round.
 */
export type PresentationKind = 'idle' | 'solve' | 'collapse' | 'advance' | 'roundStart';

/**
 * A round's presentation timeline (AD-20): the beat running, when it started and
 * how long it lasts, in the profile's Tick-accumulated play time (`GameState.clockMs`,
 * AD-17). Only `Tick` advances it. `transitionId` names the transition drawn
 * (AD-15; a fixed `'default'` until themes pick them, `'none'` while idle).
 */
export type Presentation = {
  readonly kind: PresentationKind;
  readonly startedAtMs: number;
  readonly durationMs: number;
  readonly transitionId: string;
};
