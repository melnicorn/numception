// Build-time glow tier for the ticket-3 measurements (README "Glow tiers").
// `full` is the shared spec; `lite` and `off` measure how fps scales with effect density.

declare const __BAKEOFF_GLOW__: string;

export type GlowTier = 'full' | 'lite' | 'off';

export const GLOW_TIER: GlowTier =
  __BAKEOFF_GLOW__ === 'lite' || __BAKEOFF_GLOW__ === 'off' ? __BAKEOFF_GLOW__ : 'full';

/** Glow reach in css px and sample directions per ring (one ring per css px). */
export const GLOW_SHAPE = {
  full: { distance: 12, directions: 10 }, // 120 samples per pixel
  lite: { distance: 8, directions: 5 }, // 40 samples per pixel
  off: { distance: 0, directions: 0 },
}[GLOW_TIER];
