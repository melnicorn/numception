import { describe, expect, it } from 'vitest';
import { KILN_TOKENS } from './kiln-tokens';
import { parseTheme } from './parse-theme';
import { BUILTIN_THEMES, themeById } from './theme-catalog';

const kiln = { ...KILN_TOKENS } as Record<string, unknown>;

function issuesOf(json: unknown): readonly string[] {
  const parsed = parseTheme(json);
  if (parsed.ok) throw new Error('expected the theme to be rejected');
  if (parsed.error.code !== 'invalid-theme') throw new Error(parsed.error.code);
  return parsed.error.issues;
}

describe('parseTheme', () => {
  it('accepts the built-in Kiln, frozen', () => {
    const parsed = parseTheme(kiln);
    expect(parsed).toEqual({ ok: true, value: KILN_TOKENS });
    expect(parsed.ok && Object.isFrozen(parsed.value)).toBe(true);
  });

  it('rejects a bad colour, naming its path', () => {
    expect(issuesOf({ ...kiln, surface: 'ECE3D7' })).toEqual(['surface: must be a #RRGGBB colour']);
    expect(issuesOf({ ...kiln, line: '#AC644' })).toEqual(['line: must be a #RRGGBB colour']);
  });

  it('rejects unknown and missing keys (strict)', () => {
    expect(issuesOf({ ...kiln, glow: 3 })[0]).toMatch(/^glow: /);
    const { solvedFill: _drop, ...missing } = kiln;
    expect(issuesOf(missing)[0]).toMatch(/^solvedFill: /);
  });

  it('rejects a wrong kind, schemaVersion, mode, join or weight', () => {
    expect(issuesOf({ ...kiln, kind: 'TuningConfig' })[0]).toMatch(/^kind: /);
    expect(issuesOf({ ...kiln, schemaVersion: 2 })[0]).toMatch(/^schemaVersion: /);
    expect(issuesOf({ ...kiln, mode: 'arcade' })[0]).toMatch(/^mode: /);
    expect(issuesOf({ ...kiln, lineJoin: 'bevel' })[0]).toMatch(/^lineJoin: /);
    expect(issuesOf({ ...kiln, fontWeight: '200' })[0]).toMatch(/^fontWeight: /);
    expect(issuesOf({ ...kiln, themeId: 'Kiln Theme' })[0]).toMatch(/^themeId: /);
  });

  it('rejects out-of-range numbers', () => {
    expect(issuesOf({ ...kiln, operatorDimAlpha: 0.6 })[0]).toMatch(/^operatorDimAlpha: /);
    expect(issuesOf({ ...kiln, numberSizePx: 12 })[0]).toMatch(/^numberSizePx: /);
    expect(issuesOf({ ...kiln, lineWidth: 0 })[0]).toMatch(/^lineWidth: /);
  });

  it('needs number-sunk in a Zen theme and none in a Normal one', () => {
    expect(issuesOf({ ...kiln, numberSunk: null })).toEqual(['numberSunk: must be a colour in a zen theme and null in a normal one']);
    expect(issuesOf({ ...kiln, mode: 'normal' })).toEqual(['numberSunk: must be a colour in a zen theme and null in a normal one']);
    expect(parseTheme({ ...kiln, mode: 'normal', numberSunk: null }).ok).toBe(true);
  });

  it('never throws on any input', () => {
    for (const x of [null, undefined, 1, 'kiln', [], {}]) expect(parseTheme(x).ok).toBe(false);
  });
});

describe('themeById', () => {
  it('finds a theme by id and falls back to the built-in Kiln', () => {
    const moon = { ...KILN_TOKENS, themeId: 'moonwater' };
    expect(themeById([KILN_TOKENS, moon], 'moonwater')).toBe(moon);
    expect(themeById([moon], 'gone')).toBe(KILN_TOKENS);
    expect(themeById(BUILTIN_THEMES, null)).toBe(KILN_TOKENS);
  });
});
