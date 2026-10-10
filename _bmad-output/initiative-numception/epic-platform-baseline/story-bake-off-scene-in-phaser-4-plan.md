---
title: 'Bake-off scene in Phaser 4'
type: 'feature'
ticket: '8'
created: '2026-10-09'
status: 'built'
baseline_revision: '556abb8e6e3bb4864958e9e4a0d9fab7e46355e2'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-platform-baseline/story-capacitor-shells-on-real-phones-plan.md'
warnings: ['oversized']
deferred:
  - summary: >-
      The bakeoff-phaser Playwright spec may time out on GitHub's ubuntu-latest software WebKit.
    evidence: |-
      It has only been run on macOS. The 100 ms delta clamp stretches real loop time when fps drops below 10, and the test needs loops within 10 s and 12 s polls. Settled by the first CI run; if it is flaky, raise the timeouts or the readiness poll.
    location: >-
      playwright.config.ts (bakeoff-phaser project), prototypes/renderer-bakeoff/phaser/e2e/bakeoff.spec.ts
    severity: medium (unverified)
---

<intent-contract>

## Intent

**Problem:** The renderer decision (ticket 3) needs the same neon scene built in Phaser 4 and in PixiJS v8 (ticket 9), running inside the Capacitor shells, so fps, gzipped size and cold start can be measured on the reference phones.

**Approach:** Write the shared scene spec once, in `prototypes/renderer-bakeoff/README.md`, so ticket 9 builds exactly the same thing. Then build it in Phaser 4 as a standalone Vite app in `prototypes/renderer-bakeoff/phaser`: neon polygon lines with glow, 200 particles, and a looping tier zoom with a round collapse, plus an on-screen fps and cold-start readout. Make the Capacitor shells able to load that build instead of the client.

## Boundaries & Constraints

**Always:**
- The scene follows the shared spec exactly (counts, timings, colours, loop). Anything the spec leaves open is decided in the spec, not in the Phaser code.
- `phaser` ~4.2.1 is a dependency of the prototype package only. Nothing in `packages/` or `apps/client/src` imports the prototype or `phaser`.
- The canvas renders at device pixel ratio (crisp on high-DPI) and fills the viewport, including safe areas.
- Self-contained: no CDN, no remote fonts, no network requests.
- The prototype typechecks under the root `tsc -b`.

