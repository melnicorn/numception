import type { MotionLevel } from '../settings/motion-level';
import type { ThemeSelection } from '../settings/theme-selection';
import type { Round } from './round';

/** The kind of a profile (AD-11). Kid is the default and only kind so far; Grown-up arrives with profiles. */
export type ProfileKind = 'kid';

/**
 * Per-profile settings (AD-21), changed by `SetSetting`. Later epics extend the list.
 *
 * - `motion`: the EXPERIENCE Motion level (`MotionLevel`); play runs at the lower
 *   of it and the OS (`effectiveMotion`).
 * - `themeSelection` and `playlist`: how the next round's theme is chosen
 *   (`selectPresentation`): at random, or in `playlist` order (distinct theme ids).
 * - `effects`, `music`, `haptics`: the FeedbackDirector's independent switches (AD-16).
 */
export type ProfileSettings = {
  readonly mode: 'zen';
  readonly motion: MotionLevel;
  readonly themeSelection: ThemeSelection;
  readonly playlist: readonly string[];
  readonly effects: boolean;
  readonly music: boolean;
  readonly haptics: boolean;
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
 * - `softMissLineSeen`: set by the profile's first soft miss, which shows the
 *   guide line "Tap the answer" once (FR-4); later soft misses only pulse.
 */
export type GameState = {
  readonly profileId: string;
  readonly profileKind: ProfileKind;
  readonly rootSeed: number;
  readonly settings: ProfileSettings;
  readonly roundOrdinal: number;
  readonly clockMs: number;
  readonly firstCollapseSeen: boolean;
  readonly softMissLineSeen: boolean;
  readonly rounds: {
    readonly activeRoundId: string | null;
    readonly byId: Readonly<Record<string, Round>>;
  };
};
