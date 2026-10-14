// The bundled themes (AD-15, FR-25): every content/themes/<themeId>.json is a
// valid Theme named after its themeId; Kiln matches the built-in tokens exactly,
// Moonwater takes DESIGN.md's Moonwater rows; both are Zen, and their key pairs
// meet DESIGN's contrast targets.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { KILN_TOKENS, parseTheme, type ThemeTokens } from '../packages/core/src/index.ts';

const THEME_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'themes');
const files = readdirSync(THEME_DIR).filter((f) => f.endsWith('.json')).sort();
const json = Object.fromEntries(files.map((f) => [f, JSON.parse(readFileSync(join(THEME_DIR, f), 'utf8')) as unknown]));

function theme(id: string): ThemeTokens {
  const parsed = parseTheme(json[`${id}.json`]);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return parsed.value;
}

function luminance(color: string): number {
  const v = Number.parseInt(color.slice(1), 16);
  const lin = (shift: number) => {
    const c = ((v >> shift) & 0xff) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(16) + 0.7152 * lin(8) + 0.0722 * lin(0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('content/themes', () => {
  it('bundles Kiln and Moonwater, each valid and named after its themeId', () => {
    expect(files).toEqual(['kiln.json', 'moonwater.json']);
    const themes = files.map((f) => {
      const parsed = parseTheme(json[f]);
      expect(parsed.ok ? 'ok' : parsed.error.message, f).toBe('ok');
      if (parsed.ok) expect(`${parsed.value.themeId}.json`).toBe(f);
      return parsed.ok ? parsed.value : undefined;
    });
    expect(themes.map((t) => [t?.themeId, t?.mode])).toEqual([
      ['kiln', 'zen'],
      ['moonwater', 'zen'],
    ]);
  });

  it('Kiln matches the built-in tokens exactly, so Kiln rounds look as they did', () => {
    expect(theme('kiln')).toEqual(KILN_TOKENS);
  });

  it('Moonwater takes DESIGN.md’s Moonwater rows', () => {
    expect(theme('moonwater')).toMatchObject({
      surface: '#16242C',
      surfaceDeep: '#223943',
      accent: '#BFE3DA',
      line: '#738D8C',
      lineWidth: 2.5,
      lineJoin: 'round',
      number: '#B1D4CC',
      operator: '#87A4A1',
      control: '#87A4A1',
      focus: '#B1D4CC',
      cellFill: '#223943',
      cellActive: '#738D8C',
      solvedFill: '#384A4F',
      solvedNumber: '#BFE3DA',
      cellLocked: '#2B3C42',
      numberSunk: '#566D6E',
      softMiss: '#738D8C',
      fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
      fontWeight: '300',
      fontWeightSolved: '400',
      numberSizePx: 44,
      operatorSizePx: 34,
      operatorTier2SizePx: 38,
      numberSolvedSizePx: 56,
      inset: 8,
    });
  });

  it.each(['kiln', 'moonwater'])('%s meets the DESIGN contrast targets on its tiles and surface', (id) => {
    const t = theme(id);
    expect(contrast(t.number, t.cellFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.operator, t.cellFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.solvedNumber, t.solvedFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.line, t.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.line, t.cellFill)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.control, t.surface)).toBeGreaterThanOrEqual(3);
  });
});
