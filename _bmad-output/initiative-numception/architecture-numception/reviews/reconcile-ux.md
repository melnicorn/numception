---
kind: reconcile-review
spine: ../architecture-numception.md
inputs:
  - ../../ux-numception/EXPERIENCE.md
  - ../../ux-numception/DESIGN.md
precedence: ../../prd-numception/prd-numception.md overrides UX on conflict
created: '2026-10-09'
---

# Reconcile: UX spines vs Architecture spine

Scope: UX behaviours with architectural consequence that the spine does not support, leaves unowned, or contradicts. Where UX and PRD disagree, PRD wins (daily streak is in for v1, the active profile persists across cold start, telemetry uploads in v1). The spine is **already aligned with the PRD** on those three points (AD-17 `ctx.localDate` streak, AD-10 `DeviceSettings.activeProfileId`, AD-12 `TelemetryTransport`), so they are not raised as gaps; the stale UX text (EXPERIENCE "no daily streak", "Adult mode does not persist across a cold start", "Stored on this device only", kid power cut with red/thud) is a UX-doc update owned by PO via `bmad-ux`, already listed in the PRD hand-off.

Severity: **High** = two agents will build incompatible things or a PRD/NFR test fails; **Medium** = likely rework or drift; **Low** = clarify before the relevant epic.

## Summary

| # | Gap | Severity |
|---|---|---|
| 1 | Presentation phase (transitions, collapse, narration) has no owner: input-drop, timer behaviour and resume-to-end-state undefined | High |
| 2 | Pause/blur semantics: "blurred until first tap", first-tap consumption, a11y tree leak, web blur vs visibility | High |
| 3 | Flash budget (≤ 3/s, all sources) and 700 ms wrong-tap coalescing have no home | High |
| 4 | Navigation/zoom state (which puzzle is in view) is not game state; no commands for it | High |
| 5 | Theme-per-round and transition selection: no owner, not seeded, not persisted | High |
| 6 | Cell geometry/layout lives only in `render`; `ui` needs it for keyboard play, focus ring and a11y tree | High |
| 7 | Theme token schema covers colour only; typography, inset, joins, glow, textures, kid variants missing | Medium |
| 8 | Fonts: per-theme self-hosted faces must be loaded before canvas draw with no loading states | Medium |
| 9 | Settings scoping: per-profile defaults (Motion, Chain window) vs device-level `DeviceSettings` | Medium |
| 10 | OS accessibility preferences (Reduce Motion, text size) have no port | Medium |
| 11 | Motion level reaches `render` only; core-side effects (zoom cuts, collapse pacing, constellation loops) unassigned | Medium |
| 12 | Contrast/CVD checks only on static tokens; interpolated and transient states unchecked | Medium |
| 13 | AD-17 "scheduler is the only clock reader" contradicts animation/guide timers in `render`/`ui` | Medium |
| 14 | Cell placement randomisation is not in core; breaks exact resume and competitive seeds | Medium |
| 15 | Solve-time measurement excludes pause/transition time? Not specified; feeds ratings | Medium |
| 16 | Zen constellation: persisted data, layout determinism and draw surface unassigned | Low |
| 17 | Kid power-cut variant (no red, no thud) not in theme grammar or audio mapping | Low |
| 18 | Mini-map (v1, Minimal motion) needs a tree-position view model | Low |
| 19 | Sound/haptic event mapping, coalescing and kid variant unowned | Low |
| 20 | First-ever collapse / wordless discovery flags and pacing location | Low |

Total: **20 gaps** (6 High, 9 Medium, 5 Low).

## Gaps

### 1. Presentation phase has no owner (High)

