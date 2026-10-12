---
title: 'Build flavours and dev panel shell'
type: 'feature'
ticket: '5'
created: '2026-10-11'
status: 'built'
baseline_revision: '314fff70dda35de9d19f5ed51ebb7f09f3d461ce'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 1
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Native shells (iOS flavours and the Android synced-config wiring) aren't compiled in CI, and Android has never been compiled.
    evidence: |-
      Out of scope by plan (macOS runner cost; no Android SDK locally). iOS dev and playtest were built and installed on the simulator side by side. Android's build.gradle JsonSlurper wiring and launcher label are unverified until a Gradle build runs (Android SDK + JDK 21, or a CI job on ubuntu-latest, which has the SDK).
    location: >-
      apps/client/android/app/build.gradle, .github/workflows/ci.yml
    severity: medium (unverified)
---

<intent-contract>

## Intent

**Problem:** There is one build with one hard-coded bundle id (`app.numception.dev`). AD-18 needs `dev`, `playtest` and `prod` flavours chosen at build time in `apps/client`, each with its own bundle id so they never collide on a device, and a dev panel that ships in dev and playtest and is tree-shaken out of prod.

**Approach:** One flavour table in `apps/client` drives everything: the `FLAVOUR` env (`dev` | `playtest` | `prod`, default `dev`) selects the Vite build (its own `dist/<flavour>` output, page identity and dev-panel inclusion) and the Capacitor config. iOS gets its bundle id and display name from a generated xcconfig. Android follows the last sync too: its app id and name come from the synced `capacitor.config.json`. An empty dev panel lives in `ui` behind a subpath export that the client imports only in a branch that is compile-time false for prod. CI builds all three flavours, checks the ids and that prod contains no dev-panel code, and deploys the playtest build to Pages.

## Boundaries & Constraints

**Always:**
- **Flavour table** (single source, `apps/client/flavours.ts`, read by `vite.config.ts`, `capacitor.config.ts` and the checks):
  - `dev`: appId `app.numception.dev`, name `Numception Dev`, dev panel yes.
  - `playtest`: appId `app.numception.playtest`, name `Numception Playtest`, dev panel yes.
  - `prod`: appId `app.numception` (placeholder store id until registration, epic-native-apps), name `Numception`, dev panel no.
- `FLAVOUR` is read only in `apps/client` (configs and a build-time constant). Unset means `dev`. Unknown values fail with a clear error listing the valid ones (own-property check, like `BAKEOFF`).
- **Web identity:** each build writes the flavour's appId and name into the page (`<title>`, `<meta name="application-name">`, and `<meta name="numception-app-id" content="…">` plus `data-flavour` on `<html>`), so later storage and PWA work can namespace by it.
- **Dev panel:** the `ui` package gets `src/dev-panel/` (Preact) and a separate subpath export `@numception/ui/dev-panel` with `mountDevPanel(el)`. It's an empty shell: a small toggle button with accessible name "Dev panel" that opens an empty region (`data-testid="dev-panel"`, heading "Dev panel"). The client loads it with a dynamic `import()` inside `if (<build-time constant> )`, so the prod build emits no dev-panel chunk or code. Only `ui` imports Preact (AD-1). `pnpm lint:deps` stays green.
- **iOS:** the Xcode target's bundle id and display name come from build settings (`NUMCEPTION_APP_ID`, `NUMCEPTION_APP_NAME`) defined in a gitignored `ios/App/flavour.xcconfig` that the sync step generates from the table. The existing base xcconfig includes it optionally (`#include?`) and falls back to the dev values, so a fresh clone still builds as dev.
- **Android:** follows the last `cap:sync`, like iOS (user decision 2026-10-11, replacing Gradle product flavours, which could pair a prod app with a dev web bundle). `app/build.gradle` reads `appId` and `appName` from the synced `src/main/assets/capacitor.config.json` into `applicationId` and a `resValue` `app_name`, falling back to the dev values when the file is missing. There are no `productFlavors`. `namespace` stays fixed. The generated instrumented test asserts the package is one of the table's appIds (or starts with `app.numception`), not the dev id.
- **Scripts:**
  - `apps/client`: `build` builds the current `FLAVOUR`.
  - root: `build` builds all three flavours.
  - `cap:sync` takes `FLAVOUR` (default dev) and generates the xcconfig before `cap sync`.
  - The bake-off scripts keep working.
