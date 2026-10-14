---
title: 'Tap a puzzle tracer'
type: 'feature'
ticket: '1'
created: '2026-10-14'
status: 'built'
baseline_revision: '084a813e2b41ec259f8e8fee738a526ebc540dc4'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/epic-core-play-loop.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** There's no game yet. The client page shows a tracer value, and `render` is an empty package. The user's priority is a bare-minimum playable build on their iPhone and in the browser, and this tracer is the first slice: the thinnest path through every layer of the play loop.

**Approach:** The page opens straight into the first tier-1 puzzle of a Classic n=3 `+` round, drawn on a PixiJS canvas from core geometry in Kiln colours. A tap travels render → app → core → app → render in one call stack. A correct tap marks the puzzle solved and enters the next one, and the round loops. There are no animations, no persistence and no Tower yet (entries 2–4).

## Boundaries & Constraints

**Always:**
- **core (pure; AD-1/AD-3; one exported concept per file; `Result` for bad input):**
  - **State root (AD-21, minimal):** `AppState = { device: { activeProfileId }, profiles: { [profileId]: GameState }, activeProfileId }`.
    - `GameState = { profileId, profileKind: 'kid', rootSeed, settings: { mode: 'zen', motion: 'calm' }, roundOrdinal, rounds: { activeRoundId, byId } }`.
    - Create the default Kid profile through one `createProfile(kind, ctx)` path that applies AD-21's Kid defaults, so later epics extend it.
  - **Round (AD-24, minimal):** `{ roundId, type: 'classic', seed, mode: 'zen', tuningVersion, plan: RoundPlan, puzzles: { [nodeKey]: Puzzle } (realised leaves, frozen once realised, AD-4), solved: nodeKey[], viewPath: NodeId[] (AD-25) }`.
  - **Commands and step (AD-2, AD-22):** `step(state, { command, ctx }) → { state, events }`, where `ctx = { nowMs, localDate, utcDate, entropy: { ids, seed32 } }`. Commands for this entry:
    - `StartSession`: creates the profile if none exists (rootSeed and ids from `ctx.entropy`), then plans round `roundOrdinal` with `planRound({ type: 'classic', n: 3, operator: 'add' }, tuning, deriveSeed(rootSeed, roundOrdinal), versions)`. It realises the first leaf at band 1 through `realiseRoundNode` and sets `viewPath` to `[top, firstLeaf]`.
    - `TapCell { nodeId, cellIndex }`: `classifyTap`. On `correct`, the node is marked solved, `PuzzleSolved` is emitted, and the view advances to the next unsolved leaf (realised lazily). After the last leaf it enters the tier-2 puzzle, the plan's top puzzle, with no animation. Solving that emits `RoundCompleted`, increments `roundOrdinal` and starts the next Classic round. `wrong` or `softMiss` emit `WrongTap` or `SoftMiss` and change nothing else.
    - Tuning is passed to `step` explicitly (AD-7). `step` never throws on game input.
  - **View (AD-13, `core/view`):** `selectView(state, tuning) → PlayVM`.
    - `PlayVM = { nodeId, shapeId, aspect, cells: [{ index, polygon, labelPoint, inscribedRadius, text (displayValue), state: 'unsolved' | 'solved' }], operator: { polygon, labelPoint, symbol }, inputLocked: false, theme: KilnTokens }`.
    - The geometry comes from `core/layout` (`defaultShapeFor(3)` gives 3A). For the tier-2 puzzle, cells show each solved child's answer.
    - Adapters never branch on profile or mode; they read PlayVM.
  - **Hit-testing:** `hitTestView(vm, point, tolerance) → { nodeId, cellIndex } | null`, wrapping `core/layout` `hitTest`. Null on shared edges, the operator, outside the shape, or when `inputLocked`.
- **app:**
  - `createGame({ tuning, entropy })` returns `{ dispatch(command), getView(), subscribe(listener), hitTest(point) }`.
  - `dispatch` builds the AD-22 envelope: time from an injected clock (`now()` passed in by the client, so app reads no clock itself), and entropy from an injected source (the client supplies `crypto.getRandomValues`-backed ids and seed32 values). It runs `step`, then `selectView`, then notifies listeners **synchronously**.
  - app re-exports the core view and hit-test types and functions that render and ui need, because the adapters may import core only as types (lint rule `adapters-import-core-types-only`).
  - No scheduler and no Tick yet (entry 2).
