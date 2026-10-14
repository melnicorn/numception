---
title: 'Round flow, tiers and presentation timeline in core'
type: 'feature'
ticket: '2'
created: '2026-10-14'
status: done
baseline_revision: 'a1c39ed3651cc0496ca90ec373415e794a00738b'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/story-tap-a-puzzle-tracer-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Entry 1 plays only Classic rounds, with instant state changes. Nothing models time, so solve and collapse beats, dropped input and the Tower round (Done-when 2) are missing, and render has nothing to animate from.

**Approach:** Complete the round flow as pure core state plus its clock:
- Tower rounds alongside Classic, from a simple `nextRoundRequest`.
- Breadth-first play with collapses.
- Tap-to-enter from an overview.
- An AD-20 presentation timeline advanced only by `Tick`, with durations from a new TuningConfig `presentation` section.
- The AD-17 scheduler in app that dispatches `Tick`.

The build keeps playing correctly with transitions simply waiting out their durations until entry 3 draws them.

## Boundaries & Constraints

**Always:**
- **Round sequence:**
  - A pure `nextRoundRequest(game) → PlanRequest`. It alternates Classic and Tower at n=3, `+`, with rounds 0, 2, 4… Classic and 1, 3, 5… Tower (epic Notes stand-in for level progression).
  - Seed: `deriveSeed(rootSeed, roundOrdinal)`, and the start band is band 1.
  - It replaces entry 1's fixed `CLASSIC_REQUEST`.
- **Breadth-first play (epic Notes):**
  - Leaves are played in index order.
  - When the last unsolved child of a tier-2 node is solved, that group collapses into its tier-2 cell (a `collapse` presentation).
  - After all leaves, the tier-2 puzzles are played in order, then the top, which for Classic is directly the tier-2 puzzle.
  - After a solve, the view auto-advances to the next unsolved puzzle in this order (AD-25). `viewPath` stays a NodeId stack from the top to the current puzzle.
- **Overview and EnterPuzzle (FR-9, AD-25):**
  - `EnterPuzzle { nodeId }` enters any unsolved puzzle whose children are all solved (leaves always qualify), from the overview of its parent.
  - `ZoomOut` pops to the parent overview (the next unsolved sibling stays enterable).
  - The overview view model lists cells. Each cell maps to a child node: solved children show the answer; unsolved ones show no numeral and are enterable.
  - **PlayVM:** extend it so render can tell a puzzle view from an overview. Both use the same geometry.
- **Presentation timeline (AD-20):**
  - `Round.presentation = { kind: 'idle' | 'solve' | 'collapse' | 'advance', startedAtMs, durationMs, transitionId }`. Add `'roundStart'` if useful for the between-round crossfade.
  - **Clock:** only `Tick { elapsedMs }` advances it, using the clock in its envelope. Presentation time is Tick-accumulated (AD-17), never wall clock in core.
  - **Sequence:** a correct tap starts `solve`. Its end applies the solve and starts `advance`. A completed group starts `collapse`, and a completed round leads into the next round's start.
  - **Durations:** from a new TuningConfig `presentation` section:
    - `solveMs` 380, `advanceMs` 400, `firstCollapseMs` 3000, `collapseMs` 1200, `roundTransitionMs` 400
    - a `calmMotionScale` multiplier applied when `settings.motion === 'calm'` (1.25)

    Extend `content/tuning/1.json` (v1 unshipped) and the fixture tunings. The golden puzzle outputs must not change.
  - **First collapse:** a per-profile `firstCollapseSeen` flag picks `firstCollapseMs` the first time a collapse runs, then `collapseMs`.
  - **Blocked input:** any `TapCell` or `EnterPuzzle` while `presentation.kind !== 'idle'` is dropped. The state is unchanged apart from an `InputDropped` event.
  - **Resume (later):** on resume, a non-idle presentation completes to its end state. Provide a pure `completePresentation(state)` used later by entry 4.
- **Events:**
  - `PuzzleSolved`, `WrongTap` and `SoftMiss` carry `responseMs`: the Tick-time from the puzzle becoming idle-and-shown to the tap.
  - Also emit `RoundCollapsed { nodeId }`, `RoundCompleted`, `RoundStarted` and `InputDropped`.
  - A wrong tap changes no state. Keep entry 1's events and `CommandRejected`.
