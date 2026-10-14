import type { AppState } from './app-state';

/** The state before the first `StartSession`: no profiles. */
export function initialAppState(): AppState {
  return { device: { activeProfileId: null }, profiles: {}, activeProfileId: null, pauseReasons: [] };
}
