/**
 * Why play is paused (AD-17), sorted. `AppState.pauseReasons` holds a set of
 * them as a sorted array, so sources never cancel each other:
 *
 * - `lifecycle`: the page or app is in the background (`LifecyclePort`).
 * - `blur`: the board is veiled after a lifecycle pause; the first tap clears it.
 * - `panel`, `gate`: the control surface and the parent gate (later epics).
 */
export const PAUSE_REASONS = ['blur', 'gate', 'lifecycle', 'panel'] as const;

export type PauseReason = (typeof PAUSE_REASONS)[number];

/** Whether `x` is a `PauseReason`. */
export function isPauseReason(x: unknown): x is PauseReason {
  return typeof x === 'string' && (PAUSE_REASONS as readonly string[]).includes(x);
}
