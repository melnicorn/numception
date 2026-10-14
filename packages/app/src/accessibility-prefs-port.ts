/** What the OS reports about accessibility (AD-16): so far Reduce Motion; text size arrives with the DOM surfaces. */
export type AccessibilityPrefs = { readonly reduceMotion: boolean };

/**
 * The accessibility-preferences port (AD-16): the platform reports the OS
 * preferences at start and on every change; the shell dispatches them as
 * `SetOsPreferences`, so core caps Motion at Minimal while Reduce Motion is on.
 */
export type AccessibilityPrefsPort = {
  /** Starts reporting to `listener` (at once with the current preferences); returns the stop. */
  readonly start: (listener: (prefs: AccessibilityPrefs) => void) => () => void;
};

/** No OS preferences: reports Reduce Motion off once, never changes. */
export const noAccessibilityPrefs: AccessibilityPrefsPort = Object.freeze({
  start(listener: (prefs: AccessibilityPrefs) => void) {
    listener({ reduceMotion: false });
    return () => {};
  },
});
