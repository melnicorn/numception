/**
 * How long every moving beat lasts at Minimal motion, integer ms (EXPERIENCE
 * Accessibility Floor: every transition a ≥ 400 ms crossfade, zooms become cuts
 * with a crossfade). An accessibility floor like FR-9's caps, so it is the same at
 * every tuning.
 */
// 450, not 400: the first drawn frame is already ~1 frame in, so 400 ms of play time shows as ~385 ms.
export const MINIMAL_CROSSFADE_MS = 450;
