---
review: adversarial
lens: 'Construct two units one level down that each obey every AD to the letter yet still build incompatibly; each pair is a hole to close with a new or tightened AD.'
target: ../architecture-numception.md
context: ../../prd-numception/prd-numception.md
date: '2026-10-09'
counts: { critical: 4, high: 10, medium: 8, low: 1, total: 23 }
---

# Adversarial Review: Architecture Spine, Numception

Each hole names two units (epics or features) that both comply with every AD as written and still produce incompatible code. The fix is phrased as a new AD or an amendment to an existing one.

## Summary

| # | Severity | Hole | Units in conflict | Fix |
| --- | --- | --- | --- | --- |
| H1 | Critical | Nobody owns "a transition is in progress", so input gating and the state/animation gap are undefined | render adapter vs core play loop / scoring | New AD-20 Presentation timeline in core |
| H2 | Critical | `SetSetting`/`SwitchProfile` go through per-profile `step`, but the state they change lives in `DeviceSettings` | profiles/parent gate vs control surface vs persistence | New AD-21 State root and settings scope |
| H3 | Critical | Core must create rounds (and their ids and seeds) but may not generate ids or entropy; the replay "command log" is not persisted | generator/rounds vs persistence vs replay tests | Amend AD-3, Conventions/IDs; new AD-22 Command envelope |
| H4 | Critical | AD-4 plans a round top-down at creation; AD-9 and FR-20 select per served puzzle (Zen eases the *next* puzzle) | generator vs ratings/selector | Amend AD-4 and AD-9: lazy per-puzzle realisation |
| H5 | High | Two possible owners of next theme/transition choice; `setTheme` duplicates the view model | themes/transitions vs render adapter vs rounds | Amend AD-15: presentation choice in core, stored on the round |
| H6 | High | The 3-flashes/second limit spans render and ui; power-cut merge could live in either core or render | Normal scoring vs render vs ui (round-end flash) | New AD-23 Flash budget |
| H7 | High | AD-13 says "same core view-model selectors" but nobody owns the shapes or their inputs | render vs ui vs stats vs control surface | Amend AD-13: core/view owns every view-model type |
| H8 | High | Ratings are stored in the snapshot *and* a projection of the log; no rule for which wins | persistence vs ratings | Amend AD-8/AD-10: log is truth, snapshot is a checkpointed cache |
| H9 | High | `ResponseRecord` lives in both `ResponseLog` (AD-8) and `EventLog` (AD-12); who builds it is unstated | telemetry vs ratings | Amend AD-8/AD-12: core emits it, one physical log |
| H10 | High | "After each command batch" is undefined; `Tick` is a command | persistence vs scheduler | Amend AD-10: batch and save-trigger definition |
| H11 | High | Tuning is pinned per round but the snapshot only names a version; rating K source is ambiguous; dev panel swap path undefined | tuning/dev panel vs ratings vs persistence | Amend AD-7 |
| H12 | High | `GameState` has one shape for every round type; mode switch mid-round unspecified | Pyramid vs Classic/Tower vs Rapid Fire vs Normal scoring | New AD-24 Round-type union and per-round mode pin |
| H13 | High | Tap feedback paths differ (pointer via `hitTest` vs keyboard via a11y tree); render may optimistically animate before core verdict | render vs ui a11y tree / keyboard | Amend AD-14: synchronous dispatch, no optimistic truth |
| H14 | High | Profile list, active profile and snapshots live in two stores with no write order or boot reconciliation | profiles vs persistence vs For grown-ups (delete-all) | Amend AD-10/AD-11 |
| H15 | Medium | Two sources of `Pause`/`Resume` (lifecycle and control surface) can cancel each other | platform lifecycle vs control surface vs scheduler | Amend AD-17: pause reasons set |
| H16 | Medium | Onboarding hint timer, guide suppression and ghost finger have no single owner; focus ring has two | onboarding vs ui guide vs render | Amend AD-13: guide state and focus in core/app |
| H17 | Medium | Log migrations: `saveFormatVersion` migrations vs append-only logs keyed by `eventSchemaVersion` | persistence vs ratings replay vs telemetry export | Amend AD-10: read-time upcasters, never rewrite |
| H18 | Medium | "Session" and "session position" undefined | telemetry vs ratings/selector | Amend AD-12: `StartSession` command |
| H19 | Medium | Dev panel tuning switch and level-pin override could bypass the store | dev panel vs control surface level pin | Amend AD-18: dev actions are commands |
| H20 | Medium | Stats source unstated: GameState aggregates vs log query | stats vs persistence | New rule under AD-13 |
| H21 | Medium | Event-to-sound/haptic mapping has no owner | render vs platform audio vs control surface (sound toggles) | Amend AD-16: one FeedbackDirector in app |
| H22 | Medium | Daily Seed fixes `generatorVersion` per day; clients on other versions can't reproduce it | Daily Seed vs generator versioning | Amend AD-6 |
| H23 | Low | Two value formatters (render numerals vs ui a11y names, dot faces) | render vs ui | Amend AD-5: core produces structured display tokens |

