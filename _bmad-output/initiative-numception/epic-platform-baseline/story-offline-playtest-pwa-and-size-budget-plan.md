---
title: 'Offline playtest PWA and size budget'
type: 'feature'
ticket: '6'
created: '2026-10-11'
status: done
baseline_revision: '60a9e26f714d3fd21d8e94bf0806d3dd089e4748'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-platform-baseline/story-build-flavours-and-dev-panel-shell-plan.md'
warnings: []
deferred:
  - summary: >-
      Airplane-mode check on a phone against the deployed playtest URL isn't done.
    evidence: |-
      The Pages URL redirects to www.shellmelwood.com, which doesn't resolve in DNS (user's GitHub user-site custom domain). Offline reload is proven in WebKit e2e, both locally and under BASE_PATH=/numception/. Settled once the domain resolves (or the custom domain is removed): load on the iPhone once, then reopen in airplane mode.
    location: >-
      deployed playtest (GitHub Pages)
    severity: low
  - summary: >-
      Service-worker registration is skipped inside the Capacitor shells; native offline relies on bundled assets, and the PWA path is untested on either native shell.
    evidence: |-
      Guard added because Android Capacitor serves from https://localhost, where a SW would register. Native shells load their web assets from the app bundle, so they're offline by construction. Not exercised on a device or simulator in this ticket.
    location: >-
      apps/client/src/main.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** The playtest web build deployed to Pages needs the network on every load. NFR-2 requires full offline play with no banner, and NFR-1 caps the initial web download at 5 MB gzipped. Neither is enforced.

**Approach:** Make the playtest (and prod) web flavours a PWA with vite-plugin-pwa 1.3.x (Workbox generateSW). It precaches every build asset, and a web app manifest names the flavour. Add a CI budget check that fails when any web flavour's initial download, which for a precaching PWA is everything precached, exceeds 5 MB gzipped. Prove offline reload in a browser test.

## Boundaries & Constraints

**Always:**
- **Flavour table:** add a `pwa` flag to `apps/client/flavours.ts`: dev `false` (no service worker while developing), playtest `true`, prod `true` (NFR-2 applies to the prod web too). Everything per flavour still comes from the table.
- **Service worker:** generateSW, `registerType: 'autoUpdate'`. Precache every emitted asset the page can need (html, js, css, svg, png, webmanifest, fonts), and use `navigateFallback` to the app's `index.html`. Scope and `start_url` follow the Vite `base` (`/` locally, `/<repo>/` on Pages). Workbox runtime files are emitted locally, never loaded from a CDN (AD-18: no third-party runtime requests). Registration is guarded (`'serviceWorker' in navigator`), so the Capacitor shells, which serve from a custom scheme, simply skip it.
- **Manifest:** `name` and `short_name` from the flavour's `appName`, `id` from its `appId`, `display: standalone`, theme and background colours from the neon background (`#05060a`), and a self-hosted SVG icon plus an `apple-touch-icon` link. Placeholder art is fine; note it.
- **Budget:** one constant, `5_000_000` bytes (decimal MB, the stricter reading of NFR-1), in `tools/check-budget.mjs`. For each built web flavour present under `apps/client/dist/`, sum the gzip-9 sizes of every file in the build (precache = initial download), print a per-flavour table, and exit non-zero naming any flavour over budget. Wire it as `pnpm check:budget` and run it in CI after the builds.
- **Offline test:** a Playwright test against the playtest preview. First load, wait until the service worker controls the page, go offline (`context.setOffline(true)`), reload, and the tracer still shows `5/6`. Use WebKit if its service-worker support allows this. Otherwise add a Chromium project for this one test only (and install Chromium in CI), and record why.
- The existing checks stay green (`lint:deps`, `check:flavours`, e2e). `check:flavours` must not regress, and gets extended only if the `pwa` flag needs checking (dev must emit no service worker).

**Never:**
- Runtime caching of third-party origins, push, background sync, or an install prompt UI.
- Offline banners or update toasts. Updates apply silently on the next load (autoUpdate).
- A service worker in dev builds.
- Changing the Capacitor shells' loading.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Offline reload | playtest build, first load online, then offline reload | page loads from the precache, tracer shows `5/6` | No error expected |
| Manifest | playtest build | `manifest.webmanifest` with name `Numception Playtest`, id `app.numception.playtest`, scope and start_url under the base; linked from `index.html` | No error expected |
| Pages base | `BASE_PATH=/numception/` playtest build | SW scope, precache URLs and manifest URLs all under `/numception/` | No error expected |
| Dev flavour | `FLAVOUR=dev` build | no `sw.js`, no manifest link, no registration code | check fails otherwise |
| Within budget | current builds | `check:budget` prints sizes, exits 0 | No error expected |
| Over budget | a flavour build whose files total more than 5,000,000 bytes gzipped (fixture) | exits non-zero naming the flavour and its size | non-zero exit |
| Native shell | playtest synced into Capacitor | app loads; no SW registration error breaks the page | registration skipped |