- **CI:** builds all three flavours, runs the flavour check, runs e2e against the **playtest** build (same `BASE_PATH` rules as now), and uploads `apps/client/dist/playtest` to Pages.

**Never:**
- Dev-panel tools (tuning switcher, telemetry export, inspectors). This ticket ships an empty shell.
- PWA, offline or size budget (ticket 6).
- Native compiles in CI (macOS runner cost, and Android has never been compiled). Record this as a gap.
- `import.meta.env` or `process.env` reads outside `apps/client`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | `FLAVOUR` unset | dev build: `dist/dev`, appId `app.numception.dev`, dev panel present | No error expected |
| Playtest web | `FLAVOUR=playtest` build + preview | page meta app id `app.numception.playtest`, title `Numception Playtest`; dev-panel toggle opens the empty panel; tracer still shows `5/6` | No error expected |
| Prod web | `FLAVOUR=prod` build | `dist/prod` has no dev-panel chunk and no dev-panel marker strings anywhere; no toggle in the page | flavour check fails the build otherwise |
| Unknown flavour | `FLAVOUR=staging` | Vite build and Capacitor config throw, naming the valid flavours | non-zero exit |
| Capacitor ids | each flavour | `capacitor.config` appId and appName match the table; `webDir` is `dist/<flavour>`; `BAKEOFF` still overrides webDir | throws on unknown |
| iOS ids | `FLAVOUR=playtest pnpm … cap:sync` | generated `flavour.xcconfig` sets `NUMCEPTION_APP_ID = app.numception.playtest` and the playtest name | No error expected |
| Distinct ids | all three | three distinct appIds across the table, web meta, xcconfig output and the Android synced-config wiring | flavour check fails otherwise |

</intent-contract>

## Code Map

- `apps/client/capacitor.config.ts` -- appId `app.numception.dev`, appName `Numception`, `webDir()` with the `BAKEOFF` map and its `Object.hasOwn` guard, `loggingBehavior: 'production'` when `BAKEOFF` is set. Keep the bake-off behaviour; make the ids and `dist/<flavour>` come from the table.
- `apps/client/capacitor-config.test.ts` -- uses `vi.resetModules` and `vi.stubEnv`. Extend it for flavours.
- `apps/client/vite.config.ts` -- `base: basePath()` plus the preact preset. Add the flavour (outDir, a `define` constant, HTML identity via a tiny `transformIndexHtml` plugin or equivalent).
- `apps/client/src/main.ts` -- mounts the tracer. Add the guarded dynamic dev-panel import.
- `apps/client/index.html` -- static title and viewport, with safe-area padding style. Keep both.
- `apps/client/tsconfig.json` (browser, `types: ["vite/client"]`), `apps/client/tsconfig.node.json` (configs and tests) -- include new files in the right project.
- `packages/ui/package.json` -- `exports` has only `"."`. Add `"./dev-panel"`. `packages/ui/src/index.ts` must **not** re-export the dev panel.
- `apps/client/ios/App/App.xcodeproj/project.pbxproj` -- target build configs at lines ~299–333 set `PRODUCT_BUNDLE_IDENTIFIER = app.numception.dev` with `baseConfigurationReference` → `debug.xcconfig`. Check how the Release configuration and the xcconfig files are wired before editing, and change the pbxproj minimally: bundle id and display name read from the settings. `App/Info.plist` has `CFBundleDisplayName` = `Numception`.
- `apps/client/android/app/build.gradle` -- `namespace` and `applicationId` `"app.numception.dev"`. `res/values/strings.xml` has `app_name`, `package_name` and `custom_url_scheme`. The Android SDK isn't installed here, so it can't be compiled. Keep edits small and standard.
- `playwright.config.ts` -- the `webkit` project serves the client preview on :4173 with `basePath()`. Point it at the playtest build (`FLAVOUR=playtest` for the preview command) and add the dev-panel assertions to `apps/client/e2e/`.
- `.github/workflows/ci.yml` -- `pnpm build` and the Pages upload of `apps/client/dist`. Update for flavours.
- `tools/` -- `check-supply.mjs` shows the house style for a Node check script with tests in `tools/*.test.ts`. Put the flavour check here (`tools/check-flavours.mjs` + test).
- pnpm 11 enforces a minimum release age; Xcode `#include?` is the optional-include form.

