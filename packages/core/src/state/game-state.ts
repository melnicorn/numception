import type { Round } from './round';

/** The kind of a profile (AD-11). Kid is the default and only kind so far; Grown-up arrives with profiles. */
export type ProfileKind = 'kid';

/**
 * Per-profile settings (AD-21). Only the ones this build reads; later epics extend
 * the list. `motion` is the EXPERIENCE Motion level: `full`, or `calm` (the Kid
 * default), which slows every presentation beat by the tuning's `calmMotionScale`.
 * Minimal arrives with the control surface.
 */
export type ProfileSettings = {
  readonly mode: 'zen';
  readonly motion: 'full' | 'calm';
};

/**
 * One profile's game (AD-21, AD-24).
 *
 * - `roundOrdinal`: the ordinal of the active (or next) personal round, so its seed
 *   is `deriveSeed(rootSeed, roundOrdinal)`.
 * - `clockMs`: the profile's play time, accumulated only from `Tick` (AD-17, AD-20).
 *   Presentation beats and `responseMs` are measured on it, never on wall time.
 * - `firstCollapseSeen`: set once the profile's first collapse has started, so
 *   later collapses run at `collapseMs` (epic Notes).
 */
export type GameState = {
  readonly profileId: string;
  readonly profileKind: ProfileKind;
  readonly rootSeed: number;
  readonly settings: ProfileSettings;
  readonly roundOrdinal: number;
  readonly clockMs: number;
  readonly firstCollapseSeen: boolean;
  readonly rounds: {
    readonly activeRoundId: string | null;
    readonly byId: Readonly<Record<string, Round>>;
  };
};
