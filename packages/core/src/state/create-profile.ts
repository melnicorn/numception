import type { CommandContext } from './command-context';
import type { GameState, ProfileKind, ProfileSettings } from './game-state';

/** The Kid defaults (EXPERIENCE: Calm motion); effects and haptics on, music off. */
export const KID_DEFAULTS: ProfileSettings = Object.freeze({
  mode: 'zen',
  motion: 'calm',
  themeSelection: 'randomize',
  playlist: Object.freeze([]) as readonly string[],
  effects: true,
  music: false,
  haptics: true,
});

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
    clockMs: 0,
    firstCollapseSeen: false,
    softMissLineSeen: false,
    rounds: { activeRoundId: null, byId: {} },
  };
}