---

## Critical

### H1. Who owns "a transition is in progress"?

- **Unit A (render adapter), compliant build:** on `play([PuzzleSolved, RoundCollapsed])` it animates the 1.2 s collapse. Meanwhile `hitTest` answers from the latest `render(viewModel)`, which already shows the next tier. A tap during the collapse hits a next-tier cell, and render emits `TapCell`. AD-14 allows this; render holds no truth.
- **Unit B (core play loop / Normal scoring), compliant build:** `step` moves straight to the next puzzle. The chain window is advanced by `Tick` and keeps draining during the collapse. Taps during the collapse are scored, including wrong ones that trigger a power cut.
- **Clash:** FR-8 (input during a transition is dropped with no penalty) has no owner. If render drops taps, the replay test (AD-19) and core disagree about what was possible. If core drops them, it needs transition durations, but those live in render's runtime. The chain window drains during an animation the player can't act in. FR-10 ("an interrupted transition resumes at its end state") is satisfied by both units in different ways. FR-9 first-collapse duration (3 s, then 1.2 s) is tuning (FR-53), and render can't read `TuningConfig` without becoming a second rules engine.
- **Fix (new AD-20, Presentation timeline is state):**
  - `GameState.play.presentation = { kind: 'idle' | 'solve' | 'collapse' | 'themeChange' | 'powerCut', startedAtMs, durationMs, transitionId }`. Durations come from the pinned `TuningConfig` and Motion level. Time advances only through `Tick`.
  - Core ignores `TapCell` while `presentation.kind !== 'idle'` and emits `InputDropped` (telemetry only). Chain window and round time do not advance during `collapse` and `themeChange`. Tuning says whether they advance during `solve`.
  - Render plays transitions to the given `durationMs`, as a slave. When state reports `idle`, render snaps to the end state. Render never decides when interaction is allowed. `hitTest` returns `null` whenever the view model says input is locked.

### H2. Settings and profile switching have no defined state home

- **Unit A (profiles / parent gate):** per AD-10, `activeProfileId` is in `DeviceSettings`. After the gate passes, the flow writes `DeviceSettings.activeProfileId` through `StoragePort` and dispatches `SwitchProfile` so that `step` can... do what? `step(state, cmd)` takes *one profile's* `GameState` (AD-2). There's no state that contains both profiles.
- **Unit B (control surface):** dispatches `SetSetting{motion:'calm'}` to `core.step` on the active profile's `GameState`, as AD-2 requires. But AD-10 says "device preferences" live in `DeviceSettings`, and AD-2 says ui never changes settings behind the store's back.
- **Clash:** Motion, chain window, sound and theme-selection mode end up per-profile in one build and per-device in the other. FR-40 says Kid *defaults* to Calm/Relaxed, which suggests per-profile. Sound may be per-device. Two persistence paths emerge, and `SwitchProfile` has no reducer.
- **Fix (new AD-21, State root and settings scope):**
  - The store holds `AppState = { device: DeviceState, profiles: { [profileId]: GameState }, activeProfileId }`. `core.step` is defined over `AppState`. Profile-scoped commands route to the active profile's sub-reducer. `SwitchProfile`, `SetPin`, and `SetDeviceSetting` are device-scoped commands with their own reducer.
  - Settings are listed exhaustively in a table. Per profile: mode, levelPin, chainWindow, motion, themeSelection, effects/music/haptics toggles. Per device: activeProfileId, pinHash, OS reduce-motion override. Any new setting must be added to this table.
  - Gate verification (comparing the hash) happens in app. The command is dispatched only on success. The PIN never enters a command.

