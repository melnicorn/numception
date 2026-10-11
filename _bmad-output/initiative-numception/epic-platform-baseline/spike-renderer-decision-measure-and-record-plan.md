---
title: 'Renderer decision: measure and record'
type: 'chore'
ticket: '3'
created: '2026-10-10'
status: 'built'
baseline_revision: 'da0c89ef7bbe382093e75b25b07c70378fcb9783'
route: 'oneshot'
route_source: 'pinned'
risk: 'high'
review: 'none'
review_source: 'pinned'
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred:
  - summary: >-
      Renderer not yet measured on an older iPhone-class device (iPad Air 4, A14) or on mid-range Android (Galaxy A35 class).
    evidence: |-
      User decision 2026-10-10: develop on the iPhone 16 Pro and the browser, with no Android device for now. The 16 Pro is an upper bound only. Settled by running prototypes/renderer-bakeoff/measurements.md's matrix on the iPad Air 4 and an A35-class phone before POC architecture locks.
    location: >-
      prototypes/renderer-bakeoff/measurements.md; architecture spine, Deferred (Renderer)
    severity: high (unverified)
  - summary: >-
      Filter-based glow doesn't hold 60 fps in either engine, so the game needs a cheaper glow technique.
    evidence: |-
      iPhone 16 Pro, full glow: Phaser 12–16 fps, PixiJS 46–53. Lite glow: PixiJS drops to about 43 sustained. Owned by the theme and render work (epic-themes-and-feedback / epic-core-play-loop render), to be measured on an older device.
    location: >-
      architecture spine, Deferred (Renderer, Glow technique is open)
    severity: high
---

<intent-contract>

## Intent

**Problem:** POC architecture is gated on choosing Phaser 4 or PixiJS v8 from measured fps, gzipped size and cold start on the bake-off scene.

**Approach:** Measure both bake-off builds in the Capacitor iOS shell on the user's devices across glow tiers, record the numbers and the choice in the architecture spine, and record every device gap. Per user decision 2026-10-10: iPhone 16 Pro now, iPad Air 4 later, no Android.

</intent-contract>

## Implementation Notes

Pinned oneshot. This was an interactive measuring session with the user rather than a build-auto run.

- Measurement tooling: the readout logs a `BAKEOFF` line every 5 s (identical `readout.ts` in both builds). `apps/client/capacitor.config.ts` sets `loggingBehavior: 'production'` only when `BAKEOFF` is set, so Release builds forward the lines over `devicectl --console`. A build-time `BAKEOFF_GLOW` tier (`src/glow-tier.ts`, full/lite/off) controls glow, with `full` unchanged from the shared spec.
- Device setup: Developer Mode turned on, the 16 Pro registered to team KC6UPFR323 through Xcode automatic signing (building with the device as destination), and the developer certificate trusted on the phone.
- Results, method and reading: `prototypes/renderer-bakeoff/measurements.md`. Decision: PixiJS v8, provisional (spine Stack table and Deferred). Epic Notes record the device decision.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && CI=1 pnpm e2e` -- expected: all pass with the measurement tooling in place (default glow tier = full)

## Auto Run Result

**Summary:** Measured both renderers on an iPhone 16 Pro (Release Capacitor build, 3 cold runs per variant, glow full/lite/off). Both hold 60 fps without glow. Neither holds 60 with the specified filter glow (Phaser 12–16, PixiJS 46–53). PixiJS is 2.5× smaller (139 kB vs 349 kB gzipped fetched) with a slightly faster first frame, so **PixiJS v8 is recorded as the provisional renderer** in the architecture spine. Phaser and pixi-filters are no longer the default.

**Files changed:**
- `prototypes/renderer-bakeoff/measurements.md`: results, method, reading, gaps.
- `prototypes/renderer-bakeoff/{phaser,pixi}/src/glow-tier.ts`, `bakeoff-scene.ts`, `vite.config.ts`, `readout.ts`; `README.md`: glow tiers and the measurement log line.
- `apps/client/capacitor.config.ts`: release console forwarding for bake-off syncs only.
- `architecture-numception.md`: Stack table names PixiJS (provisional); Deferred records the numbers, the open glow technique and the device gaps.
- `epic-platform-baseline.md`: device decision note.

**Review findings:** no review lens ran (interactive session, decision taken with the user).

**Residual risks:** the decision rests on a flagship phone. The older-iPhone and Android measurements are open (deferred, high), and the glow technique has to change in either engine.
