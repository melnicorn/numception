// OKLCH colour mixing for the token-interpolation transition (DESIGN: "Colours
// tween in OKLCH"). Björn Ottosson's OKLab, with sRGB transfer; out-of-gamut
// results are clamped per channel. Pure maths, no allocation beyond small tuples.

type Lab = readonly [number, number, number];

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** `#RRGGBB` as OKLab `[L, a, b]`. */
export function hexToOklab(hex: string): Lab {
  const v = Number.parseInt(hex.slice(1), 16);
  const r = toLinear(((v >> 16) & 0xff) / 255);
  const g = toLinear(((v >> 8) & 0xff) / 255);
  const b = toLinear((v & 0xff) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab `[L, a, b]` as `#RRGGBB`, each channel clamped into sRGB. */
export function oklabToHex([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channel = (x: number) => Math.round(Math.min(1, Math.max(0, toGamma(x))) * 255);
  const r = channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0').toUpperCase()}`;
}

/** Below this chroma a colour's hue is noise: such a pair is mixed straight across OKLab instead. */
const GREY_CHROMA = 0.03;

/**
 * `#RRGGBB` colours mixed in OKLCH at `t` (0..1): lightness and chroma
 * interpolated linearly, hue along the shorter arc, so the tween keeps its
 * colourfulness and lightness moves evenly. When either end is near grey its hue
 * means nothing, so the pair is mixed straight across OKLab (no hue jump). Exact
 * at the ends.
 */
export function mixOklch(from: string, to: string, t: number): string {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const [l1, a1, b1] = hexToOklab(from);
  const [l2, a2, b2] = hexToOklab(to);
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const L = l1 + (l2 - l1) * t;
  if (c1 < GREY_CHROMA || c2 < GREY_CHROMA) return oklabToHex([L, a1 + (a2 - a1) * t, b1 + (b2 - b1) * t]);
  const h1 = Math.atan2(b1, a1);
  const h2 = Math.atan2(b2, a2);
  let dh = h2 - h1;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  const C = c1 + (c2 - c1) * t;
  const h = h1 + dh * t;
  return oklabToHex([L, C * Math.cos(h), C * Math.sin(h)]);
}
