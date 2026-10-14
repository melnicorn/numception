---
title: 'Save and resume'
type: 'feature'
ticket: '4'
created: '2026-10-14'
status: 'built'
baseline_revision: 'af00e09eb59f9010c469d8924d653b8eebc6ca9b'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-core-play-loop/story-round-flow-tiers-and-presentation-timeline-in-core-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Two tabs or windows of the same flavour on one origin can overwrite each other's save slots.
    evidence: |-
      Each tab caches slot generations from its own load, so concurrent tabs can write the same generation into the same slot. Not reachable in the Capacitor app; possible in a desktop browser with two tabs. Fix: Web Locks (navigator.locks) around writes, or BroadcastChannel leader election.
    location: >-
      packages/app/src/{slot-storage.ts,save-writer.ts}
    severity: low
---

<intent-contract>

## Intent

**Problem:** Every launch starts fresh. FR-10 and Done-when 3 need a killed app to relaunch on the same puzzle, solved cells, tier and mode; Done-when 6 needs a versioned save with a forward migration path. Backgrounding should also pause play and blur the board until the next tap (AD-17).

**Approach:**
- **Storage:** a `StoragePort` in `app`, with an IndexedDB adapter in `platform-web` used by both the PWA and the Capacitor iOS shell's WebView. This is a POC exception: the filesystem adapter is deferred to epic-native-apps.
- **Snapshots:** per-profile A/B snapshots with `saveFormatVersion`, a checksum and a generation counter, plus a forward migration registry in core.
- **Saving:** a single-flight, latest-wins writer saves after each batch containing a non-Tick command and on pause.
- **Lifecycle:** AD-17 Pause/Resume in core, driven by the page lifecycle, with a blur flag.

## Boundaries & Constraints

**Always:**
- **core (pure):**
  - `serializeGame(game) → SaveDocument` and `parseSave(json) → Result<GameState>`.
    - `SaveDocument = { kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 1, generation, checksum, payload }`.
    - JSON only; the checksum is a stable integer hash over the canonical payload JSON, documented.
  - A forward-only migration registry `MIGRATIONS: { [fromVersion]: (payload) → payload }`.
    - `parseSave` upgrades older `saveFormatVersion`s step by step.
    - A **newer** version than the build knows is rejected (`save-too-new`), so it is never overwritten.
    - Ship a real test migration: v0→v1 or a synthetic fixture proving the path works.
  - **DeviceSettings:** `{ kind: 'DeviceSettings', schemaVersion: 1, activeProfileId }`, serialized separately.
  - **Commands:** `Pause { reason }` and `Resume { reason }`, with `pauseReasons: Set-like sorted array` in AppState.
    - While any reason is present, Tick is ignored and taps are dropped, except that the first tap after a `lifecycle` pause only clears `blur` (AD-17).
    - On `Pause`, any non-idle presentation completes to its end state (`completePresentation` from entry 2).
    - `blur` is a GameState or view flag. PlayVM exposes `blurred: boolean` and render draws a soft veil or blur over the board.
  - **Restoring:** `StartSession` with a restored state continues the saved round. No new profile or round is created when one exists. The first frame is the restored puzzle, not a loading state.
- **app:**
  - `StoragePort { loadDevice(), loadProfile(profileId), saveProfile(profileId, doc), saveDevice(doc) }`, async.
  - **A/B slots:** each profile save writes to the slot with the lower generation, and load picks the highest-generation slot that parses and passes the checksum. A torn write in one slot leaves the other good.
  - **Writer:** single-flight, latest-wins. While a write is in flight, newer snapshots replace the pending one. Write order is snapshot, then DeviceSettings. Failures retry silently with backoff and never block play or throw to the UI (AD-10).
  - **When to save:** after each dispatched batch that included a non-Tick command, and on `Pause`.
  - **Startup:** the client awaits load **before** the first paint. The first frame is the restored puzzle, or a new one if nothing is saved. Load must be fast (one IndexedDB read).