### H3. Rounds need ids and seeds that core cannot create; the replay log doesn't exist

- **Unit A (generator / rounds):** when a round collapses, `step` must create the next round, which needs a `roundId` and a seed. AD-3 forbids ambient randomness, and the conventions say ULIDs are "generated in the shell and passed in on commands". The rounds epic therefore derives `roundId = hash(prevSeed, ordinal)` inside core, which is deterministic and compliant.
- **Unit B (persistence / telemetry):** expects ULID `roundId`s (per the conventions) and indexes on them. A separate dev builds the scheduler to attach `newRoundId` and `newSeed` on every `TapCell`, "just in case".
- **Clash:** two id schemes, and seeds come from nowhere. AD-19's replay test "folds step over a command log", but no AD persists a command log or its `ctx`. The ULID's timestamp component also leaks the clock into ids.
- **Fix:**
  - **New AD-22, Command envelope:** every dispatch is `{ command, ctx: { nowMs, localDate, utcDate, entropy: { ids: Ulid[], seed32: int[] } } }`, and the envelope is what the replay log records. App pre-fills `ctx.entropy` with a fixed-size pool (for example 2 ids and 2 seeds) on every command. Core consumes from the pool and emits `EntropyConsumed`. A dev/playtest `CommandLog` segment is persisted per profile (it may be prod-off).
  - **Amend AD-4:** each profile has a `rootSeed` created at profile creation. A round seed is `deriveSeed(rootSeed, roundOrdinal)` for personal rounds and `dailySeed(utcDate)` for the Daily Seed. Puzzle seeds come only from these, never from ctx entropy, so golden seeds stay valid.

### H4. Top-down round planning vs per-puzzle adaptive selection

- **Unit A (generator):** reads AD-4 literally, so `createRound` generates the top puzzle and then every lower-tier puzzle at round creation. All `difficultySpec`s are fixed up front, and the snapshot stores the full tree.
- **Unit B (ratings / selector):** reads AD-9 ("every served puzzle records why it was chosen") and FR-20 ("difficulty eases after a Zen error"; "the next puzzle is quietly easier"). It calls the selector at serve time for each puzzle.
- **Clash:** A's puzzles were generated before the error and can't ease. B regenerates puzzles that A already saved, so `treePath` and spec disagree between the snapshot and the `ResponseRecord`. FR-20 also says the engine picks `n` and the operator *per round* but difficulty per puzzle. Neither AD says at which granularity each is chosen.
- **Fix (amend AD-4 and AD-9):**
  - At round creation the selector fixes `n`, operator and round type. The top-down plan fixes only each node's required `c` (the answer contract).
  - A puzzle is *realised* lazily, when it's first served. At that point the selector picks the band within the constraint that `c` is fixed. Then `generate(seed, treePath, spec, versions)` runs, and the result and selection context are frozen into the round state. A realised puzzle is never regenerated.
  - Property test: for every band and `c`, a puzzle with that answer exists (or the band is clamped, with the clamp recorded in the selection context).

---

## High

### H5. Who picks the next theme and transition?

- **A (themes epic in render):** AD-15 says render reads tokens and packs are lists. It implements Randomize/Playlist with `Math.random` (legal outside core) and avoids repeating the last theme in render memory.
- **B (rounds in core):** FR-25 is a per-round rule, so it stores `themeId` on the round using the seeded RNG.
- **Clash:** after resume or a lost WebGL context, render rebuilds from the view model (AD-14), but A's choice wasn't in the view model, so the theme changes on resume. `RenderPort.setTheme(themeRef)` is a second channel that duplicates or contradicts `render(viewModel)`. Mode and Motion filtering of transitions (FR-26) could live in either unit.
- **Fix (amend AD-15):** `core.selectPresentation(state, tuning, catalogIds, rng)` picks `{themeId, transitionId}` when a round is created. The catalog (ids plus tags only) is passed in as data, and the result is stored on the round. Filtering by mode, Motion and profile is in core. Remove `setTheme` from `RenderPort`, or define it as the internal effect of a `themeId` change in the view model. Render resolves ids to token JSON. An unknown id falls back to a declared default theme.

### H6. The flash budget spans two adapters