**Never:**
- Game rules, `core` logic, Preact or real puzzle content. Numbers on cells are optional static text at most.
- Changing how the client app builds or syncs by default (`cap:sync` without the bake-off variable must still ship `apps/client/dist`).
- Measuring or deciding anything about the renderer (that's ticket 3) or building the PixiJS version (ticket 9).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Loop | app open | zoomed-in tier-1 hold → collapse with camera pull-out → tier-2 hold → reset, repeating forever with no growth in objects or memory | No error expected |
| Particles | any frame | exactly 200 live particles | No error expected |
| Readout | running | overlay shows current fps (updated ≥2×/s), rolling average fps, and first-frame time in ms since navigation start | No error expected |
| Shell target | `BAKEOFF=phaser` set for cap sync | shells get the Phaser build | unset → client build (unchanged) |
| Backgrounding | app paused and resumed | loop resumes; on WebGL context loss the scene restarts rather than freezing | restart the scene |

</intent-contract>

## Code Map

- `pnpm-workspace.yaml` -- members are `packages/*` and `apps/*`. Add `prototypes/renderer-bakeoff/*` so the prototype's dependencies install with the workspace.
- `prototypes/renderer-bakeoff/README.md` -- currently says "not a workspace member". Rewrite it: role, the new workspace membership (still never imported by `packages/`), and the full **Shared scene spec**.
- `apps/client/capacitor.config.ts` -- `webDir: 'dist'`. Reading `process.env` here is allowed (this file is inside `apps/client`).
- `apps/client/package.json` -- has `cap:sync` = `BASE_PATH= vite build && cap sync`.
- `tsconfig.json` (root) -- solution file of project references; add the prototype project. `tsconfig.base.json` -- shared strict config (composite, emit to `${configDir}/.tsbuild`).
- `apps/client/vite.config.ts`, `apps/client/tsconfig.json` -- patterns for a Vite app and its TS project.
- pnpm 11 enforces a minimum release age: if the newest patch is too new, pin the previous one.

## Tasks & Acceptance

**Execution:**
- [x] `prototypes/renderer-bakeoff/README.md` -- write the Shared scene spec (see Design Notes) as the single source both prototypes follow. -- fairness across tickets 8 and 9
- [x] `pnpm-workspace.yaml` -- add `prototypes/renderer-bakeoff/*`. -- dependencies install
- [x] `prototypes/renderer-bakeoff/phaser/` -- `package.json` (`@numception/bakeoff-phaser`, scripts `dev`/`build`/`preview`), `index.html`, `vite.config.ts` (base `./`), `tsconfig.json`, `src/main.ts` (Phaser game config: WebGL, DPR resolution, resize to viewport), `src/bakeoff-scene.ts` (the scene), `src/readout.ts` (DOM fps and cold-start overlay). -- the Phaser scene
- [x] `tsconfig.json` (root) -- reference the prototype project. -- CI typechecks it
- [x] `apps/client/capacitor.config.ts` -- when `process.env.BAKEOFF` is `phaser`, set `webDir` to `../../prototypes/renderer-bakeoff/phaser/dist`; otherwise `dist`. Reject other non-empty values with a clear error. -- shells can load the scene
- [x] `apps/client/package.json` -- add `cap:sync:phaser` = build the prototype, then `BAKEOFF=phaser cap sync`. -- one command to put the scene in the shells

**Acceptance Criteria:**
- Given `pnpm --filter @numception/client run cap:sync:phaser` and an iOS simulator build of the shell, when the app launches, then the neon scene runs its zoom and collapse loop with the fps readout visible.
- Given `pnpm --filter @numception/client run cap:sync` afterwards, when the shell launches, then it shows the tracer page again.
- Given the repo, when `pnpm typecheck && pnpm test && pnpm build && pnpm e2e` run, then all pass.
- Given `packages/` and `apps/client/src`, when searched for `phaser` or `renderer-bakeoff`, then there are no matches.

## Implementation Notes

- `phaser` resolved to 4.2.1 (released 2026-07-09, old enough for pnpm's release-age policy). It is a dependency of `@numception/bakeoff-phaser` only.
- Decided in the spec (README), not in code: the exact `T(c, s)` geometry (hexagon cells, connectors, spokes, truncated-triangle frame = 30 segments, 102 drawn in all), the collapse mapping (tier-1 segment `i` of puzzle `k` lerps onto tier-2 segment `6k + (i mod 6)`), constant 3 css px line width and 2-4 css px particle size at every camera scale, tier-2 lines fading with collapse progress, the pulse formula, particle spawn and speed rules, and glow parameters (one outer glow per colour, distance 12 css px, outer strength 2).
- DPR: Phaser 4 has no `resolution` option, so the game is sized to viewport x DPR with `Scale.NONE` and displayed at zoom `1/DPR`; resize re-applies both.
- Glow: one Graphics per colour, each with `addGlow(colour, 2, 0, dpr, false, 10, 12)`. Graphics have no bounds, so filters focus on the camera context and the glow is screen space (12 steps x DPR device px = 12 css px).
- Particles are 200 pooled `Image`s plus typed arrays, rather than Phaser's `ParticleEmitter`, whose `preUpdate` allocates per frame and can't guarantee exactly 200 alive. Dead particles respawn in the same frame.
- Context loss: Phaser restores GL itself; the scene restarts on `RESTORE_WEBGL` (logs `bake-off: WebGL context restored, restarting the scene`). The loop advances by clamped delta (100 ms max), so it resumes where it was after backgrounding.
- Prototype imports are extensionless, matching the repo (base config has no `allowImportingTsExtensions`).

## Verification Results

- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e`: all pass (6/6 tests, 1/1 e2e).
- `pnpm --filter @numception/bakeoff-phaser build`: JS 1,381 kB, gzip 360.5 kB.
- `cap:sync:phaser`: exits 0; iOS and Android `public/index.html` are the bake-off page. `BAKEOFF=pixi` fails with `Unknown BAKEOFF="pixi"`. `cap:sync` afterwards restores the tracer.
- The `grep` over `packages` and `apps/client/src` returns nothing.
- iOS simulator (iPhone 17, iOS 26.1): `xcodebuild` BUILD SUCCEEDED. The scene runs full-bleed with the readout below the status bar. After `cap:sync` and a rebuild, the shell shows `Tracer: 5/6` again.
- Browser: the loop, colours and collapse were checked visually. Headless WebKit at DPR 3 made only 2 requests (the page and its JS), with no console errors. A forced WebGL context loss and restore restarted the scene.
- Matrix tests: `apps/client/capacitor-config.test.ts` covers Shell target (unset or empty → `dist`, `phaser` → the prototype dist, unknown → throws). `prototypes/renderer-bakeoff/phaser/e2e/bakeoff.spec.ts` (Playwright project `bakeoff-phaser`, 480x360 at DPR 1, served on :4174 by a second `webServer` that builds the prototype first) covers Readout, Particles (200 at two sample points), Loop (`loopsCompleted >= 1`) and Backgrounding (a forced context loss then restore gives `restarts >= 1`, and loops keep increasing). Both read the `window.__bakeoff` debug hook. `pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e` passes (9 unit tests, 2 e2e).
- Not done: Android build and real-device runs (no Android SDK on this machine; that belongs to ticket 3). Simulator and headless fps are software-rendered and mean nothing.
- 2026-10-09 CI fix (deferred item realised): on GitHub's ubuntu-latest the Phaser scene ran at 2–3 fps (software WebGL), and the loop wait timed out (run 38008307670). Two causes. (1) Phaser's `fps.smoothStep` substitutes ~16 ms deltas when frames are slow or the page is unfocused, so the loop clock ran in slow motion, against the spec's "real delta clamped to 100 ms" (PixiJS already followed it). Fixed with `fps: { smoothStep: false }` in `main.ts`. (2) The specs assumed roughly real-time loops. Both bake-off specs now measure a new `sceneSeconds` debug clock and size each loop wait from it, failing fast if the clock stalls. Checked locally at 6 fps (1920x1080 @3x): passes in 20 s.

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 6 findings — high 0, medium 1, low 4, false 0, maybe-false 1
- findings:
  - `[medium]` `[patch]` The README collapse formula said tier-2 segment `i mod 6`, which sends every puzzle into cell 0's hexagon and contradicts the code's `6k + (i mod 6)`, so ticket 9 would build a different scene. Fixed: the README now says `6k + (i mod 6)`.
  - `[low]` `[patch]` `liveParticles` counted the fixed pool after respawning, so it was 200 by construction. Fixed: it is now counted from visible particle images in the scene's display list, without per-frame allocation.
  - `[low]` `[patch]` The readout's first interval counted its start frame, so the first instant fps read (N+1)/elapsed. Fixed: the first frame only records the first-frame time, and every interval counts the same way.
  - `[low]` `[reject]` DPR is read once in `create()`, so a DPR change without a reload (browser zoom, moving monitors) would leave line, glow and particle sizes stale. Phones in the Capacitor shell don't change DPR mid-run, and handling it would add re-layout logic to a throwaway prototype.
  - `[low]` `[patch]` `bakeoffWebDirs[bakeoff]` found inherited keys, so `BAKEOFF=constructor` returned a function. Fixed: added an `Object.hasOwn` check and a test case.
  - `[maybe-false]` `[defer]` The `bakeoff-phaser` e2e depends on timing and has only run on macOS. Software WebKit on `ubuntu-latest` might be too slow for the 10 s and 12 s polls. It also builds Phaser in a second webServer on every `pnpm e2e`. Settled by the first GitHub Actions run.

## Design Notes

**Shared scene spec** (write this into the README verbatim, refining only where needed):
- Background `#05060a`. Neon line colours cycle through cyan `#29f0ff`, magenta `#ff3df2` and lime `#b6ff3d`. Line width 3 css px. Glow on lines only: outer glow, distance about 12 css px, strength comparable in both engines.
- Geometry in world units, with the tier-2 frame filling about 80% of the shorter viewport side at camera scale 1. Tier 2 is one large triangle whose 3 corner cells are the 3 tier-1 puzzles (n=3). Each tier-1 puzzle is a triangle of 3 small polygon cells plus connecting lines, about 30 line segments per tier-1 puzzle, so about 100 glowing segments in all.
- Particles: always exactly 200, additive blend, 2–4 px dots drifting from the active cells, lifetime 1.5 s, recycled in a fixed pool (no allocation per frame).
- Loop (5.0 s): 0–1.5 s hold, camera zoomed to scale 3.0 on the first tier-1 puzzle, panning across the three. 1.5–2.7 s collapse: each tier-1 puzzle's segments shrink into its corner cell of tier 2 while the camera pulls out to scale 1.0 (ease in-out, 1.2 s, FR-9's later-collapse duration). 2.7–4.2 s hold on tier 2 with lines pulsing. 4.2–5.0 s reset back to the zoomed state. Repeat.
- Readout (DOM overlay, top-left inside the safe area, monospace): `fps <instant> · avg <rolling 5 s> · first frame <ms>`. The first-frame time is `performance.now()` at the first rendered frame, which is measured from navigation start.
- Cold start and size are measured in ticket 3 from this build (Vite's gzipped output size, plus the readout).

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e` -- expected: all exit 0
- `pnpm --filter @numception/bakeoff-phaser build` -- expected: exits 0; Vite prints the gzipped bundle size
- `pnpm --filter @numception/client run cap:sync:phaser` -- expected: exits 0; `apps/client/ios/App/App/public/index.html` is the bake-off page
- `grep -rnE "phaser|renderer-bakeoff" packages apps/client/src` -- expected: no output

**Manual checks (if no CLI):**
- iOS simulator build of the shell after `cap:sync:phaser`: the loop runs and the readout updates. Then run `cap:sync` to restore the tracer.

## Auto Run Result

**Summary:** Wrote the shared renderer bake-off scene spec (`prototypes/renderer-bakeoff/README.md`) and built it in Phaser 4.2.1 as the workspace prototype `@numception/bakeoff-phaser`: 102 glowing neon segments, exactly 200 pooled particles, and a 5 s loop (zoomed tier-1 hold → 1.2 s collapse with pull-out → tier-2 pulse → reset), with an fps / avg / first-frame readout. `cap:sync:phaser` loads it into the Capacitor shells, and plain `cap:sync` restores the client.

**Files changed:**
- `prototypes/renderer-bakeoff/README.md`: role, workspace note, full shared scene spec.
- `prototypes/renderer-bakeoff/phaser/**`: the Phaser app (scene, readout, game setup, Vite and TS config) and its WebKit e2e spec.
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.json`: workspace member, dependencies, typecheck reference.
- `apps/client/capacitor.config.ts`, `apps/client/capacitor-config.test.ts`, `apps/client/tsconfig.node.json`: the `BAKEOFF` webDir switch and its test.
- `apps/client/package.json`: `cap:sync:phaser` script.
- `playwright.config.ts`: second project and webServer for the prototype.

**Review findings:** 4 patches applied (1 medium, 3 low), 1 deferred (CI timing of the bake-off e2e, medium unverified), 1 rejected (DPR change without reload: phones don't change DPR mid-run, and the fix adds complexity to a throwaway).

**Follow-up review recommended:** false. Patched: high 0, medium 1, low 3.

**Verification:** `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (9/9), `pnpm build` and `CI=1 pnpm e2e` (2/2: client tracer and Phaser bake-off) all pass. The bake-off build is 1,381 kB, 360.5 kB gzipped. `cap:sync:phaser` then `cap:sync` switches the shell content both ways. The implementer saw the scene running in the iOS simulator shell. No `phaser` or `renderer-bakeoff` references in `packages/` or `apps/client/src`.

**Residual risks:** the verify step ("runs in the installed app on one reference phone") still needs a real phone, which is ticket 3's measuring step. Simulator and headless fps are software-rendered and not meaningful. Three full-screen glow passes may be heavy on the Galaxy A35-class phone, which is exactly what ticket 3 is for.
