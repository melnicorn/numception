# Stack Version Research: Numception (web-first TS game + Capacitor)

Verified 2026-10-09. Version and date data come from the live npm registry (`npm view <pkg> version time`), nodejs.org/dist/index.json and GitHub API, plus the web sources cited below. Dates are UTC publish dates of the latest stable release.

## 1. Version table

| # | Package | Latest stable | Released | Source | Fit caveat |
|---|---|---|---|---|---|
| 1 | phaser | 4.2.1 | 2026-07-09 | https://www.npmjs.com/package/phaser | v4 GA was 2026-04-10 (4.0.0); v4 ecosystem/plugins and tutorials still largely v3-shaped. |
| 1 | Phaser template: `phaserjs/template-vite-ts` | repo pkg v1.4.0 | last commit 2026-04-21 | https://github.com/phaserjs/template-vite-ts | Official (Phaser Studio) but stale: pins phaser 4.0.0, vite ^6.3.1, typescript ~5.7.2. Bump deps after scaffolding. Also scaffoldable via `npm create @phaserjs/game` (@phaserjs/create-game 1.3.2, 2026-04-21). `create-phaser-game` on npm is an unrelated 2020 Phaser 3/Webpack package. |
| 2 | pixi.js | 8.22.0 | 2026-10-01 | https://www.npmjs.com/package/pixi.js | Fast cadence (8.21 on 2026-09-17); pin minor. |
| 2 | create-pixi.js (`npm create pixi.js@latest`) | 1.4.0 | 2025-04-15 | https://pixijs.com/8.x/guides/getting-started/quick-start , https://github.com/pixijs/create-pixi | Official. Vite TS template = `template-bundler-vite` (TS) / `-vite-js`; also `template-creation-web`. CLI not updated since 2025-04; template deps will need bumping. |
| 2 | pixi-filters (GlowFilter) | 6.1.5 | 2025-11-29 | https://www.npmjs.com/package/pixi-filters | Peer `pixi.js >=8.0.0-0`; v6 line = Pixi v8. Only relevant if PixiJS is chosen. |
| 3 | @capacitor/core, cli, ios, android | 8.5.3 | 2026-10-07 | https://www.npmjs.com/package/@capacitor/cli , https://capacitorjs.com/docs/updating/8-0 | Min iOS 15.0; Android minSdk 24, compile/target 36; Node >=22 (cli `engines`); Xcode 26+; Android Studio Otter 2025.2.1+. New iOS projects default to SPM (not CocoaPods). Add `density` to Android `configChanges`. |
| 4 | @capacitor/haptics | 8.0.2 | 2026-03-27 | https://www.npmjs.com/package/@capacitor/haptics | peer `@capacitor/core >=8.0.0`. |
| 4 | @capacitor/preferences | 8.0.1 | 2026-02-12 | https://www.npmjs.com/package/@capacitor/preferences | peer >=8.0.0. Native (UserDefaults/SharedPreferences): durable, small key/value only. |
| 4 | @capacitor/filesystem | 8.1.4 | 2026-10-02 | https://www.npmjs.com/package/@capacitor/filesystem | peer >=8.0.0. Good for durable JSON save blobs (Directory.Data / Library). |
| 4 | @capacitor/share | 8.0.3 | 2026-10-02 | https://www.npmjs.com/package/@capacitor/share | peer >=8.0.0. |
| 4 | @capacitor/app | 8.1.2 | 2026-10-02 | https://www.npmjs.com/package/@capacitor/app | peer >=8.0.0. Use `appStateChange`/`pause`/`resume` to flush saves and handle WebGL context loss. |
| 4 | @capacitor-community/sqlite | 8.1.1 | 2026-08-06 | https://www.npmjs.com/package/@capacitor-community/sqlite | peer `@capacitor/core >=8.0.0`. Web platform needs `jeep-sqlite` (^2.7.2) + sql.js wasm; heavy for a puzzle game's save needs. |
| 5 | @openforge/capacitor-game-connect | 5.0.2 | 2023-12-04 | https://github.com/openforge/capacitor-game-connect | NOT Cap 8 compatible: peer `@capacitor/core ^5.0.0`. Repo not archived (last push 2026-02-21) but open "Support Cap 7" issues (2025-08/09) unaddressed in a release. Fork or avoid. |
| 5 | @modbender/capacitor-play-games | 0.5.0 | 2026-09-12 | https://github.com/modbender/capacitor-play-games | Peer `^8.0.0`; Play Games Services v2 (Android only), web no-op. Pre-1.0, one maintainer, repo created 2026-09-08, 0 stars. |
| 5 | @astrocreep/capacitor-gamecenter | 0.1.0 | 2024-09-04 | https://www.npmjs.com/package/@astrocreep/capacitor-gamecenter | Peer `^6.0.0`; abandoned. |
| 5 | @mpgd/capacitor-game-services | 0.6.1 | 2026-10-08 | https://github.com/imjlk/mpgd-kit | Cap 8 (`^8.5.1`) but despite the name contains no GameKit/Play Games code (storage/credentials bridge for mpgd-kit backend). Not a Game Center plugin. |
| 6 | vite | 8.3.4 | 2026-10-08 | https://www.npmjs.com/package/vite | Node `^20.19 || >=22.12`. Vite 8 = Rolldown-based; check plugin compat. |
| 6 | typescript | 7.0.2 | 2026-07-08 | https://www.npmjs.com/package/typescript | TS 7 = native (Go) compiler. Tools that use the TS JS API (typescript-eslint, some IDE/lint plugins) may still require 6.x (6.0.3, 2026-04-16). Vite/Vitest transpile without tsc, so fine for build; verify lint toolchain. |
| 6 | vitest | 5.0.3 | 2026-09-30 | https://www.npmjs.com/package/vitest | Node `^22.12 || ^24 || >=26`; peer vite ^6.4/^7/^8. |
| 6 | @playwright/test | 1.64.0 | 2026-10-07 | https://www.npmjs.com/package/@playwright/test | WebKit project approximates but does not equal iOS WKWebView; device testing still needed. |
| 6 | pnpm | 12.10.1 | 2026-10-06 | https://www.npmjs.com/package/pnpm | Major 12 is new; note this repo's package.json `devEngines` currently pins pnpm `^11.18.0` (npm commands fail in repo root with EBADDEVENGINES). |
| 6 | Node.js LTS | 24.21.0 "Krypton" (Active LTS) | 2026-09-07 | https://nodejs.org/dist/index.json | 22.23.3 "Jod" (2026-09-23) is Maintenance LTS. Node 26 (26.11.1 current) becomes LTS late Oct 2026. Use 24 (satisfies Capacitor >=22, Vite, Vitest). |
| 7 | fast-check | 4.10.2 | 2026-09-19 | https://www.npmjs.com/package/fast-check | None. |
| 8 | preact | 11.0.1 | 2026-10-08 | https://www.npmjs.com/package/preact | 11.0.0 only shipped 2026-09-30; brand-new major. 10.29.8 (2026-08-01) is the conservative choice. |
| 8 | @preact/signals | 2.11.3 | 2026-09-30 | https://www.npmjs.com/package/@preact/signals | Peer `preact >=10.25.0 || >=11.0.0-0`; works with either. |
| 9 | zod | 4.6.5 | 2026-09-13 | https://www.npmjs.com/package/zod | Larger bundle; use `zod/mini` if size matters. |
| 9 | valibot | 1.5.0 | 2026-09-09 | https://www.npmjs.com/package/valibot | Smallest tree-shaken footprint; good fit for config validation. |
| 10 | idb-keyval | 6.3.0 | 2026-07-08 | https://www.npmjs.com/package/idb-keyval | Tiny KV. See #12: not durable on iOS WKWebView. |
| 10 | idb | 8.0.4 | 2026-10-06 | https://www.npmjs.com/package/idb | Same iOS durability caveat. |
| 11 | pure-rand | 8.4.2 | 2026-07-10 | https://github.com/dubzzz/pure-rand | Integer-arithmetic PRNGs (xoroshiro128plus recommended, mersenne, xorshift128plus, congruential32); deterministic for a seed. README does not explicitly claim cross-engine identity, but generators use 32-bit int ops (spec-defined in ECMAScript), so integer output is engine-independent in practice. Avoid float scaling via `Math.*` transcendental functions; use its `uniformInt` distributions. Pin version: algorithm/distribution changes across majors could change sequences. |
| 11 | seedrandom | 3.0.5 | 2019-09-17 | https://www.npmjs.com/package/seedrandom | Unmaintained since 2019; CommonJS; not recommended. |

