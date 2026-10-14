import type { CameraRect, CameraVM } from '@numception/app';

// Pure interpolation for the presentation beats (AD-14): every value is a function
// of the beat's `progress` (Tick time, AD-17), never of frame time. Eases are
// linear or ease-out only, so a zoom never accelerates (FR-9).

/** `x` clamped to 0..1. */
export function clamp01(x: number): number {
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
}

/** `p` remapped so that `from` → 0 and `to` → 1, clamped. */
export function ramp(p: number, from: number, to: number): number {
  return to <= from ? (p >= to ? 1 : 0) : clamp01((p - from) / (to - from));
}

/** Cubic ease-out: fast start, settling at the end; never accelerates. */
export function easeOut(t: number): number {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** `#RRGGBB` colours mixed in sRGB, as a 0xRRGGBB number. */
export function mixColor(a: string, b: string, t: number): number {
  const x = Number.parseInt(a.slice(1), 16);
  const y = Number.parseInt(b.slice(1), 16);
  const channel = (shift: number) => Math.round(lerp((x >> shift) & 0xff, (y >> shift) & 0xff, clamp01(t)));
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/**
 * The camera rect at `t` (0..1, already eased) between `camera.from` and `.to`:
 * a zoom about the one point both rects share on screen (their homothety centre),
 * with the scale moving geometrically, so the zoom's speed is constant in `t`.
 * Rects of equal size pan in a straight line. Rects of different proportions
 * (not served yet) also interpolate width and height geometrically.
 */
export function cameraAt(camera: CameraVM, t: number): CameraRect {
  const { from: a, to: b } = camera;
  const u = clamp01(t);
  if (u === 0) return a;
  if (u === 1) return b;
  const k = b.width / a.width;
  const ca = [a.x + a.width / 2, a.y + a.height / 2] as const;
  const cb = [b.x + b.width / 2, b.y + b.height / 2] as const;
  const width = a.width * k ** u;
  const height = a.height * (b.height / a.height) ** u;
  let cx: number;
  let cy: number;
  if (Math.abs(1 - k) < 1e-9) {
    cx = lerp(ca[0], cb[0], u);
    cy = lerp(ca[1], cb[1], u);
  } else {
    // Fixed point p of the homothety a → b: cb − p = k (ca − p).
    const px = (cb[0] - k * ca[0]) / (1 - k);
    const py = (cb[1] - k * ca[1]) / (1 - k);
    const s = k ** u;
    cx = px + s * (ca[0] - px);
    cy = py + s * (ca[1] - py);
  }
  return { x: cx - width / 2, y: cy - height / 2, width, height };
}

/**
 * How one view is drawn in a frame. Idle is `IDLE_LOOK`; the beats move these.
 *
 * - `alpha`: the whole layer's opacity.
 * - `answer`: the cell that fires (`cell-solved` at once) and carries the answer
 *   numeral, or null. `grow` 0..1 moves that numeral to the shape's centre and
 *   from `number` to `number-solved` size.
 * - `operands`: 0..1, the other numerals and the operator shrinking into the
 *   centre and fading. `overlay`: 0..1, the whole shape filling with `cell-solved`
 *   over the seams (the puzzle fusing into one fired tile).
 * - `fired`: 0..1, how fired a solved cell of an upper-tier puzzle is (1 at a
 *   collapse's start, cooling to open tile; an overview's solved cells are always fired).
 * - `boost`: 0..1, solved cells' numerals at `number-solved` size easing back to `number`.
 * - `operator`: the operator's strength (an overview's is dimmed until its tier opens).
 * - `focus`: one cell drawn at full strength while the rest of the shape fades in at `others`.
 */
export type LayerLook = {
  readonly alpha: number;
  readonly answer: number | null;
  readonly grow: number;
  readonly operands: number;
  readonly overlay: number;
  readonly fired: number | null;
  readonly boost: number;
  readonly operator: number | null;
  readonly focus: { readonly cell: number; readonly others: number } | null;
};

/** A view at rest: `fired` and `operator` null take the view kind's defaults. */
export const IDLE_LOOK: LayerLook = {
  alpha: 1,
  answer: null,
  grow: 0,
  operands: 0,
  overlay: 0,
  fired: null,
  boost: 0,
  operator: null,
  focus: null,
};

/** A solved puzzle fused into its answer `answer` (the end of a solve beat). */
export function fusedLook(answer: number, alpha = 1): LayerLook {
  return { ...IDLE_LOOK, alpha, answer, grow: 1, operands: 1, overlay: 1 };
}

/**
 * The solve beat (DESIGN round-collapse frames 1–2): the answer fires at once,
 * then its numeral grows into the centre while the operands shrink in and fade,
 * and the seams fade last as the shape fills with one fired tile.
 */
export function solveLook(answer: number, p: number): LayerLook {
  return {
    ...IDLE_LOOK,
    answer,
    grow: easeOut(ramp(p, 0, 0.75)),
    operands: easeOut(ramp(p, 0, 0.6)),
    overlay: ramp(p, 0.25, 0.95),
  };
}

/** The collapse beat, as the parent (`to`) takes over around its cell `cell`. */
export function collapseToLook(cell: number, p: number, dimOperator: number): LayerLook {
  return {
    ...IDLE_LOOK,
    fired: 1 - ramp(p, 0.7, 1),
    boost: 1 - easeOut(p),
    operator: lerp(dimOperator, 1, ramp(p, 0.45, 0.9)),
    focus: { cell, others: easeOut(ramp(p, 0, 0.25)) },
  };
}

/** The collapsing child (`from`), fused, fading as the parent's own fired cell takes its place. */
export function collapseFromAlpha(p: number): number {
  return 1 - ramp(p, 0, 0.3);
}

/** The camera's time in a collapse: linear, so the pull-out runs at constant velocity. */
export function collapseCameraT(p: number): number {
  return clamp01(p);
}

/** The camera's time in an advance: ease-out (never ease-in on a zoom). */
export function advanceCameraT(p: number): number {
  return easeOut(p);
}

/** The puzzle an advance leaves fades in the second half, so nothing pops at the end. */
export function advanceFromAlpha(p: number): number {
  return 1 - ramp(p, 0.5, 1);
}

/**
 * The round crossfade: the old round fades out as the new one fades in, both over
 * the first half, so from half-way only the new round is drawn and nothing of the
 * old one (its fused top, its answer) shows through the new operator's faint wash.
 */
export function crossfade(p: number): { readonly from: number; readonly to: number } {
  return { from: 1 - ramp(p, 0, 0.5), to: ramp(p, 0, 0.5) };
}
