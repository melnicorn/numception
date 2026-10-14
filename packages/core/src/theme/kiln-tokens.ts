import type { ThemeTokens } from './theme-tokens';

/**
 * Kiln, the default Zen and first-run theme (DESIGN.md), built in: the fallback
 * when no bundled theme loads, and the theme of rounds saved before themes
 * existed. Equal to `content/themes/kiln.json` (tools/theme-content.test.ts).
 */
export const KILN_TOKENS: ThemeTokens = Object.freeze({
  kind: 'Theme',
  schemaVersion: 1,
  themeId: 'kiln',
  name: 'Kiln',
  mode: 'zen',
  surface: '#ECE3D7',
  surfaceDeep: '#DCCDBB',
  accent: '#A14E36',
  cellFill: '#F6F0E8',
  cellActive: '#F6F0E8',
  cellLocked: '#D6C6B2',
  line: '#AC644E',
  lineWidth: 1.5,
  lineJoin: 'round',
  number: '#994A33',
  numberSunk: '#CBA491',
  operator: '#A14E36',
  operatorWashAlpha: 0.09,
  control: '#89422E',
  focus: '#89422E',
  solvedFill: '#A14E36',
  solvedNumber: '#F6F0E8',
  press: '#AC644E',
  softMiss: '#AC644E',
  fontFamily: "Futura, 'Century Gothic', sans-serif",
  fontWeight: '500',
  fontWeightSolved: '500',
  numberSizePx: 44,
  operatorSizePx: 32,
  numberSolvedSizePx: 58,
  operatorTier2SizePx: 38,
  operatorDimAlpha: 0.32,
  guideSizePx: 24,
  inset: 10,
});