- **UX ref:** EXPERIENCE State Patterns "Mid-transition: lands on the transition's end state, no replay"; "a transition in progress completes to its end state"; Open Q 19 input during a transition; `equation-narration` not skippable; `round-collapse`, `round-end-flash` "no input needed". PRD FR-8 (input during transition dropped, OQ-9 default), FR-10 (interrupted transition resumes at end state).
- **Spine ref:** AD-14 (render holds no game truth, rebuilds from view model), AD-2, AD-17. Absent: any notion of a blocking presentation phase.
- **Problem:** "Drop input during a transition" is a rule, but transitions exist only in `render`, which holds no truth. If `render` drops taps, the rule lives in the adapter (violates AD-2 spirit, untestable in replay); if `core` drops them, core has no idea a transition is running. Also undefined: does `Tick` advance the chain window / solve time during solve transition, round collapse, round-end flash and narration? Resume-to-end-state works only if the snapshot never stores "mid-transition" — not stated.
- **Fix:** Add an AD: `GameState` carries `presentation: { phase: 'play' | 'transition' | 'collapse' | 'narration' | 'roundEnd', id, untilMs }` set by `core.step` from the event that starts it, with durations from `TuningConfig` (pacing). `core` drops `TapCell` while `phase !== 'play'` (emits `InputDropped` for telemetry) and freezes chain window/solve time during non-play phases. `render` animates the phase and dispatches `PresentationDone` (or core ends it via `Tick` reaching `untilMs`). Snapshots persist only the post-phase end state, so resume never replays. Same-frame tap feedback (AD-14) stays render-local and cosmetic.

### 2. Pause and blur semantics (High)

- **UX ref:** `menu-button` "pauses both timers and blurs the board so the pause can't be used to study"; State Patterns "Interrupted/backgrounded: … board blurred on return until the first tap"; `control-surface` dismiss resumes timers. PRD FR-10, FR-40.
- **Spine ref:** AD-16 `LifecyclePort` emits `Pause`/`Resume`; AD-17 no `Tick` while paused; AD-2 lists `Pause`/`Resume`. Absent: blur state, first-tap rule, menu as a pause source.
- **Problem:** (a) "Blurred until first tap" means `Resume` from lifecycle does **not** unpause play — the first tap does; is that first tap consumed (unblur only) or also a `TapCell`? Unspecified, and it decides whether a resume-tap can be a wrong tap. (b) Two pause sources (menu, lifecycle) can overlap; a single boolean breaks (close menu while backgrounded). (c) The accessible tree (AD-13) still exposes every cell name while blurred, defeating anti-study. (d) Web: `visibilitychange` vs window `blur` (e.g. devtools, split-screen) not specified.
- **Fix:** `GameState.pause = { reasons: Set<'menu'|'lifecycle'|'gate'>, blurred: boolean }`. `Resume` removes a reason; `blurred` clears only on a dedicated `Unblur` command that `ui`/`render` send for the first tap, which is consumed (not forwarded as `TapCell`). Timers run only when `reasons` is empty and `blurred` is false. View-model selector hides cell values in the a11y tree while blurred ("Board hidden. Tap to continue."). `platform-web` LifecyclePort uses `visibilitychange` + `pagehide`; window blur is not a pause.

### 3. Flash rate limiting and wrong-tap coalescing (High)

- **UX ref:** `power-cut` "wrong taps within 700 ms coalesce into one cut; ≤ 3 flashes/s from all sources"; Accessibility Floor Flashing; DESIGN Do's "≤ 3 flashes/s", dark↔light through mid-luminance. PRD FR-16, FR-26, NFR-4.
- **Spine ref:** Absent. AD-15 tags transitions calm/intense only.
- **Problem:** Coalescing is a game rule (one combo reset, one cut event, but are both taps logged as wrong responses for ratings?) yet nothing says it is in `core`. The ≤ 3/s budget spans power cuts, theme transitions, combo glow steps, round-end flash, Overdrive fireworks and particles — no single place sees all of them, so each feature will self-police and the sum will exceed the cap.
- **Fix:** (a) In `core/rules`: second wrong tap within `TuningConfig.powerCutCoalesceMs` (700) of the last cut emits `WrongTap` (logged as a `ResponseRecord`, rating updated once per puzzle per policy) but no new `PowerCut` event. (b) In `render`: one `FlashGovernor` (sliding 1 s window, max 3 luminance transitions, enforced mid-luminance frame on dark↔light) that every effect requests through; requests over budget degrade to a non-flashing variant. Add a Playwright/visual test that fires worst-case sequences and samples frame luminance. Name the governor in AD-14 or AD-15.

