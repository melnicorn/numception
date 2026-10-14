---
title: 'Soft miss presentation and − rounds'
type: 'feature'
ticket: '6'
created: '2026-10-14'
status: 'done'
baseline_revision: '221d7a0b3d8ee4530ee9b6d0c4c056e6ac08410a'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/epic-core-play-loop.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/story-round-flow-tiers-and-presentation-timeline-in-core-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Only + rounds are served, so the game never shows subtraction. In a − puzzle (a − b = c, answer c), tapping b is a valid reading (a − c = b). FR-4 calls this a **soft miss**: a gentle hint that is never a wrong tap. Core already classifies it (`SoftMiss` event), but nothing presents it.

**Approach:**
- Round sequence becomes Classic +, Tower +, Classic −, Tower −, then repeats.
- On a soft miss, the tapped cell pulses once in the `soft-miss` colour (never red, never dims the board) and a ghost arrow points from it to the answer cell.
- The guide line "Tap the answer" appears once per profile. A persisted `softMissLineSeen` flag in GameState records it, and the save covers it.

## Boundaries & Constraints

**Always:**
- **Core:**
  - `nextRoundRequest`: rounds 0, 1, 2, 3 are Classic +, Tower +, Classic −, Tower −, then repeat, all at n=3.
  - **Saves:** existing saves keep working. Add `softMissLineSeen` with default `false`. Either bump `saveFormatVersion` to 2 with a migration (1 → 2, adding the flag) or make the parser default a missing flag. Prefer the explicit migration, since it exercises the path for real.
  - **Soft miss state:** a `SoftMiss` tap changes no puzzle state. It starts no locking beat; input stays open. Record a transient soft-miss cue in the round: tapped cell index, answer cell index, and Tick start time. The view exposes it while it runs. Its duration comes from a new tuning `presentation.softMissMs`: about 600 ms × the Calm scale.
  - **Guide line:** the first soft miss of a profile sets `softMissLineSeen` and exposes `guideLine: 'Tap the answer'` on the view while the cue runs, plus until the next correct tap. Later soft misses show the pulse and arrow only.
  - **Never a wrong tap:** no penalty and no state change. `WrongTap` is unaffected (still nothing at POC baseline).
- **View (PlayVM):** `softMiss?: { cellIndex, answerIndex, progress }` and `guideLine?: string`. Values come from core; adapters don't decide.
- **Render:**
  - The tapped cell pulses once: its fill or outline in Kiln `soft-miss` (`#AC644E`; add a token if missing) swells and fades over the cue.
  - A ghost arrow (a faint line with an arrowhead) runs from the tapped cell's label point toward the answer cell's label point and fades out.
  - No red, and the board never dims.
