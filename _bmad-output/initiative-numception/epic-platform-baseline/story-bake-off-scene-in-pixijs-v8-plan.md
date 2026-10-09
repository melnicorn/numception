---
title: 'Bake-off scene in PixiJS v8'
type: 'feature'
ticket: '9'
created: '2026-10-09'
status: 'built'
baseline_revision: 'b6656c2716d95a169f77aade1ab594ddfebb3da4'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/prototypes/renderer-bakeoff/README.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-platform-baseline/story-bake-off-scene-in-phaser-4-plan.md'
warnings: []
deferred:
  - summary: >-
      The bakeoff-pixi Playwright spec may time out on GitHub's ubuntu-latest software WebKit.
    evidence: |-
      Same timing exposure as the Phaser spec (ticket 8 deferred item): only run on macOS so far. Settled by the first CI run.
    location: >-
      playwright.config.ts (bakeoff-pixi project), prototypes/renderer-bakeoff/pixi/e2e/bakeoff.spec.ts
    severity: medium (unverified)
---

<intent-contract>

## Intent

**Problem:** The renderer decision (ticket 3) compares Phaser 4 against PixiJS v8 on the same scene. The Phaser build exists (ticket 8). The PixiJS build does not.

**Approach:** Build the scene from the shared spec in `prototypes/renderer-bakeoff/README.md` in PixiJS v8 with pixi-filters, as the workspace prototype `@numception/bakeoff-pixi` under `prototypes/renderer-bakeoff/pixi`. Filter resolution matches device pixel ratio. It gets the same readout, the same debug hook and test coverage as the Phaser build, and `cap:sync:pixi` loads it into the Capacitor shells.

## Boundaries & Constraints

**Always:**
- Follow the README spec exactly: geometry, the collapse mapping `6k + (i mod 6)`, timings, colours, 3 css px lines, 2–4 css px particles, exactly 200 pooled particles, glow distance 12 css px, readout format, and the `window.__bakeoff = { liveParticles, loopsCompleted, restarts }` hook semantics. Where PixiJS forces a different glow parameterisation, record the mapping chosen in the README's glow section so ticket 3 can see both engines' settings side by side.
- Renderer and every filter render at `devicePixelRatio` (`resolution`, `autoDensity`). Filters must not fall back to resolution 1 (addendum A1).
- `pixi.js` ~8.22.x and `pixi-filters` ~6.1.x are dependencies of the prototype package only. Nothing in `packages/` or `apps/client/src` imports the prototype or `pixi`.
- `liveParticles` is counted from what is actually rendered (visible particle display objects in the stage tree), not from the pool size.
- No per-frame allocation in the hot loop. Self-contained: no network requests.

**Never:**
- Changing the Phaser prototype or the spec's behaviour (only the README glow-mapping note may be added).
- Measuring or deciding the renderer (ticket 3).
- Game rules or `core`/`ui` code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Loop | app open | the spec's 5 s loop repeats forever; `loopsCompleted` increases | No error expected |
| Particles | any frame | exactly 200 rendered particles | No error expected |
| Readout | running | `fps <n> · avg <n> · first frame <n> ms`, the same as Phaser | No error expected |
| Shell target | `BAKEOFF=pixi` for cap sync | shells get the Pixi build; `phaser` and unset keep working; unknown values throw | throw a clear error |
| Context loss | WebGL context lost then restored | scene restarts; `restarts` increases and loops continue | restart the scene |

</intent-contract>

## Code Map

- `prototypes/renderer-bakeoff/phaser/**` -- the reference implementation. Mirror its file layout (`index.html`, `vite.config.ts` with base `./`, `tsconfig.json`, `src/main.ts`, `src/bakeoff-scene.ts`, `src/readout.ts`, `e2e/bakeoff.spec.ts`). Copying `readout.ts` verbatim is expected so both builds measure identically.
- `prototypes/renderer-bakeoff/README.md` -- the shared spec. Read it fully; it is the source of truth.
- `apps/client/capacitor.config.ts` -- `bakeoffWebDirs` map with an `Object.hasOwn` guard. Add `pixi: '../../prototypes/renderer-bakeoff/pixi/dist'`.
- `apps/client/capacitor-config.test.ts` -- currently asserts that `pixi` throws. Change that to assert the pixi dist path, and keep an unknown-value case (e.g. `bogus`) and the `constructor` case.
- `apps/client/package.json` -- has `cap:sync:phaser`. Add `cap:sync:pixi` the same way.
- `playwright.config.ts` -- `bakeoff-phaser` project plus a webServer on :4174 (480x360, DPR 1, explained in its comment). Add a `bakeoff-pixi` project and webServer on :4175 the same way.
- `tsconfig.json` (root) -- add the pixi prototype reference. `pnpm-workspace.yaml` already includes `prototypes/renderer-bakeoff/*`.
- pnpm 11 enforces a minimum release age. If the newest patch is too new, pin the previous one.