### 4. Navigation/zoom state is not game state (High)

- **UX ref:** Interaction Primitives "Zoom: tier 2 is an overview… player zooms into one tier-1 puzzle at a time; solving zooms back out"; State Patterns "Mid-tier-2: reopens the tier-2 puzzle"; Open Q 16 (does the player choose which puzzle to enter). PRD FR-9 zoom-as-layout, FR-10 exact resume.
- **Spine ref:** AD-2 command list (`TapCell`, `Tick`, `Pause`, …); AD-4 `treePath`. Absent: current-view path and zoom commands.
- **Problem:** Which puzzle is on screen is needed for exact resume, for `hitTest` meaning, for the a11y tree contents and for keyboard focus, but it isn't in `GameState` and there is no `EnterPuzzle`/`ZoomOut` command. Left alone, `render`'s camera becomes a second source of truth (the exact failure AD-2 prevents).
- **Fix:** Add `GameState.viewPath: treePath` and commands `EnterPuzzle { treePath }` / `ZoomOut`. `core` auto-sets `viewPath` after solve/collapse; `render` derives the camera from it. Keep the gesture (tap vs pinch) open, since both map to the same commands.

### 5. Theme-per-round and transition selection (High)

- **UX ref:** Theme & Transition System "new theme every round; randomize across unlocked themes or a user-built playlist"; transition "drawn from the incoming theme's pack, filtered by intensity tag"; Zen calm only; intense only at Full. PRD FR-25 (no consecutive repeat), FR-26.
- **Spine ref:** AD-15 (themes/transitions are data, packs are id lists), AD-14 `setTheme(themeRef)`. Absent: who selects, with what randomness, and where the choice persists.
- **Problem:** Selection needs randomness (core forbids ambient randomness; render would use `Math.random`), mode + Motion + profile filtering, a no-repeat rule and a playlist cursor. The chosen theme must survive resume (cold open restores the same look) and Daily Seed/replay may want it reproducible. Nothing owns this.
- **Fix:** `core/themes/select(state, catalog, settings, rng) → { themeId, transitionId }` run at round creation, seeded from the round seed; result stored on the round in `GameState` with the playlist cursor. Filtering by `mode`, `motion`, `profileKind` happens there. `render` only receives `setTheme(themeId)` and plays `transitionId`. Add a test: no consecutive repeat when > 1 theme available; Zen never gets an `intense` id.

### 6. Cell geometry for keyboard play and the accessible tree (High)

- **UX ref:** Interaction Primitives "keyboard arrows move focus between cells, Enter/Space taps"; `focus-ring` follows focus across cells; `puzzle-cell` edge-ambiguous taps are no-ops; Accessibility Floor "full keyboard play on web". DESIGN `focus-ring` on keyboard-focused cell. PRD FR-8, NFR-4.
- **Spine ref:** AD-13 (ui builds a parallel tree from core view-model selectors, never from render internals), AD-14 `hitTest` in `render`. Absent: shared layout.
- **Problem:** Arrow-key navigation needs spatial adjacency between polygon cells; a DOM focus ring positioned over a canvas cell needs that cell's screen bounds; edge no-op tolerance must match between pointer and keyboard. All of that is geometry, which today only `render` knows — and AD-13 forbids `ui` reading `render` internals.
- **Fix:** Put per-n shape geometry and placement in a pure `core/layout` (normalised coordinates, adjacency graph, inscribed-circle sizes for the tap-target test). `render` scales it and implements `hitTest` from it; `ui` uses the same layout plus a `render.getViewportTransform()` (add to `RenderPort`) to place the DOM focus ring and order the a11y tree. Add a unit test that every cell's inscribed circle ≥ 48/56 at the reference frame for each n.

### 7. Theme token schema is colour-only (Medium)

