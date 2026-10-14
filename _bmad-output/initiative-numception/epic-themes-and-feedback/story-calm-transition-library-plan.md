---
title: 'Calm transition library'
type: 'feature'
ticket: '5'
created: '2026-10-14'
status: 'in-review'
baseline_revision: '5b396b3c8c306e5b7a8dffd895d6ec53283965a0'
route: 'full'
route_source: 'auto'
risk: 'medium'
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/epic-themes-and-feedback.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/DESIGN.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/EXPERIENCE.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/mockups/theme-transitions-1.html'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/mockups/theme-transitions-2-nature.html'
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/story-motion-theme-and-feedback-settings-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Every round change is the same look: render hard-codes one whole-frame colour change (`'default'`), or the Minimal crossfade (`'crossfade'`). AD-15 wants transitions to be registered data that core chooses per round, filtered by mode and Motion, and DESIGN lists a calm set (fade, token interpolation, ripple, snow or embers) that Zen and Calm draw. The whoosh is wired to `RoundStarted` in the director, not to the transition.

**Approach:**
- **Data:** `content/transitions/<id>.json`, each a `Transition` validated by a valibot schema in core: `transitionId`, `tag` (`calm` | `intense`), `start` (`on-tap` | `after-tap`), `maxFlashesPerSecond` (0..3) and `audioCue` (a cue id or null). Shipped: `crossfade`, `fade`, `interpolate`, `ripple`, `snow`.
- **Selection:** `selectPresentation` returns `{ themeId, transitionId }`. At Minimal the transition is always `crossfade`. Otherwise it is drawn from the round's seed (its own salt) from the allowed pool (calm only, until Normal at Full exists), never the previous round's while another is available. `crossfade` is the Minimal fallback, not in the rotation. The choice is stored on `Round.transitionId` (save format 5) and drawn by the `roundStart` beat.
- **Render:** draws each calm transition within the `roundStart` beat, from pure functions of progress, with no filters.
- **Sound:** `RoundStarted` carries the `transitionId`; the director plays that transition's `audioCue`.
- **Dev panel:** a Transitions block that forces a transition for the next round changes (a runtime core override, like `os`) and replays the last round change in any transition at once.

## Boundaries & Constraints

**Always:**
- **Core (AD-3 pure; one concept per file):**
  - `TransitionSchema` / `parseTransition` / `TransitionCatalog` / `BUILTIN_TRANSITIONS` (`interpolate` and `crossfade`, like `BUILTIN_THEMES`), in `core/src/transition/`.
  - `selectPresentation(request, tuning, themes, transitions)`. The request gains `motion`, `previousTransitionId` and `transitionOverride`. Theme selection is unchanged byte for byte (golden fixtures and theme sequences hold).
  - Pool: catalogue transitions with tag `calm`, or `intense` only when the mode is `normal` and motion is `full` (no Normal rounds yet), less `crossfade`. Empty → `interpolate`.
  - The override (`AppState.overrides.transitionId`, set by the device-scoped runtime command `SetTransitionOverride { transitionId: string | null }`, never persisted) wins when it is in the pool. Minimal still wins over it.
  - `Round.transitionId`: the transition that brought the round in. The `roundStart` beat's `transitionId` is the round's. Other beats keep `default` / `crossfade`.
  - `RoundStarted { …, transitionId }`.
  - Save format 5: migration 4 → 5 gives every round `transitionId: 'interpolate'` (the look it was drawn with). `checkGameState` requires a non-empty string.
