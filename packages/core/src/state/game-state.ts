import type { Round } from './round';

/** The kind of a profile (AD-11). Kid is the default and only kind so far; Grown-up arrives with profiles. */
export type ProfileKind = 'kid';

/** Per-profile settings (AD-21). Only the ones this build reads; later epics extend the list. */
export type ProfileSettings = {
  readonly mode: 'zen';
  readonly motion: 'calm';
};

/**
 * One profile's game (AD-21, AD-24). `roundOrdinal` is the ordinal of the active
 * (or next) personal round, so its seed is `deriveSeed(rootSeed, roundOrdinal)`.
 */
export type GameState = {
  readonly profileId: string;
  readonly profileKind: ProfileKind;
  readonly rootSeed: number;
  readonly settings: ProfileSettings;
  readonly roundOrdinal: number;
  readonly rounds: {
    readonly activeRoundId: string | null;
    readonly byId: Readonly<Record<string, Round>>;
  };
};