- **UX ref:** DESIGN Theme grammar (colour roles), Typography table (face, weights, tracking, per-role sizes per theme), Layout "cell inset is a theme token", Corners (line join per theme), Elevation & Depth (glow sigma, stroke widths, textures, Kiln tile shadow), combo `strokeScale`/`bloomScale`; Zen themes leave Normal roles empty.
- **Spine ref:** AD-15 "a theme is a token JSON matching the UX role grammar (surface, line, number, … error)".
- **Problem:** Only colour roles are named; `render` will hard-code inset, joins, glow, typography and textures per theme, so "a new theme needs no code" fails. Mode applicability (Zen vs Normal role sets) is not validated.
- **Fix:** Expand AD-15: theme schema (valibot, in `core` or `content`) = `{ id, mode, colors{role}, typography{face, weights, tracking, sizes}, geometry{inset, lineJoin, strokeWidth}, glow{sigmas, comboScale}, texture? }`, with mode-dependent required roles. CI fails on missing roles.

### 8. Fonts (Medium)

- **UX ref:** DESIGN Typography — one geometric face per theme, several are Apple system fonts, web uses self-hosted licensed fonts or fallbacks, no CDN; numerals distinct at 20 px; DOM surfaces use the active theme's face. EXPERIENCE Open Q 12. PRD NFR-1 no loading states, ≤ 5 MB web, privacy no third-party CDN.
- **Spine ref:** Absent (Stack has no font entry; Structural Seed has no `content/fonts`).
- **Problem:** Canvas text drawn before a `FontFace` resolves renders in a fallback and re-flows mid-transition; a per-round theme change would hit an unloaded face exactly during the transition. Licensing and bundle budget are unowned.
- **Fix:** Add `content/fonts/` (self-hosted, subset to digits + operators + UI glyphs), a `FontPort`/preloader in `app` that loads all unlocked themes' faces at boot (and the next theme's face before its round starts), and a rule that theme selection (gap 5) only picks themes whose fonts are loaded. Per-theme fallback stack in the theme JSON; licence check in the font folder README or CI manifest.

### 9. Settings scoping (Medium)

- **UX ref:** Profiles table — Motion default Kid Calm / Adult Full; Chain window kid default Relaxed; control-surface rows (Mode, Motion, Chain window, Sound, Themes). PRD FR-40 kid defaults, FR-34 per-profile.
- **Spine ref:** AD-10 "`DeviceSettings` holds the active profile id, the PIN hash and device preferences"; AD-2 `SetSetting` goes through `core.step` (i.e. into `GameState`).
- **Problem:** It's ambiguous whether Motion, Sound, Chain window and Theme mode are device-level (`DeviceSettings`) or per-profile (`GameState`). Per-profile defaults imply per-profile storage; Chain window changes rules so it must be in `GameState`; Sound may reasonably be device-level.
- **Fix:** State explicitly: rule-affecting and profile-defaulted settings (Mode, Chain window, Motion, Themes, level pin) live in `GameState.settings` per profile; only Sound/Haptics volume-type prefs and the active profile live in `DeviceSettings`. Record `motion` and `chainWindow` on `ResponseRecord` (they affect performance data).

### 10. OS accessibility preferences have no port (Medium)

- **UX ref:** Motion setting "OS Reduce Motion maps to Minimal"; "DOM surfaces honour OS text size up to 200%". PRD FR-40, NFR-4.
- **Spine ref:** AD-16 port list (no accessibility-prefs port).
- **Problem:** Web gets `prefers-reduced-motion` via media query, but in a Capacitor WKWebView iOS Dynamic Type does not flow into CSS automatically, and Android font scale behaves differently; Reduce Motion changes at runtime. Without a port each feature will query it ad hoc.
- **Fix:** Add `AccessibilityPrefsPort { reduceMotion$, textScale$ }` (web: media queries; native: a small Capacitor plugin or `@capacitor/app` + native bridge). `app` maps `reduceMotion` to an effective Motion = `min(user, OS)`; `ui` applies `textScale` as root font-size. Test the control surface and stats at 200%.