</intent-contract>

## Code Map

- `apps/client/flavours.ts` -- the table (`name`, `appId`, `appName`, `devPanel`), `resolveFlavour` and `flavourOutDir`. Plain erasable TS, loaded directly by Node from `.mjs` scripts. Add `pwa`. `apps/client/flavours.test.ts` covers it.
- `apps/client/vite.config.ts` -- `flavour = resolveFlavour(process.env)`, `base: basePath()`, plugins `[preact(), flavourIdentity(flavour)]`, `define` constants, `build.outDir: dist/<flavour>`. Add `VitePWA(...)` only when `flavour.pwa`.
- `apps/client/index.html` -- title replaced per flavour by `flavourIdentity`. Inline safe-area style. Put the icon in `apps/client/public/` (Vite copies it with the base applied).
- `apps/client/src/main.ts` -- mounts the tracer plus the guarded dev panel. Registration can use `virtual:pwa-register` behind a build-time `__NUMCEPTION_PWA__` constant (typed in `src/flavour.ts`), or vite-plugin-pwa's `injectRegister` if that keeps dev free of it. Choose the one that leaves dev with no SW code.
- `tools/check-flavours.mjs`, `tools/check-supply.mjs` -- house style for check scripts (exported pure functions, entry guard through `realpathSync`, tests in `tools/*.test.ts` using temp-dir fixtures).
- `playwright.config.ts` -- the `webkit` project serves the playtest preview (`FLAVOUR=playtest`) on :4173 with `basePath()`, and the bake-off projects run on :4174/:4175. CI sets `BASE_PATH=/<repo>/` job-wide.
- `.github/workflows/ci.yml` -- install → typecheck → lint:deps → test → build (all flavours) → check:flavours → playwright install webkit → e2e → Pages upload of `apps/client/dist/playtest`.
- Root `package.json` scripts: `typecheck`, `lint:deps`, `test`, `build`, `check:flavours`, `e2e`.
- pnpm 11 enforces a minimum release age; vite-plugin-pwa must support Vite 8 (check its peer range; pick the newest 1.3.x that does).

## Tasks & Acceptance

**Execution:**
- [x] `apps/client/flavours.ts` (+ test) -- the `pwa` flag. -- table stays the single source
- [x] `apps/client/package.json`, `apps/client/vite.config.ts`, `apps/client/src/*`, `apps/client/public/*` -- vite-plugin-pwa for pwa flavours, manifest, icon, guarded registration. -- offline PWA
- [x] `tools/check-budget.mjs` (+ `tools/check-budget.test.ts`), root `package.json` -- the budget check and `check:budget`. -- NFR-1
- [x] `tools/check-flavours.mjs` (+ test) -- dev has no SW or manifest; pwa flavours have both. -- guard the flag
- [x] `playwright.config.ts`, `apps/client/e2e/offline.spec.ts` -- the offline reload test. -- NFR-2 proof
- [x] `.github/workflows/ci.yml` -- run `pnpm check:budget` after the builds (plus a browser install if a Chromium project is needed). -- CI

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass.
- Given a temporary file making `dist/playtest` exceed 5,000,000 bytes gzipped, when `pnpm check:budget` runs, then it exits non-zero naming playtest (revert afterwards).
- Given the deployed playtest on a phone, when it is loaded once and then reopened in airplane mode, then it still runs (human check; the Pages custom domain must resolve first).

## Implementation Notes

- vite-plugin-pwa `~1.3.0` (1.3.0 is the only 1.3.x; peer range includes Vite 8). It pulls workbox-build 7.4.1 (incl. `workbox-google-analytics`, unused: `offlineGoogleAnalytics: false`, and not on the banned list); `lint:deps`/`check-supply` stay green.
- Registration: `injectRegister: false` plus a hand-written `navigator.serviceWorker.register(`${BASE_URL}sw.js`, { scope: BASE_URL })` in `src/main.ts` behind the build-time `__NUMCEPTION_PWA__` constant (typed in `src/flavour.ts`), so dev has no SW code. `virtual:pwa-register` was not used: the plugin isn't loaded for dev, so the virtual module wouldn't resolve there. Since registration isn't injected, `skipWaiting` and `clientsClaim` are set explicitly (autoUpdate semantics: the first load becomes controlled, updates apply silently on the next load).
- Native shells: besides the `'serviceWorker' in navigator` guard, registration is skipped when `window.Capacitor.isNativePlatform()` is true. The plan assumed both shells serve from a custom scheme; iOS does (`capacitor://`), but Android serves from `https://localhost`, where the WebView would register a worker. The extra guard keeps the shells loading exactly as before. Not exercised on a device or simulator in this build.
- Precache: `globPatterns` html/js/css/svg/png/ico/fonts/json; `manifest.webmanifest` is added by the plugin itself and `includeManifestIcons: false`, so there are no duplicate entries. `navigateFallback: 'index.html'`, no runtime caching. Workbox runtime is emitted as `workbox-<hash>.js` beside `sw.js` (only `https://` string in it is an error-message link).
- Manifest: name/short_name/id/scope/start_url from the table and base; `#05060a` theme and background; `icon.svg`. Placeholder art in `apps/client/public/`: `icon.svg` and a 180x180 `apple-touch-icon.png` (same design). `index.html` statically links the favicon, apple-touch-icon and a `theme-color` meta for every flavour; only the manifest link is PWA-only.
- Offline test runs on WebKit (no Chromium project needed). Negative control: with `serviceWorkers: 'block'` the offline reload fails, so the test isn't vacuous.
- `check:budget` skips flavours that weren't built and fails if none are. Current sizes: dev 0.009 MB, playtest 0.015 MB, prod 0.013 MB gzipped.

