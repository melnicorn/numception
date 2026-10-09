# Renderer bake-off (Phaser 4 vs PixiJS v8)

Throwaway prototypes for the renderer decision (ticket 3). The same neon scene is
built once per engine and run inside the Capacitor shells, so fps, gzipped size and
cold start can be compared on the reference phones (Galaxy A35-class, iPhone 13).

- `phaser/` -- Phaser 4 build (ticket 8), package `@numception/bakeoff-phaser`.
- `pixi/` -- PixiJS v8 build (ticket 9), same scene, same spec.

Each prototype is a workspace member (`prototypes/renderer-bakeoff/*` in
`pnpm-workspace.yaml`) only so its dependencies install with the workspace and it
typechecks under the root `tsc -b`. Nothing in `packages/` or `apps/client/src`
imports a prototype or its engine. Each one is a standalone Vite app with base `./`,
fully self-contained: no CDN, no remote fonts, no network requests.

## Running

- Browser: `pnpm --filter @numception/bakeoff-phaser dev` or
  `pnpm --filter @numception/bakeoff-pixi dev` (or `build` then `preview`).
- Shells: `pnpm --filter @numception/client run cap:sync:phaser` (or `cap:sync:pixi`)
  builds the prototype and syncs it into the iOS and Android shells (`BAKEOFF=phaser`
  or `BAKEOFF=pixi` points Capacitor's `webDir` at that prototype's `dist`). Run
  `pnpm --filter @numception/client run cap:sync` afterwards to put the tracer client
  back. Any other non-empty `BAKEOFF` value is rejected.
- Size: Vite prints the gzipped bundle size at the end of `build`. The PixiJS build is
  split into chunks by PixiJS's own dynamic imports, and the WebGPU and web-worker
  chunks are never fetched (the renderer is WebGL), so count only the chunks the page
  loads (the network panel shows them).

## Shared scene spec

Both prototypes follow this spec exactly. Anything it leaves open is decided here,
not in engine code. "css px" means CSS pixels on screen; renderers draw at device
pixel ratio, so 1 css px is `devicePixelRatio` device pixels.

### Canvas

- Fills the whole viewport, including the safe areas (`viewport-fit=cover`), and
  renders at device pixel ratio so lines are crisp on high-DPI screens. Follows
  viewport resizes and rotation.
- Background `#05060a`.
- WebGL renderer. No input, no audio, no text on cells.

### Colours

Palette, in order: cyan `#29f0ff`, magenta `#ff3df2`, lime `#b6ff3d`
(`palette[0..2]`).

### Geometry

All geometry is in world units, y pointing down, built from one shape function.

**Triangle puzzle `T(c, s)`** (centroid `c`, cell spacing `s`) has exactly 30
segments:

- Cell centres: `C_k = c + R * (cos a_k, sin a_k)` with `R = s / sqrt(3)` and
  `a_k = -90°, 30°, 150°` for `k = 0, 1, 2` (top, bottom-right, bottom-left).
- Segments 0-17, cells: for each cell `k`, a regular hexagon of radius `r = 0.22 s`
  around `C_k`, vertex `j` at angle `60° * j` (`j = 0..5`). Segment `6k + j` runs from
  vertex `j` to vertex `j + 1 (mod 6)`.
- Segments 18-20, connectors: for `k = 0..2`, with `u` the unit vector from `C_k` to
  `C_(k+1 mod 3)`, from `C_k + r u` to `C_(k+1) - r u`.
- Segments 21-23, spokes: for `k = 0..2`, with `u` the unit vector from `c` to `C_k`,
  from `c + 0.1 s u` to `C_k - r u`.
- Segments 24-29, frame: a truncated triangle. Its corners are
  `F_k = c + 1.15 s * (cos a_k, sin a_k)`. For side `k` (from `F_k` to `F_(k+1 mod 3)`),
  `A_k = F_k + 0.15 (F_(k+1) - F_k)` and `B_k = F_k + 0.85 (F_(k+1) - F_k)`.
  Segment `24 + 2k` is `A_k -> B_k` (long side) and segment `25 + 2k` is
  `B_k -> A_(k+1 mod 3)` (cut corner).

**The scene** (n = 3, two tiers):

- Tier 2 is `T((0, 0), 1000)`. Its cell centres `P_0, P_1, P_2` are the positions of
  the three tier-1 puzzles. Its hexagon segments (0-17) are never drawn on their own;
  they are what the tier-1 puzzles collapse into. Its segments 18-29 (12 segments) are
  drawn, segment `j` in `palette[j mod 3]`.
- Tier-1 puzzle `k` is `T(P_k, 1000 / 3)`, all 30 segments drawn in `palette[k]`.
- Drawn segments: 3 x 30 + 12 = 102 glowing segments. The count never changes; a
  segment that is invisible (alpha 0) is still drawn.
- Base camera fit: at camera scale 1, the larger of the width and height of the
  tier-2 frame's bounding box (segments 24-29) is 80% of the shorter viewport side.
  Screen px per world unit = base fit x camera scale.

### Lines

