import { BUILTIN_THEMES, parseTheme, type ThemeCatalog, type ThemeTokens } from '@numception/core';

/** A bundled theme file left out of the catalogue, and why (for a dev log). */
export type RejectedTheme = { readonly source: string; readonly message: string };

/** The catalogue the game draws from, plus the files that failed validation. */
export type LoadedThemeCatalog = { readonly themes: ThemeCatalog; readonly rejected: readonly RejectedTheme[] };

/**
 * Parses and validates every bundled theme (AD-15): `files` maps a source name
 * (e.g. the `content/themes/<id>.json` path) to its parsed JSON, which the client
 * bundles so it works offline. A file that fails `parseTheme`, whose `themeId`
 * doesn't match its file name, or that repeats an id already loaded is left out and
 * reported in `rejected`; the others still load. With none left, the catalogue is
 * core's built-in Kiln. Sources are taken in name order, so the result does not
 * depend on how the bundler orders them.
 */
export function loadThemeCatalog(files: Readonly<Record<string, unknown>>): LoadedThemeCatalog {
  const themes: ThemeTokens[] = [];
  const rejected: RejectedTheme[] = [];
  for (const source of Object.keys(files).sort()) {
    const parsed = parseTheme(files[source]);
    const stem = source.replace(/^.*\//, '').replace(/\.json$/, '');
    if (!parsed.ok) rejected.push({ source, message: parsed.error.message });
    else if (parsed.value.themeId !== stem) rejected.push({ source, message: `themeId ${parsed.value.themeId} does not match the file name` });
    else if (themes.some((t) => t.themeId === parsed.value.themeId)) rejected.push({ source, message: `duplicate themeId ${parsed.value.themeId}` });
    else themes.push(parsed.value);
  }
  return { themes: themes.length === 0 ? BUILTIN_THEMES : themes, rejected };
}