- **platform-web:**
  - IndexedDB adapter via `idb` (8.0.x, already in the Stack table), one database `numception` with two object stores (`device`, `profiles`, keys `profileId:A|B`).
  - The database name includes the flavour's appId, so flavours never share saves (AD-18).
  - Lifecycle source: `visibilitychange` and `pagehide` map to `Pause { lifecycle }`, and `visibilitychange` to visible maps to `Resume { lifecycle }`.
  - platform-web imports only app (lint).
- **client:** composes the storage and lifecycle adapters, loads before first paint, starts the save writer, and wires the scheduler's `pauseReasons` to core's.
- **Tests:**
  - **core:** serialize/parse round-trip, checksum mismatch rejected, migration path, `save-too-new` rejected, Pause/Resume semantics (Tick ignored, presentation completed, the blur-clearing first tap does nothing else).
  - **app:** A/B selection, torn-write recovery (a corrupted latest slot falls back to the previous), single-flight latest-wins, retry on failure.
  - **Kill-mid-write test:** simulate a crash mid-write with an in-memory fake that dies after a partial write, then reload and assert the last good state.
  - **e2e (WebKit, playtest preview):** solve two leaves, reload, and the same puzzle and solved cells come back with the first frame a puzzle. Background then foreground via page visibility emulation: the board is blurred and the first tap only unblurs.
  - The existing e2e stays green. Tests must isolate IndexedDB, e.g. a fresh browser context per test.