- Width 3 css px on screen at every camera scale.
- Glow on lines only (not particles): one outer glow per colour, in the colour of its
  lines (so three glow passes: one each for the cyan, magenta and lime lines). Glow
  distance 12 css px, outer strength 2, inner strength 0, line itself drawn (no
  knockout). Phaser: `addGlow(colour, 2, 0, devicePixelRatio, false, 10, 12)` in
  screen space. PixiJS should match distance and strength; if its sample settings
  differ, write the chosen values here.

  Glow settings side by side (both: 12 rings, one sample ring per css px, same
  distance-weighted alpha sum and outer-strength formula):

  | | Phaser 4 `Glow` | PixiJS `GlowFilter` (pixi-filters 6.1) |
  |---|---|---|
  | Colour | line colour | `color`: line colour |
  | Outer / inner strength | 2 / 0 | `outerStrength: 2`, `innerStrength: 0` |
  | Knockout | `false` | `knockout: false` (`alpha: 1`) |
  | Distance | 12 steps x `scale = devicePixelRatio` device px = 12 css px | `distance: 12`; PixiJS sizes filter input in css px, so 12 steps of 1 css px at any resolution |
  | Samples per pixel | quality 10: 10 angles per ring, random rotation per ring, 120 in all | `quality: 0.1326`: angle step `1 / (quality x distance)` rad gives 10 fixed angles per ring, 120 in all |
  | Resolution | game canvas at DPR, filters on the camera context at that size | `resolution: devicePixelRatio` on the filter (the Filter default of 1 would be soft); renderer `resolution` DPR with `autoDensity` |
  | Area | the whole camera (Graphics have no bounds) | the colour layer's bounds plus `padding: 12` css px |
  | Filter MSAA | none (filter framebuffers are single-sampled) | `antialias: 'off'` (the default), so also single-sampled |

  The visible difference: Phaser's random per-ring rotation hides sampling rays,
  while PixiJS's fixed angles can show faint rays at line ends.

### Particles

- Always exactly 200 live particles, from a fixed pool recycled in place (no
  allocation per frame). A particle that dies is respawned in the same frame.
- Additive blend, round dots, diameter uniform in 2-4 css px on screen at every camera
  scale.
- Lifetime 1.5 s. Alpha falls linearly from 1 to 0 over the lifetime.
- Spawn: pick one of the 9 tier-1 cells uniformly at random. Its current centre is
  `lerp(C, P_k, p)` and its current radius is `lerp(0.22 * 1000/3, 0.22 * 1000, p)`,
  where `C` is the cell's tier-1 centre, `P_k` the tier-2 cell its puzzle collapses
  into and `p` the collapse progress below. Spawn uniformly inside a disc of half the
  current radius around the current centre. Colour is the puzzle's colour.
- Motion: straight line, random direction, speed uniform in 40-120 world units per
  second. Particles live in world space (they move with the camera).
- At start, all 200 spawn at once with remaining lifetimes uniform in (0, 1.5] s, so
  deaths are spread evenly from the first frame.

### Loop (5.0 s, repeats forever)

`ease(x)` is cubic in-out: `x < 0.5 ? 4x^3 : 1 - (2 - 2x)^3 / 2`. `t` is the time in
the loop, advanced by frame delta (each delta clamped to 100 ms, so returning from
the background resumes the loop where it was instead of jumping).

| Phase | t (s) | Camera centre | Camera scale | Collapse progress `p` |
|---|---|---|---|---|
| Tier-1 hold | 0-1.5 | `P_0 -> P_1` over 0-0.75 s, then `P_1 -> P_2` over 0.75-1.5 s, each leg eased | 3.0 | 0 |
| Collapse | 1.5-2.7 | `lerp(P_2, (0,0), e)` | `lerp(3, 1, e)` | `e` |
| Tier-2 hold | 2.7-4.2 | `(0, 0)` | 1.0 | 1 |
| Reset | 4.2-5.0 | `lerp((0,0), P_0, e)` | `lerp(1, 3, e)` | `1 - e` |

`e = ease(phase progress)`. The collapse is 1.2 s (FR-9's later-collapse duration).

- Collapse: segment `i` of tier-1 puzzle `k` is drawn from `lerp(a_i, a'_i, p)` to
  `lerp(b_i, b'_i, p)`, where `a_i -> b_i` is its tier-1 position and `a'_i -> b'_i` is
  segment `6k + (i mod 6)` of tier 2 (an edge of tier-2 cell `k`'s hexagon). At `p = 1` the
  puzzle's 30 segments lie on the 6 edges of that hexagon.
- The 12 tier-2 segments are drawn at alpha `p` (hidden while zoomed in, fading in
  during the collapse, out during the reset).
- Pulse: during the tier-2 hold, every line's alpha is multiplied by
  `0.7 + 0.3 cos(2π (t - 2.7) / 0.75)` (two pulses, starting and ending at full
  brightness). Outside the hold the multiplier is 1.

### Readout

- DOM overlay, top-left inside the safe area, monospace, over the canvas:
  `fps <instant> · avg <rolling 5 s> · first frame <ms>`.
- Instant fps: rendered frames over the last update interval, updated every 500 ms.
  Rolling average: rendered frames over the last 5 s.
- First frame: `performance.now()` at the first rendered frame, which is measured from
  navigation start, rounded to whole ms.

### Lifecycle

- Backgrounding: the loop pauses with the app and resumes where it was.
- WebGL context loss: the scene restarts once the context is restored, rather than
  freezing.

### Measured in ticket 3

Cold start and size come from this build: Vite's gzipped output size, plus the
first-frame readout. Fps comes from the readout on the reference phones. The
prototypes do not measure or decide anything themselves.
