import type { GameState } from './game-state';

/** Device-scoped state (AD-21). */
export type DeviceState = { readonly activeProfileId: string | null };

/**
 * The one state root (AD-2, AD-21). Profile-scoped commands route to
 * `profiles[activeProfileId]`; `device.activeProfileId` is the persisted copy and
 * always equals `activeProfileId`.
 */
export type AppState = {
  readonly device: DeviceState;
  readonly profiles: Readonly<Record<string, GameState>>;
  readonly activeProfileId: string | null;
};
