import { fmix32 } from '../random/mix32';
import { nextInt } from '../random/next-int';
import { randomStream } from '../random/random-stream';
import type { MotionLevel } from '../settings/motion-level';
import type { ThemeSelection } from '../settings/theme-selection';
import { BUILTIN_TRANSITIONS, CROSSFADE_TRANSITION_ID, FALLBACK_TRANSITION_ID, type TransitionCatalog } from '../transition/transition-catalog';
import type { ThemeMode, ThemeTokens } from '../theme/theme-tokens';
import type { TuningConfig } from '../tuning/tuning-config';

/** The first-run theme (DESIGN: Kiln is the default Zen and first-run theme). */
export const FIRST_RUN_THEME_ID = 'kiln';

/** Salt that keeps the theme draw apart from the round's puzzle streams. */
const THEME_SALT = 0x27d4eb2f;
/** Salt that keeps the transition draw apart from the theme draw and the puzzle streams. */
const TRANSITION_SALT = 0x165667b1;

/** What the round about to start is chosen for. */
export type PresentationRequest = {
  /** The round's mode (Zen only so far): only themes of that mode are drawn. */
  readonly mode: ThemeMode;
  /** The theme of the round before, or null for a profile's first round. */
  readonly previousThemeId: string | null;
  /** The round's seed (`deriveSeed(rootSeed, roundOrdinal)`), so the draw is deterministic. */
  readonly roundSeed: number;
  /** The profile's `themeSelection` (Randomize when absent). */
  readonly selection?: ThemeSelection;
  /** The profile's `playlist`, read under Playlist: distinct theme ids, in order. */
  readonly playlist?: readonly string[];
  /** The profile's effective Motion level (Full when absent): Minimal always crossfades. */
  readonly motion?: MotionLevel;
  /** The transition that brought the round before in, or null (none, or a profile's first round). */
  readonly previousTransitionId?: string | null;
  /** A dev override (`SetTransitionOverride`): this transition whenever it is in the pool. */
  readonly transitionOverride?: string | null;
};

/** What core chose to present a round in (AD-15): its theme and the transition that brings it in. */
export type PresentationChoice = { readonly themeId: string; readonly transitionId: string };

/**
 * The theme of a new round and the transition into it (AD-15, FR-25, FR-26).
 *
 * The transition (`selectTransition`) is drawn from its own salted stream of the
 * round's seed, so the theme sequence is the same as before transitions existed.
 *
 * Playlist (`selection: 'playlist'`): the playlist's ids that are in the pool, in
 * order (each once). A profile's first round is the first of them; after that the
 * one after the previous round's theme, wrapping, or the first when the previous
 * theme is not on it. With distinct ids, consecutive rounds never repeat while it
 * holds two or more themes. With none of its ids in the pool, Randomize.
 *
 * Randomize:
 *
 * - The pool is the catalogue's themes of the round's `mode`, by `themeId`.
 * - A profile's first round (no previous theme) is Kiln when the pool has it
 *   (DESIGN: the first-run theme).
 * - Otherwise one theme is drawn uniformly from the pool less the previous
 *   round's, so no two consecutive rounds share a theme while more than one is
 *   available. The draw comes from the round's seed, so the same rootSeed and
 *   ordinals give the same theme sequence.
 * - With one theme it is always that one; with none, the built-in Kiln.
 *
 * `tuning` is the active config (Playlist and weights will read it); this build
 * reads nothing from it.
 */
export function selectPresentation(
  request: PresentationRequest,
  tuning: TuningConfig,
  catalog: readonly Pick<ThemeTokens, 'themeId' | 'mode'>[],
  transitions: TransitionCatalog = BUILTIN_TRANSITIONS,
): PresentationChoice {
  return { themeId: selectTheme(request, tuning, catalog), transitionId: selectTransition(request, transitions) };
}

/**
 * The transition into a new round (AD-15; EXPERIENCE Theme & Transition System,
 * Accessibility Floor):
 *
 * - At Minimal motion: always `crossfade`.
 * - Otherwise the pool is the catalogue's calm transitions, plus the intense ones
 *   only in Normal at Full motion, less `crossfade` (the Minimal fallback, not in
 *   the rotation). With none: `interpolate`.
 * - A dev `transitionOverride` in the pool is taken as is.
 * - Else one is drawn uniformly from the pool less the previous round's, so two
 *   consecutive round changes never share a transition while another is available,
 *   from the round's seed (deterministic).
 */
export function selectTransition(request: PresentationRequest, transitions: TransitionCatalog): string {
  const motion = request.motion ?? 'full';
  if (motion === 'minimal') return CROSSFADE_TRANSITION_ID;
  const intenseAllowed = request.mode === 'normal' && motion === 'full';
  const pool = [
    ...new Set(
      transitions
        .filter((t) => t.transitionId !== CROSSFADE_TRANSITION_ID && (t.tag === 'calm' || intenseAllowed))
        .map((t) => t.transitionId),
    ),
  ].sort();
  if (pool.length === 0) return FALLBACK_TRANSITION_ID;
  const override = request.transitionOverride ?? null;
  if (override !== null && pool.includes(override)) return override;
  const previous = request.previousTransitionId ?? null;
  const open = pool.length > 1 ? pool.filter((id) => id !== previous) : pool;
  const [pick] = nextInt(randomStream(fmix32((request.roundSeed ^ TRANSITION_SALT) >>> 0)), 0, open.length - 1);
  return open[pick] ?? FALLBACK_TRANSITION_ID;
}

/** The theme part of `selectPresentation`. */
function selectTheme(request: PresentationRequest, _tuning: TuningConfig, catalog: readonly Pick<ThemeTokens, 'themeId' | 'mode'>[]): string {
  const pool = [...new Set(catalog.filter((t) => t.mode === request.mode).map((t) => t.themeId))].sort();
  if (pool.length === 0) return FIRST_RUN_THEME_ID;
  if (request.selection === 'playlist') {
    const list = [...new Set((request.playlist ?? []).filter((id) => pool.includes(id)))];
    const at = request.previousThemeId === null ? -1 : list.indexOf(request.previousThemeId);
    const next = list[(at + 1) % Math.max(1, list.length)];
    if (next !== undefined) return next;
  }
  if (request.previousThemeId === null && pool.includes(FIRST_RUN_THEME_ID)) return FIRST_RUN_THEME_ID;
  const open = pool.length > 1 ? pool.filter((id) => id !== request.previousThemeId) : pool;
  const [pick] = nextInt(randomStream(fmix32((request.roundSeed ^ THEME_SALT) >>> 0)), 0, open.length - 1);
  return open[pick] ?? FIRST_RUN_THEME_ID;
}