## Tasks & Acceptance

**Execution:**
- [x] `apps/client/flavours.ts` (+ test) -- the table, `resolveFlavour(env)` with the error behaviour, and the types. -- single source
- [x] `apps/client/vite.config.ts`, `apps/client/index.html`, `apps/client/src/main.ts`, `apps/client/src/flavour.ts` (build-time constant typing) -- flavour build, page identity, guarded dev-panel import. -- web flavours
- [x] `packages/ui/src/dev-panel/*`, `packages/ui/package.json` -- the empty panel and the subpath export. -- dev panel shell
- [x] `apps/client/capacitor.config.ts`, `apps/client/capacitor-config.test.ts` -- per-flavour appId, appName, webDir; bake-off kept. -- native ids
- [x] `apps/client/ios/…` (xcconfig include, pbxproj/Info.plist settings), the sync-step generator (e.g. `apps/client/scripts/write-ios-flavour.mjs`), `.gitignore` -- iOS ids per flavour. -- iOS
- [x] `apps/client/android/app/build.gradle` (+ strings.xml if needed) -- product flavours. -- Android
- [x] `apps/client/package.json`, root `package.json` -- scripts per Always. -- one command each
- [x] `tools/check-flavours.mjs` (+ `tools/check-flavours.test.ts`) -- after the builds: each `dist/<flavour>` exists with the right meta app id; ids are distinct across table, xcconfig generator output and `build.gradle`; prod `dist` has no dev-panel marker (choose a distinctive marker string in the panel source, e.g. its testid) and no extra chunk. -- verify step
- [x] `playwright.config.ts`, `apps/client/e2e/*` -- e2e on the playtest preview: tracer `5/6`, page meta id, dev panel toggles open. -- browser check
- [x] `.github/workflows/ci.yml` -- build all flavours, run `check:flavours`, e2e on playtest, upload `dist/playtest`. -- CI

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && CI=1 pnpm e2e` run, then all pass.
- Given the three builds, when `apps/client/dist/prod` is searched for the dev-panel marker, then there is no match, and both `dist/dev` and `dist/playtest` contain it.
- Given `FLAVOUR=playtest pnpm --filter @numception/client run cap:sync` and an iOS simulator build, when the app is installed next to a dev build, then both coexist on the simulator with different bundle ids and names.
- Given `FLAVOUR=staging`, when building, then it fails naming the valid flavours.

## Implementation Notes

- Dev-panel marker: `numception-dev-panel` (the panel region id, `DEV_PANEL_ID` in `packages/ui/src/dev-panel/dev-panel.tsx`). `tools/check-flavours.mjs` requires it in `dist/dev` and `dist/playtest`, forbids the broader string `dev-panel` anywhere in `dist/prod`, and confirms the panel source still contains the marker so the prod scan can't pass vacuously. The dev-panel chunk is named `mount-dev-panel-<hash>.js` (from the subpath entry file), which the check also looks for.
- Build-time constants: `__NUMCEPTION_FLAVOUR__` and `__NUMCEPTION_DEV_PANEL__` via Vite `define`, typed as globals in `apps/client/src/flavour.ts`; `main.ts` uses the global directly in the `if` so the bundler sees a literal.
- Root `build` calls the client's new `build:all` (dev, playtest, prod in sequence). `cap:sync` and both bake-off `cap:sync:*` scripts run `scripts/write-ios-flavour.mjs` first, so the xcconfig always matches the Capacitor config's appId.
- Android (re-derived in review loop 1): no `productFlavors`. `app/build.gradle` reads `appId`/`appName` from the synced `src/main/assets/capacitor.config.json` (JsonSlurper) into `defaultConfig.applicationId` and `resValue "string", "app_name"`, falling back to `app.numception.dev` / `Numception Dev` when nothing is synced; `buildFeatures.resValues = true` kept for AGP 9. `strings.xml` has no `app_name` (and `package_name`/`custom_url_scheme`, dev-only and unused, stay removed). The instrumented test accepts any of the three table appIds. `check-flavours` verifies this wiring (synced-config read, dev fallbacks, no hard-coded flavours or applicationId) instead of three gradle flavours. Not compiled (no Android SDK here).
- Gap: native shells are not compiled in CI (macOS runner cost; Android never compiled).

## Plan Change Log

- iOS: the Release target configuration had no base xcconfig (only Debug used `debug.xcconfig`), so the defaults plus `#include? "App/flavour.xcconfig"` live in a new checked-in `ios/flavour-base.xcconfig`. `debug.xcconfig` includes it; the Release target uses it as its base configuration (one new file reference in the pbxproj). `PRODUCT_BUNDLE_IDENTIFIER = "$(NUMCEPTION_APP_ID)"` in both target configs; `CFBundleDisplayName = $(NUMCEPTION_APP_NAME)` in Info.plist.

