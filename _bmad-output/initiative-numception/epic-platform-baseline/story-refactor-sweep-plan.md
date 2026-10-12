---
title: 'Refactor sweep'
type: 'chore'
ticket: '7'
created: '2026-10-11'
status: 'in-progress'
baseline_revision: '23811ef50fc4df7a4995651afa344b4d0ff4cf61'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
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
| 2: iOS shell not on a real phone | **Closed.** Installed and run on the user's iPhone 16 Pro during ticket 3 (Release builds, devicectl). |
| 2, 5: Android never compiled | **Fixed here.** CI `android` job. |
| 5: native shells not compiled in CI (iOS part) | **Moved** to epic-native-apps (note): macOS runner cost; local Xcode builds cover it until store builds. |
| 3: renderer not measured on an older iPhone or Android | **Moved** to epic-native-apps (note). Also stays in the spine's Deferred (Renderer). |
| 3: filter glow too expensive | **Moved** to epic-themes-and-feedback (note). Also in the spine's Deferred. |
| 6: phone airplane-mode check on the deployed URL | **Moved** to epic-poc-playtest (note): blocked on the Pages custom domain (DNS). |
| 6: SW skipped in Capacitor shells | **Closed** as by design: native shells load bundled assets and are offline by construction. Native offline is exercised whenever the shells run (e.g. ticket 3's device runs had no network dependency). |

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test` -- expected: pass (no app code changes)
- CI on push: the `ci` and `deploy` jobs green, the `android` job green with `app-debug.apk` built; no Node 20 deprecation annotations
