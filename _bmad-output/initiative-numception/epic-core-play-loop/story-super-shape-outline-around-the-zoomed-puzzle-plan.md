---
title: 'Super-shape outline around the zoomed puzzle'
type: 'feature'
ticket: '9'
created: '2026-10-14'
status: 'built'
baseline_revision: 'd3045d20872ca15baf33c2a1efeb6c8ab4b601ce'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/story-solve-and-collapse-transitions-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/DESIGN.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** On the iPhone the user found the collapse "a little weird, not sure it's obvious that we're solving the super puzzle". Each puzzle fills the frame, so nothing shows it is a cell of a bigger puzzle until the collapse zooms out. The user suggested extending the super-shape's outline around the zoomed-in puzzle (`mockups/key-first-collapse.html` frame 1 also shows sibling tiles at the edges).

**Approach:** Whenever the shown puzzle or overview has a parent, frame it slightly smaller than full screen inside its parent's geometry, so the parent (super-shape) outline and the sibling cells show around it and run off the frame edges.
- **Siblings:** solved ones show their answers; unsolved ones are empty tiles.
- **Advance:** pans inside that same parent frame.
- **Collapse:** pulls out from this framing to the parent, so the bigger shape the player has been seeing all along is the one that resolves.

## Boundaries & Constraints

**Always:**
- **Core view (AD-13):** PlayVM gains an optional `context` when the current node has a parent:
  - `{ parent: <the parent drawn as an overview: cells with solved answers or empty, operator, geometry>, cellIndex: <which parent cell the current node fills>, camera: rect }`.
  - `camera` is the region of the parent's unit box to fit to the frame. The current node's cell bounds are expanded so that cell takes about 70–80% of the shorter frame dimension (a named, documented constant).
  - The top node has no context.
  - Beat views (`from`/`to`) carry their context too, so render can keep the parent framing through advance and collapse. The collapse's end state (the parent filling the frame) may then have its own grandparent context in Tower; that's consistent.