- **render (new; pixi.js ~8.22.x as a dependency of `packages/render` only):**
  - `createRenderer()` implements the AD-14 `RenderPort`: `{ mount(el), render(vm), hitTest(point) → NodeCellRef | null, destroy() }`.
  - **Drawing:** Kiln tokens from `ux-numception/DESIGN.md`. Surface `#ECE3D7` (the background may be flat), tiles `#F6F0E8` with a 1.5 px line `#AC644E`, numbers `#994A33`, operator `#A14E36`, solved fill `#A14E36` with numerals `#F6F0E8`. Font stack `Futura, 'Century Gothic', sans-serif`, weight 500.
  - **Layout:** the shape fills most of the viewport with a 16 px gutter inside the safe areas, respecting `aspect`. Numerals stay upright and are centred on `labelPoint`, sized from `inscribedRadius` (e.g. about 1.1 × radius, capped by DESIGN's 44 px at n=3 on a 375 px-wide frame).
  - **Rendering rules:** device pixel ratio and `autoDensity`; resize-aware; no pixi-filters. The scene rebuilds fully from the latest PlayVM on every `render`, so there is no retained game state in render.
  - **Pointer input:** on pointer down, render draws a same-frame press acknowledgement at the pointer: a short-lived ripple or dot in `#AC644E`, **independent of hitTest**. On pointer up, it hit-tests in unit-box space through app's `hitTest` (tolerance about 3 CSS px converted to drawn-height units per the `core/layout` docs) and calls an `onTap(ref)` callback.
- **client (`apps/client/src/main.ts`):**
  - Replaces the tracer page with the game. Loads `content/tuning/1.json` (bundled, so offline works), parses it through app, creates the game and renderer, wires `onTap` → `dispatch(TapCell)` and `subscribe` → `render`, and dispatches `StartSession` at startup.
  - The first painted frame must be the puzzle. If tuning fails to parse, show a plain error text (playtest and dev only), never a crash loop.
  - The dev panel and PWA wiring stay as they are. Remove the old tracer from the page and its e2e (`tracer.spec.ts`). The `tracerValue` and `tracerMessage` code may stay or go; prefer removing them if nothing else uses them.
- **Tests:**
  - core: headless `step` tests (StartSession, a correct tap advances, wrong and soft-miss taps change nothing, the full Classic loop into the next round, determinism with fixed entropy) and `selectView` / `hitTestView` tests.
  - app: dispatch is synchronous and listeners see the new view.
  - **WebKit e2e on the playtest preview:** the first frame shows a canvas with a puzzle, with no other UI except the dev-panel button. Read the current puzzle through a dev/playtest-only test hook on `window` (e.g. `__numception.view()`, absent in prod, checked by `check:flavours`), click the answer cell's `labelPoint` mapped to page coordinates, and the next puzzle appears. Clicking the operator centre changes nothing.
  - The existing dev-panel, inspector and offline specs stay green.

**Never:**
- Animations, presentation timeline, Tick or scheduler (entries 2–3).
- Tower rounds, `EnterPuzzle` from an overview, or the collapse (entry 2).
- Persistence (entry 4), keyboard or accessibility (entry 5), soft-miss presentation (entry 6), themes beyond Kiln, sound or haptics.
- Importing pixi.js anywhere but `packages/render`, or core values (not types) in render or ui.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Launch | fresh page | first frame: tier-1 puzzle of Classic n=3 +, 3A shape, Kiln | No error expected |
| Correct tap | tap the answer cell | `PuzzleSolved`; next leaf shown | No error expected |
| Last leaf | solve the 3rd leaf | the tier-2 puzzle (cells = the 3 answers) is shown | No error expected |
| Round end | solve the tier-2 puzzle | `RoundCompleted`; next Classic round's first leaf | No error expected |
| Wrong tap | tap a non-answer cell | `WrongTap`; nothing else changes | No error expected |
| Edge or operator | tap a shared edge or the centre | no `TapCell` dispatched; press ripple still drawn | No error expected |
| Determinism | same entropy and command sequence | identical states and views | No error expected |
| Bad tuning | tuning fails to parse | error text, no crash | shown as text |
| Prod | prod build | game present; no test hook; no dev panel | check fails otherwise |

</intent-contract>

## Code Map

- **core exports today** (`packages/core/src/index.ts`): `planRound`, `realiseRoundNode`, `ROUND_TYPES`, `RoundPlan` (nodes `{ nodeId, contract?, puzzle? }`; upper tiers carry the puzzle), `deriveSeed`, `parseTuning`, `versionsFor`, `classifyTap`, `displayValue`, `rational`, `childrenOf`, `parentOf`, `topNodeId`, `nodeCount`, the `core/layout` API (`SHAPES`, `defaultShapeFor`, `hitTest(layout, point, edgeTolerance)` with tolerance in drawn-height units, `focusOrder`, `ShapeLayout` and `CellGeometry` types), `bucketOf`, `DomainError`, `Result`.
- **Empty packages:** `packages/core/src/rounds/round-types.ts` has a note saying the play-loop epic adds `onSolve` and `isComplete` (entry 2; not needed here). `packages/render/{package.json,src/index.ts}` is an empty stub. `packages/platform-web` is empty.
- **Lint (`.dependency-cruiser.cjs`):**
  - `render-imports-only-app`, `ui-imports-only-app` and `adapters-import-core-types-only` (render and ui may import core only via `import type`).
  - pixi.js is allowed only in render.
  - `apps/client` may import anything.
  - The purity check covers `core/{generator,random,rounds,rules}`. Put core/view and state code in new folders such as `core/state` and `core/view`. Floats are fine there.
- **app:** `packages/app/src/{demo-puzzle.ts,inspect-round.ts}` show the parse-then-core pattern. `packages/app/package.json` depends on core.
- **ui:** the dev panel (`packages/ui/src/dev-panel/*`); `mountTracer` lives in `packages/ui/src/mount-tracer.ts`.
- **client:** `apps/client/src/main.ts` mounts the tracer, the guarded dev panel with the tuning glob and the PWA registration. `index.html` has `#app` and safe-area body padding. `flavours.ts` has the flavour table and `devPanel` flag; `__NUMCEPTION_DEV_PANEL__` is the build constant for the test hook guard.
- **e2e:** `apps/client/e2e/*.spec.ts` run on the playtest preview (`playwright.config.ts` project `webkit`); `tracer.spec.ts` asserts `5/6` and should be replaced.
- **Design:** `_bmad-output/initiative-numception/ux-numception/DESIGN.md` (Kiln tokens, typography, shapes) and `mockups/key-play-n3.html`.
- **Bake-off reference only:** `prototypes/renderer-bakeoff/pixi/src/main.ts` shows PixiJS 8 Application setup with DPR, autoDensity and resize. Don't import it.
- pnpm 11 enforces a minimum release age. Pin `pixi.js ~8.22.0` (already in the lockfile for the prototype).

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/state/*` (+ tests) -- AppState, GameState, Round types, `createProfile`, `step` for StartSession and TapCell, events. -- AD-2, AD-21, AD-22, AD-24, AD-25
- [x] `packages/core/src/view/*` (+ tests) -- `selectView`, `PlayVM`, Kiln tokens, `hitTestView`. -- AD-13
- [x] `packages/app/src/game.ts` (+ tests) -- `createGame` with synchronous dispatch and injected clock and entropy; re-exports for adapters. -- shell
- [x] `packages/render/*` (+ unit tests where practical) -- the PixiJS RenderPort, press acknowledgement and pointer hit-test. -- AD-14
- [x] `apps/client/src/main.ts`, `apps/client/e2e/play.spec.ts` (replacing `tracer.spec.ts`), dev/playtest test hook -- composition and the browser proof. -- playable tracer
- [x] `tools/check-flavours.mjs` (if needed) -- the prod build has no test hook. -- AD-18

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass.
- Given the playtest preview, when the page loads, then the first frame is a Classic n=3 + puzzle. Tapping the answer shows the next puzzle, three solves lead to the tier-2 puzzle, and solving it starts a new round.
- Given the prod build, when it is searched, then it contains the game but no dev panel and no test hook.

## Implementation Notes

- `step(state, envelope, tuning)`: tuning is the explicit third argument. A malformed envelope, a tap on a puzzle not in view, an invalid cell or no active round returns the state unchanged with a `CommandRejected { command, code, message }` event (new `DomainError` code `invalid-command`). A correct tap whose next puzzle or next round can't be realised is rejected atomically.
- Extra events beyond the plan: `ProfileCreated` and `RoundStarted`. `StartSession` on a profile that already has an active round is a no-op. Completed Classic rounds are dropped from `rounds.byId`, so it doesn't grow without bound.
- `selectView` returns `PlayVM | null` (null before the first `StartSession`). The tier-2 puzzle's cells are `state: 'solved'` (accent fill, light numerals) where their child is solved; its values are the plan's top cells, which equal the children's answers.
- `NodeKey` is `"<tier>.<index>"`. The leaf band is fixed at 1 (`LEAF_BAND`) until the selector exists.
- app: `createGame({ tuning, entropy, now })`. `now` is the injected clock, and `localDate`/`utcDate` are derived from it in app. `dispatch` returns the events, and listeners get `(view, events)`. app re-exports `parseTuning`, `hitTestView` and the view/layout types for the adapters and the client. The tracer code (`tracerValue`, `tracerMessage`, `mountTracer`, `TracerBadge`) is removed; `ui`'s root now exports nothing.
- render: `createRenderer({ onTap })` returns the RenderPort (no `play` yet) plus `pagePoint` for the test hook. `fitView` fits the shape's bounding box (not the raw unit box) inside a 16 px gutter. The numeral size is `min(1.1 × on-screen radius, 44 px × max(1, frameWidth / 375))`, floored at 20 px; the operator is scaled by 32/44. The operator space is a 9 % accent wash, as in the mockup. The cell inset is not drawn. The canvas is drawn before it is attached to the page, and `#app`/body use the Kiln surface, so the first visible frame is the puzzle.
- The client bundles `content/tuning/1.json` with an eager `import.meta.glob`, which avoids tsconfig `rootDir` issues. `ulid`/`webEntropy` (crypto.getRandomValues) live in `apps/client/src/web-entropy.ts`. The test hook (`apps/client/src/test-hook.ts`, `window.__numception`: `view()`, `pagePoint()`, `events()` since install) is a dynamic import behind `__NUMCEPTION_DEV_PANEL__`. `check:flavours` check 7 requires it in dev and playtest and forbids the string `__numception` in prod.
- Review fixes: render constructs `WebGLRenderer` directly with a static `import 'pixi.js/browser'` and `manageImports: false`, and drives it with its own `Ticker` plus a `ResizeObserver`. No lazy chunk loads before the first puzzle frame; `init` is still async, but it only awaits microtasks. An unused, never-fetched `webworkerAll` stub chunk remains because PixiJS's webworker extension keeps a dynamic import. The entry chunk is ~155 kB gzipped, so `chunkSizeWarningLimit` is 600. Only primary-button presses count (`isPrimaryPress`), and the canvas suppresses the context menu. The dev panel reuses the eagerly bundled tuning 1 instead of globbing it lazily too (no INEFFECTIVE_DYNAMIC_IMPORT warning). The `user-select` and `touch-callout` rules are scoped to `#app`.
- e2e: `tracer.spec.ts` was replaced by `play.spec.ts` (with the flavour-identity test kept) and `play-helpers.ts`. `dev-panel.spec.ts` and `offline.spec.ts` now assert the canvas and puzzle instead of the tracer value.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 3 findings — high 0, medium 1, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` `Application.init` lazily loaded renderer and environment chunks, so the first painted frames were bare background, not the puzzle. Fixed: static `pixi.js/browser` and a directly constructed `WebGLRenderer` (`manageImports: false`) with own Ticker and ResizeObserver; no chunk fetch between script load and the first puzzle frame. `renderer.init` stays async in PixiJS 8.22 but fetches nothing; the scene is drawn before the canvas is attached. Measuring the first frame on device is entry 7. The `INEFFECTIVE_DYNAMIC_IMPORT` warning was removed too (the dev-panel glob reuses the bundled `1.json`).
  - `[low]` `[patch]` Right and middle clicks drew the press dot and dispatched TapCell. Fixed: `isPrimaryPress` (primary pointer, button 0) on down and up, context menu blocked on the canvas, with unit tests and a right-click e2e.
  - `[low]` `[patch]` `user-select: none` on `body` blocked selecting dev-panel text. Fixed: scoped to `#app`.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0

**Manual checks:**
- iOS simulator or iPhone (optional for this entry): the playtest build opens on a puzzle, and tapping answers advances.

## Auto Run Result

**Summary:** The game is playable at its thinnest. The page opens straight onto a Classic n=3 + puzzle drawn by a fresh PixiJS 8.22 renderer in Kiln colours.
- **Core:** the state root and default Kid profile, `step` (StartSession, TapCell), `selectView`/PlayVM and `hitTestView`.
- **App:** `createGame` with synchronous dispatch and injected clock and entropy.
- **Render:** draws the AD-14 RenderPort with a same-frame press acknowledgement and primary-only taps.
- **Flow:** a correct tap solves and advances, three solves reach the tier-2 puzzle, and solving it starts the next round.
- **Test hook:** dev/playtest only.
- **Old tracer:** removed.

**Files changed:** `packages/core/src/{state,view}/*` (+ tests), `packages/app/src/game.ts` (+ re-exports, tests), `packages/render/*` (new renderer, primary-press, sizing, with tests), `apps/client/{src/main.ts,src/test-hook.ts,src/web-entropy.ts,index.html,vite.config.ts,e2e/*}`, `tools/check-flavours.mjs`; tracer code and spec removed.

**Review findings:** 3 patches applied (1 medium, 2 low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 1, low 2.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm typecheck`, `lint:deps`, `test`, `build` (no warnings), `check:flavours` (test hook absent in prod), `check:budget` (playtest about 0.2 MB gzipped) and `CI=1 pnpm e2e` all pass.
- The e2e plays through a Classic round via the canvas, and checks that edge, operator and right-click taps do nothing.

**Residual risks:**
- Not yet tried on the iPhone (optional for this entry; entry 3 has the hitl check).
- Futura falls back to system fonts.
- The 10 px cell inset isn't drawn yet.