## Tasks & Acceptance

**Execution:**
- [x] `prototypes/renderer-bakeoff/pixi/` -- package `@numception/bakeoff-pixi` (pixi.js, pixi-filters, vite), app files mirroring the Phaser layout, the scene per spec, and the debug hook. -- the PixiJS scene
- [x] `prototypes/renderer-bakeoff/pixi/e2e/bakeoff.spec.ts` -- the same assertions as the Phaser spec. -- matrix rows Loop, Particles, Readout, Context loss
- [x] `prototypes/renderer-bakeoff/README.md` -- add the PixiJS glow mapping next to Phaser's. -- side-by-side settings for ticket 3
- [x] `apps/client/capacitor.config.ts`, `apps/client/capacitor-config.test.ts`, `apps/client/package.json` -- `pixi` webDir, its test, `cap:sync:pixi`. -- matrix row Shell target
- [x] `playwright.config.ts`, `tsconfig.json` -- register the new project, webServer and TS reference. -- CI runs it

**Acceptance Criteria:**
- Given `pnpm --filter @numception/client run cap:sync:pixi` and an iOS simulator build of the shell, when the app launches, then the scene runs its zoom and collapse loop with the readout visible.
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e` run, then all pass, including both bake-off projects.
- Given the Pixi build at DPR 3, when the glow is inspected, then lines and glow are crisp, not soft at resolution 1.
- Given `packages/` and `apps/client/src`, when searched for `pixi` or `renderer-bakeoff`, then there are no matches.

## Implementation Notes

- `pixi.js` resolved to 8.22.0 (2026-10-01) and `pixi-filters` to 6.1.5. pnpm's release-age policy accepted both. They are dependencies of `@numception/bakeoff-pixi` only.
- Layout mirrors the Phaser build. `readout.ts` and the geometry code are copied verbatim. `index.html` differs only in its title. The e2e spec has the same assertions, with its comments renamed to the plan's "Context loss" row.
- DPR: `Application.init({ resolution: devicePixelRatio, autoDensity: true, resizeTo: window, preference: 'webgl' })`. The camera is a world `Container` scaled by base fit x camera scale in css px. Line width is `3 / zoom` and dot size is `d / zoom` in world units.
- Glow: one `Graphics` per colour, each with one `GlowFilter` set to `resolution = devicePixelRatio` (the Filter default is 1, see A1). PixiJS sets `uInputSize` to the filter input's logical (css px) size, so `GlowFilter` steps 1 css px per ring at any resolution. The right setting is `distance: 12`, not 12 x DPR. A first attempt used 12 x DPR: the glow ran 36 css px at DPR 3, got clipped at the filter bounds and ran at about 15 fps headless. `quality: 0.1326` gives 10 angles x 12 rings = 120 samples, the same count as Phaser's quality 10. Padding defaults to the distance (12 css px). Filter MSAA is left `off`, like Phaser's single-sampled filter framebuffers. The full mapping table is in the README's "Lines" section.
- Strokes: per frame, each colour layer is cleared and gets one stroke for its puzzle's 30 segments (shared alpha) and one for its 4 tier-2 segments (alpha `p x pulse`, issued even at 0). The stroke style object is reused. PixiJS's Graphics context still allocates instructions internally, as Phaser's Graphics command buffer does. The prototype's own code allocates nothing per frame.
- Particles: 200 `Sprite`s with additive blend on a 16 px generated dot texture, plus typed arrays. `liveParticles` counts visible sprites with alpha > 0 using the dot texture in the dot layer, and only while the world container is attached to the stage.
- Context loss: PixiJS restores GL itself. A `webglcontextrestored` listener, added after PixiJS's own, destroys the scene (world, filters, dot texture) and builds a new one, then increments `restarts` and logs `bake-off: WebGL context restored, restarting the scene`. The ticker's `deltaMS` is clamped to 100 ms, so backgrounding resumes the loop where it was.
- The readout hooks `renderer.runners.postrender`.
- Build output: PixiJS's dynamic imports split the build into chunks. At runtime the page fetches 12 JS chunks plus the HTML. The WebGPU and web-worker chunks are never fetched. The README tells ticket 3 to sum only the loaded chunks.

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 4 findings — high 0, medium 0, low 4, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` `destroy()` called `world.destroy({ children: true })`, which in pixi 8.22 leaves each line Graphics' owned GraphicsContext alive, leaking three per context-restore rebuild. Fixed: it now passes `{ children: true, context: true }`.
  - `[low]` `[reject]` The readout hooks `renderer.runners.postrender`, which also fires for the dot texture's `generateTexture` render after a context restore. That adds one extra counted frame, and only after a rare restore, never during a steady measurement window. Matching Phaser would mean rewiring the hook for no measurable gain.
  - `[low]` `[patch]` `countRenderedDots()` didn't check that the dot layer is attached, visible and renderable, nor each sprite's `renderable`. Fixed: all of these are now required.
  - `[low]` `[reject]` Renderer and filter resolution don't follow a DPR change after init. The target phones don't change DPR mid-run (same rejection as ticket 8), and handling it adds re-layout logic to a throwaway.

