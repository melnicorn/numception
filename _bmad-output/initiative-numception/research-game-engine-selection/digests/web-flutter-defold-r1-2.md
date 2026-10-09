# Digest: Web TS renderers + Capacitor / Flutter+Flame / Defold (r1-2)

Accessed: 2026-10-08. Scope: engine selection for a 2D neon/glow math puzzle game (iOS, Android, web incl. mobile web), TS-strong solo dev.
Method: 13 web searches/fetches. Class key: `primary` (official vendor/repo), `secondary-analysis` (independent dev write-up/benchmark), `secondary-aggregator` (Wikipedia/news repost/vendor marketing), `anecdote`.

## Findings

### (a) PixiJS v8 / Phaser + Capacitor

1. **claim:** PixiJS latest stable is v8.22.0 (01 Oct 2026); prior releases v8.21.0 (17 Sep), v8.20.1 (26 Aug), v8.20.0 (20 Aug), v8.19.0 (04 Jun). Release cadence is about every 2–6 weeks in 2026.
   source: https://github.com/pixijs/pixijs/releases | publisher: PixiJS (GitHub) | pub_date: 2026-10-01 | accessed: 2026-10-08 | confidence: high | class: primary
2. **claim:** v8.20.0 focused on the WebGPU path (WGSL overrides, render bundles, Safari WGSL fallback). It replaced `isUniform` with `accessMode`, a silent-`undefined` migration hazard for custom shader code.
   source: https://gamedev.net/news/5221-pixijs-v8200-released/ | publisher: GameDev.net (repost of release notes) | pub_date: ~2026-08 (unclear) | accessed: 2026-10-08 | confidence: medium | class: secondary-aggregator
3. **claim:** In v8, community filters (including GlowFilter) are imported per filter from `pixi-filters/glow`. The `@pixi/filter-*` packages are v7-only. Filter blend modes default to resolution 1, which can look wrong on high-DPI phone screens.
   source: https://skills.sh/pixijs/pixijs-skills/pixijs-filters | publisher: pixijs/pixijs-skills (skills doc, appears PixiJS-org authored) | pub_date: n/a | accessed: 2026-10-08 | confidence: medium | class: secondary-aggregator
4. **claim:** Phaser 4 is stable. v4.0.0 shipped 10 Apr 2026 with a rebuilt WebGL renderer, then v4.1.0 (30 Apr), v4.2.0 (19 Jun; Cone Lights, Mesh2D, Stencil) and v4.2.1 (9 Jul 2026). The last Phaser 3 release shown is v3.90.0 (23 May 2025), and the page states no v3 maintenance policy.
   source: https://github.com/phaserjs/phaser/releases | publisher: Phaser Studio (GitHub) | pub_date: 2026-07-09 | accessed: 2026-10-08 | confidence: high | class: primary
5. **claim:** Shipped games are migrating to Phaser 4 (HEXSTORM: Tears of Arcadia, May 2026), and an official v3 to v4 migration guide exists.
   source: https://phaser.io/news/2026/05/hexstorm-tears-of-arcadia-is-now-on-phaser-v4 | publisher: Phaser | pub_date: 2026-05 | accessed: 2026-10-08 | confidence: medium | class: primary
6. **claim:** Capacitor's latest stable is 8.5.3 (07 Oct 2026). 9.0.0 is in alpha (alpha.8, 07 Oct). Patch releases on 31 Aug went back to v6 and v7, so older majors are still maintained.
   source: https://github.com/ionic-team/capacitor/releases | publisher: Ionic (GitHub) | pub_date: 2026-10-07 | accessed: 2026-10-08 | confidence: high | class: primary
7. **claim:** WKWebView runs JavaScript with JIT, unlike legacy UIWebView, which matters for CPU-bound game work such as particle simulation. This is old (2016) but foundational.
   source: https://www.construct.net/en/blogs/construct-official-blog-1/boosting-ios-performance-855 | publisher: Scirra (Construct) | pub_date: 2016 | accessed: 2026-10-08 | confidence: medium (dated) | class: secondary-analysis
8. **claim:** A Capacitor vendor blog rates WKWebView animation as "good" with occasional dropped frames, below native. This is not a benchmark.
   source: https://capgo.app/ko/blog/ultimate-guide-to-animation-performance-in-capacitor-apps/ | publisher: Capgo (vendor) | pub_date: unknown | accessed: 2026-10-08 | confidence: low | class: secondary-aggregator
9. **claim:** Apple Guideline 4.2 (Minimum Functionality) rejects WebView apps that resemble browsing a website. Native plugins alone did not save one Capacitor app (Apple forum thread). No source found addresses WebView *games* specifically.
   source: https://developer.apple.com/forums/thread/812889 ; https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper | publisher: Apple Developer Forums; MobiLoud | pub_date: ~2025–2026 | accessed: 2026-10-08 | confidence: medium (for wrapper apps); unverified for games | class: anecdote / secondary-aggregator

### (b) Flutter + Flame

10. **claim:** Flame's latest stable is 1.38.2 (about 42 days before access, so ~late Aug 2026), and 2.0.0-dev.1 is in prerelease. It has about 2.33k likes and 160 pub points, carries the Flutter Favorite badge, and targets Android, iOS, Web, and desktop.
    source: https://pub.dev/packages/flame | publisher: pub.dev / flame-engine.org | pub_date: ~2026-08-27 | accessed: 2026-10-08 | confidence: high | class: primary