- **RoundType registry:** add `onSolve` and `isComplete` to `ROUND_TYPES.classic` and `.tower` (the `round-types.ts` note), and use them in `step`.
- **View model:** PlayVM gains `inputLocked` (`presentation.kind !== 'idle'`) and `presentation: { kind, progress 0..1, durationMs, transitionId }`. progress is computed from accumulated Tick time, so render can interpolate later.
- **app:**
  - A scheduler (AD-17) that is the only clock reader, with time injected as in entry 1. It dispatches `Tick { elapsedMs }` from a frame loop the client provides (requestAnimationFrame) while `pauseReasons` is empty.
  - `pauseReasons` is a set; entry 4 adds lifecycle reasons.
  - It may dispatch Tick only while a presentation is running, to avoid needless work. Document the choice.
- **render (minimal, to keep the build playable):** while `inputLocked`, `hitTest` returns null but the press acknowledgement still draws. render shows the current view; snapping or fading during transitions is acceptable until entry 3.
- **client:** wires the scheduler with `requestAnimationFrame` and `performance.now`.
- **Tests:**
  - **core headless:** a Tower n=3 round plays 9, then 3, then 1 puzzles. A collapse runs after each group of three and after the tier-2 level, and the round flows into the next with no end state.
  - Classic and Tower alternate.
  - Taps during `solve` or `collapse` are dropped with `InputDropped`.
  - The first collapse uses `firstCollapseMs`, later ones `collapseMs`, and Calm scales them.
  - `EnterPuzzle` into a leaf from an overview works, while entering a node with unsolved children is rejected.
  - `responseMs` is Tick-based.
  - Determinism.
  - **app:** the scheduler dispatches Ticks only while unpaused.
  - **e2e:** the playtest preview still plays a full Classic round, and a Tower round, through the canvas using the test hook (waiting out transitions).

