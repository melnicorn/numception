import * as v from 'valibot';

const color = () => v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, 'must be a #RRGGBB colour'));
const px = (min: number, max: number) => v.pipe(v.number(), v.minValue(min), v.maxValue(max));
const alpha = () => v.pipe(v.number(), v.minValue(0), v.maxValue(1));
/** Numeral weights (DESIGN numeral-min-weight: never below 300). */
const FONT_WEIGHTS = ['300', '400', '500', '600', '700'] as const;

/**
 * ThemeTokens schema, schemaVersion 1 (AD-15, DESIGN Colors → Theme grammar): one
 * theme as a bundled `content/themes/<themeId>.json` file. Strict, so a typo can't
 * silently fall back to a default. Colours are `#RRGGBB`; sizes are CSS px at the
 * DESIGN n = 3 hero scale in a 375-wide frame.
 *
 * What render and ui draw with today:
 * - `surface`, `cellFill` (`cell-unsolved`), `line` (+ `lineWidth`, `lineJoin`),
 *   `number`, `operator` (+ `operatorWashAlpha`, the operator space's faint wash),
 *   `solvedFill` / `solvedNumber` (`cell-solved` / `-number`), `press` (the press
 *   acknowledgement), `softMiss` (FR-4; never red);
 * - `fontFamily`, `fontWeight` (numbers and operators), `fontWeightSolved` (a
 *   solved answer), and the sizes: `numberSizePx`, `operatorSizePx`,
 *   `numberSolvedSizePx`, `operatorTier2SizePx`, `guideSizePx`;
 * - `operatorDimAlpha`: the tier-2 operator's strength until its tier opens (25–45 %).
 *
 * DESIGN roles carried for what comes next: `surfaceDeep`, `accent`, `control`,
 * `focus`, `cellActive`, `cellLocked`, `numberSunk` (Zen only: null in a Normal
 * theme, required in a Zen one), and `inset` (DESIGN `spacing.inset-*`).
 * `mode` tags the pool the theme is drawn from (AD-15: Zen rounds get Zen themes).
 */
export const ThemeTokensSchema = v.pipe(
  v.strictObject({
    kind: v.literal('Theme'),
    schemaVersion: v.literal(1),
    themeId: v.pipe(v.string(), v.regex(/^[a-z][a-z0-9-]*$/, 'must be a lowercase kebab-case id')),
    name: v.pipe(v.string(), v.minLength(1, 'must not be empty')),
    mode: v.picklist(['zen', 'normal']),
    surface: color(),
    surfaceDeep: color(),
    accent: color(),
    cellFill: color(),
    cellActive: color(),
    cellLocked: color(),
    line: color(),
    lineWidth: px(0.5, 8),
    lineJoin: v.picklist(['round', 'miter']),
    number: color(),
    numberSunk: v.nullable(color()),
    operator: color(),
    operatorWashAlpha: alpha(),
    control: color(),
    focus: color(),
    solvedFill: color(),
    solvedNumber: color(),
    press: color(),
    softMiss: color(),
    fontFamily: v.pipe(v.string(), v.minLength(1, 'must not be empty')),
    fontWeight: v.picklist(FONT_WEIGHTS),
    fontWeightSolved: v.picklist(FONT_WEIGHTS),
    numberSizePx: px(20, 96),
    operatorSizePx: px(20, 96),
    numberSolvedSizePx: px(20, 128),
    operatorTier2SizePx: px(20, 96),
    operatorDimAlpha: v.pipe(v.number(), v.minValue(0.25), v.maxValue(0.45)),
    guideSizePx: px(12, 48),
    inset: px(0, 24),
  }),
  v.forward(
    v.partialCheck(
      [['mode'], ['numberSunk']],
      (t) => (t.mode === 'zen') === (t.numberSunk !== null),
      'must be a colour in a zen theme and null in a normal one',
    ),
    ['numberSunk'],
  ),
);

/** A validated theme (AD-15). Obtain one with `parseTheme`, or use the built-in `KILN_TOKENS`. */
export type ThemeTokens = v.InferOutput<typeof ThemeTokensSchema>;

/** A theme's mode: the pool it is drawn from. */
export type ThemeMode = ThemeTokens['mode'];
