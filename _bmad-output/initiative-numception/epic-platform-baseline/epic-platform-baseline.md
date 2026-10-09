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
