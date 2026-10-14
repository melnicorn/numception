import type { ThemeTokens } from '@numception/app';
import { clamp01, easeOut, lerp } from './beat-motion';
import { mixOklch } from './oklch';
import { mixHex } from './round-change';
import { isDarkTheme, smooth } from './transition-looks';

// Snow / embers (DESIGN, after-tap; melts from the tap point): flakes in the new
// theme's colours fall and land as clumps until the old round is blanketed; under
// full cover the rounds swap; then the clumps melt outward from the tap point. A
// dark destination gets glowing embers falling into ash instead of snow. Every
// frame is a pure function of progress over a field laid out once per frame size
// and tap point (seeded, so the same beat draws the same flakes).

/** The most falling flakes a field holds (60 fps on a phone: particles stay modest). */
export const MAX_FLAKES = 150;
/** The most blanket clumps a field holds; the grid spacing grows until it fits. */
export const MAX_CLUMPS = 96;
/** Every clump has landed and grown by here, and none melts before `SNOW_MELT`. */
export const SNOW_COVERED = 0.58;
/** Under full cover the rounds swap at this progress. */
export const SNOW_SWAP = 0.59;
export const SNOW_MELT = 0.6;
/** A clump grows over this share of the beat once landed, and melts over `MELT_SPAN`. */
const GROW_SPAN = 0.1;
const MELT_SPAN = 0.15;

export type Clump = { readonly x: number; readonly y: number; readonly r: number; readonly land: number; readonly melt: number };
export type Flake = { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly t0: number; readonly t1: number; readonly r: number; readonly phase: number };
export type SnowField = { readonly width: number; readonly height: number; readonly clumps: readonly Clump[]; readonly flakes: readonly Flake[] };

/** A small seeded generator (mulberry32): render-side only, so the field is the same every frame. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The field for a `width` × `height` frame melting from `tap`: clumps on a jittered
 * hex grid whose radius exceeds the grid's covering radius (so all landed is full
 * cover), each landing between 4 % and 48 % and melting from 60 % in order of
 * distance from the tap (lightly jittered), done by the end; one flake falls onto
 * each clump and a few more drift past, `MAX_FLAKES` at most.
 */
export function snowField(width: number, height: number, tap: readonly [number, number]): SnowField {
  const rnd = seeded(Math.round(width) * 73856093 + Math.round(height) * 19349663 + 7);
  const range = (lo: number, hi: number) => lo + (hi - lo) * rnd();
  let g = Math.max(24, Math.max(width, height) / 18);
  const count = (s: number) => (Math.ceil(width / s) + 2) * (Math.ceil(height / (s * 0.87)) + 2);
  while (count(g) > MAX_CLUMPS) g *= 1.08;
  const maxD = Math.max(1, Math.hypot(Math.max(tap[0], width - tap[0]), Math.max(tap[1], height - tap[1])));
  const clumps: Clump[] = [];
  let row = 0;
  for (let y = -g * 0.5; y < height + g; y += g * 0.87, row += 1) {
    for (let x = -g * 0.5 + (row % 2 === 1 ? g / 2 : 0); x < width + g; x += g) {
      const cx = x + range(-0.06, 0.06) * g;
      const cy = y + range(-0.06, 0.06) * g;
      const d = Math.hypot(cx - tap[0], cy - tap[1]) / maxD;
      clumps.push({ x: cx, y: cy, r: range(0.72, 0.78) * g, land: range(0.04, 0.48), melt: SNOW_MELT + 0.25 * clamp01(0.75 * d + 0.25 * rnd()) });
    }
  }
  const flakes: Flake[] = clumps.map((c) => {
    const fall = range(0.15, 0.28);
    return { x0: c.x + range(-24, 24), y0: c.y - range(200, 380), x1: c.x, y1: c.y, t0: c.land - fall, t1: c.land, r: range(1.6, 3.8), phase: range(0, 6.283) };
  });
  while (flakes.length < Math.min(MAX_FLAKES, clumps.length + 40)) {
    const t0 = range(0, 0.5);
    const x0 = range(-10, width + 10);
    flakes.push({ x0, y0: -14, x1: x0 + range(-35, 35), y1: height + 20, t0, t1: t0 + range(0.3, 0.45), r: range(1.2, 3.4), phase: range(0, 6.283) });
  }
  return { width, height, clumps, flakes };
}

/** A clump's size at `p`, 0..1 of its radius: grows once landed, full while covered, melts from its `melt` time. */
export function clumpScale(c: Clump, p: number): number {
  if (p < c.land) return 0;
  return easeOut((p - c.land) / GROW_SPAN) * (1 - smooth((p - c.melt) / MELT_SPAN));
}

/** While true, the whole frame is drawn blanketed too (belt and braces around the swap). */
export function fullCover(p: number): boolean {
  return p >= 0.56 && p < 0.62;
}

/** Where flake `f` is at `p` (it sways as it falls), or null when it is not falling. */
export function flakeAt(f: Flake, p: number): readonly [number, number] | null {
  if (p < f.t0 || p > f.t1) return null;
  const u = (p - f.t0) / Math.max(1e-6, f.t1 - f.t0);
  return [lerp(f.x0, f.x1, u) + Math.sin(u * 5 + f.phase) * 6, lerp(f.y0, f.y1, u)];
}

/**
 * The snow's colours, from the new theme: snow (the new surface lifted toward
 * white) on a light destination, embers (the accent) into ash on a dark one. On a
 * light ↔ dark change (`bridge`) the blanket is half-way between the old surface
 * and that, so each pixel goes old → mid → new (one way) and the covered frame is
 * mid-luminance.
 */
export type SnowColors = { readonly embers: boolean; readonly blanket: string; readonly rim: string; readonly flake: string; readonly accent: string };

export function snowColors(from: ThemeTokens, to: ThemeTokens, bridge: boolean): SnowColors {
  const embers = isDarkTheme(to);
  const accent = to.accent;
  const own = embers ? mixOklch(to.surface, accent, 0.14) : mixHex(to.surface, '#FFFFFF', 0.5);
  const blanket = bridge ? mixOklch(from.surface, own, 0.5) : own;
  return {
    embers,
    blanket,
    rim: embers ? mixOklch(blanket, accent, 0.35) : mixOklch(blanket, accent, 0.25),
    flake: embers ? accent : mixHex(to.surface, '#FFFFFF', 0.7),
    accent,
  };
}
