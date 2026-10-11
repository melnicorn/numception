---
type: epic
title: "Platform baseline and renderer decision"
parent: initiative-numception
covers: []
after: []
assignee: ""
risk: high
---

# Platform baseline and renderer decision

## Description

The monorepo, CI, build flavours and playtest deploy exist, and the renderer bake-off has picked Phaser 4 or PixiJS v8 on measured numbers. Every later epic builds on this; the renderer decision gates POC architecture.

## Outcome

The developer can push a change and see it tested and deployed to the offline playtest web build, on a renderer proven to hold 60 fps for the tier zoom; the signal is the bake-off's measured fps, gzipped size and cold start.

## Requirements

- R1: A pnpm workspace with the packages and boundaries of the Structural Seed builds, and CI runs typecheck and tests on every change. (architecture, Structural Seed, AD-19)
- R2: Dependency direction and the banned list are enforced in CI. (architecture, AD-1; spec Constraints: no ads, no OTA code, self-hosted assets)
- R3: dev, playtest and prod flavours build with separate bundle ids; the dev panel ships only in dev and playtest. (architecture, AD-18)
- R4: The playtest web build deploys to a static host and runs offline, within the 5 MB gzipped budget. (architecture, Deployment; quality-bars NFR-1, NFR-2)
- R5: Capacitor iOS and Android shells run the client on real phones. (architecture, Stack, Deployment)
- R6: Phaser 4 or PixiJS v8 is chosen from measured fps, gzipped size and cold start for the tier-zoom scene on the reference devices. (spec Constraints: renderer gate; addendum A1; architecture Deferred)

## Done when

1. The workspace packages (core, app, render, ui, platform-web, platform-native, apps/client) build, and CI runs typecheck, the dependency boundary and banned-list lint, and unit tests on every change.
2. dev, playtest and prod flavours build with separate bundle ids; the dev panel is absent from prod.
3. The playtest PWA deploys to a static host and loads and runs offline on a phone; CI fails the build above 5 MB gzipped initial download (NFR-1).
4. The renderer bake-off scene (neon lines, glow, 200 particles, tier zoom with round collapse) is measured inside Capacitor on a Galaxy A35-class phone and an iPhone 13, and the choice is recorded with fps, gzipped size and cold start.

## Boundaries

The build substrate and the renderer decision. No game rules, no player-facing features.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- constraint — _bmad-output/initiative-numception/spec-numception/spec-numception.md, section Constraints (renderer gate, store compliance, web cookies, zero licensing cost)
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-1, AD-18, AD-19, Stack, Structural Seed, Deferred (renderer)
- research — _bmad-output/initiative-numception/prd-numception/addendum.md, section A1
- constraint — _bmad-output/initiative-numception/spec-numception/quality-bars.md, NFR-1

## Notes

- Assumption: CI on GitHub Actions and a static host such as Cloudflare Pages or GitHub Pages (architecture assumption, revisit at first deploy).
- Assumption: stack versions are re-checked before scaffolding, since the addendum dates them stale after 2026-11-01.
- Decision: 2026-10-09 — breakdown planned autonomously at the user's request after the epic set was approved.
- Tracer bullet: entry 1 — workspace, CI and a bare static deploy of a value computed in core.
- Sequencing: the renderer bake-off (8 and 9 in parallel, then 3) comes right after the phone shells because it is the least certain and gates epics 3 and 6; entry 4 runs beside the bake-off; 5 then 6 follow; 7 closes.
- Assumption: the tracer reaches the static host on day one (entry 1 owns the host account step); offline PWA and the size budget stay in entry 6.
- Assumption: epic-puzzle-generator's wait on CI includes the boundary lint, so its entries will wait on 1.1 and 1.4; epic-core-play-loop and epic-themes-and-feedback will wait on 1.3.
- Decision: 2026-10-10 (user). Development runs on the user's iPhone 16 Pro and the browser. No Android device for now. The iPad Air 4 (A14) stands in for the iPhone 13 when it is available. Done-when item 4 is met provisionally: the renderer was measured on the 16 Pro only, and the A35 and older-iPhone measurements are recorded as gaps in the architecture spine's Deferred section.