## Verification Results

- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e`: all pass (10 unit tests; 3 e2e: client tracer, bakeoff-phaser, bakeoff-pixi).
- `pnpm --filter @numception/bakeoff-pixi build`: exits 0. All chunks total about 158 kB gzipped. The loaded subset is smaller (no WebGPU or worker chunks).
- `cap:sync:pixi`: iOS and Android `public/index.html` are `Bake-off: PixiJS v8`. `cap:sync` restores `Numception`. `BAKEOFF=bogus` fails with `Unknown BAKEOFF="bogus". Expected one of: phaser, pixi`.
- The `grep` over `packages` and `apps/client/src` returns nothing.
- iOS simulator (iPhone 17, iOS 26.1): BUILD SUCCEEDED. The scene runs full-bleed with the readout below the status bar, and the loop goes from the zoomed tier-1 hold to the tier-2 hold. The shell was then restored with `cap:sync` and rebuilt.
- Headless WebKit at DPR 1 and DPR 3: no console errors and only same-origin requests. At DPR 3 the canvas backing store is 3x (1200x2100 for 400x700), and lines and glow are crisp. The glow fades out within 12 css px, with no clipped filter-bounds edges.
- Not done: real-device runs and Android builds (ticket 3). Simulator and headless fps are software-rendered and mean nothing.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && CI=1 pnpm e2e` -- expected: all exit 0
- `pnpm --filter @numception/bakeoff-pixi build` -- expected: exits 0; Vite prints the gzipped size
- `pnpm --filter @numception/client run cap:sync:pixi && pnpm --filter @numception/client run cap:sync` -- expected: both exit 0; the shell's `public/index.html` switches to the Pixi page and back
- `grep -rnE "pixi|renderer-bakeoff" packages apps/client/src` -- expected: no output

**Manual checks (if no CLI):**
- iOS simulator build after `cap:sync:pixi`: the loop runs and the readout updates. Restore with `cap:sync`.

## Auto Run Result

**Summary:** Built the shared bake-off scene in PixiJS 8.22.0 with pixi-filters 6.1.5 as `@numception/bakeoff-pixi`. Renderer and filters run at device pixel ratio. The README now lists the glow settings side by side (Pixi `distance: 12`, quality matched to 120 samples per pixel like Phaser's quality 10). It has the same readout, debug hook and e2e coverage as the Phaser build, and `cap:sync:pixi` loads it into the Capacitor shells.

**Files changed:**
- `prototypes/renderer-bakeoff/pixi/**`: the PixiJS app (scene, readout copied verbatim, setup, Vite and TS config) and its WebKit e2e spec.
- `prototypes/renderer-bakeoff/README.md`: glow mapping table, running instructions for pixi.
- `apps/client/capacitor.config.ts`, `apps/client/capacitor-config.test.ts`, `apps/client/package.json`: `pixi` webDir, its tests, `cap:sync:pixi`.
- `playwright.config.ts`, `tsconfig.json`, `pnpm-lock.yaml`: e2e project and webServer on :4175, TS reference, dependencies.

**Review findings:** 2 patches applied (both low), 1 deferred (CI timing of the bake-off e2e, medium unverified), 2 rejected (one extra counted frame after a context restore; DPR change without reload).

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 2.

**Verification:** `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (10/10), `pnpm build` and `CI=1 pnpm e2e` (3/3: client, bakeoff-phaser, bakeoff-pixi) all pass. `cap:sync:pixi` then `cap:sync` switches the shell between `Bake-off: PixiJS v8` and `Numception`. The implementer saw the loop running in the iOS simulator shell and crisp glow at DPR 3 in headless WebKit. No `pixi` or `renderer-bakeoff` references in `packages/` or `apps/client/src`.

**Residual risks:** gzipped size has to count only the files the page loads. Pixi splits WebGPU, canvas and worker renderers into separate files it may not fetch (about 158 kB gzipped for all files; see the README note). Pixi's fixed-angle glow sampling can show faint rays at line ends that Phaser's jittered sampling hides. Real-phone runs are ticket 3.