11. **claim:** Since Flutter 3.29 the HTML renderer is gone, and the compile target picks the renderer: JS builds use CanvasKit, `--wasm` builds use skwasm. Even with `--wasm`, **Safari, Firefox and all iOS browsers get CanvasKit** (hardcoded Blink allowlist), and the WebKit bug 267291 behind this was still open in Sep 2026. For mobile web on iOS, Flutter therefore always ships CanvasKit.
    source: https://startdebugging.net/2026/09/canvaskit-vs-skwasm-for-flutter-web-in-2026/ | publisher: Start Debugging (Marius Bughiu) | pub_date: 2026-09-17 | accessed: 2026-10-08 | confidence: medium-high | class: secondary-analysis
12. **claim:** Measured first-visit payloads on Flutter 3.47.4 (brotli) were 1,977 KB for CanvasKit (Chromium variant), 2,695 KB for CanvasKit (full variant, the Safari path), and 1,647 KB for skwasm. The renderer alone accounts for about 1.2–2.3 MB before game code or assets.
    source: same as #11 | confidence: medium-high | class: secondary-analysis
13. **claim:** In a heavy desktop Chrome (M4) scene, skwasm ran at 32.7 fps against 24.0 for CanvasKit, and a light scene hit about 60 fps either way. **No mobile measurements were taken.** Multi-threaded skwasm stalls on text-heavy frames in 3.47.x (#190039), and the workaround is `forceSingleThreadedSkwasm`. Multi-threaded mode also needs COOP/COEP headers.
    source: same as #11 | confidence: medium | class: secondary-analysis

### (c) Defold

14. **claim:** Defold's latest stable is v1.13.2 (listed 29 Sep 2026; build metadata 2026-10-04). v1.14.0 is in beta, and roughly monthly stable releases continue.
    source: https://github.com/defold/defold/releases | publisher: Defold Foundation (GitHub) | pub_date: 2026-09-29 | accessed: 2026-10-08 | confidence: high | class: primary
15. **claim:** An empty Defold HTML5 project is 1.06 MB (v1.12.4, May 2026), and the Foundation says shrinking HTML5 builds is an ongoing focus. Wikipedia lists 976 kB for the build, but that figure is unconfirmed.
    source: https://defold.com/2026/05/04/Defold-1-12-4/ | publisher: Defold Foundation | pub_date: 2026-05-04 | accessed: 2026-10-08 | confidence: high (1.06 MB); low (976 kB) | class: primary
16. **claim:** Defold is free with no royalties or fees, which the Foundation says Swedish foundation law protects. The license is source-available and Apache-2.0-derived, not OSI open source. Scripting is Lua (TypeScript only via the community tool ts-defold, not verified this run).
    source: https://defold.com/open ; https://en.wikipedia.org/wiki/Defold | publisher: Defold Foundation; Wikipedia | pub_date: n/a | accessed: 2026-10-08 | confidence: high (license); unverified (TS tooling) | class: primary / secondary-aggregator

### (d) Cocos Creator (optional)

17. **claim:** The newest 3.8.x release found was 3.8.6 (28 Mar 2025, with package-size optimizations), and the line is LTS. No 2026 release was surfaced, so ecosystem freshness is unconfirmed. The engine is free and open source per Cocos, and it is TypeScript-native.
    source: https://www.cocos.com/en/post/f539c7888e620701228458d6b89b80c7 | publisher: Cocos | pub_date: 2025-04-02 | accessed: 2026-10-08 | confidence: medium (stale) | class: primary

## Synthesis (inference, not evidence)
- **TS fit:** PixiJS and Phaser are native TS/JS. Cocos is TS-native. Flutter is Dart. Defold is Lua (TS only through a community transpiler).
- **Web payload:** Defold (~1 MB empty) is smallest among engines with a runtime. Flutter costs ~2.0–2.7 MB before the game, and iOS Safari always gets the heavier CanvasKit path. A PixiJS or Phaser bundle likely lands in the hundreds of KB, but **no 2026 measurement was found**.
- **Health:** PixiJS, Phaser, Capacitor, Defold and Flame all had active releases within the last 1–3 months. Cocos is unconfirmed.
- **Main risks:** App Store 4.2 for the Capacitor path (game-specific evidence missing), and unmeasured Flutter performance in mobile browsers.

## Leads
- Bundlephobia / npm for `pixi.js` v8.22 and `pixi-filters/glow` gzipped sizes, plus `phaser` 4.2.1 min+gz.
- The PixiJS `pixijs-performance` skill doc for filter tuning on mobile, and `@pixi/particle-emitter` v8 compatibility status.
- Capacitor 8 docs for the haptics, preferences/filesystem (offline save) and native-audio plugins, plus the Capacitor 9 changelog.
- The Defold 1.13.x release notes (forum) for the current HTML5 size, and the ts-defold project health.
- Apple forum threads that search on "Phaser"/"PixiJS" plus "App Store approved Capacitor".
- Flame 2.0 roadmap, and any Flutter-web game measured on iPhone Safari.

## Looked for but not found
- Any 2026 benchmark of PixiJS/Phaser WebGL inside a Capacitor WKWebView or Android WebView on mid-range phones.
- Game-specific App Store 4.2 outcomes for Capacitor/WebView-wrapped HTML5 games.
- PixiJS v8 GlowFilter cost figures and mobile particle benchmarks.
- Flutter web (CanvasKit/skwasm) performance measured on mobile browsers.
- The current Cocos Creator version and its 2026 activity.
- Capacitor 8 release notes on WebView/WebGL changes.
