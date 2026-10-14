/**
 * The theme tokens the play view draws with (AD-15, minimal): the Kiln roles the
 * tracer uses, from DESIGN.md. Colours are `#RRGGBB`; `lineWidth` is in CSS px.
 */
export type KilnTokens = {
  readonly themeId: 'kiln';
  readonly surface: string;
  readonly cellFill: string;
  readonly line: string;
  readonly lineWidth: number;
  readonly number: string;
  readonly operator: string;
  /** The operator space's faint accent wash: `operator` at this alpha (display only). */
  readonly operatorWashAlpha: number;
  readonly solvedFill: string;
  readonly solvedNumber: string;
  /** The press acknowledgement's colour. */
  readonly press: string;
  /** DESIGN `soft-miss`: the soft-miss pulse and ghost arrow (FR-4; never red). */
  readonly softMiss: string;
  readonly fontFamily: string;
  readonly fontWeight: '500';
  /** The DESIGN hero sizes at n = 3 in a 375-wide frame, px. */
  readonly numberSizePx: number;
  readonly operatorSizePx: number;
  /** `typography.number-solved`: a solved answer, one step larger. */
  readonly numberSolvedSizePx: number;
  /** `typography.operator-tier2`: the operator of an upper-tier puzzle. */
  readonly operatorTier2SizePx: number;
  /** The tier-2 operator's strength until its tier opens (DESIGN operator-cell: 25–45%; mock ~32%). */
  readonly operatorDimAlpha: number;
  /** `typography.guide`: the onboarding guide line (DOM, AD-13), px. */
  readonly guideSizePx: number;
};

/** Kiln, the default Zen and first-run theme (DESIGN.md). */
export const KILN_TOKENS: KilnTokens = Object.freeze({
  themeId: 'kiln',
  surface: '#ECE3D7',
  cellFill: '#F6F0E8',
  line: '#AC644E',
  lineWidth: 1.5,
  number: '#994A33',
  operator: '#A14E36',
  operatorWashAlpha: 0.09,
  solvedFill: '#A14E36',
  solvedNumber: '#F6F0E8',
  press: '#AC644E',
  softMiss: '#AC644E',
  fontFamily: "Futura, 'Century Gothic', sans-serif",
  fontWeight: '500',
  numberSizePx: 44,
  operatorSizePx: 32,
  numberSolvedSizePx: 58,
  operatorTier2SizePx: 38,
  operatorDimAlpha: 0.32,
  guideSizePx: 24,
});
