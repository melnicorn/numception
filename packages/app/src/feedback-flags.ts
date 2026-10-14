import type { AppState } from '@numception/core';

/**
 * The feedback switches the director is gated by: the active profile's `effects`,
 * `music` and `haptics` settings (AD-16, AD-21), changed by `SetSetting`. The three
 * are independent: `haptics` gates the haptic taps only, never a sound.
 */
export type FeedbackFlags = { readonly effects: boolean; readonly music: boolean; readonly haptics: boolean };

/** Effects and haptics on, music off (there is no music yet): the Kid defaults. */
export const DEFAULT_FEEDBACK_FLAGS: FeedbackFlags = Object.freeze({ effects: true, music: false, haptics: true });

/** The active profile's feedback switches in `state`, or the defaults before a profile exists. */
export function feedbackFlagsOf(state: AppState): FeedbackFlags {
  const settings = state.activeProfileId === null ? undefined : state.profiles[state.activeProfileId]?.settings;
  if (settings === undefined) return DEFAULT_FEEDBACK_FLAGS;
  return { effects: settings.effects, music: settings.music, haptics: settings.haptics };
}
