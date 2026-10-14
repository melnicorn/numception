---
title: 'Sound through a feedback director'
type: 'feature'
ticket: '2'
created: '2026-10-14'
status: 'in-review'
baseline_revision: '2bd5b9220c806bf51a0ed5a32e2fa9ddbccb5002'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/epic-themes-and-feedback.md'
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** The game is silent. FR-41 and Done-when 4 want sound on every beat: solve tones that step down one note per tier, a soft-miss click, a soft Zen wrong-tap tone, and a whoosh on the theme change. AD-16 wants these behind platform ports, mapped by a single FeedbackDirector, with the iOS mute switch respected.

**Approach:**
- **Ports:** AD-16 `AudioPort` and `HapticsPort` interfaces in app, each with a no-op adapter.
- **FeedbackDirector:** in app, it maps core events to cue ids, gated by effects and music flags the dev panel sets.
- **Sound adapter:** a procedural Web Audio adapter in platform-web synthesises every cue in code, with no audio files.
- **Mute switch:** Web Audio only, so WKWebView's ambient session obeys it.
- **Lifecycle:** the audio context is unlocked on the first tap and suspended on pause.

## Boundaries & Constraints

**Always:**
- **Ports (app):**
  - `AudioPort { unlock(): void; play(cue: CueId, params?): void; setEnabled({ effects, music }): void; suspend(): void; resume(): void }`.
  - `HapticsPort { impact(kind: 'light'|'medium'|'heavy'|'soft'): void }`. Wire it with a no-op; entry 3 adds the real adapter.
  - Every feature works with no-op adapters (AD-16).
