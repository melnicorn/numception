import type { AppState } from './app-state';
import type { GameState } from './game-state';

/** `state` with `game` stored as, and made, the active profile. */
export function withGame(state: AppState, game: GameState): AppState {
  return {
    ...state,
    device: { ...state.device, activeProfileId: game.profileId },
    profiles: { ...state.profiles, [game.profileId]: game },
    activeProfileId: game.profileId,
  };
}
