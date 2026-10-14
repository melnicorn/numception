---
title: 'Solve and collapse transitions'
type: 'feature'
ticket: '3'
created: '2026-10-14'
status: 'in-review'
baseline_revision: '7ec0efe77039b71625b4e6857fc0227c41644e27'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/epic-core-play-loop.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/story-round-flow-tiers-and-presentation-timeline-in-core-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/DESIGN.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Core now runs solve, advance, collapse and roundStart beats over Tick time, but render just waits during them. The defining moment — a solved round collapsing into the next tier, zooming out to reveal a bigger puzzle (EXPERIENCE Flow 1 climax; `mockups/key-first-collapse.html`) — is invisible. This entry completes the user's bare-minimum playable build.

**Approach:** Give render enough view data to draw each beat, and interpolate it over `presentation.progress`.
- **solve:** the tapped answer tile fires (`cell-solved`), its numeral grows (44 → 58 px at n=3), and the operands and seams fade.
- **advance:** the camera moves to the next puzzle.
- **collapse:** the solved children fuse into their parent cell while the camera pulls out to the parent puzzle. At n=3 the cell **becomes** the next-tier puzzle.
- **roundStart:** a ≈ 400 ms crossfade into the next round's first puzzle.

## Boundaries & Constraints

**Always:**
- **Core view (AD-13):** render stays a pure function of the view plus `progress`. Core extends `PresentationVM` (or PlayVM) with what the current beat needs, computed in `core/view`:
  - **solve:** the tapped answer `cellIndex`.
  - **advance and collapse:** a `from` and a `to` view (the same `PlayVM` shape, without nested transitions), plus a **camera** pair `{ from: rect, to: rect }` in the `to` view's unit box.
    - **advance:** the camera pans and zooms between the two leaves' cells inside their shared parent's geometry, a short pull-back then push-in, or a straight pan. Keep it simple and documented.
    - **collapse:** `from` (the solved child) starts filling the frame and shrinks into its cell's bounds in the parent overview or puzzle (`to`), which takes over.
    - **Geometry:** derived from `core/layout` cell polygons and their bounding boxes. A cell that "becomes" (FR-9) uses its polygon. "Contains" only applies at n ≥ 5 (not served yet), so a bounding-box frame is enough there.
  - **roundStart:** `from` (the last puzzle) and `to` (the new round's first puzzle) for the crossfade.
  - At idle, `from` and `to` are absent.
- **Render (`packages/render`, PixiJS 8.22, no pixi-filters):**
  - Interpolate positions, scales and alphas with simple eases from `progress`.
  - **Zoom velocity is capped and never accelerates (FR-9):** use linear or ease-out scale over time for camera moves, and never ease-in on zoom.
  - **First collapse:** its long duration (3000 ms) is driven by core, with no guide text and no extra UI.
  - **Rebuilds:** render rebuilds from the view on every frame that carries a new `transitionId` or progress. It keeps no game state, and after a lost WebGL context (`webglcontextlost`/`restored`) it rebuilds from the latest view (AD-14).
  - **Press acknowledgement:** every pointer-down still draws the same-frame acknowledgement, even while input is locked.
  - **Frame time:** frame time is for interpolation smoothness only; truth is `progress` from Tick time (AD-14, AD-17).
  - **Kiln tokens:** use those in `core/view/kiln-tokens.ts` (extend them from DESIGN.md if a role is missing, e.g. `cell-solved-number`, `seam`).
- **Performance:** keep the scene light (a handful of Graphics and Text per frame). Avoid recreating Text objects every frame where reuse is easy; measured 60 fps is entry 7.
- **e2e:** the existing Classic and Tower play-through stays green. Add a test that samples the canvas (or the test hook's view) mid-collapse and asserts a transition with `from`/`to` is in progress and the frame isn't blank. No pixel-perfect screenshots.
- **Hitl step:** the user plays a Tower n=3 round on the iPhone (playtest PWA or the Capacitor playtest shell) and confirms the solve, collapse and crossfade beats read well. The orchestrator installs the build; record the user's verdict in the plan.

**Never:**
- Sound, haptics, theme transitions or particles (epic-themes-and-feedback); glow.
- Changes to the timeline rules, durations or round flow in core (entry 2), except adding view fields.
- Persistence or keyboard (entries 4–5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Solve | correct tap | answer tile fires the same frame; numeral grows; operands fade over `solveMs` | No error expected |
| Advance | after a leaf solve | camera moves to the next leaf over `advanceMs`; no blank frame | No error expected |
| Group collapse | 3rd leaf of a group solved | the child shrinks into its cell in the parent; the parent appears around it; long the first time | No error expected |
| Tier collapse | last tier-2 puzzle solved (Tower) | tier-2 level collapses into the top the same way | No error expected |
| Round start | top solved | ≈ 400 ms crossfade into the next round's first leaf | No error expected |
| Tap during beat | any tap while locked | press acknowledgement drawn; nothing dispatched | No error expected |
| Context loss | `webglcontextlost` then restored | scene rebuilt from the latest view | No error expected |
| Resize mid-beat | viewport resize | transition continues correctly scaled | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/view/{play-vm.ts,select-view.ts,kiln-tokens.ts,hit-test-view.ts}` -- `PlayVM { nodeId, kind: puzzle|overview, shapeId, aspect, cells[{ index, polygon, labelPoint, inscribedRadius, text, state, enters }], operator, inputLocked, presentation: { kind, progress, durationMs, transitionId }, theme }`. Extend it here.
- `packages/core/src/state/{run-timeline.ts,end-beat.ts,reduce-tick.ts,...}` and `packages/core/src/presentation/*` -- beat kinds and what each beat is moving from and to. Read them; don't change the rules.
- `packages/core/src/layout/*` -- cell polygons and the shape registry (3A for n=3; cells "become").
- `packages/render/src/{create-renderer.ts (244 lines),view-transform.ts,numeral-size.ts,draw-key.ts,is-primary-press.ts,render-port.ts}` -- the renderer from entries 1–2. It skips rebuilds when only progress changes (entry 2); transitions now need per-frame updates during beats.
- `apps/client/src/{main.ts,test-hook.ts}`, `apps/client/e2e/{play.spec.ts,play-helpers.ts}` -- wiring and e2e.
- `_bmad-output/initiative-numception/ux-numception/mockups/key-first-collapse.html` -- the 5-frame collapse storyboard. `DESIGN.md` covers `round-collapse` and the solved state.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/view/*` (+ tests) -- the beat's `from`/`to` views, camera rects and tapped cell. -- AD-13
- [x] `packages/render/src/*` (+ unit tests for interpolation and camera maths) -- solve, advance, collapse and roundStart drawing; context-loss rebuild. -- AD-14, FR-9
- [x] `apps/client/e2e/*` -- mid-collapse transition test; play-throughs still green. -- browser proof
- [ ] Hitl: install on the iPhone; the user confirms the beats (orchestrator records it). -- Done-when 2 on the device

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass.
- Given the iPhone, when a Tower n=3 round is played, then 9, 3 and 1 puzzles show with visible solve beats and a collapse after each group and tier, and the round flows into the next with a crossfade and no end screen (user-confirmed).

## Implementation Notes

- **View (core/view):** `PresentationVM` gains `cellIndex` (solve: the tapped answer; collapse: the cell of `to` the child fills; else null) and, for advance/collapse/roundStart, `from`/`to` (`PlayVM`s whose own presentation has no nested transition) and, for advance/collapse, `camera { from, to }` (`CameraRect`s in the `to` view's unit box; `to` is always the shape's bounding box = the idle camera; the `from` view is drawn with its shape box at `camera.from`). Idle has none of them. `PlayVM.solvedAnswer` is the answer cell when the node in view is itself solved (drawn fused). `selectView` is split into `node-view.ts` (any node's view), `beat-views.ts` (what the beat draws) and `camera-rect.ts` (nesting geometry).
- **Reconstructing `from`:** core's timeline has already moved `viewPath` when a beat runs, so `from` is derived: collapse = the last solved node (child of the view); advance = the last solved node, or its parent when that solve completed the group (the collapse ran first, e.g. Tower tier-2 node 0 → leaf 3). Camera geometry nests each child's shape box into its cell's bounding box (exact for 3A "becomes"; a bounding-box frame for "contains"), composed from the top down, so an advance pans/zooms through the shared ancestors.
- **One state field (view data only):** the completed round is dropped at round end, so `Round.previousTop: Puzzle | null` keeps the solved top for the roundStart crossfade (set in `completeRound`, null from `startRound`). No timeline rule, duration or flow changed.
- **Kiln tokens:** `numberSolvedSizePx` 58, `operatorTier2SizePx` 38, `operatorDimAlpha` 0.32 (DESIGN typography and operator-cell).
- **Render:** `beat-motion.ts` (pure, tested) holds the eases and per-beat looks; `paint-view.ts` draws one view with a look; `scene-pool.ts` reuses Graphics and Text across frames (Text re-rasterises only when its string, size or colour changes; motion is position/scale/alpha). `drawKey` now includes a beat's kind, transitionId, progress and cellIndex, so every beat frame redraws and an unchanged idle view doesn't.
  - **solve:** the answer tile fires at progress 0; its numeral grows 44 → 58 px and moves to the shape centre (ease-out); operands and the operator shrink in and fade; the whole shape then fills with `cell-solved` over the seams (they fade last) — DESIGN round-collapse frame 2.
  - **collapse:** camera from `camera.from` (the child's cell) to the whole parent, a zoom about the rects' homothety centre with the scale moving geometrically over **linear** time (constant zoom velocity, FR-9). The fused child fades over the first 30 %, the parent's other cells and operator fade in over the first 25 %, answers ease 58 → 44 px (numerals are sized in screen space, not scaled by the camera), fired cells cool to open tile over the last 30 % (numeral ink swaps at half-way, a blend would vanish into the blended fill), and the operator rises from 0.32 to full.
  - **advance:** same camera maths with **ease-out** time; `from` (fused if solved) fades over the second half. Numerals are sized from each layer's current on-screen scale (`sizingTransform`), so a scale-changing advance (Tower tier-2 → next group's leaf) keeps them in proportion to their tiles; collapses keep rest sizing.
  - **roundStart:** the old top fades out while the new round fades in, both over the first half, so from half-way nothing of the old fused top shows through the new operator's faint wash.
  - **Rest look change:** a playable upper-tier puzzle now draws its cells as open tiles (the collapse's end state, DESIGN frame 5) instead of fired; an overview keeps fired solved cells and dims its operator (0.32) until its tier opens.
  - **Context loss:** on `webglcontextlost` frames are skipped (`Renderer.stats()` counts rendered frames and rebuilds; the dev/playtest test hook exposes it as `renderStats`); on `webglcontextrestored` (Pixi re-inits GL first) the pool is destroyed and the frame redrawn from the latest view. The press acknowledgement is unchanged (same frame, also while locked).
- **e2e:** a test samples the canvas (screenshot decoded in-page) mid-solve, mid-first-collapse (`from`/`to`/camera present, frame has ink and fired pixels) and in the crossfade's second half (frame not blank; a pixel of the new operator region is not the solved fill); a synthetic lost/restored event test asserts no frame renders while lost, the rebuild counter increments once on restore, frames resume and play continues; a real `WEBGL_lose_context` test skips where the browser never restores (headless WebKit never fires `webglcontextrestored`).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0
