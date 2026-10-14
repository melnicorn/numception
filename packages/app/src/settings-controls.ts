import { type AppState, type Command, type MotionLevel, motionOf, type ProfileSettings, type SettingChange } from '@numception/core';

/** The active profile's settings and the Motion level play runs at (the setting capped by the OS). */
export type SettingsView = { readonly settings: ProfileSettings; readonly effectiveMotion: MotionLevel };

/**
 * What a settings surface reads and changes (the dev panel now; epic-profiles-and-controls'
 * control surface later): every change is a `SetSetting` command (AD-2), so it
 * lands in the profile and its save like any other.
 */
export type SettingsControls = {
  /** The active profile's settings, or null before a profile exists. */
  readonly get: () => SettingsView | null;
  /** Dispatches `SetSetting` for `change`. */
  readonly set: (change: SettingChange) => void;
  /** The theme ids the catalogue holds, for a playlist. */
  readonly themeIds: readonly string[];
};

/** The settings of `state`'s active profile, or null. */
export function settingsView(state: AppState): SettingsView | null {
  const game = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId];
  return game === undefined ? null : { settings: game.settings, effectiveMotion: motionOf(state, game) };
}

/** Settings controls over a game: reads `getState`, changes through `dispatch` (the scheduler's, so play time stays exact). */
export function createSettingsControls(getState: () => AppState, dispatch: (command: Command) => unknown, themeIds: readonly string[]): SettingsControls {
  return {
    get: () => settingsView(getState()),
    set: (change) => {
      dispatch({ type: 'SetSetting', ...change } as Command);
    },
    themeIds: [...themeIds],
  };
}