- 2026-10-11 review loop 1 (bad_plan, user-approved intent change): Gradle `productFlavors` let `prodRelease` package whatever web bundle was last synced, including dev with the dev panel. That breaks AD-18. Amended: Android follows the last sync (reads the synced `capacitor.config.json`), mirroring iOS, so the bundle id and the web bundle can't disagree. `check-flavours` now verifies the Android wiring instead of three gradle flavours. Known-bad state avoided: a prod app id carrying dev tooling. KEEP: everything else in the diff (flavour table, web builds and identity, dev panel subpath and guarded import, Capacitor config, iOS xcconfig wiring with `flavour-base.xcconfig`, scripts, CI, e2e). Only the Android files, the Android part of `check-flavours` and the instrumented test are re-derived, plus the dev-panel `aria-controls` patch. Re-derivation was scoped to these files rather than a full revert, because the rest passed review.

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 4 findings — high 1, medium 0, low 2, false 1, maybe-false 0
- findings:
  - `[high]` `[bad_plan]` Gradle `productFlavors` let `prodRelease` package whatever web bundle was last synced (the dev bundle with the dev panel included) under `app.numception`, against AD-18. The approach was in the intent contract, so the user decided (2026-10-11): Android follows the last sync like iOS. Amendment recorded in the Plan Change Log (review loop 1). Android files, the Android part of check-flavours and the instrumented test were re-derived.
  - `[low]` `[bad_plan]` `ExampleInstrumentedTest` asserted the dev package id, which is wrong for playtest and prod. Re-derived with the Android rework: it now asserts one of the table ids.
  - `[low]` `[bad_plan]` The dev-panel toggle's `aria-controls` named a section that exists only while open. Fixed in the same rework: set only while open.
  - `[false]` `[reject]` "No evidence that the iOS flavours coexist." Refuted: `xcrun simctl listapps booted` shows `app.numception.dev` / "Numception Dev" and `app.numception.playtest` / "Numception Playtest" installed side by side (implementer's simulator run, re-checked by the orchestrator).

### 2026-10-11 — Review pass (after loop 1)
- verdicts: 5 findings — high 0, medium 1, low 3, false 1, maybe-false 0
- findings:
  - `[medium]` `[patch]` The Android launcher activity used `@string/title_activity_main` (hard-coded "Numception"), so every flavour showed the same launcher name. Fixed: the activity label is now `@string/app_name`, and the unused `title_activity_main` was removed.
  - `[low]` `[patch]` The `strings.xml` comment still said `app_name` comes from the product flavour. Fixed: it now describes the synced-config resValue.
  - `[low]` `[patch]` The CI comment still mentioned Android flavours. Fixed to describe the synced-config check.
  - `[low]` `[reject]` The plan's Tasks checklist Android row still says "product flavours". The fix would edit this build's plan; the Plan Change Log and Implementation Notes record the amendment.
  - `[false]` `[reject]` "AC 3 (iOS coexistence) has no recorded evidence." Refuted: same `simctl listapps` result as above, now recorded in this log and in the Auto Run Result.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && CI=1 pnpm e2e` -- expected: all exit 0
- `grep -rl "<dev-panel marker>" apps/client/dist/prod` -- expected: no output
- `FLAVOUR=staging pnpm --filter @numception/client run build` -- expected: non-zero, lists dev/playtest/prod
- `FLAVOUR=playtest pnpm --filter @numception/client run cap:sync && cat apps/client/ios/App/flavour.xcconfig` -- expected: playtest id and name; then `pnpm --filter @numception/client run cap:sync` restores dev
- iOS simulator: build dev and playtest, install both, `xcrun simctl listapps booted | grep numception` -- expected: both bundle ids present

## Auto Run Result

**Summary:** One flavour table (`apps/client/flavours.ts`: dev `app.numception.dev`, playtest `app.numception.playtest`, prod `app.numception`) drives everything:
- **Web:** `FLAVOUR` selects the Vite build (`dist/<flavour>`), page identity (title, `application-name`, `numception-app-id`, `data-flavour`) and the dev panel.
- **Capacitor:** appId, appName and webDir come from the table (`BAKEOFF` kept).
- **iOS:** bundle id and display name come from a generated, gitignored `flavour.xcconfig`, with a dev fallback.
- **Android:** reads the synced `capacitor.config.json`, so it always matches the last `cap:sync`.
- **Dev panel:** an empty shell in `@numception/ui/dev-panel`, loaded behind a build-time constant. Prod has no dev-panel code.
- **CI:** builds all three flavours, runs `check:flavours`, runs e2e on playtest and deploys `dist/playtest` to Pages.

**Files changed:**
- `apps/client/flavours.ts` (+ test), `src/flavour.ts`, `vite.config.ts`, `src/main.ts`, `capacitor.config.ts` (+ test), `package.json`, `tsconfig.node.json`, `scripts/write-ios-flavour.mjs`: flavour selection and wiring.
- `packages/ui/src/dev-panel/*`, `packages/ui/package.json`: the dev panel shell and its subpath export.
- `apps/client/ios/flavour-base.xcconfig`, `debug.xcconfig`, `App.xcodeproj/project.pbxproj`, `App/Info.plist`, `ios/.gitignore`: iOS ids per flavour.
- `apps/client/android/app/build.gradle`, `AndroidManifest.xml`, `strings.xml`, `ExampleInstrumentedTest.java`: Android follows the synced config.
- `tools/check-flavours.mjs` (+ test), root `package.json`, `.github/workflows/ci.yml`, `playwright.config.ts`, `apps/client/e2e/*`: checks, CI and e2e.

**Review findings:** two passes, one review loop.
- **Pass 1:** 1 high, routed bad_plan; with the user's decision, Android now follows the last sync, and 2 low were fixed in the same rework. 1 false.
- **Pass 2:** 3 patches (1 medium, 2 low), 1 rejected (plan checklist wording), 1 false.
- **Deferred:** native compile in CI and Android never compiled (medium, unverified).

**Follow-up review recommended:** false. Patched this pass: high 0, medium 1, low 2. The high from pass 1 was resolved by re-derivation and re-reviewed in pass 2.

**Verification:**
- `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint:deps`, `pnpm test` (143), `pnpm build` (three flavours), `pnpm check:flavours` and `CI=1 pnpm e2e` (5) all pass, also with `BASE_PATH=/numception/` as in CI.
- `dist/prod` has no `dev-panel` match. `FLAVOUR=staging` fails, naming dev, playtest and prod.
- The iOS simulator has dev and playtest installed side by side with distinct ids and names.

**Residual risks:**
- Xcode and Gradle builds use whichever flavour was last synced: run `FLAVOUR=<x> pnpm --filter @numception/client run cap:sync` first.
- Android is uncompiled.
- `app.numception` is a placeholder store id.
