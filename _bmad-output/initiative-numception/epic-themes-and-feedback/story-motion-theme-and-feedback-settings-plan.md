---
title: 'Motion, theme and feedback settings'
type: 'feature'
ticket: '4'
created: '2026-10-14'
status: 'done'
baseline_revision: '2d4d765a7266cbb69df976e7ff7aa36905f3e9ae'
route: 'full'
route_source: 'auto'
risk: 'medium'
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/epic-themes-and-feedback.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/EXPERIENCE.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/story-sound-through-a-feedback-director-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/story-haptics-on-the-iphone-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The AD-21 per-profile settings this epic needs (motion, themeSelection, playlist, effects, music, haptics) don't exist as state. Motion has only Full and Calm, OS Reduce Motion is ignored, themes are always Randomize, and the effects, music and haptics switches are dev flags in localStorage, outside the save. EXPERIENCE's Accessibility Floor wants Minimal motion: zooms become cuts, every transition becomes a crossfade of at least 400 ms, and looping animation stops. OS Reduce Motion maps to Minimal.

**Approach:**
- **Settings in core:** `ProfileSettings` gains `minimal` motion, `themeSelection`, `playlist`, `effects`, `music` and `haptics`, changed by one profile-scoped `SetSetting` command (AD-2), with a save-format bump (3 → 4) and a migration.
- **Effective motion:** the lower of the setting and the OS. The OS preference reaches core through a new app `AccessibilityPrefsPort` and a device-scoped runtime command, `SetOsPreferences { reduceMotion }`. Core uses it for beat durations and transition ids, and exposes it as `PlayVM.motion` for DOM surfaces.
- **Minimal look:** at Minimal, the advance, collapse and round-start beats last `MINIMAL_CROSSFADE_MS` (400) and carry `transitionId: 'crossfade'`. render draws them as a crossfade at the views' rest framing: no camera move and no scale.
- **Playlist:** `selectPresentation` follows the playlist order, moving on from the previous round's theme.
- **Feedback:** the FeedbackDirector reads effects, music and haptics from the active profile's settings. The dev panel's Sound block and a new Settings block dispatch `SetSetting`. The old localStorage flags are migrated once, then removed.

## Boundaries & Constraints

