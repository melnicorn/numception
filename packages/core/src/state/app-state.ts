import type { GameState } from './game-state';
import type { PauseReason } from './pause-reason';

/** Device-scoped state (AD-21). */
export type DeviceState = { readonly activeProfileId: string | null };

/**
 * What the OS reports (AD-16 `AccessibilityPrefsPort`), set by `SetOsPreferences`:
 * `reduceMotion` caps play at Minimal motion (`effectiveMotion`). Runtime state of
 * this session, read again at every boot, so never persisted.
 */
export type OsPreferences = { readonly reduceMotion: boolean };

/**
 * Dev overrides (the dev panel), set by their commands: `transitionId` forces the
 * transition of every round change (`SetTransitionOverride`). Runtime state of this
 * session, never persisted.
 */
export type RuntimeOverrides = { readonly transitionId: string | null };

/**
 * The one state root (AD-2, AD-21). Profile-scoped commands route to
 * `profiles[activeProfileId]`; `device.activeProfileId` is the persisted copy and
 * always equals `activeProfileId`.
 *
 * `pauseReasons` (AD-17) is a set kept as a sorted, duplicate-free array. While it
 * holds any reason, `Tick` is ignored and input is dropped, except that the first
 * input while only `blur` is left clears it and does nothing else. It is runtime
 * state of this session and is not persisted: a relaunch starts unpaused. So are `os` and `overrides`.
 */
export type AppState = {
  readonly device: DeviceState;
  readonly profiles: Readonly<Record<string, GameState>>;
  readonly activeProfileId: string | null;
  readonly pauseReasons: readonly PauseReason[];
  readonly os: OsPreferences;
  readonly overrides: RuntimeOverrides;
};
