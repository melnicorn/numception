import { KILN_TOKENS } from './kiln-tokens';
import type { ThemeTokens } from './theme-tokens';

/**
 * The themes a build can draw (AD-15): the bundled `content/themes/*.json` that
 * validated, passed in by the composition root like the tuning. Order does not
 * matter (selection sorts by `themeId`); ids are unique.
 */
export type ThemeCatalog = readonly ThemeTokens[];

/** The built-in catalogue: Kiln alone. Used when nothing bundled loads, and by default in tests. */
export const BUILTIN_THEMES: ThemeCatalog = Object.freeze([KILN_TOKENS]);

/** The theme `themeId` of `catalog`, or the built-in Kiln when it has none by that id (e.g. a theme a later build dropped). */
export function themeById(catalog: ThemeCatalog, themeId: string | null): ThemeTokens {
  return catalog.find((t) => t.themeId === themeId) ?? KILN_TOKENS;
}