**Never:**
- The `@capacitor/filesystem` adapter (epic-native-apps), multiple profiles or switching (epic-profiles-and-controls), CommandLog persistence, or telemetry logs.
- Blocking play on a failed save, or showing error dialogs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh install | empty IndexedDB | new profile and round; saved after the first tap | No error expected |
| Resume | saved mid-Tower | same round, puzzle, solved cells, tier, mode on relaunch; first frame is the puzzle | No error expected |
| Kill mid-write | crash after a partial slot write | previous good slot loads | recovered silently |
| Corrupt both slots | both fail the checksum | fresh session; the corrupt data is left untouched (not overwritten until a new good save) | recovered silently |
| Older save | `saveFormatVersion` below current | migrated forward and loaded | No error expected |
| Newer save | `saveFormatVersion` above current | not loaded and never overwritten; fresh session in memory only | `save-too-new`, no writes |
| Background | page hidden mid-beat | Pause: the beat completes to its end state, Tick stops, state saved | No error expected |
| Return | page visible | board blurred; the first tap only unblurs | No error expected |
| Save failure | IndexedDB write throws | silent retry with backoff; play continues | swallowed and retried |
| Flavours | dev vs playtest on one origin | separate databases | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/state/*`: `AppState`, `GameState`, `Round` (incl. `previousTop` from entry 3), `step`, `reduce-*`, `run-timeline.ts`, `completePresentation`, `reduce-start-session.ts` (creates the profile and round today), `game-event.ts`, `command.ts`. Add Pause/Resume, blur, save and parse here, or in a new `core/save` folder.
- `packages/core/src/view/select-view.ts`, `play-vm.ts`: add `blurred`.
- `packages/app/src/{game.ts,scheduler.ts}`: `createGame` with synchronous dispatch; the scheduler has `pauseReasons`. Add `storage-port.ts` and `save-writer.ts`.
- `packages/platform-web/src/index.ts`: an empty stub. Add an `idb ~8.0.x` dependency here only; check that dependency-cruiser allows it in platform-web.
- `packages/render/src/create-renderer.ts` and `paint-view.ts`: draw the blur veil when `blurred`.
- `apps/client/src/main.ts`: composition (tuning, game, renderer, scheduler, dev panel, PWA, test hook). `flavours.ts` provides the appId for the database name.
- `apps/client/e2e/{play.spec.ts,play-helpers.ts,offline.spec.ts}`: e2e patterns and the test hook.
- Architecture AD-10 (persistence) and AD-17 (time and pauses) are the rules to follow. The deviation is IndexedDB on native for the POC (spine Deferred).

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/save/*` (+ tests): save document, checksum, migrations, DeviceSettings. (AD-10)
- [x] `packages/core/src/state/*` (+ tests): Pause/Resume, blur, restored StartSession. (AD-17, FR-10)
- [x] `packages/app/src/{storage-port.ts,save-writer.ts}` (+ tests): A/B slots, single-flight writer, retry, kill-mid-write test. (AD-10)
- [x] `packages/platform-web/src/*` (+ tests where feasible): IndexedDB adapter and lifecycle source. (AD-16)
- [x] `packages/render/*`: blur veil.
- [x] `apps/client/src/main.ts` and `apps/client/e2e/*`: load before first paint, wiring, reload and background e2e. (browser proof)

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass, including the kill-mid-write and migration tests.
- Given the playtest preview mid-round, when the page reloads, then the same puzzle and solved cells return and the first frame is a puzzle.
- Given the iPhone app mid-round, when it is killed from the app switcher and reopened, then play resumes in the same place. The orchestrator checks this on the device.

## Implementation Notes

- **Save document:** `serializeGame(game, generation)` writes `{ kind: 'GameSave', schemaVersion: 1, saveFormatVersion: 1, generation, checksum, payload: { game } }`. Format 1's payload wraps the game so later fields (the AD-8 ratings checkpoint) sit beside it; format 0 is the bare `GameState` (synthetic: entries 1 to 3 only kept it in memory), and `MIGRATIONS[0]` wraps it. Rationals stay `{ n, d }` objects in the payload (as in memory), not AD-5 strings.
- **Checksum:** `saveChecksum(payload)` = FNV-1a-32 over the UTF-8 bytes of `canonicalJson(payload)` (keys sorted at every depth, no whitespace), uint32; hand-written multiply, no `Math`. It covers the payload only; `generation` is validated as an integer.
- **parseSave(json, format?)** returns `Result<{ game, generation, saveFormatVersion }>` (the plan said `Result<GameState>`; the slots need the generation). Order: JSON and envelope shape (`invalid-save`), then a newer `schemaVersion`/`saveFormatVersion` (`save-too-new`, checked before the checksum so a future format is recognised), then the checksum (`save-checksum-mismatch`), then migrations step by step (a gap is `invalid-save`), then `checkGameState` (a structural check of the fields play reads first). The optional `format` argument lets tests run a synthetic 0→1→2→3 path. `DeviceSettings` has `serializeDeviceSettings` / `parseDeviceSettings`. `packages/core/src/save` is in `PURE_DIRS`.
- **Pauses:** `AppState.pauseReasons` is a sorted, duplicate-free array and is **not persisted** (runtime state of the session): a relaunch starts unpaused and unblurred. `Pause { lifecycle }` adds `lifecycle` and `blur`; `Resume { lifecycle }` removes only `lifecycle`. Every `Pause` runs `completePresentation` first. While paused, `Tick` is a no-op. Input (`TapCell`, `EnterPuzzle`, `ZoomOut`) goes through `gateInput`: any reason other than `blur` drops it (`InputDropped` with `pauseReasons`); only `blur` left, it clears the blur (`BlurCleared`) and does nothing else. New events: `Paused`, `Resumed`, `BlurCleared`; no-op pauses/resumes emit nothing.
- **Restore:** `StartSession { restore: GameState }` checks it (`checkGameState`), stores it as the active profile, completes any beat it was saved in, then runs the usual StartSession (which keeps the active round). PlayVM gains `blurred`; nested views are always `false`.
- **Scheduler:** the pause set now lives in core. `scheduler.pause/resume` flush live time and dispatch `Pause`/`Resume`; the scheduler follows `game.getState().pauseReasons` after every dispatch, restarting its clock when the last reason clears (so the blur-clearing tap counts no paused time). `Game` gains `getState()`, and listeners also receive the command.
- **Storage:** `StoragePort` (app) is as planned, but returns typed load results (`empty | loaded | corrupt | too-new`). It is implemented once in app by `createSlotStorage(driver)` (A/B slots, keys `<profileId>:A|B`, slot generations cached from the last load or write, a failed write marks its slot torn so the retry reuses it); platform adapters only provide a `StorageDriver` of JSON text (`read(store, keys)` in one transaction, `write`). platform-web's `indexedDbDriver(appId)` uses `idb` 8.0.4, database `numception:<appId>`, stores `device` and `profiles`, and requests `navigator.storage.persist()` best effort. Its cached connection is dropped (the next call reopens) when the open fails, on `terminated` (the browser killed the connection, e.g. WebKit after iOS backgrounding), on `blocking` (it closes for a newer version), and when a transaction fails with `InvalidStateError`, `TransactionInactiveError` or `UnknownError`.
- **Writer:** `createSaveWriter` is single-flight, latest-wins, writes the snapshot then DeviceSettings, retries forever with 250 ms doubling backoff capped at 30 s, and exposes `stats()` (test hook). An urgent save (`save(state, true)`, used for `Pause`) ends a running backoff at once, so a backgrounded page attempts its pause snapshot immediately; still one write at a time. `saveAfterBatches` defers one save per macrotask batch containing a non-Tick command (`setTimeout 0`), and saves at once on `Pause` so the write starts before a hidden page freezes.
- **Boot:** `loadSave(storage, wait, 2500 ms)` makes **one** storage read, `StoragePort.loadAll()` (driver `readAll()`: the device record and every profile slot in one IndexedDB transaction; this replaces the earlier two sequential reads). The device record names the profile to restore; a corrupt profile starts fresh (a new profile id, so its slots stay untouched). When the device record is **missing or corrupt** (a kill tore it, or landed before its first write), the profile is derived from the snapshots that exist (AD-10): the highest valid generation. Too-new, a read error or a timeout → a fresh session **in memory with no writer at all**, so nothing that could not be read is ever overwritten. The client awaits it before creating the renderer and mounting; `__NUMCEPTION_APP_ID__` is a new Vite define from `flavours.ts`. A restore core refused falls back to a plain `StartSession`.
- **DeviceSettings writes:** the slot storage rewrites the single device record only when its text differs from what it last read or wrote, so kills rarely land in it. A corrupt device record is no longer overwritten blindly: boot first recovers the profile from the snapshots, and the record is then rewritten once, pointing at that recovered profile.
- **Two tabs:** two tabs of the same flavour on one origin each run their own writer and can overwrite each other's slots (the slot-generation cache is per tab). Out of scope for the POC; a later fix is Web Locks (one writer per profile) or BroadcastChannel (newest tab wins, others go read-only).
- **Lifecycle:** `webLifecycle()` maps `visibilitychange` hidden and `pagehide` to `Pause { lifecycle }`, `visibilitychange` visible and a visible `pageshow` to `Resume`, and pauses at once if the page starts hidden. The client routes them through the scheduler.
- **Render:** while `blurred`, a full-frame veil in the surface colour at `BLUR_VEIL_ALPHA` 0.86 is drawn over the board; `hitTest` is unaffected so the first tap reaches core. The accessible tree does not exist yet (entry 5), so hiding values from it is left to that entry.
- **Test hook:** adds `mountedView()` (the view the canvas mounted with, i.e. the first frame), `pauseReasons()` and `saves()`.
- **Tests:** core `save/*.test.ts` (round-trip, checksum, truncated JSON, too-new, v0 migration, multi-step path and gap) and `state/pause.test.ts`; app `slot-storage.test.ts` (A/B, torn and checksum fallback, corrupt untouched, too-new, `loadAll`, device written only on change) and `save-writer.test.ts` (order, single-flight latest-wins, backoff retry, urgent save cutting the backoff, kill-mid-write of a slot and of the device record then reload, batching, loadSave outcomes including recovery from the snapshots); platform-web `web-lifecycle.test.ts` (no IndexedDB unit test: no fake-indexeddb dependency was added; the e2e covers the real adapter); e2e `save.spec.ts` (flavour database, reload restores the same view and first frame, background mid-beat then return with veil and blur-only tap).

- Playtest feedback 2026-10-14 (user, iPhone): the grey veil read as "disabled", so it was unclear that a tap continues. A centred play button (accent fill, cream triangle; `render/src/resume-button.ts`) now sits on the veil. It's a glyph, not words, because numbers are the only text on the play view (DESIGN). Any tap anywhere still lifts the veil.

- Playtest feedback 2026-10-14 (user): numbers were still readable (faded) under the veil, which "defeats the purpose of pausing": play time is stopped while paused (AD-17), so a readable board lets the answer be worked out off the clock, which skews response times (AD-8). `selectView` now blanks every numeral (cells and the parent context) while `blurred`, keeping geometry so the first tap still only lifts the veil. Core test in `pause.test.ts`. This also covers entry 5's "hide cell values while blurred" for the accessible tree, which reads the same view.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 6 findings — high 0, medium 4, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` DeviceSettings was a single slot rewritten every save. A torn device write made boot start a new profile and orphan the good A/B profile slots (against AD-10's "profile list derived from snapshots"). Fixed: boot reads device and all profile slots in one transaction (`readAll`/`loadAll`); a missing or corrupt device record recovers the highest-generation valid profile; DeviceSettings is rewritten only on change. Tests tear the device write and still restore.
  - `[medium]` `[patch]` A dead IndexedDB connection (abnormal close, versionchange, WebKit after iOS backgrounding) was never reopened, so retries hit it forever. Fixed: `terminated` and `blocking` handlers and InvalidState-type errors drop the cached connection.
  - `[medium]` `[patch]` A Pause save waited out the retry backoff (up to 30 s). Fixed: urgent saves cut the backoff short (still single-flight), with a test.
  - `[low]` `[defer]` Two tabs of one flavour on one origin can overwrite each other's slots. Out of scope for the POC (the phone app is single-instance); later fix: Web Locks or BroadcastChannel.
  - `[low]` `[patch]` Boot made two sequential IndexedDB reads. Fixed by the single `readAll` transaction above.
  - `[medium]` `[patch]` A corrupt device record was overwritten blindly. Fixed: the profile is recovered first, then the record is rewritten once, pointing at it.

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.

## Auto Run Result

**Summary:**
- **Saves:** versioned A/B save snapshots (FNV-1a checksum, forward migrations, save-too-new protection) in a per-flavour IndexedDB.
- **Writer:** single-flight, with silent retry and urgent saves on pause.
- **Boot:** recovers from the snapshots in one read, so a torn device record no longer orphans a profile.
- **Connection:** a dead IndexedDB connection is reopened.
- **Pause/Resume (AD-17):** completes any running beat and shows a veiled board with no visible numbers and a centred play button; the first tap only lifts the veil.

**Hitl verdict (user, iPhone 16 Pro, 2026-10-14):** the veil initially read as "disabled", so a play button was added. The numbers still showed faded, so they are now hidden. The user then tested and found it "looking decent".

**Review findings:** 5 patches applied (4 medium, 1 low), 1 deferred (two tabs of one flavour), 0 rejected. Playtest follow-ups: the play button, and hidden numerals.

**Verification:** typecheck, lint, 940 unit tests (including kill-mid-write, migration and recovery), build, flavour and budget checks, and e2e (24 passed, 1 skipped) all pass. Checked on the device by the user.