- **App:** `loadTransitionCatalog(files)` like `loadThemeCatalog`. `createGame` and the director take the catalogue; `cuesFor(events, transitions)` plays the `RoundStarted` transition's `audioCue` when it is a known `CueId` (an unknown transition id still whooshes; `audioCue: null` plays nothing). `SettingsControls` gains `transitionIds`, `transitionOverride()` and `setTransitionOverride(id)`.
- **Render (no filters; stencil masks only; ≤ 150 particles):**
  - `interpolate` (and the legacy `default`): today's three-step round change, colours tweened in OKLCH.
  - `crossfade`: today's Minimal crossfade (sRGB, linear).
  - `fade`: the new layer (its surface and board) fades in over the old as one, its board settling from 1.05× to rest while the old board drifts out to 1.03×; opaque before the old is gone.
  - `ripple` (on-tap): a circle from the tap point (the old top's answer cell) reveals the new round, a 2 px accent front and two fainter trailing rings; the radius eases out and reaches the farthest corner at 78 %.
  - `snow` (after-tap): flakes in the new theme's colours fall and land as clumps until the old round is blanketed, the rounds swap under full cover, then the clumps melt outward from the tap point. Embers (glowing dots, ash blanket) when the destination is dark.
  - Mid-luminance: on a light ↔ dark change (surfaces on either side of luminance 0.18) the spatial transitions bridge: the old region drifts to the half-way theme while the new one arrives from it (ripple), or the blanket is the half-way colour (snow), so each pixel moves monotonically and the frame passes mid-luminance. `fade`, `interpolate` and `crossfade` are monotonic mixes.
  - `stats().beats` counts the round change per transition (`themeChange` for interpolate, plus `fade`, `ripple`, `snow`, `crossfade`).
  - `replayRoundChange(transitionId, durationMs)`: dev-only replay of the last drawn round change, self-timed; any new view cancels it.
- **Tests:** core: the schema; Zen and Calm only ever pick calm transitions; Minimal always crossfade; no consecutive repeat; determinism; theme sequences unchanged; the override; the migration and save round-trip. App: the catalogue loader and the cue from data. Render: the looks (monotonic luminance and a mid-luminance frame on Kiln ↔ Moonwater, full coverage at the swap, particle cap). Content: every transition file valid and ≤ 3 flashes per second. e2e: successive round changes draw different transitions; look-specific specs force `interpolate` through the dev panel.

**Never:**
- Intense transitions (entry 8), the FlashBudget (entry 7), per-frame filters or WebGL shaders, a tuning bump, or starting an on-tap transition before the solve beat ends (deferred: the beat sequence stays solve → roundStart).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Zen, Calm or Full | round change | a calm transition other than `crossfade`, not the previous round's | No error expected |
| Minimal (setting or OS) | round change | `crossfade` | No error expected |
| One calm transition | catalogue {ripple, crossfade} | ripple every round | No error expected |
| No calm transitions | catalogue {crossfade} or none | `interpolate` (built-in) | No error expected |
| Override | `SetTransitionOverride ripple`, Calm | ripple every round change | No error expected |
| Override not in pool | `SetTransitionOverride nowhere` | ignored by selection | No error expected |
| Override bad | `SetTransitionOverride 7` | state unchanged | `CommandRejected invalid-command` |
| Override at Minimal | override ripple, Minimal | crossfade | No error expected |
| v4 save | rounds without `transitionId` | migrated to v5, `interpolate` | invalid shapes pass through for `checkGameState` |
| Bad transition file | schema fails / id ≠ file name / duplicate | left out; others load | logged in dev |
| Unknown transitionId in render | e.g. `default` | drawn as `interpolate` | No error expected |
| Light ↔ dark ripple / snow | Kiln ↔ Moonwater | each pixel monotonic; a mid-luminance frame | No error expected |
| Cue | RoundStarted ripple (`audioCue: whoosh`) | whoosh | `null` cue: silent |

</intent-contract>

## Code Map

- `packages/core/src/transition/*` (new): schema, parse, catalogue, ids.
- `packages/core/src/presentation/select-presentation.ts`: the transition draw.
- `packages/core/src/state/{app-state,initial-app-state,command,game-event,step,round,start-round,end-beat,run-timeline,reduce-tick,reduce-pause,reduce-start-session,complete-presentation}.ts` plus a new `reduce-set-transition-override.ts`: threading the catalogue and the override.
- `packages/core/src/save/{save-format-version,migrations,check-game-state}.ts`: format 5.
- `packages/app/src/{transition-catalog,feedback-director,game,settings-controls,index}.ts`.
- `packages/render/src/{create-renderer,round-change}.ts` plus new `oklch.ts`, `transition-looks.ts`, `snow-field.ts`.
- `packages/ui/src/dev-panel/{dev-panel,transition-block}.tsx`, `mount-dev-panel.ts`.
- `apps/client/src/main.ts`, `apps/client/e2e/{play-helpers,themes,play,transitions}.spec.ts`.
- `content/transitions/*.json`, `content/README.md`, `tools/transition-content.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] Transition schema, catalogue, content files and content test.
- [x] `selectPresentation` transition draw, `Round.transitionId`, override command, `RoundStarted.transitionId`, save format 5 (+ tests).
- [x] App: catalogue loader, director cue from data, game and settings controls wiring (+ tests).
- [x] Render: OKLCH interpolation and the fade, ripple and snow looks, replay (+ tests).
- [x] Dev panel Transitions block; client wiring; e2e.

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass, and `BASE_PATH=/numception/ pnpm build` passes.
- Given Zen at Full or Calm, when many rounds are created, then every transition is calm and never `crossfade`, with no consecutive repeat; at Minimal every one is `crossfade` (core tests).
- Given the playtest build, when two round changes run, then they draw different calm transitions (e2e), and on the iPhone successive rounds look different (hitl).

## Implementation Notes

- **Data and schema (core `transition/`):**
  - `TransitionSchema` is strict: `kind: 'Transition'`, `schemaVersion: 1`, `transitionId`, `name`, `tag`, `start`, `maxFlashesPerSecond` (an integer 0..3, `MAX_FLASHES_PER_SECOND`) and `audioCue` (a camelCase cue id or null).
  - `parseTransition` returns `invalid-transition`, a new `DomainError` code.
  - `BUILTIN_TRANSITIONS` holds `crossfade` and `interpolate`. `CROSSFADE_TRANSITION_ID` moved here from `state/beat.ts` (still exported from core); `FALLBACK_TRANSITION_ID` is `interpolate`.
  - Shipped in `content/transitions/`: `crossfade`, `fade`, `interpolate` and `snow` (after-tap), and `ripple` (on-tap). All are calm with the whoosh cue. `maxFlashesPerSecond` is 1, and 2 for snow, whose blanket can land and then melt back slightly on a pixel. `tools/transition-content.test.ts` checks them.
- **Selection (`selectPresentation` → `{ themeId, transitionId }`):**
  - The theme draw is now `selectTheme`, unchanged byte for byte (a test compares the two). Golden fixtures are untouched.
  - `selectTransition` draws from its own salt (`0x165667b1`) of the round seed:
    - At Minimal: `crossfade`.
    - Otherwise the pool is calm transitions, plus intense ones only in Normal at Full, less `crossfade`. It falls back to `interpolate`.
    - A dev override in the pool wins.
    - Otherwise a uniform draw from the pool less the previous transition.
- **Threading:**
  - `step(state, envelope, tuning, themes, tunings, transitions = BUILTIN_TRANSITIONS)`.
  - The reducers pass a `TransitionSource { catalog, override }` (`state/transition-source.ts`) down `runTimeline` → `endBeat` → `completeRound` → `startRound(…, choice: { transitions, motion, previousTransitionId })`.
  - `completeRound` puts the new round's `transitionId` on the `roundStart` beat. Other beats keep `default` / `crossfade`.
  - `RoundStarted` carries `transitionId`. A session's first round gets one too: drawn, but no round change shows it.
- **Override:** `AppState.overrides = { transitionId }`, set by `SetTransitionOverride` (device-scoped, works without a profile, never persisted, emits nothing; a malformed id is `invalid-command`). Minimal still wins over it.
- **Save format 5:** `addTransition` (4 → 5) gives rounds without a transition `interpolate`. `checkGameState` requires a non-empty `transitionId`. Tests cover the migration, the missing-step refusal, the round-trip and rejection.
- **App:**
  - `loadTransitionCatalog` mirrors `loadThemeCatalog`.
  - `createGame({ transitions })`.
  - The director takes `transitions`: `transitionCue(id, catalog)` gives the transition's `audioCue` when it is a known `CueId`, null for a null or unknown cue, and the whoosh for a transition not in the catalogue (e.g. an old save's).
  - `SettingsControls` gains `transitionIds`, `transitionOverride()` and `setTransitionOverride()`.
- **Render:**
  - `transitionStyle(id)` maps unknown ids (the legacy `default`) to `interpolate`.
  - `interpolate`: the existing three-step look, colours now mixed in OKLCH (`oklch.ts`). Near-grey pairs (chroma < 0.03) mix straight across OKLab to avoid a hue jump; per-role luminance is tested monotonic for the Kiln/Moonwater pairs.
  - `crossfade`: unchanged (sRGB).
  - `fade`: the new board resolves in under the old one, from 1.06× to rest, and is opaque by 50 %. The old board then dissolves, drifting to 1.03×, between 45 % and 90 %. The surface tweens in OKLCH. Each board stays in its own theme.
  - `ripple`:
    - Origin: the old top's answer cell, where the player tapped.
    - Reveal: the new round sits on a second pooled layer masked by a stencil circle. There's a 2 px accent front and two fainter rings in a third, unmasked effects layer.
    - Reach: eases out to the farthest corner at 78 %.
  - `snow`:
    - Field (`snow-field.ts`): a seeded field of at most 96 clumps on a jittered hex grid (radius beyond the covering radius) and at most 150 flakes.
    - Timing: clumps land by 48 % and are grown by 58 %. The rounds swap under full cover at 59 % (a full-frame rect is drawn from 56 % to 62 % as well). Melting runs from 60 %, ordered by distance from the tap, and is done by 100 %.
    - Dark destination: embers (accent dots with a soft halo) into ash.
  - **Mid-luminance:** for a light ↔ dark pair (surfaces either side of luminance 0.18), ripple draws the old side drifting to the half-way theme while the new side arrives from it, and snow's blanket is half-way between the old surface and the snow or ash. Each pixel moves one way, and the frame passes mid-luminance (unit-tested both directions). Fade and interpolate are monotonic mixes.
  - The page band follows each transition: the ripple's new surface once the ring has passed the top corners, and for snow the old surface, then the blanket, then the new one.
  - `stats().beats` adds `fade`, `ripple` and `snow`; `interpolate` stays `themeChange`, so existing specs hold.
  - `replayRoundChange(id, { theme, durationMs })` replays the last round change drawn, or, before any, the current view into another theme. It runs on the ticker's clock and is cancelled by any game beat.
- **Dev panel:** a Transitions block.
  - "Round changes" select (Random or a calm id) dispatches `SetTransitionOverride`.
  - A Preview button per id (crossfade too) closes the panel, replays that transition, and plays its cue through the director: the client hands the director a synthetic `RoundCompleted` / `RoundStarted` pair, with no game state change.
- **e2e:**
  - New `transitions.spec.ts`:
    - Two round changes draw two different calm transitions, each counted in its own style, with no crossfade.
    - Forcing ripple gives a ripple round change and a whoosh.
    - Every transition previews without page errors and hands back to an idle board.
  - `play.spec.ts`'s round-change look test and `themes.spec.ts`'s mid-luminance band test force `interpolate` through the dev panel (`forceTransition` helper), since they check that look.
- **Verified:** the full chain passed (1138 unit tests; 39 e2e passed, 1 skipped), and `BASE_PATH=/numception/ pnpm build` passed. Budget: playtest 0.198 MB gzipped (4.0 %). Mid-transition screenshots of each preview were checked by eye in WebKit at 390 × 844.
- **Deferred / risks:**
  - On-tap transitions (ripple) still start after the solve beat (~475 ms at Calm), not on the tap itself: starting them at the tap means choosing the transition at the top's tap and overlapping the solve beat, which is a beat-sequence change.
  - On a light ↔ dark change the bridge makes the ripple's revealed side and the snow blanket mid-grey for a while, which reads flatter than the mockups. The user's rating may ask for a different reading of "mid-luminance frame".
  - 60 fps on the iPhone is not measured. The work per frame is one stencil mask (ripple) or about 230 circles (snow), with no filters or render textures.
  - All transitions use the tuning's round-change duration (900 ms × Calm 1.25). Per-transition durations (the mockups use 1200 ms for nature) would need a tuning or data field.
  - The FlashBudget and the CI flash sum are entry 7. `maxFlashesPerSecond` is only declared and schema-capped here.

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.

## Auto Run Result

Built and verified 2026-10-14. The full chain passes: 1138 unit tests; 39 e2e tests pass and 1 is skipped. Waiting on the user's rating on the iPhone.