## 2. iOS WKWebView storage durability (#12)

Verdict: IndexedDB/localStorage are NOT safe as the sole durable save store in a Capacitor iOS app. Use native storage (Filesystem JSON or Preferences, or SQLite) as the source of truth; IndexedDB is acceptable only as a cache/web-build store.

- Capacitor's own Storage guide: localStorage "must be considered transient" because "the OS will reclaim local storage from Web Views if a device is running low on space"; "the same can be said for IndexedDB at least on iOS". Recommends Preferences (native, avoids eviction) or SQLite. https://capacitorjs.com/docs/guides/storage
- WebKit storage policy (2023-08-10): non-browser apps get origin quota up to 15% and overall 20% of disk; eviction is LRU per origin under storage pressure or inactivity; data is "best-effort" unless persistent mode is granted via heuristics (`navigator.storage.persist()`), which does not reliably apply to embedded WKWebViews. https://webkit.org/blog/14403/updates-to-storage-policy/
- Developer reports of WKWebView localStorage disappearing (iOS 17.4+; anecdotal): https://developer.apple.com/forums/thread/751820 , https://developer.apple.com/forums/thread/770747 , https://developer.apple.com/forums/thread/773434
- No Apple doc found guaranteeing WKWebView storage persistence, and no Capacitor setting that makes it persistent.