- **A (Normal scoring, core):** implements FR-16's 700 ms power-cut merge in core by emitting one `PowerCut` per merged burst.
- **B (render):** implements the merge again visually, debouncing `PowerCut` in render, and adds particle strobing on combo.
- **C (ui):** the round-end flash (FR-17) is a DOM overlay with a fade-in.
- **Clash:** NFR-4 requires no more than 3 flashes per second *from all sources combined*. Render and ui each comply locally, but their sum can exceed the limit. The power-cut merge window exists twice, with different clocks (core `Tick` time vs render frame time).
- **Fix (new AD-23):** behaviour merges (power-cut merge, combo steps) live only in core, with windows from tuning. Every luminance change above a threshold is a *flash* and must go through one `FlashBudget` owned by render. ui may not animate luminance or colour over the play view; the round-end flash content is ui, but its backdrop flash comes from render. Each transition declares `maxFlashesPerSecond` in its registry entry, and a CI fixture checks the sum.

### H7. Nobody owns view-model shapes

- **A (render):** defines its own `PlayVM` in `render`, derived from `GameState` fields it reads through the "view types only" edge.
- **B (ui stats / control surface):** defines `ControlVM` and selects kid/grown-up visibility in components.
- **Clash:** AD-13 says both are built "from the same core view-model selectors", but no AD names the types, their inputs, or bars adapters from deriving values. Selectors also need `DeviceSettings`, `TuningConfig` and the catalog, not just `GameState`. Kid variants (softer power cut, absent social entries) are supposed to "come from view models", but render reads `profileKind` directly, which is legal.
- **Fix (amend AD-13):** `core/view` exports every view-model type (`PlayVM`, `A11yTreeVM`, `GuideVM`, `ControlSurfaceVM`, `StatsVM`, `RoundEndVM`) and one `selectView(appState, tuning, catalog) → ViewModels`. Adapters may format and lay out but may not branch on `profileKind`, mode or tuning. Each such decision appears as an explicit field (for example `powerCutCue: 'soft'|'full'`, `entries: [...]`). The dependency edge narrows to "imports `core/view` types only".

### H8. Ratings exist in two places

- **A (persistence):** writes ratings inside `ProfileSnapshot` (AD-10) and loads them as truth.
- **B (ratings):** treats ratings as a projection of `ResponseLog` (AD-8) and rebuilds on load.
- **Clash:** a crash between the snapshot rename and the log append (two separate I/O operations, even "in the same batch") leaves them disagreeing, and the two units pick different winners. Bucket ratings belong to the generator domain, yet AD-11 keys everything by profile. Are buckets per-profile? The ER diagram is silent.
- **Fix:** the log is the source of truth. Each record carries a monotonic `seq`. The snapshot stores `ratingsCheckpoint = { ratings, throughSeq }`. Write order is log append first, then snapshot. On load, replay records with `seq > throughSeq`. State explicitly that bucket ratings are per-profile in the POC (shared device-wide pooling is v1, and would need a `profileId = '*'` scope).

### H9. One record, two logs

- **A (telemetry):** AD-12 says `ResponseRecord` is a member of the `TelemetryEvent` union in `EventLog`, so it writes it there.
- **B (ratings):** AD-8 says it is appended to `ResponseLog`, so it writes it there and replays from there.
- **Clash:** the same record is duplicated and can diverge (crash between appends), and exports double-count. Who builds it is unstated: the ratings-before, K and expected P are only known inside core's rating update, but the app pipeline might build it after the fact from events.
- **Fix:** core's `step` emits a `ResponseRecorded` event that carries the complete record. App appends it to exactly one physical log (`ResponseLog`). `EventLog` holds the other telemetry kinds, and export merges both by `seq`. Alternatively use one log, with `ResponseLog` as a filtered read. Either way, pick one and state it.

### H10. "Command batch" and save timing are undefined

- **A (persistence):** saves "after each command batch". Since `Tick` is a command dispatched each frame, it does 60 atomic rename-writes per second on native.
- **B (scheduler):** coalesces ticks and saves on a 5 s timer.
- **Clash:** A burns battery and I/O. B violates FR-10's "persist after every tap". Overlapping async writes can also land out of order, so an older snapshot wins.
- **Fix (amend AD-10):** a batch is all commands dispatched in one macrotask. A save is triggered when a batch contains any non-`Tick` command, or on `Pause`. `Tick`-only batches never save, so a resumed timer may lag by at most one interval, which is acceptable. The writer is single-flight and latest-wins: one write in flight, and the newest pending state replaces any queued one. Log appends are ordered before the snapshot write (H8).