- **FeedbackDirector (app):** the **only** mapper from core events (plus PlayVM where needed) to port calls (AD-16).
  - `PuzzleSolved` plays `solve`, with a pitch set by the solved node's tier: tier 1 highest, then one scale step lower per tier.
  - `SoftMiss` plays `softMiss`, a soft click.
  - `WrongTap` plays `wrongZen`, a soft low tone. It's Zen-only for now, since mode is always zen.
  - `RoundStarted`, or the `roundStart` beat start, plays `whoosh`.
  - `RoundCollapsed`: none (no sound specified; the next tier's solve covers it).
  - Gated by `effects` (default on) and `music` (default off, no music yet). The music channel is a no-op.
- **Settings for now:** effects and music are flags set in the dev panel (playtest/dev builds), persisted locally (localStorage is fine for these dev flags) and read by the director. Entry 4 moves them into profile settings and commands. Name and isolate them so that move is easy.
- **Web Audio adapter (platform-web):**
  - Synthesised cues: oscillators with gain envelopes, and for the whoosh, filtered noise with a sweep.
  - **Pitches:** a pentatonic scale. Solve tier 1 = E5, tier 2 = D5, tier 3 = C5. A short (~180 ms) soft sine or triangle with a gentle attack and release. Each cue's parameters are in one table so they're easy to retune.
  - **Mute switch:** **never** use `<audio>` elements. Set `navigator.audioSession.type = 'ambient'` where the API exists (feature-detect). This is the assumption that WKWebView maps Web Audio to the ambient session, which the iOS mute switch silences; record it in Implementation Notes.
  - **Lifecycle:** create or resume the `AudioContext` on the first user gesture (`unlock`), suspend it on a lifecycle pause and resume on return.
  - Master gain is modest; cues must never clip.
- **Client:** creates the adapter and director, and feeds the director the events from each dispatch, the same synchronous batch the renderer sees. It calls `unlock` on the first pointer-down.
- **Dev panel:** a "Sound effects" toggle (and "Music", disabled with "(none yet)") that sets the flags.
- **Tests:**
  - director: an event → cue mapping table test, tier-to-pitch stepping, gating off silences, and no calls when disabled.
  - Web Audio adapter: unit tests with a fake AudioContext (scheduled nodes and frequencies per cue).
  - e2e (WebKit): with a stub that records cue calls via the test hook, a solve records `solve` at the right tier, and toggling effects off in the dev panel records nothing.
  - Existing tests stay green.
- **Hitl step:** the orchestrator installs; the user checks that the sounds feel right and that the mute switch silences the game, in the Capacitor app and in the Safari PWA where reachable.

**Never:**
- Audio files or a CDN, music, haptics (entry 3), profile settings (entry 4), Normal-mode cues (epic-zen-normal-onboarding).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Solve tier 1 | correct tap on a leaf | `solve` at E5 | No error expected |
| Solve tier 2/3 | upper puzzle solved | one scale step lower per tier | No error expected |
| Soft miss | tap b in − | soft click | No error expected |
| Wrong tap (Zen) | wrong cell | soft low tone | No error expected |
| Round change | new round | whoosh | No error expected |
| Effects off | dev toggle | no sound | No error expected |
| Before first tap | page loaded | no sound attempted (context locked) | silently skipped |
| Pause | app backgrounded | context suspended; no sound | No error expected |
| No Web Audio | API missing | no-op | silently skipped |

</intent-contract>

## Code Map

- `packages/app/src/{game.ts,index.ts,scheduler.ts,storage-port.ts,lifecycle-port.ts}`: the port pattern (StoragePort and LifecyclePort exist); `createGame` dispatch returns or notifies events.
- `packages/core/src/state/game-event.ts`: `PuzzleSolved` (nodeId with tier), `WrongTap`, `SoftMiss`, `RoundCollapsed`, `RoundCompleted`, `RoundStarted`.
- `packages/platform-web/src/*`: the IndexedDB driver and lifecycle source. Add `web-audio-adapter.ts` here. platform-web imports app only (lint).
- `packages/ui/src/dev-panel/*`: add the toggles.
- `apps/client/src/{main.ts,test-hook.ts}`: composition and the test hook.
- `architecture-numception/research-stack-versions.md` §3: the iOS audio and mute-switch facts.

## Tasks & Acceptance

**Execution:**
- [x] Ports and FeedbackDirector in app (+ tests).
- [x] Web Audio adapter in platform-web (+ tests with a fake context).
- [x] Dev-panel toggles and flags; client wiring and unlock.
- [x] e2e with a recording stub.

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass.
- Given the iPhone app, when puzzles are solved, then a tone plays one note lower per tier, the soft miss clicks, the round change whooshes, and the mute switch silences the game (user-confirmed).

## Implementation Notes

- **Mute-switch assumption (recorded per the plan):** WKWebView (Capacitor) and Safari play Web Audio in the ambient audio session, which the iOS mute switch silences; the adapter never uses `<audio>` elements, and also sets `navigator.audioSession.type = 'ambient'` where the API exists (Safari 16.4+, feature-detected, failures ignored). Unverified until the device check.
- **Ports (app):** `audio-port.ts` (`AudioPort`, `CueId`, `CueParams`, `noAudio`), `haptics-port.ts` (`HapticsPort`, `noHaptics`), `feedback-flags.ts` (`FeedbackFlags`, `DEFAULT_FEEDBACK_FLAGS`, `FeedbackFlagStore`, `FeedbackControls`, `parseFeedbackFlags`), isolated so entry 4 can replace them with profile settings.
- **Pitch split:** the director owns the stepping (`solveStep(tier) = tier − 1`, passed as `params.step`); the adapter owns the scale (`SOLVE_SCALE_HZ`, C major pentatonic descending from E5: E5, D5, C5, A4, G4, E4, D4, C4, holding the lowest). All cue parameters are in the adapter's `CUES` table; `MASTER_GAIN` 0.3 and every peak ≤ 0.6 keep each cue ≤ 0.18 at the output.
- **Soft-miss click** is a 40 ms band-passed noise burst (a click, not a tone); `wrongZen` is a 240 ms G3 triangle; `whoosh` is 600 ms band-passed noise swept 300 → 2400 Hz.
- **Whoosh only on a round change:** `RoundStarted` whooshes only in a batch with `RoundCompleted` (the round-change beat start), so opening or restoring a session is silent.
- **Lifecycle through the director:** `Paused { lifecycle }` suspends and `Resumed { lifecycle }` resumes the port; a batch carrying a lifecycle `Paused` (which may complete a beat, even a round change) plays no cues. Other pause reasons leave audio alone.
- **Unlock:** the client calls `director.unlock()` from capture-phase `pointerdown`, `pointerup` and `touchend` listeners on `window` (not only the first pointer-down: WebKit treats the touch release as the activating gesture, and a context the OS interrupted needs a gesture to resume). Once running, each call is a no-op. The first unlock also starts a one-sample silent buffer (the iOS unlock idiom). A cue is played only while the context runs or an unlock's resume is in flight, so an interrupted context never queues cues to burst out later.
- **Flags:** `webFeedbackFlags(appId)` in platform-web stores `{ effects, music }` in localStorage under `numception:feedback-flags:<appId>`; read in every flavour (defaults when absent), set only from the dev panel's Sound block (dev, playtest).
- **Recording stub:** in dev and playtest the client wraps the adapter in `apps/client/src/recording-audio.ts`; the test hook exposes `cues()`. Prod builds construct the plain adapter (checked: no recorder in the prod bundle).

## Plan Change Log

## Review Triage Log

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.

## Auto Run Result

Built and verified 2026-10-14. The full acceptance chain passes: 32 e2e tests pass and 1 is skipped. Waiting on the iPhone check: how the sounds feel and whether the mute switch silences the game.