### 11. Motion level side effects outside `render` (Medium)

- **UX ref:** Accessibility Floor Motion table (Calm: slower zoom; Minimal: every transition a ≥ 400 ms crossfade, zooms become cuts, looping animations stop, static mini-map). `round-collapse` Minimal = ≥ 400 ms crossfade cut. PRD FR-26.
- **Spine ref:** AD-14 `setMotion(level)`; AD-15 transition tags.
- **Problem:** Motion also changes presentation phase durations (gap 1 — core needs them to know when input reopens), transition selection (gap 5) and DOM animations in `ui` (control surface, constellation, stats trend). Only `render` is told.
- **Fix:** Effective Motion is part of the view model; `core` uses it for phase durations and selection; `ui` applies it as a root attribute so CSS honours it. List these consumers in AD-14/AD-15.

### 12. Contrast/CVD checks miss dynamic states (Medium)

- **UX ref:** DESIGN Theme grammar contrast targets and "colour-vision check of error vs solved and the combo ramp"; combo steps interpolate in OKLCH (1.2x/1.4x/1.8x); token-interpolation transitions; power-cut dims; Kiln numbers never on bare `surface-deep`. PRD FR-25, NFR-4.
- **Spine ref:** AD-15 "Each theme declares its contrast and colour-vision checks in CI fixtures".
- **Problem:** Static role pairs pass, but interpolated combo stops and intermediate frames of token interpolation (e.g. number vs surface at 50% between a dark and light theme) are not checked; `number-dimmed` during power cut must stay ≥ 4.5:1; segmented-control variants (`timer-line-dimmed`, `number-dimmed` in Vector Noir) are reused out of role.
- **Fix:** CI contrast job computes WCAG ratios over (a) all role pairs incl. `surface-deep`, (b) sampled OKLCH combo steps used by `TuningConfig`, (c) DOM component pairs (segmented control selected/unselected, profile indicator), (d) simulated deutan/protan error-vs-solved and combo ramp distinctness. For token interpolation, require text to be crossfaded rather than colour-tweened unless every sampled frame passes.

### 13. Clock ownership contradiction (Medium)

- **UX ref:** `guide-text` replaced after ≥ 8 s; hint after ~8 s; `round-end-flash` fades with the transition; all animation.
- **Spine ref:** AD-17 "`app`'s scheduler is the only clock reader".
- **Problem:** `render` must read `requestAnimationFrame` time to animate, and guide/hint timing is game-relevant (hint shows the answer). As written, AD-17 is either violated by every animation or forces animation through `Tick`.
- **Fix:** Narrow AD-17: the scheduler is the only clock for **game time** (chain window, solve time, hint/guide delays, phase ends). Adapters may read frame time for cosmetic interpolation only. Hint and guide delays are `GameState` timers advanced by `Tick` (so they pause with play).

### 14. Cell placement randomisation is outside core (Medium)

- **UX ref:** Game-rule Notes "seeds are puzzle content only… placement is randomized at play time; competitive seeded play may derive layout from the seed". PRD FR-5/§4.1 placement randomised, competitive seeds fix layout.
- **Spine ref:** AD-3, AD-4 (`generate` returns content; placement not mentioned).
- **Problem:** If `render` shuffles placement, resume shows cells in new positions (breaks "restored from last tap"), keyboard order and a11y tree drift, and competitive layouts can't be fixed.
- **Fix:** Placement is a core step: `place(puzzle, layoutSeed) → cellOrder`, where `layoutSeed` = seed-derived for competitive rounds and a shell-supplied ULID-derived seed otherwise; stored on the puzzle in `GameState` and in `ResponseRecord`.

### 15. Solve-time measurement (Medium)