### H11. Tuning pinning is under-specified

- **A (tuning / dev panel):** the switcher swaps app's "active config" in memory. The snapshot stores `tuningVersion` only.
- **B (ratings):** updates ratings using the active config's K (AD-8 says K is swappable via `TuningConfig`).
- **C (persistence):** after an app update removes an old bundled config, resuming a mid-round snapshot pinned to `tuningVersion 3` finds no config, and the round can't continue.
- **Clash:** rating updates mid-round use a different K from the pinned round config. `ratingAlgoVersion` doesn't change when K changes, so ratings keyed by `algoVersion` mix tunings silently.
- **Fix (amend AD-7):** the round stores the *full* pinned config (or bundles keep every shipped config forever, enforced in CI). The rating update uses the pinned round config, and records `tuningVersion` (already in AD-6). The selector for the *next* round uses the active config. Changing the active config is a command (`SetActiveTuning{version}`) so that replay, telemetry and the snapshot agree.

### H12. `GameState` shape per round type and mode

- **A (Pyramid, v1):** adds `state.pyramid`, a persistent tree, and plays it as the active round.
- **B (Classic/Tower):** uses `state.round`. FR-49 says starting another type leaves the Pyramid untouched, so B overwrites `state.round` and assumes that the Pyramid lives elsewhere.
- **C (Normal scoring):** keeps combo and chain window at `state.combo` (session-wide), while Rapid Fire keeps `state.rapidFire.combo`.
- **D (control surface):** FR-18 allows switching mode "at any time", so it switches mid-round. Scoring and Zen constellation then diverge on a half-scored round.
- **Fix (new AD-24):** `GameState.rounds = { activeRoundId, byId: { [id]: Round } }`, where `Round` is a discriminated union (`classic | tower | pyramid | rapidFire | daily`), each carrying `RoundCore { roundId, seed, mode, tuning, presentation, modeState }`. Mode-specific state (combo, chain window, totems) lives in `modeState` inside the round. A `RoundType` registry provides `{ plan, realise, onSolve, isComplete }`. Mode and tuning are pinned per round. `SetSetting(mode)` takes effect at the next round, and the Pyramid's own mode is pinned when its round is created.

### H13. Two tap paths and optimistic animation

- **A (render):** to meet "first response same frame within 100 ms", it starts the solve shatter on `hitTest` locally, then sends `TapCell`. If core says the tap is wrong, it rewinds.
- **B (ui a11y tree / keyboard):** Enter dispatches `TapCell` directly. Render only learns about it through `play(events)`, possibly on the next frame.
- **Clash:** pointer taps show optimistic success while keyboard taps don't. Render briefly believes a cell is solved, which is exactly what AD-2 aims to prevent.
- **Fix (amend AD-14):** `app.dispatch` is synchronous. `step` runs, and `render.play(events)` and `render(vm)` are called in the same call stack as the input handler, for both paths. Render never animates an outcome before core's events. Tap-down feedback (a press ripple that isn't a verdict) is allowed and is not truth.

### H14. Profile list and active profile across two stores

- **A (profiles):** creating a v1 Kid profile writes a snapshot file, then appends to `DeviceSettings.profiles` in Preferences.
- **B (For grown-ups):** delete-all deletes `DeviceSettings` first, then files.
- **Clash:** a crash between the two writes leaves an orphan snapshot, a dangling `activeProfileId`, or a half-deleted device. AD-10's atomicity is per document only. There's no boot reconciliation, so each unit invents its own.
- **Fix (amend AD-10/AD-11):** the profile list is derived from snapshots present on disk. `DeviceSettings` holds only `activeProfileId`, the PIN hash and device-scope settings. On boot, if `activeProfileId` is missing, fall back to the first Kid profile; with no profiles, run first-run. Create writes the snapshot before `DeviceSettings`. Delete-all writes a `wipeInProgress` tombstone to `DeviceSettings`, deletes files, then clears `DeviceSettings`. Boot completes any pending wipe.

---

## Medium

### H15. Pause has two sources

