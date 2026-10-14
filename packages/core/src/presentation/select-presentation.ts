import { fmix32 } from '../random/mix32';
import { nextInt } from '../random/next-int';
import { randomStream } from '../random/random-stream';
import type { ThemeSelection } from '../settings/theme-selection';
import type { ThemeMode, ThemeTokens } from '../theme/theme-tokens';
import type { TuningConfig } from '../tuning/tuning-config';

/** The first-run theme (DESIGN: Kiln is the default Zen and first-run theme). */
export const FIRST_RUN_THEME_ID = 'kiln';

/** Salt that keeps the theme draw apart from the round's puzzle streams. */
const THEME_SALT = 0x27d4eb2f;

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
};

/** What core chose to present a round in (AD-15). Transitions join it with the transition library (entry 5). */
export type PresentationChoice = { readonly themeId: string };

/**
 * The theme of a new round (AD-15, FR-25).
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
  _tuning: TuningConfig,
  catalog: readonly Pick<ThemeTokens, 'themeId' | 'mode'>[],
): PresentationChoice {
  const pool = [...new Set(catalog.filter((t) => t.mode === request.mode).map((t) => t.themeId))].sort();
  if (pool.length === 0) return { themeId: FIRST_RUN_THEME_ID };
  if (request.selection === 'playlist') {
    const list = [...new Set((request.playlist ?? []).filter((id) => pool.includes(id)))];
    const at = request.previousThemeId === null ? -1 : list.indexOf(request.previousThemeId);
    const next = list[(at + 1) % Math.max(1, list.length)];
    if (next !== undefined) return { themeId: next };
  }
  if (request.previousThemeId === null && pool.includes(FIRST_RUN_THEME_ID)) return { themeId: FIRST_RUN_THEME_ID };
  const open = pool.length > 1 ? pool.filter((id) => id !== request.previousThemeId) : pool;
  const [pick] = nextInt(randomStream(fmix32((request.roundSeed ^ THEME_SALT) >>> 0)), 0, open.length - 1);
  return { themeId: open[pick] ?? FIRST_RUN_THEME_ID };
}
