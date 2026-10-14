import { BUILTIN_THEMES, KILN_TOKENS } from '@numception/core';
import { describe, expect, it } from 'vitest';
import { loadThemeCatalog } from './theme-catalog';

const kiln = { ...KILN_TOKENS };
const moon = { ...KILN_TOKENS, themeId: 'moonwater', name: 'Moonwater', surface: '#16242C' };

describe('loadThemeCatalog', () => {
  it('loads every valid bundled theme, in file-name order', () => {
    const loaded = loadThemeCatalog({ 'content/themes/moonwater.json': moon, 'content/themes/kiln.json': kiln });
    expect(loaded.themes.map((t) => t.themeId)).toEqual(['kiln', 'moonwater']);
    expect(loaded.rejected).toEqual([]);
  });

  it('leaves out a theme that fails validation, and the others still load', () => {
    const loaded = loadThemeCatalog({ 'themes/kiln.json': kiln, 'themes/moonwater.json': { ...moon, surface: 'dark' }, 'themes/broken.json': null });
    expect(loaded.themes.map((t) => t.themeId)).toEqual(['kiln']);
    expect(loaded.rejected.map((r) => r.source)).toEqual(['themes/broken.json', 'themes/moonwater.json']);
    expect(loaded.rejected[1]?.message).toMatch(/surface: /);
  });

  it('leaves out a theme named after another id, or a repeated id', () => {
    const loaded = loadThemeCatalog({ 'themes/kiln.json': kiln, 'themes/other.json': moon, 'themes/z/kiln.json': kiln });
    expect(loaded.themes.map((t) => t.themeId)).toEqual(['kiln']);
    expect(loaded.rejected.map((r) => r.message)).toEqual(['themeId moonwater does not match the file name', 'duplicate themeId kiln']);
  });

  it('falls back to the built-in Kiln when nothing loads', () => {
    expect(loadThemeCatalog({}).themes).toBe(BUILTIN_THEMES);
    expect(loadThemeCatalog({ 'themes/kiln.json': { kind: 'Theme' } }).themes).toBe(BUILTIN_THEMES);
  });
});
