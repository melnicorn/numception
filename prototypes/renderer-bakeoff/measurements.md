# Renderer bake-off measurements (ticket 3)

Measured 2026-10-10. The result: **PixiJS v8, provisional** (architecture spine, Stack and Deferred).

## Devices

| Planned reference | Used | Why |
|---|---|---|
| iPhone 13 (A15) | **iPhone 16 Pro** (A18 Pro, iOS 26), upper bound only | The user's phone. The A15 iPhone 14 is a locked-down work phone. |
| iPhone 13 (A15) | iPad Air 4th gen (A14), the stricter stand-in | **Not measured yet**: not on hand. |
| Galaxy A35-class Android | none | **Not measured**: the user has no Android device for now (decision 2026-10-10). |

## Method

- Capacitor iOS shell, **Release** build, installed with `devicectl`. Each variant: 3 cold launches (the app is terminated between runs), 35 s each.
- The fps readout (`src/readout.ts`, identical in both builds) logs `BAKEOFF t avg min first` every 5 s. `loggingBehavior: 'production'` is set only for `BAKEOFF` syncs, so these lines reach `devicectl --console` in Release.
  - `avg` is the rolling 5 s average.
  - `min` is the lowest 0.5 s instant fps since the last line.
  - `first` is the first rendered frame in ms after WebView navigation start. The native launch before navigation is the same shell for both builds.
- Glow tiers come from the build-time env `BAKEOFF_GLOW` (`src/glow-tier.ts`):
  - `full` is the shared spec: 12 css px, 120 samples per pixel.
  - `lite` is 8 css px, 40 samples per pixel.
  - `off` has no glow.
  - Example: `BAKEOFF_GLOW=lite pnpm --filter @numception/client run cap:sync:pixi`.
- Size: gzip -9 of the files headless WebKit actually fetches from the built `dist/` (full glow).
- WKWebView caps requestAnimationFrame at 60 Hz on the 16 Pro's 120 Hz screen, so 60 is the ceiling.

## Results: iPhone 16 Pro

| Glow tier | Phaser 4.2.1 avg fps (min) | PixiJS 8.22.0 avg fps (min) |
|---|---|---|
| full | 12–16 (12) | 46–53 (31–44); one run fell to 28 at 31 s |
| lite | 27–35 (26) | 60 for about 18 s, then 42–44 (29–30), in all 3 runs |
| off | 60 (58) | 60 (56) |

| | Phaser 4.2.1 | PixiJS 8.22.0 |
|---|---|---|
| Gzipped download (files fetched) | 349 kB (2 files) | 139 kB (13 files; the WebGPU and worker chunks are never fetched) |
| First frame, glow off | 73–84 ms | 68–71 ms |
| First frame, glow full | 136–150 ms | 92–325 ms |

## Reading

- **The zoom itself holds 60 fps in both engines**, so the ticket's "reopen the engine choice" branch doesn't apply.
- **The glow as specified doesn't hold 60 in either engine, even on a 2024 flagship.** Per the ticket, effect density is cut first. The game's glow needs a cheaper technique (for example pre-baked glow sprites or textures, or one shared low-resolution bloom pass instead of three full-resolution passes), measured again on an older device.
- **Phaser's glow costs about 3× PixiJS's at the same sample count.** Phaser Graphics have no bounds, so each of the three glow filters runs over the whole camera. PixiJS filters only each colour layer's bounds plus padding. This comes from how each engine's glow is built, not from raw renderer speed.
- The PixiJS `lite` drop at about 18 s happened in every run at the same point. It looks like the phone's sustained GPU and thermal limit. Treat about 40–45 fps as the sustained figure for that load on this phone.
- Tie-breaks (addendum A1), once glow is affordable in both:
  - Render-loop control: about even. Both expose their ticker, and Phaser needed `fps.smoothStep: false` to get real frame deltas.
  - Size: PixiJS is 2.5× smaller.
  - Cold start: PixiJS is slightly faster with glow off.
  - The result is **PixiJS**.

## Gaps before POC architecture locks

1. iPad Air 4 (A14): run the same matrix, plus whatever glow technique replaces filter glow.
2. Android mid-range (Galaxy A35 class): not measured. This is the riskiest platform for WebView GPU work.
3. Cold start was measured from navigation, not from tapping the icon.
