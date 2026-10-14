---
title: 'Refactor sweep'
type: 'chore'
ticket: '7'
created: '2026-10-11'
status: done
baseline_revision: '23811ef50fc4df7a4995651afa344b4d0ff4cf61'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred:
  - summary: >-
      Carried-over items live as epic Notes, not stories.
    evidence: |-
      epic-native-apps, epic-core-play-loop, epic-themes-and-feedback and epic-poc-playtest aren't sliced into tickets yet. When each is sliced (bmad-ticket), turn its "Carried over" notes into stories with verify lines.
    location: >-
      Notes sections of those four epic files
    severity: low
---

<intent-contract>

## Intent

**Problem:** The epic's plans and reviews left deferred items (tickets 2, 3, 5, 6, 8, 9), and CI warns that the GitHub actions it uses run on the deprecated Node 20.

**Approach:** Give every deferred item a disposition: close it (with evidence), fix it in this ticket, or move it to the epic that owns it (as a note in that epic file). The two fixes:
- **Android build job in CI:** an Ubuntu runner with the Android SDK and JDK 21 runs `cap sync android` for the dev flavour, then `./gradlew assembleDebug`. This is the first compile of the Android shell. The job doesn't gate the Pages deploy.
- **Action versions:** bump to the current Node 24 majors (checkout v7, pnpm/action-setup v6, setup-node v7, upload-artifact v7, upload-pages-artifact v5, deploy-pages v5).

</intent-contract>

## Implementation Notes

Oneshot: about 40 lines of CI YAML plus notes in three epic files.

Disposition of every deferred item:

| Item | Disposition |
|---|---|
| 8, 9: bake-off e2e may time out on ubuntu WebKit | **Closed.** Fixed in `da0c89e` (Phaser raw deltas and clock-sized waits); CI green on runs 38069502978 and 38189788269. |
| 2: iOS shell not on a real phone | **Partly closed, rest moved.** The shell installs and runs on the user's iPhone 16 Pro (ticket 3, Release, devicectl), but with the bake-off content, not the tracer client. Installing the client on a phone moved to epic-native-apps (note). |
| 2, 5: Android never compiled | **Fixed here.** CI `android` job builds the **playtest** flavour, so the synced-config wiring differs from the dev fallback, and checks the APK's package (`app.numception.playtest`) and label (`Numception Playtest`) with aapt2. |
| 2: Android not installed on a phone | **Moved** to epic-native-apps (note). The user has no Android device for now. |
| 5: native shells not compiled in CI (iOS part) | **Moved** to epic-native-apps (note): macOS runner cost; local Xcode builds cover it until store builds. |
| 3: renderer not measured on an older iPhone or Android | **Moved** to epic-core-play-loop (note), which comes before POC architecture locks. Also stays in the spine's Deferred (Renderer). |
| 3: filter glow too expensive | **Moved** to epic-themes-and-feedback (note). Also in the spine's Deferred. |
| 6: phone airplane-mode check on the deployed URL | **Moved** to epic-poc-playtest (note): blocked on the Pages custom domain (DNS). |
| 6: SW skipped in Capacitor shells | **Closed as by design, check moved.** Native shells load bundled assets, so they don't need a SW. Confirming the client runs offline in both shells on a device moved to epic-native-apps (note). |

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 8 findings — high 0, medium 2, low 6, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` The Android CI job built dev, whose ids equal the Gradle fallback, so broken synced-config wiring couldn't show. Fixed: it builds playtest and asserts the APK package and label with aapt2. Run 38191819952 shows `app.numception.playtest`, application label and launcher label `Numception Playtest`.
  - `[medium]` `[patch]` The renderer-measurement note went to epic-native-apps, which starts after the POC, but the spine requires it before POC architecture locks. Moved to epic-core-play-loop.
  - `[low]` `[patch]` The iOS row was "Closed" on the strength of the 16 Pro running bake-off builds, not the tracer client. Reworded to partly closed, with the client-on-phone install moved to epic-native-apps.
  - `[low]` `[patch]` The Android install on a phone had no disposition. Added a row and an epic-native-apps note (no Android device for now).
  - `[low]` `[patch]` The SW closure cited ticket 3 runs that never included `main.ts`. Reworded to by design, with an on-device offline check moved to epic-native-apps.
  - `[low]` `[patch]` The epic-native-apps iOS-CI note cited 1.7 instead of its source ticket 1.5. Fixed.
  - `[low]` `[defer]` The verify line says "moved to a new story", but the moves are epic notes, because the receiving epics aren't sliced into tickets yet. Convert the carried-over notes into stories when those epics are sliced.
  - `[low]` `[reject]` The source plans' `deferred:` lists still read as open. Those lists are append-only by design, and this plan's disposition table is the record of where each item went.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test` -- expected: pass (no app code changes)
- CI on push: the `ci` and `deploy` jobs green, the `android` job green with `app-debug.apk` built; no Node 20 deprecation annotations

## Auto Run Result

**Summary:**
- **Android CI:** a new, independent job builds the Android shell for the first time (playtest flavour, JDK 21, `assembleDebug`) and checks the APK's package and launcher label.
- **Actions:** GitHub actions bumped to their Node 24 majors, which cleared the deprecation warnings.
- **Deferred items:** every deferred item from the epic's plans is closed, fixed, or carried into the epic that owns it, with the disposition table above as the record.

**Files changed:**
- `.github/workflows/ci.yml`: `android` job; action version bumps.
- `epic-native-apps.md`, `epic-core-play-loop.md`, `epic-themes-and-feedback.md`, `epic-poc-playtest.md`: carried-over notes.

**Review findings:** 6 patches applied (2 medium, 4 low), 1 deferred (notes become stories when those epics are sliced), 1 rejected (append-only deferred lists).

**Follow-up review recommended:** false. Patched: high 0, medium 2, low 4. The CI evidence covers the riskiest patch.

**Verification:** `pnpm typecheck`, `pnpm lint:deps` and `pnpm test` (158) pass. On GitHub, runs 38191359883 and 38191819952 passed `ci`, `android` and `deploy` with no Node 20 annotations. The APK badging shows `app.numception.playtest` and `Numception Playtest`.

**Residual risks:** Android has never run on a device. iOS isn't compiled in CI.