- **Render:**
  - Draws `context.parent` behind and around the current puzzle in the parent's coordinates, with the current puzzle drawn exactly in its cell. At n=3 cells "become", so the geometry matches.
  - **Parent styling:** quieter than the current puzzle. Use the Kiln line colour for its outline at reduced alpha, sibling tiles at reduced alpha, and sibling numerals at reduced size and alpha. Exact alphas are a documented constant. The current puzzle keeps its full look and is lifted (subtle shadow or stronger outline is optional).
  - The parent outline and siblings run off the frame edges; clipping is fine.
  - **Taps:** only the current puzzle's cells are tappable. Sibling and parent areas are dead space (no dispatch), apart from the press acknowledgement. In an overview, the enterable cells stay as they are.
  - **Advance:** camera between sibling cells inside the shared parent frame (from entry 3), now with the parent visible throughout.
  - **Collapse:** interpolate from the context framing to the parent filling the frame (the parent's own idle framing, including any grandparent context).
  - **Numeral sizing:** the current puzzle keeps the existing sizing, so tap targets don't shrink below the DESIGN floors. Check that the Kid ≥ 56 pt inscribed-circle rule still holds for n=3 at a 390×844 viewport with the current puzzle at about 75%. If not, pick the largest framing that holds and note it.
- **Tests:**
  - core: context presence and absence, the right `cellIndex`, camera containment, beat views with context.
  - render: unit tests for the framing maths.
  - e2e: a leaf view's hook data has a context and the canvas shows non-background ink outside the current puzzle's cell bounds (the parent outline/siblings); taps on sibling areas dispatch nothing; the play-throughs still pass.
- **Hitl step:** the orchestrator installs on the iPhone and the user confirms the collapse now reads as completing the super puzzle.

**Never:**
- Changing round flow, timing or durations (core entry 2), or making siblings tappable from a puzzle view.
- Themes, glow or sound.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Leaf in Classic | first leaf | puzzle at about 75% inside the visible parent outline; 2 empty sibling cells and the parent operator visible | No error expected |
| After a sibling solve | leaf 2 | leaf 1's cell in the parent shows its answer | No error expected |
| Top | Classic tier-2 or Tower top | no context; fills the frame as before | No error expected |
| Tower leaf | leaf under tier-2 node 1 | context = tier-2 node 1 | No error expected |
| Tap sibling area | tap on a parent cell outside the current puzzle | no dispatch; press acknowledgement only | No error expected |
| Collapse | group finished | pull-out from the context framing to the parent; no jump at the start | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/view/{play-vm.ts,select-view.ts,beat-views.ts?,kiln-tokens.ts,hit-test-view.ts}` -- the PlayVM and beat views from entry 3 (`from`, `to`, `camera`, `cellIndex`). Read select-view and beat-views first.
- `packages/core/src/rounds/round-node-id.ts` -- `parentOf`, `childrenOf`. A child's index within its parent is `index mod n` (bottom-anchored NodeIds; cell j of node (k, i) is child (k−1, i·n + j)).
- `packages/render/src/{create-renderer.ts,paint-view.ts,view-transform.ts,numeral-size.ts,beat-motion.ts}` -- drawing, camera transforms and numeral sizing (`sizingTransform`).
- `apps/client/src/test-hook.ts`, `apps/client/e2e/{play.spec.ts,play-helpers.ts}` -- e2e helpers (`frameInk`, `pixelAt`, answer finding).
- `_bmad-output/initiative-numception/ux-numception/mockups/key-first-collapse.html` -- frame 1 shows sibling tiles at the edges.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/view/*` (+ tests) -- the context with parent overview, cellIndex and camera, including in beat views. -- AD-13
- [x] `packages/render/src/*` (+ tests) -- draw the parent framing; keep it through advance and collapse; restrict taps. -- AD-14
- [x] `apps/client/e2e/*` -- context visible; sibling taps inert; play-throughs green. -- browser proof
- [ ] Hitl: the user confirms on the iPhone. -- user feedback

**Acceptance Criteria:**
- Given the repo, when `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass.
- Given the iPhone, when a Classic and a Tower round are played, then each puzzle sits visibly inside its super-shape with siblings around it, and the user confirms the collapse reads as completing the super puzzle.

## Implementation Notes

- **View (core/view):** `PlayVM.context?: PlayContextVM { parent, cellIndex, camera }` below the round's top (absent at the top). `parent` is the parent node drawn as an overview (solved cells show answers, unsolved ones are empty, `enters` all null, `solvedAnswer` null, no context of its own); `cellIndex` is `index mod n`; `camera` is `contextCamera`: the cell's bounding box grown about its centre by `1 / CONTEXT_CELL_SHARE` (`CONTEXT_CELL_SHARE = 0.75`, `camera-rect.ts`). `nodeView` adds it, so beat `from`/`to` views carry it too.
- **Beat cameras:** `CameraVM` is now `{ from, to, fromBox }`: `from`/`to` are the two views' idle framings in the `to` view's unit box (`idleCamera`: the whole shape at the top, else the context camera mapped through the nesting); `fromBox` is where `from`'s shape box sits (the old `camera.from`, `relativeCamera`). A collapse therefore starts exactly on the child's context framing and lands on the parent's own (whole frame in Classic; its context in the top for a Tower tier-2 node); an advance pans between sibling framings inside the shared parent.
- **Render:** `idleTransform` (fit the context camera, nest the view in its parent cell; else `fitView`) is the rest and hit-test transform; `contextTransform` places a parent from wherever its child is drawn (inverse nesting), so the parent follows every beat. The parent is drawn with `contextLook` (`LayerLook.quiet`), styled by `CONTEXT_STYLE` (`beat-motion.ts`): line alpha 0.5; open tiles and operator wash 0.45; fired (solved) tiles 0.75 with their answers at full alpha, so a solved sibling's answer is ≈ 3.3:1 against its quiet tile (≥ 3:1, unit-tested from KILN_TOKENS); other numerals and the operator glyph 0.6; all numerals at 0.6 size. The parent's cell under the puzzle in view is left out (`LayerLook.cellFade`), so the puzzle's operator area looks as at the top and nothing stacks beneath it; during an advance the cells under the leaving and arriving puzzles crossfade with them, and a Tower grandparent leaves out the cell under its collapsing parent.
  - **Taps:** hit-testing uses the puzzle's own transform and `hitTestView`, so sibling and parent areas resolve to nothing; the press acknowledgement is unchanged.
  - **Collapse:** the parent (`to`) starts in the context look (quiet, fired solved cells, dimmed operator) and settles to its full look over the first 60 % (`collapseToLook.quiet`). The collapsed cell's answer eases from number-solved back to number as before; the other answers (DESIGN round-collapse) start at the context size, reach number-solved at 60 % as the context style lifts (`collapseOthersBoost`), then ease back to number. Numerals are sized from the context parent's rest scale blending to its own (`blendScale`). A Tower grandparent fades in over the first 30 % (`contextFadeIn`). Camera time is still linear.
  - **Advance:** a shared parent stays drawn at full context strength; when parents differ (Tower tier-2 puzzle → the next group's leaf) the old parent fades with `from` and the new one fades in, higher tier drawn first. The arriving puzzle now fades in over the first half (`advanceToAlpha`), since its cell was a quiet empty tile on screen at the start.
  - **roundStart:** each side's parent crossfades with it.
- **Numeral sizing / Kid floor:** at 390 × 844 a 3A leaf at 75 % has a cell inscribed circle of about 77 pt (≥ 56 Kid floor); numerals stay ≈ 43 px (were 45.8 at full frame), unit-tested. The 75 % framing holds, so no fallback was needed.
- **e2e:** a 390 × 844 test checks the first leaf's hook context, ink in a strip below the puzzle (parent outline and lower cells), that taps on both siblings and the parent's operator dispatch no event and leave the view unchanged, and that leaf 2's context shows leaf 1's answer as solved; the mid-collapse test also checks `from.context` and that `camera.from` is the child's context camera.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 3 findings — high 0, medium 1, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` Solved siblings' answers composited at about 1.58:1 against their quiet tiles, below DESIGN's ≥ 3:1 for dimmed numerals. Fixed: solved parent tiles at 0.75 alpha with full-alpha answers (about 3.3:1, still quieter than the puzzle's 5.1:1), with a unit test computing contrast from KILN_TOKENS.
  - `[low]` `[patch]` The parent's cell under the current puzzle showed through the puzzle's translucent operator wash, and stacked during Tower collapses. Fixed: per-cell fade (`cellFade`), so the parent and grandparent never draw the cell the puzzle occupies.
  - `[low]` `[patch]` The collapse dropped DESIGN's number-solved boost for the parent's other answers. Fixed: all solved answers reach number-solved by 60% of the beat and ease back (`collapseOthersBoost`).

## Verification

**Commands:**
- the acceptance chain above -- expected: all exit 0

**Result (2026-10-14):** with and without `BASE_PATH=/numception/`: `pnpm typecheck`, `lint:deps`, `test` (891), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (21 passed, 1 skipped: real WebGL context restore) all pass. Headless WebKit screenshots at 390 × 844 checked frame continuity at solve → advance, advance → idle and solve → collapse (≈ 0.5 % of pixels differ, from the solve's last frame step).

## Auto Run Result

**Summary:** Puzzles below the round's top sit at 75% of the frame inside their parent's quiet outline, with solved siblings showing their answers and unsolved ones as empty tiles, running off the frame edges. The framing carries through advances and collapses, so the collapse resolves the shape the player has been seeing. Taps outside the current puzzle are inert.

**Hitl verdict (user, iPhone 16 Pro, 2026-10-14):**
- "Much better visually."
- The collapse into the large puzzle was then too slow, so durations were shortened to 1200 ms first and 800 ms later (commit ba2b963).
- After the change: "Good to go. Fine for now, might tweak later."

**Review findings:** 3 patches applied (1 medium, 2 low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false.

**Verification:** with and without `BASE_PATH=/numception/`, typecheck, lint, 893 unit tests, build, flavour and budget checks, and e2e (21 passed, 1 skipped) all pass. The user played it on the iPhone.

**Idea for later:** live dev-panel sliders for the `presentation` tuning values, so timings can be adjusted on the phone without a rebuild (user: "might be nice to have these settings defined in one place"; they already are, in `content/tuning/1.json`).