**Never:**
- Animations and camera moves in render (entry 3), persistence (entry 4), keyboard (entry 5), and − rounds or soft-miss presentation (entry 6).
- Reading wall-clock time in core, or random numbers outside `ctx.entropy`.
- Mode scoring or Zen/Normal consequences.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tower round | round 1 (Tower n=3 +) | leaves 0..8, then tier-2 0..2, then top; 4 collapses; then round 2 (Classic) | No error expected |
| Solve beat | correct tap | `solve` for `solveMs`(×calm), then `advance`, then idle on the next puzzle | No error expected |
| Dropped input | tap during solve or collapse | `InputDropped`, state otherwise unchanged | No error expected |
| First collapse | first collapse for the profile | `firstCollapseMs` (×calm), flag set | No error expected |
| Later collapse | after the first | `collapseMs` (×calm) | No error expected |
| EnterPuzzle | an enterable puzzle from the overview | `viewPath` points at it, idle | No error expected |
| EnterPuzzle bad | a node with unsolved children, or already solved | rejected (`CommandRejected`), no change | returned as event |
| Wrong tap | non-answer | `WrongTap` with `responseMs`; nothing else changes | No error expected |
| Tick when idle | idle | no-op (or only time accumulation) | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/state/*` -- entry 1's state layer: `step.ts` (dispatch by command), `reduce-start-session.ts`, `reduce-tap-cell.ts`, `start-round.ts` (`LEAF_BAND`, `startRound`), `classic-request.ts` (`CLASSIC_REQUEST`, to replace), `round.ts` (Round type), `game-state.ts` (GameState, `ProfileKind`, `ProfileSettings`), `game-event.ts`, `command.ts`, `envelope.ts`, `command-context.ts`, `check-context.ts`, `reject.ts` (`CommandRejected`), `node-key.ts`, `round-puzzle.ts`, `with-game.ts`, `step.test.ts`.
- `packages/core/src/view/{select-view.ts,play-vm.ts,hit-test-view.ts,kiln-tokens.ts}` -- PlayVM and hit-testing.
- `packages/core/src/rounds/{round-types.ts,round-node-id.ts}` -- `ROUND_TYPES` (`plan`, `realise`, with a note that this epic adds `onSolve`/`isComplete`); `childrenOf`, `parentOf`, `topNodeId`, `nodeCount`, `tierWidth`.
- `packages/core/src/tuning/tuning-config.ts` -- the strict schema with only a `generation` section; add `presentation`. `content/tuning/1.json`, `packages/core/test/fixtures/tuning/*.json`, and test copies of tuning v1 (grep for `"generation"` in tests) all need the new section if it's required. Making it required is fine because v1 is unshipped.
- `packages/app/src/game.ts` -- `createGame` with synchronous dispatch and injected `now`/entropy; add the scheduler beside it.
- `packages/render/src/create-renderer.ts` -- `hitTest` must return null while `inputLocked`.
- `apps/client/src/main.ts`, `apps/client/src/test-hook.ts`, `apps/client/e2e/{play.spec.ts,play-helpers.ts}` -- wiring and e2e helpers (the answer is found assuming `+`).
- `tools/check-core-purity.mjs` -- `core/state` and `core/view` aren't in `PURE_DIRS`. Consider adding `core/state` (no Math.random, Date or clocks) if it doesn't trip on legitimate code; note the decision.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/tuning/*`, `content/tuning/1.json`, fixtures -- the `presentation` section. -- AD-7
- [x] `packages/core/src/state/*` (+ tests) -- `nextRoundRequest`, breadth-first flow, collapse, EnterPuzzle and ZoomOut, presentation timeline, Tick, `firstCollapseSeen`, events with `responseMs`, `completePresentation`. -- AD-2, AD-20, AD-25, FR-9, FR-11
- [x] `packages/core/src/rounds/round-types.ts` (+ tests) -- `onSolve` and `isComplete`. -- AD-24
- [x] `packages/core/src/view/*` (+ tests) -- overview vs puzzle VM, `inputLocked`, presentation progress. -- AD-13
- [x] `packages/app/src/scheduler.ts` (+ tests), `apps/client/src/main.ts` -- the Tick scheduler wired to rAF. -- AD-17
- [x] `packages/render/src/create-renderer.ts` -- null hit-test while locked. -- AD-14
- [x] `apps/client/e2e/*` -- Classic and Tower rounds play through. -- browser proof

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm bench:generator && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass, and the golden fixtures are unchanged.
- Given a fresh profile, when rounds are played headlessly, then round 0 is Classic n=3 (3 + 1 puzzles), round 1 is Tower n=3 (9, then 3, then 1 with a collapse after each group and tier), and round 2 is Classic again, with no end state between rounds.

## Implementation Notes

- **Clock:** `GameState.clockMs` is the profile's Tick-accumulated play time; `startedAtMs`, `shownAtMs` and `responseMs` are all on it. `Tick { elapsedMs }` must be a non-negative integer; with no profile it is a no-op (no events), idle it only accumulates time. One Tick may cross several beats: each ends at `startedAtMs + durationMs` and the next starts there (`run-timeline.ts`, `end-beat.ts`), so the timeline never drifts with frame timing.
- **Beats:** correct tap → `solve` (`PuzzleSolved` now, with `responseMs`). Solve end → the node joins `solved`; then, via `ROUND_TYPES[type].isComplete`/`onSolve`: round complete → `RoundCompleted`, `RoundStarted`, next round opens on `roundStart`; group complete → `viewPath` moves to the parent, `collapse` (`RoundCollapsed { roundId, nodeId }`, first one sets `firstCollapseSeen`); else `advance` (to the first unsolved node in breadth-first `playOrder`, realised lazily). Collapse end → `advance`, or idle directly when the parent collapsed into is itself the next puzzle (Classic's top, Tower's top). `advance`/`roundStart` end → idle, puzzle shown from then. `StartSession` opens idle (first frame interactive). transitionId is `'default'` (idle `'none'`) until themes pick them.
- **Entropy:** the tap that solves the top reserves the next round's id (`Round.nextRoundId = ctx.entropy.ids[0]`), so Tick and `completePresentation(state, tuning)` need no ctx. `completePresentation` ends every remaining beat at the current `clockMs` (no time added) and returns a `StepResult`.
- **Atomicity change:** a correct tap is no longer rejected when the next leaf or round can't be realised; that now surfaces when the beat ends. `runTimeline` then settles the round idle on what is in view (without the failed follow-on, the node unsolved) and the Tick or `completePresentation` emits one `CommandRejected`, so the board unlocks and the scheduler stops. It cannot happen with a plan the planner accepted.
- **Navigation:** a node is a *puzzle* when it is a leaf or all its children are solved, else an *overview* (`is-playable.ts`). `EnterPuzzle` needs the target to be a child of the overview in view, unsolved, and playable. `ZoomOut` only works from a puzzle with a parent (an overview or the top is rejected), so the player can never land on an overview with nothing enterable (e.g. a Tower top whose tier-2 children have unsolved leaves). `TapCell` on an overview is rejected. Input dropped during a beat (`InputDropped { command, presentation }`) covers `TapCell`, `EnterPuzzle` and `ZoomOut`.
- **Motion:** `ProfileSettings.motion` is now `'full' | 'calm'` (Kid default Calm); Minimal arrives with the control surface. Durations: `core/presentation/beat-duration.ts`, rounded integer ms. `calmMotionScale` applies to solve, advance and roundStart only, never to collapses, so FR-9's caps (≤ 3 s first, ≤ 1.2 s later) hold for every profile (Calm: solve 475, advance 500, roundStart 500, collapses 3000/1200).
- **View:** PlayVM gains `kind: 'puzzle' | 'overview'`, `presentation { kind, progress, durationMs, transitionId }` (idle and zero-length beats report progress 1), real `inputLocked`, and per-cell `enters: NodeId | null` (overview cells only). `tapCommand(vm, ref)` (core/view, re-exported by app) maps a hit to `TapCell` or `EnterPuzzle`; the client uses it.
- **Scheduler choice:** `createScheduler({ game, now, frames })` in app requests frames only while a beat runs (`inputLocked`); idle time is flushed as one Tick before every command dispatched through `scheduler.dispatch` (and before a pause), so `responseMs` is exact and an idle board costs no frames or re-renders. Ticks are whole ms with the fraction carried. `pauseReasons` is a set in the scheduler (`lifecycle | panel | gate | blur`); paused time is never ticked. AD-17's `GameState.pauseReasons` and the `Pause`/`Resume` commands are left to entry 4.
- **Render:** `hitTest` also checks `inputLocked` itself; `render(vm)` skips the scene rebuild when only the timeline changed (`draw-key.ts`), so beat frames don't recreate Pixi Text objects every frame.
- **Purity:** `packages/core/src/state` is now in `PURE_DIRS` (it needs no Math or clocks). `core/view` and `core/presentation` stay out: they use float maths (progress, the Calm scale).
- **Tuning:** `presentation` is a required strict section (all durations integer 0..60000 ms, `calmMotionScale` 0.25..4). Added to `content/tuning/1.json`, the five fixture tunings and every inline test tuning; the golden fixtures are unchanged.
- `CLASSIC_REQUEST` was removed; `LEAF_BAND` moved to `state/serve-node.ts`.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 3 findings — high 0, medium 2, low 1, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` `calmMotionScale` also scaled collapses, so the default Calm Kid profile got 3750/1500 ms collapses, against FR-9 (≤ 3 s first, ≤ 1.2 s later). The plan's "calm multiplier on durations" was too broad. Fixed: Calm scales solve, advance and roundStart only; collapses stay 3000/1200 for every profile, with tests and docs.
  - `[medium]` `[patch]` A failed `endBeat` left the round non-idle forever, so input stayed locked and the scheduler requested frames endlessly, each rejected. Fixed: `runTimeline` settles to idle on the current view and emits one `CommandRejected`; the scheduler stops by itself. A test forces the failure.
  - `[low]` `[patch]` The "tap during the solve beat" e2e depended on wall-clock timing. Fixed: both taps are sent in one `page.evaluate`, so no frame or Tick can interleave.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm bench:generator && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0

## Auto Run Result

**Summary:** The round flow is complete in core.
- **Round sequence:** `nextRoundRequest` alternates Classic and Tower at n=3 +.
- **Play order:** Tower plays breadth-first (9, then 3, then 1), with a collapse after each group and after the tier-2 level, and flows into the next round with no end state.
- **Navigation:** `EnterPuzzle`/`ZoomOut` handle overview navigation.
- **Timeline:** an AD-20 presentation timeline (solve, advance, collapse, roundStart) advanced only by Tick. Durations come from a new tuning `presentation` section; Calm slows non-collapse beats, and `firstCollapseSeen` picks the long first collapse.
- **Events:** taps during beats are dropped with `InputDropped`, and tap events carry Tick-based `responseMs`.
- **Registry:** `onSolve` and `isComplete` are on the RoundType registry.
- **App:** a scheduler is the only clock reader, with a `pauseReasons` set.
- **Render:** hit-testing returns null while input is locked.

**Files changed:** `packages/core/src/{state,presentation,view,rounds,tuning}/*` (+ tests), `content/tuning/1.json` and fixture/test tunings (presentation section), `packages/app/src/scheduler.ts` (+ tests), `packages/render/src/create-renderer.ts`, `apps/client/src/main.ts`, `apps/client/e2e/*`, `tools/check-core-purity.mjs` (covers `core/state`).

**Review findings:** 3 patches applied (2 medium, 1 low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 2, low 1. Each patch has a direct test.

**Verification:**
- With and without `BASE_PATH=/numception/`: typecheck, `lint:deps`, `test`, `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` all pass.
- The e2e plays a full Classic and a full Tower round through the canvas.
- Golden fixtures are unchanged.

**Residual risks:**
- Transitions aren't drawn yet (entry 3), so the board just waits during beats.
- No lifecycle pause yet (entry 4).
