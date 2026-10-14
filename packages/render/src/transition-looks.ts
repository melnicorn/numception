import type { ThemeTokens } from '@numception/app';
import { clamp01, easeOut, lerp, ramp } from './beat-motion';
import { relativeLuminance } from './round-change';

// The calm round-change transitions (DESIGN Transition looks; AD-15), as pure
// functions of the beat's progress `p` (0..1): render draws each frame from these,
// never from frame time. No filters: layer alphas, scales, one stencil mask
// (ripple) and a few hundred circles at most (snow).

/** How render draws a round change, by core's `transitionId` (an id it does not know draws as `interpolate`). */
export type TransitionStyle = 'interpolate' | 'crossfade' | 'fade' | 'ripple' | 'snow';

const STYLES: readonly TransitionStyle[] = ['interpolate', 'crossfade', 'fade', 'ripple', 'snow'];

export function transitionStyle(transitionId: string): TransitionStyle {
  return (STYLES as readonly string[]).includes(transitionId) ? (transitionId as TransitionStyle) : 'interpolate';
}

/** A surface darker than this relative luminance is a dark theme (the mockups' threshold). */
export const DARK_SURFACE_LUMINANCE = 0.18;

export function isDarkTheme(theme: Pick<ThemeTokens, 'surface'>): boolean {
  return relativeLuminance(theme.surface) < DARK_SURFACE_LUMINANCE;
}

/** A change between a light and a dark theme, which must pass through a mid-luminance frame (Accessibility Floor). */
export function crossesLightDark(from: Pick<ThemeTokens, 'surface'>, to: Pick<ThemeTokens, 'surface'>): boolean {
  return isDarkTheme(from) !== isDarkTheme(to);
}

/** Smoothstep. */
export function smooth(t: number): number {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
}

/**
 * Fade (DESIGN "Fade / blur", after-tap): the new round resolves in under the old
 * one, settling from slightly large (the blur, without a filter), and is opaque
 * before the old board dissolves, drifting outward. The surface tweens under both.
 */
export type FadeLook = {
  /** 0..1: how far the surface has moved to the new theme. */
  readonly color: number;
  readonly fromAlpha: number;
  readonly fromScale: number;
  readonly toAlpha: number;
  readonly toScale: number;
};

/** The new board starts this much larger and settles to rest; the old one drifts out to `FADE_DRIFT`. */
export const FADE_RESOLVE = 1.06;
export const FADE_DRIFT = 1.03;

export function fadeLook(p: number): FadeLook {
  return {
    color: smooth(ramp(p, 0, 0.9)),
    toAlpha: easeOut(ramp(p, 0.05, 0.5)),
    toScale: lerp(FADE_RESOLVE, 1, easeOut(ramp(p, 0.05, 0.9))),
    fromAlpha: 1 - smooth(ramp(p, 0.45, 0.9)),
    fromScale: lerp(1, FADE_DRIFT, ramp(p, 0, 0.9)),
  };
}

/**
 * Ripple (DESIGN, on-tap): a circle from the tap point reveals the new round with a
 * hard 2 px front and two fainter rings behind it.
 *
 * - `reach`: the circle's radius as a share of the distance to the farthest frame
 *   corner; eases out (fast, then settling, never accelerating) and is 1 at
 *   `RIPPLE_REACH`.
 * - `oldBlend` / `newBlend`: how far toward the new theme each side is drawn. On a
 *   light ↔ dark change (`bridge`) the old side drifts to half-way while the new
 *   side arrives from half-way, so every pixel's luminance moves one way and the
 *   frame passes mid-luminance; otherwise each side is its own theme.
 * - `rings`: the rings' strength, fading out once the front has passed.
 */
export type RippleLook = { readonly reach: number; readonly oldBlend: number; readonly newBlend: number; readonly rings: number };

export const RIPPLE_REACH = 0.78;
/** The front and its two trailing rings: offset behind the front (share of the reach radius), width (px) and alpha. */
export const RIPPLE_RINGS: readonly { readonly behind: number; readonly width: number; readonly alpha: number }[] = [
  { behind: 0, width: 2, alpha: 0.9 },
  { behind: 0.12, width: 1.2, alpha: 0.45 },
  { behind: 0.24, width: 1, alpha: 0.25 },
];

export function rippleLook(p: number, bridge: boolean): RippleLook {
  return {
    reach: 1 - (1 - ramp(p, 0, RIPPLE_REACH)) ** 1.7,
    oldBlend: bridge ? 0.5 * smooth(ramp(p, 0, 0.45)) : 0,
    newBlend: bridge ? 0.5 + 0.5 * smooth(ramp(p, 0.35, 1)) : 1,
    rings: 1 - smooth(ramp(p, 0.6, 1)),
  };
}

/** The distance from `point` to the farthest corner of a `width` × `height` frame. */
export function farthestCorner(point: readonly [number, number], width: number, height: number): number {
  const [x, y] = point;
  return Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y));
}