Recommendation: a `SaveStore` interface with a native adapter (`@capacitor/filesystem` writing a versioned JSON file in `Directory.Data`/Library, or `@capacitor/preferences` for small saves) on iOS/Android and an `idb-keyval` adapter for the pure-web build. Flush on `App` `pause`.

## 3. Known iOS WebGL/WebGPU/audio issues (#13)

- Audio vs silent switch: Web Audio in WKWebView is mapped to the "Ambient" audio session category and is silenced by the hardware mute switch, while `<audio>` elements are not; setting AVAudioSession natively reportedly does not change WKWebView behaviour. Workarounds: start a looped silent `<audio>` element on a user gesture to promote the session to playback (e.g. `unmute.js`), plus an in-game mute toggle. Behaviour varies by iOS version; test on device. Sources: https://bugs.webkit.org/show_bug.cgi?id=251532 , https://bugs.webkit.org/show_bug.cgi?id=252746 , https://github.com/swevans/unmute , https://developer.apple.com/forums/thread/24464 . No Capacitor-specific 2025-2026 issue was found.
- WebGL context loss on background/resume: recurring WebKit/WKWebView behaviour (iOS 16-17 reports, iOS 17.6 report in 2025). Handle `webglcontextlost` (preventDefault) / `webglcontextrestored` and rebuild GPU resources; check `isContextLost()` on resume. Sources: https://bugs.webkit.org/show_bug.cgi?id=261331 , https://forum.playcanvas.com/t/webgl-context-lost-in-ios-17-wkwebview/34247 , https://feedback.textasticapp.com/communities/1/topics/4001-webgl2-graphics-context-is-sometimes-lost-in-the-built-in-html-viewer-after-backgrounding-the-app
- WebView killed in background ("cold start"/blank on resume): the OS can terminate the WebContent process; Capgo's webview-guardian plugin detects and reloads. Persist state on `pause`. https://capgo.app/docs/plugins/webview-guardian/
- WebGPU: ships on by default in Safari/WebKit 26 (iOS 26). Apple engineer stated WKWebView gets it once enabled by default (beta-era statement). iOS 15-25 have no WebGPU, and Capacitor 8 supports iOS 15+, so WebGL must remain the baseline; feature-detect `navigator.gpu`. Reports of WebContent/GPU process crashes in WKWebView on iPhone 15 / iOS 26.4 (cause not tied to WebGPU). Sources: https://web.dev/blog/webgpu-supported-major-browsers , https://developer.apple.com/forums/thread/770862 , https://developer.apple.com/forums/thread/822200
- No confirmed Capacitor 8-specific WebGL cold-start freeze bug found in 2025-2026 searches.

## 4. Game Center / Play Games summary (#5)

No maintained Capacitor 8 plugin covering both Game Center and Google Play Games was found. Options:
1. Write a thin custom local Capacitor plugin (GameKit `GKLocalPlayer.authenticateHandler`, `GKLeaderboard.submitScore`, `GKAchievement.report`) for iOS, and use `@modbender/capacitor-play-games` (Android, pre-1.0) or a custom Android wrapper.
2. Fork `@openforge/capacitor-game-connect` and port to Cap 8 (API surface already fits: sign-in, leaderboards, achievements).
3. Defer platform game services to post-MVP.

Platform model differences to abstract over: Play Games has daily/weekly/all-time leaderboard windows and incremental vs standard achievements; Game Center models achievements as percent-complete.