`LifecyclePort` emits `Resume` on foreground while the control surface (ui) is still open after dispatching its own `Pause`. Timers restart behind the panel. **Fix (amend AD-17):** `GameState.pauseReasons: Set<'lifecycle'|'panel'|'gate'|'blur'>`. Commands are `Pause{reason}` and `Resume{reason}`. The clock runs only when the set is empty, and the scheduler reads a `isClockRunning` selector rather than tracking its own flag. The board blur until first tap (FR-10) is a reason that the first `TapCell` clears; that tap is consumed and not scored.

### H16. Onboarding: timers, guide suppression and focus

The onboarding epic puts an 8 s `setTimeout` in ui for the hint. That is legal: AD-17 only says the *scheduler* is the only clock reader in app, and ui is an adapter. Core onboarding computes hint visibility from `Tick`. Zen may not dispatch `Tick` at all, since AD-17 ticks only "while play is active". Suppressing the guide during the first collapse (FR-9) is decided by both. The ghost finger needs cell geometry (render), but the guide is ui. The keyboard focus ring (FR-8) could be drawn by either. **Fix:** amend AD-17 so no adapter reads a clock for game-meaningful timing and `Tick` runs in every mode while unpaused. Core owns `GuideState` (line, hint, ghost-finger target cell). ui renders text, and render draws the ghost finger and focus ring from `PlayVM`. `focusedCell` is app transient state passed into `selectView`.

### H17. Migrating append-only logs

Persistence reads AD-10's "migrations keyed by `saveFormatVersion`" and rewrites old log segments in place. The ratings replay assumes logs are immutable, and telemetry export assumes original records. **Fix (amend AD-10):** logs are never rewritten. Each segment header records `eventSchemaVersion`. A version bump opens a new segment. Core provides pure upcasters `vN → vN+1` applied on read. Snapshot migrations remain forward-only on `saveFormatVersion`.

### H18. "Session" undefined

`ResponseRecord` needs a session id and position (AD-8). Telemetry treats a new session as each cold start, while the selector (warm-up easing, the once-per-session content intro in FR-22) treats it as resume after 30 min. **Fix (amend AD-12):** app dispatches `StartSession{sessionId}` on cold start or on resume after a gap longer than `tuning.sessionGapMs`. Core keeps `session { id, position, contentIntroduced }`.

### H19. Dev panel bypass

The dev panel's level-pin override writes the pin into the store directly or calls the selector with an override. The control surface uses `SetLevelPin`. Telemetry then can't tell dev-forced puzzles from player pins. **Fix (amend AD-18):** every dev action is a normal command with `source: 'dev'` (`SetActiveTuning`, `SetLevelPin`, `ForceSeed`). It's recorded in `EventLog`, and the selection context gets `forcedBy: 'dev'`.

### H20. Stats source

The stats epic computes the 7/30-day trends (FR-39) by querying `EventLog` through `StoragePort` from ui (async, in an adapter). The persistence epic assumes stats are `GameState` aggregates. **Fix:** stats are incremental aggregates in `GameState.stats` (daily buckets, kept for 30 days, plus all-time), updated by `step`. `StatsVM` is computed from those aggregates only, and logs are never read for display.

### H21. Sound and haptics mapping owner

Render triggers the solve tone as part of the transition (it knows the tier). A separate "sound" feature subscribes to events in app and plays the same tone, so it plays twice. Or each assumes the other does it, and it plays never. **Fix (amend AD-16):** a single `FeedbackDirector` in app maps domain events plus `PlayVM` to `AudioPort`/`HapticsPort` calls, gated by profile settings. Render does visuals only, and the transition registry may name an audio cue id that the director plays.

### H22. Daily Seed across generator versions (v1)

"A `generatorVersion` fixed per day" means an older client must reproduce a newer generator, or the reverse, and players' puzzles diverge. **Fix (amend AD-6):** the generator package keeps every shipped `generatorVersion` callable (dispatch by version). The Daily Seed's version is `min(today's scheduled version, the highest the client has)`, and clients that lack it don't offer the Daily Seed that day.

---

## Low

### H23. Two value formatters

AD-5 puts formatting "only in adapters", so render (numerals, fractions, dot faces) and ui (a11y names "named by its value") each build a formatter. The a11y name can read "three quarters" while the canvas shows "¾", and dot-face thresholds differ. **Fix (amend AD-5):** core exports `displayValue(rational, representation) → { glyphs, spoken }`. Adapters typeset glyphs and announce `spoken`.