- **UX ref:** Modes "Elapsed solve time… feeds score"; menu/backgrounding pause both timers; point stream rides the transition.
- **Spine ref:** AD-8 `responseMs`; AD-17 solve times in `GameState`, advanced by `Tick`.
- **Problem:** Whether `responseMs` excludes paused time, blur-until-first-tap time, the solve beat (~380 ms) and narration is unstated; it feeds both score and ratings, so agents will differ.
- **Fix:** Define `responseMs` = sum of `Tick.elapsedMs` while `presentation.phase === 'play'` and not paused/blurred, from puzzle becoming active to the scoring tap. Document in AD-8.

### 16. Zen constellation (Low)

- **UX ref:** IA `zen-constellation` (POC); `zen-constellation` component "each Zen solve adds a light; first show a single light, no counter"; Kid stats "lights in your sky". DESIGN not designed. PRD FR-14.
- **Spine ref:** Absent from Capability map (only implied by FR-14 under `core/modes`).
- **Problem:** Lifetime visual: is it a count or a persisted list of lights with positions? Where is it drawn (canvas vs DOM stats)? Unbounded growth affects snapshot size.
- **Fix:** Store only `constellationCount` (+ seed) per profile; derive light positions deterministically in a view-model selector; draw on canvas in `render` (play/transition moments) and as a static SVG in `ui` stats. Add the row to the Capability map.

### 17. Kid power-cut variant (Low)

- **UX ref:** EXPERIENCE `power-cut` uses red + thud (UX doc stale); PRD FR-16 "In the Kid profile, the power cut uses a softer cue: no red and no bass thud" (PRD wins).
- **Spine ref:** AD-11 (kid rule variants from `profileKind`), AD-15 grammar.
- **Problem:** No theme role exists for a non-red kid cut, and no audio mapping rule; render would branch on profile ad hoc.
- **Fix:** Add `error-kid` / `error-kid-fill` roles (or a `cutStyle` in the view model) and have the `PowerCut` event carry `variant: 'standard' | 'soft'` derived in core from `profileKind`; `AudioPort` maps `soft` to a non-thud cue.

### 18. Mini-map for Minimal motion (Low, v1)

- **UX ref:** Motion Minimal "static mini-map shows position in the tree". PRD FR-26 [v1].
- **Spine ref:** Absent.
- **Fix:** View-model selector `treePosition(state)` from `viewPath` (gap 4); `ui` draws it as DOM/SVG with an accessible label. Note in Capability map under Themes/Motion for v1.

### 19. Sound and haptics mapping (Low)

- **UX ref:** Sound & Haptics table (per-event sound/haptic; solve tone steps down per tier); iPhone mute switch; never the only feedback.
- **Spine ref:** AD-16 `AudioPort`, `HapticsPort`; Capability map row.
- **Problem:** Who maps domain events to cues, and do coalesced wrong taps (gap 3) and the kid variant (gap 17) apply to audio/haptics? Rapid haptics can also feel like flashing.
- **Fix:** One `feedback` module in `app` subscribes to domain events and maps to `AudioPort`/`HapticsPort` using profile/settings; it uses the same coalesced `PowerCut` event, so audio follows the rule.

### 20. First-ever collapse and wordless discovery (Low)

- **UX ref:** `round-collapse` "first-ever collapse is a long, slow pull-out; later ones faster; no guide line on first-ever tier-2 puzzle". PRD FR-9 (≤ 3 s first, ≤ 1.2 s later in tuning).
- **Spine ref:** AD-7 (pacing in TuningConfig); `core/onboarding`.
- **Fix:** Per-profile `milestones` set in `GameState` (`firstCollapseSeen`, `firstTier2Seen`), set by `core.step`; collapse duration chosen from `TuningConfig` by that flag and fed into the presentation phase (gap 1); onboarding selectors suppress guide text while the flag is unset.

## Not gaps (checked)

- Same-frame tap response ≤ 100 ms: AD-14.
- Rebuild after WebGL loss / resume: AD-14.
- Save every tap, silent retry: AD-10.
- Kid entries absent, not disabled: AD-11 view models.
- Guide text and narration via aria-live: AD-13.
- Daily streak (v1), persistent active profile, telemetry upload (v1): spine matches PRD; UX docs are stale.