- **ui:** the guide line is DOM text (AD-13: canvas draws play, DOM draws everything else). Show it in a guide-line slot near the board in the theme's colours and font, with `role="status"`/`aria-live="polite"` so it is announced. It isn't shown in the canvas.
- **Tests:**
  - core: the sequence includes − rounds; a soft miss changes no puzzle state and doesn't lock input; the cue and its duration; the guide line only the first time, persisted across save and load (migration test).
  - render: pulse and arrow maths, as unit tests where practical.
  - e2e: in a − round, tap the soft-miss cell (found via the test hook's roles or values), assert the puzzle is still unsolved, that `softMiss` is in the view, and that the guide line text appears once. After a reload, the next soft miss shows no guide line.
  - The existing play-throughs stay green. They find answers assuming +, so update the helpers to use the answer index.

**Never:**
- Zen or Normal consequences, combo, ratings (later epics), or soft-miss counting in stats.
- × or ÷.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| − round order | round 2 | Classic n=3 − | No error expected |
| Soft miss first time | tap b in a − puzzle | pulse + arrow; "Tap the answer" shown; puzzle unsolved; input open | No error expected |
| Soft miss again | later in the same or another round | pulse + arrow only | No error expected |
| After reload | flag saved | no guide line on the next soft miss | No error expected |
| Correct after soft miss | tap c | normal solve; guide line cleared | No error expected |
| + puzzle | tap b | wrong tap (nothing happens, as before) | No error expected |
| Old save | saveFormatVersion 1 | migrates; flag false | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/state/next-round-request.ts` (or wherever `nextRoundRequest` lives): the alternating Classic and Tower sequence.
- `packages/core/src/state/reduce-tap-cell.ts`: classification via `classifyTap`; the `SoftMiss` event is already emitted.
- `packages/core/src/state/{game-state.ts,round.ts}`, `packages/core/src/save/*`: GameState, the save format and the migration registry (format 0 → 1 exists).
- `packages/core/src/tuning/tuning-config.ts`: the presentation section. Add `softMissMs` there, in `content/tuning/1.json` and in the fixture and test tunings.
- `packages/core/src/view/{select-view.ts,play-vm.ts,kiln-tokens.ts}` and `packages/render/src/{create-renderer.ts,paint-view.ts,beat-motion.ts}`.
- `packages/ui/src/`: has the dev panel only so far. Add a small guide-line component mounted by the client next to the game, with the ui importing app only.
- `apps/client/src/main.ts` and `apps/client/e2e/{play-helpers.ts,play.spec.ts,save.spec.ts}`.
- DESIGN `soft-miss` role and component row; EXPERIENCE `soft-miss` primitive.

## Tasks & Acceptance

**Execution:**
- [x] Core sequence, soft-miss cue, flag and save migration, with tests.
- [x] View fields; render pulse and arrow.
- [x] ui guide line and client wiring.
- [x] e2e and helper updates.

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass.
- Given a − round in the playtest preview, when the soft-miss cell is tapped, then it pulses with a ghost arrow to the answer, the puzzle stays unsolved, and "Tap the answer" shows only the first time per profile.

## Implementation Notes

- **Sequence:** `nextRoundRequest` cycles Classic +, Tower +, Classic −, Tower − (ordinal mod 4), n = 3, band 1.
- **Cue:** `Round.softMiss: SoftMissCue | null` (`nodeId`, `cellIndex`, `answerIndex`, `startedAtMs`, `durationMs`) and `Round.guideLine: boolean`. A soft miss sets the cue at the current `clockMs` (a second one restarts it) and changes nothing else; no beat, so input stays open. `Tick` clears an expired cue; `completePresentation` (pause, restore) ends a running one but keeps the guide line. A correct tap clears both; `ZoomOut` and `EnterPuzzle` clear the cue, and the view shows it only on its own `nodeId`. Duration: `softMissDuration` = `presentation.softMissMs` (600) × `calmMotionScale` at Calm (750 for the Kid default).
- **Flag and save:** `GameState.softMissLineSeen`, set by the profile's first soft miss. `SAVE_FORMAT_VERSION` is 2; migration 1 → 2 adds `softMissLineSeen: false` and `softMiss: null, guideLine: false` to every round. `checkGameState` checks all three.
- **View:** `PlayVM.softMiss { cellIndex, answerIndex, progress }` while the cue runs (puzzle views only, never while blurred) and `guideLine: 'Tap the answer'` while up (hidden while blurred; back once the veil lifts). The scheduler also runs frames while `softMiss` is present. `drawKey` ignores `guideLine` (DOM only).
- **Render:** `soft-miss-motion.ts` (pure, unit-tested): `pulseLook` (outline swells by 4 px at 30 % and fades, with a faint wash) and `ghostArrow`/`arrowAlpha` (shaft between the two label points with 28 % clear at each end, ±30° chevron head, peak alpha 0.55). Kiln gains `softMiss` (#AC644E) and `guideSizePx` (24).
- **ui:** `mountGuideLine(el, game)` renders a `role="status"` `aria-live="polite"` line in `#guide`, a 64 px band above `#app` in `index.html` that the board fit never uses (pointer-events none), in the theme's face and `number` colour; the client mounts it in its own slot.
- **Test hook:** `roles()` returns the puzzle in view's operator, roles and `answerIndex` (via core's new `puzzleInView`); e2e helpers find answers with it (`answerCell(page)`, `roleCell(page, role)`).

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 5 findings — high 0, medium 2, low 3, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` The soft-miss cue had no nodeId and survived ZoomOut/EnterPuzzle, so it could pulse on a sibling and point at the old answer index. Fixed: the cue carries its nodeId, navigation clears it, and the view shows it only on its node.
  - `[medium]` `[patch]` The fixed guide line could overlap the board's top cells when the board is height-limited, against DESIGN ("never over a cell"). Fixed: a 64 px `#guide` band above `#app`; the board fit uses `#app` only, with e2e checks at 1280×720 and 390×844.
  - `[low]` `[patch]` The guide line stayed on the veiled board. Fixed: hidden while blurred, and it returns after the veil lifts.
  - `[low]` `[patch]` EXPERIENCE.md still listed soft-miss as undesigned. Fixed.
  - `[low]` `[patch]` The e2e save wait before reload proved little. Fixed: it waits for the save count to rise past a captured value.

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.

## Auto Run Result

**Summary:**
- **Rounds:** Classic +, Tower +, Classic −, Tower −, repeating.
- **Soft miss:** tapping b in a − puzzle pulses that cell in the soft-miss colour, with a ghost arrow to the answer. The puzzle stays unsolved and input open.
- **Guide line:** "Tap the answer" appears once per profile (persisted `softMissLineSeen`) in a DOM guide band above the board, never over a cell and never on the veil.
- **Save:** format 2, with a 1 → 2 migration.
- **Tuning:** `presentation.softMissMs` (600 ms).

**Files changed:** core state/view/save/tuning (+ tests), `render/src/soft-miss-motion.ts` and `create-renderer.ts`, `ui/src/guide-line/*`, `apps/client/{index.html,src/main.ts,src/test-hook.ts,e2e/*}`, `content/tuning/1.json` and fixture tunings, DESIGN/EXPERIENCE rows.

**Review findings:** 5 patches applied (2 medium, 3 low).

**Verification:** with and without `BASE_PATH=/numception/`: typecheck, lint, unit tests, build, flavour and budget checks, and e2e all pass. Golden unchanged.
