import type { PlayVM, ThemeTokens } from '@numception/app';
import { clamp01, easeOut, lerp, ramp } from './beat-motion';
import type { ViewTransform } from './view-transform';

// The round change (FR-25, AD-15; the `roundStart` beat): a whole-frame theme
// change that reads as a new round, in three steps:
//
// 1. The whole field (surface, the old round's fused top, its numeral) shifts
//    from the old theme's colours to the new one's, the old top held in place.
//    DESIGN "Token interpolation" (calm): colours tween token by token, the face
//    swaps at half-way.
// 2. With the colours fully moved, the old top shrinks away into the centre and fades.
// 3. The new round's first puzzle grows in.
//
// Accessibility Floor: each colour tweens monotonically in sRGB, so a light ↔ dark
// change passes through mid-luminance frames on its way, and no pixel ever shows a
// surface still on the far side of the change: the old top only uncovers the field
// once the field has reached the new theme. So the field and the old top's
// footprint change luminance one way only, and the arrival of the new board is
// the one change after it (no flash).

/** Where each part of the round change is at beat progress `p` (0..1). */
export type RoundChangeLook = {
  /** 0..1: how far every colour has moved from the old theme to the new one. */
  readonly color: number;
  /** The old round's top: opacity and scale about the frame centre (it leaves by shrinking). */
  readonly fromAlpha: number;
  readonly fromScale: number;
  /** The new round's first puzzle: opacity and scale about the frame centre (it arrives growing in). */
  readonly toAlpha: number;
  readonly toScale: number;
};

/** The old board shrinks to this share of its size as it leaves. */
export const LEAVE_SCALE = 0.7;
/** The new board grows in from this share of its size. */
export const ARRIVE_SCALE = 0.8;

/** Smoothstep: a gentle start and end for the colour change (colour, not a zoom, so it may ease in). */
function smooth(t: number): number {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

/**
 * The round change at progress `p`: colours move over the first half (the old top
 * in place); the old top leaves from 50 % to 70 %; the new board fades in from
 * 70 % to 90 % and grows in from 70 % to the end (ease-out: never an accelerating
 * zoom). Nothing moves or uncovers before the colours are done.
 */
export function roundChangeLook(p: number): RoundChangeLook {
  const leave = ramp(p, 0.5, 0.7);
  const arrive = ramp(p, 0.7, 1);
  return {
    color: smooth(ramp(p, 0, 0.5)),
    fromAlpha: 1 - leave,
    fromScale: lerp(1, LEAVE_SCALE, easeOut(leave)),
    toAlpha: easeOut(ramp(p, 0.7, 0.9)),
    toScale: lerp(ARRIVE_SCALE, 1, easeOut(arrive)),
  };
}

/**
 * The round change at Minimal motion (EXPERIENCE Accessibility Floor; core's
 * `crossfade` transition): a plain crossfade, nothing moving or scaling. The
 * colours shift linearly (each one monotonically, so a light ↔ dark change passes
 * mid-luminance frames) while the old top fades out and the new board fades in.
 */
export function crossfadeLook(p: number): RoundChangeLook {
  const u = clamp01(p);
  return { color: u, fromAlpha: 1 - u, fromScale: 1, toAlpha: u, toScale: 1 };
}

/** `#RRGGBB` colours mixed in sRGB, as `#RRGGBB`. */
export function mixHex(a: string, b: string, t: number): string {
  const x = Number.parseInt(a.slice(1), 16);
  const y = Number.parseInt(b.slice(1), 16);
  const u = clamp01(t);
  const channel = (shift: number) => Math.round(lerp((x >> shift) & 0xff, (y >> shift) & 0xff, u));
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, '0').toUpperCase()}`;
}

const COLOR_KEYS = [
  'surface',
  'surfaceDeep',
  'accent',
  'cellFill',
  'cellActive',
  'cellLocked',
  'line',
  'number',
  'operator',
  'control',
  'focus',
  'solvedFill',
  'solvedNumber',
  'press',
  'softMiss',
] as const;

const NUMBER_KEYS = [
  'lineWidth',
  'operatorWashAlpha',
  'numberSizePx',
  'operatorSizePx',
  'numberSolvedSizePx',
  'operatorTier2SizePx',
  'operatorDimAlpha',
  'guideSizePx',
  'inset',
] as const;

/**
 * The theme `t` of the way from `from` to `to` (DESIGN token interpolation): every
 * colour role mixed, every width, size and alpha interpolated, and the discrete
 * tokens (face, weights, join, id, mode) taken from `from` before half-way and
 * `to` from then on. At 0 it is `from`, at 1 `to`.
 */
export function blendTheme(from: ThemeTokens, to: ThemeTokens, t: number): ThemeTokens {
  const u = clamp01(t);
  if (u <= 0) return from;
  if (u >= 1) return to;
  const base = u < 0.5 ? from : to;
  const colors = Object.fromEntries(COLOR_KEYS.map((k) => [k, mixHex(from[k], to[k], u)]));
  const numbers = Object.fromEntries(NUMBER_KEYS.map((k) => [k, lerp(from[k], to[k], u)]));
  const sunk = from.numberSunk !== null && to.numberSunk !== null ? mixHex(from.numberSunk, to.numberSunk, u) : base.numberSunk;
  return { ...base, ...colors, ...numbers, numberSunk: sunk } as ThemeTokens;
}

/** `view` (and the parent drawn around it) drawn in `theme`. */
export function inTheme(view: PlayVM, theme: ThemeTokens): PlayVM {
  const context = view.context;
  return {
    ...view,
    theme,
    ...(context === undefined ? {} : { context: { ...context, parent: { ...context.parent, theme } } }),
  };
}

/** `t` scaled by `k` about the frame point (`cx`, `cy`). */
export function scaleAbout(t: ViewTransform, k: number, cx: number, cy: number): ViewTransform {
  return { ...t, scale: t.scale * k, left: cx + (t.left - cx) * k, top: cy + (t.top - cy) * k };
}

/** WCAG relative luminance of a `#RRGGBB` colour (0 black .. 1 white). */
export function relativeLuminance(color: string): number {
  const value = Number.parseInt(color.slice(1), 16);
  const linear = (shift: number) => {
    const c = ((value >> shift) & 0xff) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(16) + 0.7152 * linear(8) + 0.0722 * linear(0);
}