## Plan Change Log

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 3 findings — high 0, medium 1, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` The precache matched only html/js/css/svg/png/ico/fonts/json, while the budget assumes precache = every built file. A future audio, `.webp` or `.wasm` asset would be counted by the budget but missing offline. Fixed: `globPatterns: ['**/*']` (Workbox still excludes `sw.js` and `workbox-*.js`; `manifest.webmanifest` is ignored in the glob because the plugin adds it). Added `maximumFileSizeToCacheInBytes: 5_000_000` so a single asset over 2 MiB isn't silently skipped. `check-flavours` now fails when any built file of a PWA flavour is missing from the `sw.js` precache, with a test. Checked by hand: a temporary 3 MB `.ogg` landed in the precache.
  - `[low]` `[patch]` A manifest that parsed to a non-object (`null`) crashed `check-flavours` with a TypeError. Fixed: reported as "is not a valid JSON object", with tests for `null`, `[]` and `"x"`.
  - `[low]` `[reject]` Implementation Notes say `offlineGoogleAnalytics: false` is set, but the config relies on its default (`false`). Behaviour is identical, and the fix would edit this build's plan.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` exported -- expected: all exit 0
- `ls apps/client/dist/dev | grep -c sw.js` -- expected: 0
- Temporary over-budget file: `head -c 6000000 /dev/urandom > apps/client/dist/playtest/zz.bin && pnpm check:budget` -- expected: non-zero naming playtest. Then delete the file.

## Auto Run Result

**Summary:** The playtest and prod web flavours are now offline PWAs (vite-plugin-pwa 1.3.0, Workbox generateSW):
- **Precache:** every built file is precached, with a navigate fallback to `index.html`.
- **Manifest:** name and id come from the flavour table, and scope and start_url follow the Vite base.
- **Assets:** a self-hosted SVG icon and an apple-touch-icon. Workbox runtime files are emitted locally.
- **Registration:** guarded and skipped in dev and in the Capacitor shells. Dev builds contain no service-worker code.
- **Budget:** `pnpm check:budget` fails CI when any built web flavour exceeds 5,000,000 bytes gzipped. That counts every file, because the precache is the initial download.
- **Offline proof:** a WebKit e2e test loads the page once, goes offline, reloads and still sees `5/6`.

**Files changed:**
- `apps/client/flavours.ts` (+ test): the `pwa` flag (dev off, playtest and prod on).
- `apps/client/vite.config.ts`, `package.json`, `index.html`, `src/main.ts`, `src/flavour.ts`, `public/icon.svg`, `public/apple-touch-icon.png`: PWA plugin, manifest, icons, guarded registration.
- `tools/check-budget.mjs` (+ test), root `package.json`: the NFR-1 budget.
- `tools/check-flavours.mjs` (+ test): the SW and manifest exist only in PWA flavours, every built file is precached, and the manifest must be a valid object.
- `apps/client/e2e/offline.spec.ts`: offline reload and manifest checks.
- `.github/workflows/ci.yml`: `check:budget` step.

**Review findings:** 2 patches applied (1 medium, 1 low), 2 deferred (phone airplane check pending DNS; native shells skip the SW), 1 rejected (plan note wording).

**Follow-up review recommended:** false. Patched: high 0, medium 1, low 1.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint:deps`, `pnpm test` (158), `pnpm build`, `pnpm check:flavours`, `pnpm check:budget` (playtest 0.015 MB gzipped) and `CI=1 pnpm e2e` (7) all pass.
- The dev build has no `sw.js`.
- A temporary 6 MB file in `dist/playtest` failed `check:budget` (exit 1, naming playtest).
- With service workers blocked, the offline test fails, so the test can catch a broken offline path.

**Residual risks:**
- Placeholder icons.
- The Pages custom domain doesn't resolve yet, so the deployed offline check waits on DNS.
- Workbox includes an unused Google Analytics module (off by default; supply check passes).