**Always:**
- **Core (AD-3 pure; one concept per file):**
  - `MotionLevel = 'full' | 'calm' | 'minimal'`.
  - `effectiveMotion(setting, reduceMotion)`: the lower of the two, in the order minimal < calm < full. Reduce Motion on gives `minimal`.
  - `AppState.os = { reduceMotion: boolean }`: runtime and not persisted, like `pauseReasons`. It's set by `SetOsPreferences`, which works with or without a profile and emits nothing.
  - `SetSetting { key, value }`:
    - `motion`: one of the three levels.
    - `themeSelection`: `randomize` or `playlist`.
    - `playlist`: up to 32 distinct, non-empty theme ids. They aren't checked against the catalogue, because the selection filters them.
    - `effects`, `music`, `haptics`: booleans.
    - Anything else, or no active profile, is rejected (`invalid-command`).
    - A change emits `SettingChanged { key, value }`; setting the same value again is a no-op.
    - The command isn't gated by pauses, since the control surface opens over a paused board.
    - A motion change takes effect from the next beat.
  - **Beats:** `beatDuration` takes the effective level.
    - At Minimal, `advance`, `collapse` and `roundStart` last `MINIMAL_CROSSFADE_MS` = 400. This is a core accessibility constant, like FR-9's caps, so no tuning bump is needed.
    - At Minimal, `solve` and the soft-miss cue run at the Full duration.
    - At Minimal, `beatAt` sets `transitionId: 'crossfade'` on the three moving beats, and `'default'` otherwise.
  - **Playlist (`selectPresentation`):**
    - The list is the playlist filtered to the pool (the catalogue's themes of the mode).
    - With no previous theme, it picks list[0].
    - Otherwise it picks the entry after the previous theme. When the previous theme isn't in the list, it picks list[0].
    - With an empty list, it falls back to Randomize.
    - Distinct ids mean consecutive rounds never repeat while the list holds two or more themes.
    - Randomize is unchanged, so golden fixtures and theme sequences stay the same.
  - **Defaults:** the Kid defaults add `themeSelection: 'randomize'`, `playlist: []`, `effects: true`, `music: false` and `haptics: true`, the same as the old dev-flag defaults.
  - **Save format 4:**
    - Migration 3 → 4 fills any missing setting with its default.
    - `checkGameState` validates every setting.
- **App:**
  - `AccessibilityPrefsPort { start(listener: (prefs: { reduceMotion }) => void): () => void }`, with a no-op.
  - `feedbackFlagsOf(state)`: the active profile's effects, music and haptics, or the defaults when there's no profile.
  - The director takes a `flags: () => FeedbackFlags` getter, reads it on every `handle`, and calls `audio.setEnabled` when the flags change.
  - `SettingsControls` (`get`, `set`, `themeIds`) for the dev panel replaces `FeedbackControls`. `FeedbackFlagStore` and `parseFeedbackFlags` are removed.
- **platform-web:**
  - `webAccessibilityPrefs()`: `matchMedia('(prefers-reduced-motion: reduce)')`, emitting at start and on change.
  - `takeLegacyFeedbackFlags(appId)`: reads the old `numception:feedback-flags:<appId>` key once, returns its boolean fields, and removes the key. `webFeedbackFlags` is removed.
- **Client:**
  - Starts the prefs port before `StartSession`, so the first beat already knows the OS level.
  - After `StartSession`, dispatches `SetSetting` for any legacy flag that differs.
  - Passes `SettingsControls`, backed by `scheduler.dispatch`, to the dev panel.
- **render:**
  - `transitionId === 'crossfade'` on an `advance` or `collapse` draws `from` fading out and `to` fading in, each at its idle transform (a cut with a crossfade).
  - On `roundStart`, `crossfadeLook(p)` draws a linear colour shift, the old top fading out and the new board fading in, with no scale.
  - `stats().beats` counts the frames drawn per style (`solve`, `zoom`, `cut`, `themeChange`, `crossfade`), for the e2e.
  - There's no looping animation in the build yet, so "stops looping animation" is satisfied trivially. `PlayVM.motion` is the hook for future loops.
- **Dev panel:**
  - The Sound block toggles dispatch `SetSetting`.
  - A Settings block has a Motion select (Full, Calm, Minimal) that also shows the effective level, Theme selection radios (Randomize, Playlist), and a Playlist text field (comma-separated ids, applied on change) listing the available ids.
- **Tests:**
  - core: each setting and its rejection, effective motion, Minimal durations and transition ids, playlist order without consecutive repeats, the migration, and `PlayVM.motion`.
  - app: the director following settings state.
  - platform-web: the prefs adapter and the legacy flags.
  - render: the crossfade looks.
  - e2e (WebKit, `reducedMotion: 'reduce'`): zooms drawn as cuts (no `zoom` frames, `cut` frames present, advance `transitionId` `crossfade`), and the round change drawn as a crossfade of at least 400 ms.
  - The sound and haptics specs move to the settings-backed toggles.
  - Golden fixtures stay unchanged.

**Never:**
- The control surface UI (epic-profiles-and-controls), the device-level OS-preference override, the transition library (entry 5), a tuning bump, or text-size preferences.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Set motion | `SetSetting motion minimal` | settings.motion minimal; `SettingChanged` | No error expected |
| Same value | `SetSetting effects true` when true | no change, no events | No error expected |
| Bad value | `SetSetting motion fast` / unknown key | state unchanged | `CommandRejected invalid-command` |
| No profile | `SetSetting` before `StartSession` | state unchanged | `CommandRejected invalid-command` |
| OS reduce on | `SetOsPreferences { reduceMotion: true }`, setting full | effective minimal; `PlayVM.motion` minimal | No error expected |
| OS reduce off | setting calm | effective calm | No error expected |
| Minimal advance/collapse | beat starts at Minimal | 400 ms, transitionId crossfade; render draws a cut with crossfade | No error expected |
| Minimal round change | top solved at Minimal | roundStart 400 ms crossfade, linear colour shift | No error expected |
| Playlist | [moonwater, kiln], previous kiln | moonwater, then kiln, … | No error expected |
| Playlist unknown ids | [washi], catalogue kiln+moonwater | falls back to Randomize | No error expected |
| Playlist duplicates | [kiln, kiln] | state unchanged | `CommandRejected invalid-command` |
| Effects off | `SetSetting effects false` | director plays no cues; haptics unaffected | No error expected |
| v3 save | settings without new keys | migrated to v4 with defaults | invalid shapes pass through for `checkGameState` |
| Legacy flags | localStorage `{effects:false}` | `SetSetting effects false` once; key removed | malformed or unreadable storage ignored |

</intent-contract>

## Code Map

- `packages/core/src/state/{game-state,app-state,command,game-event,step,create-profile,initial-app-state,beat,end-beat,run-timeline,reduce-tick,reduce-tap-cell,complete-presentation,start-round}.ts`: settings, commands, and threading the motion level into beats.
- `packages/core/src/presentation/{beat-duration,select-presentation}.ts`: Minimal durations and the playlist.
- `packages/core/src/save/{save-format-version,migrations,check-game-state}.ts`: format 4.
- `packages/core/src/view/{play-vm,select-view}.ts`: `PlayVM.motion`.
- `packages/app/src/{feedback-flags,feedback-director,game,index}.ts` plus a new `accessibility-prefs-port.ts` and `settings-controls.ts`.
- `packages/platform-web/src/{web-feedback-flags,web-accessibility-prefs,index}.ts`.
- `packages/render/src/{create-renderer,round-change}.ts`.
- `packages/ui/src/dev-panel/{dev-panel,mount-dev-panel,sound-block,settings-block}.tsx`.
- `apps/client/src/{main,test-hook}.ts` and `apps/client/e2e/{sound,motion}.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] Core settings, `SetSetting`, `SetOsPreferences`, effective motion, Minimal beats, playlist, `PlayVM.motion` (+ tests).
- [x] Save format 4 and the migration (+ tests).
- [x] App: prefs port, director reading settings, settings controls (+ tests).
- [x] platform-web: prefs adapter and legacy flag migration (+ tests).
- [x] render: crossfade looks and beat stats (+ tests).
- [x] Dev panel Settings block; client wiring; e2e (sound specs updated, new motion spec).

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass, and `BASE_PATH=/numception/ pnpm build` passes.
- Given WebKit with `reducedMotion: 'reduce'`, when puzzles are solved through a round change, then no zoom frames are drawn, the advances are cuts with a crossfade, and the round change is a crossfade of at least 400 ms.
- Given a playlist, when rounds complete, then themes follow its order with no consecutive repeat (core test).

## Implementation Notes

- **Settings (core):**
  - `packages/core/src/settings/` holds `MotionLevel` / `MOTION_LEVELS`, `effectiveMotion`, `ThemeSelection` / `MAX_PLAYLIST_LENGTH` (32), and `SettingChange`.
  - `ProfileSettings` carries all seven settings.
  - `KID_DEFAULTS` is exported from `create-profile.ts`.
  - The `SetSetting` command is flattened: `{ type: 'SetSetting', key, value }`.
  - `reduceSetSetting` validates the change, ignores a value the profile already has, and emits `SettingChanged { profileId, key, value }`.
  - `AppState.os = { reduceMotion }` comes from `SetOsPreferences`. It isn't persisted, because it's re-read at every boot.
- **Effective motion threading:**
  - `motionOf(state, game)` is computed where a beat starts: `reduceTapCell`, `reduceTick` and `completePresentation`.
  - It is passed through `runTimeline` → `endBeat` → `startAdvance` / `completeRound` → `beatAt(…, motion)`.
  - A Motion change, or a change to the OS preference, applies from the next beat. A running beat keeps its duration.
- **Minimal:**
  - `MINIMAL_CROSSFADE_MS` = 400 is a core constant, not tuning, so there's no tuning bump and the golden fixtures are untouched.
  - At Minimal, `advance`, `collapse` (the long first collapse too) and `roundStart` last 400 ms with `transitionId: 'crossfade'`.
  - `solve` and the soft-miss cue keep their Full durations.
  - There are no looping animations in the build yet. `PlayVM.motion` (the effective level, set on the top-level view only) is what future loops and DOM surfaces read.
- **Playlist:** handled in `selectPresentation`, with ids filtered to the mode's pool and deduplicated.
  - The first round, or a previous theme that isn't on the list, gives the list's first entry.
  - Otherwise it's the entry after the previous theme, wrapping.
  - With no usable ids, it falls back to Randomize.
  - `SetSetting` rejects duplicate ids, so the order is unambiguous without a stored cursor.
  - A one-theme playlist repeats; that is the player's choice.
  - Randomize is byte-for-byte unchanged.
- **Save format 4:**
  - `addSettings` (3 → 4) fills only missing settings with the defaults.
  - `checkGameState` validates each setting: the playlist must be distinct, non-empty ids, at most 32.
  - Tests cover the migration, the missing-step refusal, the round-trip and malformed settings.
- **App:**
  - `AccessibilityPrefsPort` and `noAccessibilityPrefs`.
  - `feedbackFlagsOf(state)`.
  - The director now takes `flags: () => FeedbackFlags`, read on every `handle`. It calls `audio.setEnabled` only when the channels change. `setFlags` is gone.
  - `SettingsControls` and `createSettingsControls` dispatch through the scheduler.
  - `FeedbackControls`, `FeedbackFlagStore` and `parseFeedbackFlags` are removed.
- **platform-web:**
  - `webAccessibilityPrefs()` reads `matchMedia('(prefers-reduced-motion: reduce)')`, at start and on change.
  - `takeLegacyFeedbackFlags(appId)` replaces `webFeedbackFlags`. It reads the old key once, keeps its boolean fields, and removes the key.
  - The client dispatches a `SetSetting` for each legacy field after `StartSession`. The old localStorage values are migrated, not defaulted.
- **Client:**
  - The prefs port starts before `StartSession`.
  - The director reads `feedbackFlagsOf(game.getState())` once the game boots, and the defaults before that.
  - The dev panel gets forwarding `SettingsControls`, because it mounts before boot.
- **render:**
  - At Minimal, a `crossfade` advance or collapse draws both views at their own rest framing, crossfading: a cut, with no camera move.
  - A `crossfade` round start uses `crossfadeLook`: linear colour, no scale, so luminance moves one way (unit-tested Kiln → Moonwater).
  - `stats().beats` counts the frames per `BeatStyle` (`idle`, `solve`, `zoom`, `cut`, `themeChange`, `crossfade`).
- **Dev panel:**
  - A new Settings block has a Motion select with the effective level, Randomize and Playlist radios, and a Playlist text field (comma- or space-separated, applied on change) listing the available theme ids.
  - The Sound block toggles now dispatch `SetSetting`.
- **e2e:**
  - `motion.spec.ts` (WebKit, `reducedMotion: 'reduce'`): `PlayVM.motion` is `minimal`; after three leaves no `zoom` frames are drawn and `cut` frames are; the round change has `transitionId: 'crossfade'` and `durationMs` ≥ 400, is on screen for ≥ 400 ms less two frames of wall time, and draws no `themeChange` frames.
  - The spec also shows that, without Reduce Motion, zooms move the camera, and that choosing Minimal in the dev panel cuts them.
  - `sound.spec.ts` now waits for the save before reloading, since the toggles persist in the profile save, and checks the one-shot legacy-flag migration.
- **Wall-time slack:** the beat is 400 ms of Tick time from the moment the solve ended, which falls inside a frame. So the first visible frame is already slightly under way, and the measured on-screen time was 384–390 ms. The e2e allows two 60 Hz frames of slack. If the floor must hold for wall time strictly, raise `MINIMAL_CROSSFADE_MS` to about 450.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.

## Auto Run Result

Built and verified 2026-10-14. The full chain passes: 1085 unit tests; 36 e2e tests pass and 1 is skipped; the BASE_PATH build passes. The orchestrator raised MINIMAL_CROSSFADE_MS from 400 to 450 so the on-screen crossfade is at least 400 ms of wall time (it measured 384–390 ms at 400). The e2e test now asserts at least 400 ms on screen, with no slack.
