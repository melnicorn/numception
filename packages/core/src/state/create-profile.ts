import type { CommandContext } from './command-context';
import type { GameState, ProfileKind, ProfileSettings } from './game-state';

const KID_DEFAULTS: ProfileSettings = { mode: 'zen', motion: 'calm' };

/**
 * A new profile of `kind` (AD-21): its id is `ctx.entropy.ids[0]` and its
 * `rootSeed` is `ctx.entropy.seed32[0]` (AD-22). The kind's defaults are applied
 * here, the one place profiles are made, so later kinds and settings extend it.
 * Callers pass a checked context.
 */
export function createProfile(kind: ProfileKind, ctx: CommandContext): GameState {
  return {
    profileId: ctx.entropy.ids[0],
    profileKind: kind,
    rootSeed: ctx.entropy.seed32[0] >>> 0,
    settings: { ...KID_DEFAULTS },
    roundOrdinal: 0,
    rounds: { activeRoundId: null, byId: {} },
  };
}
