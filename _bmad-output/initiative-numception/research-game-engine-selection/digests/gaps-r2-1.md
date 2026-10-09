# Gaps R2-1 — Bundle size, App Store 4.2, WebView/web-export performance, Godot license & TS

Accessed for all: 2026-10-08. Budget: 15 tool calls. Class key: primary-official | primary-anecdotal | secondary-aggregator | secondary-blog.

## Findings

### Q1 Bundle size
1. **claim:** pixi.js (v8.18.1) full package measures ~857.9 KB minified / ~244.4 KB gzipped (full import, not tree-shaken).
   - source: https://depscope.dev/pkg/npm/pixi.js · publisher: DepScope · pub_date: unknown · confidence: LOW (seen only in search snippet; direct fetch returned HTTP 410) · class: secondary-aggregator
2. **claim:** PixiJS v8 merged packages into a single `pixi.js` package; unused features can be tree-shaken at build time, so shipped size depends on imports.
   - source: https://www.issoh.co.jp/tech/details/9180/ · publisher: issoh.co.jp · pub_date: unknown · confidence: MEDIUM (consistent with v8 design; snippet only) · class: secondary-blog
3. **claim:** Phaser 4.1.0 measures ~1314.7 KB minified / ~341.0 KB gzipped; no official Phaser Studio size figure for v4 found.
   - source: https://mcp.depscope.dev/pkg/npm/phaser · publisher: DepScope · pub_date: unknown · confidence: LOW (snippet only; direct fetch HTTP 410) · class: secondary-aggregator
4. **claim:** Phaser 3 full bundle adds ~980 KB minified JS (v3.50-era custom-build guide); custom builds can strip unused modules.
   - source: https://awesome.ecosyste.ms/projects/github.com%2Fphaserjs%2Fcustom-build · publisher: ecosyste.ms (mirror of phaserjs/custom-build) · pub_date: unknown · confidence: MEDIUM · class: secondary-aggregator
   - Note: "Phaser Nano 7.6 KB" figure (gamedevacademy.org/phaser-4-tutorial) refers to an abandoned early Phaser 4 concept, NOT the shipped Phaser 4 — disregard.

### Q2 Apple App Store guidelines
5. **claim:** Guideline 4.2 verbatim: "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store. If your App doesn't provide some sort of lasting entertainment value or adequate utility, it may not be accepted." 4.2.2 bars "web clippings"; 4.2.3(ii) requires disclosing/prompting for downloads needed on first launch.
   - source: https://developer.apple.com/app-store/review/guidelines/ · publisher: Apple · pub_date: no date shown on page · confidence: HIGH · class: primary-official
6. **claim:** Guideline 2.5.2: apps must be self-contained and may not "download, install, or execute code which introduces or changes features or functionality of the app." (Relevant to OTA JS updates e.g. Capgo live updates — bundled JS in app is fine.) Guideline 4.7 explicitly permits HTML5/JavaScript mini games not embedded in the binary under conditions; 2.5.6 requires WebKit for web browsing.
   - source: same as above · confidence: HIGH · class: primary-official
7. **claim:** Developer account of a Capacitor web app rejected under 4.2 with reviewer text that it was "not sufficiently different from a mobile browsing experience" and that push/Core Location/sharing alone were not robust enough.
   - source: https://capgo.app/de/blog/app-store-rejection/ (also /zh/) · publisher: Capgo (Capacitor vendor) · pub_date: unknown · confidence: MEDIUM (snippet only, vendor blog) · class: secondary-blog
8. **claim:** A non-web indie tilt-puzzle game (Ballzerk; 35+ levels, Game Center) was rejected under 4.2 for "minimal functionality/very little content" — shows 4.2 hits small games regardless of tech; a reply reports getting a 4.2 rejection overturned by adding features.
   - source: https://developer.apple.com/forums/thread/103679 · publisher: Apple Developer Forums · pub_date: 2018-06 · confidence: MEDIUM (old, anecdotal) · class: primary-anecdotal
9. **claim:** Phaser officially documents shipping Phaser games to iOS/Android via Capacitor (touch, resize, safe-area) but does not address App Review.
   - source: https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor ; https://phaser.io/news/2024/09/new-tutorial-deploying-phaser-games-to-mobile-with-capacitor · publisher: Phaser Studio · pub_date: 2024-09 · confidence: MEDIUM (snippet) · class: primary-official

### Q3 Performance
10. **claim:** A pixi.js v8 game running in a Capacitor WKWebView on iPhone (camera feed as WebGL texture) shipped/debugged in 2026; issues were WebKit media/lifecycle traps (shared <video> destroy, play() resolving before first frame, mute-switch silencing Web Audio — fixed with silent <audio> anchor), not rendering throughput; pixi init ~8 ms.
    - source: https://hackernoon.com/three-ios-webkit-traps-that-blacked-out-my-ar-game-and-how-i-caught-them · publisher: HackerNoon · pub_date: 2026-09-21 · confidence: MEDIUM (single anecdote) · class: primary-anecdotal
    - Relevance: Web Audio mute-switch behavior in WKWebView matters for a game with sound.
11. **claim:** PixiJS game hung on iOS 15 beta WKWebView/Safari; workaround was disabling "GPU Process: Canvas Rendering"; similar reports on iOS 16.0.3.
    - source: https://developer.apple.com/forums/thread/684843 · publisher: Apple Developer Forums · pub_date: 2021 (iOS 15 beta) · confidence: MEDIUM (dated) · class: primary-anecdotal
12. **claim:** 2019 Cordova iOS: PixiJS ~25 fps in WKWebView vs acceptable in Safari; one cause was PNGs larger than canvas.
    - source: https://www.html5gamedevs.com/topic/42962-ios-cordova-slow-raf-performance-solved/ · publisher: html5gamedevs · pub_date: 2019 · confidence: LOW (old) · class: primary-anecdotal
13. **claim:** Godot 4.7 official docs: web export "can run on mobile platforms with some caveats"; native Android/iOS exports perform significantly better; "CPU and GPU performance is at a premium" on mobile; Safari has several WebGL 2.0 issues other browsers lack; WebGL 2.0 / Compatibility renderer only (no Forward+/Mobile, no WebGPU); C# cannot export to web; single-threaded export is default since 4.3 (no COOP/COEP headers needed); .wasm gzips to ~1/4; custom optimized templates recommended to cut mobile load time.
    - source: https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html · publisher: Godot Engine · pub_date: 4.7 docs (undated) · confidence: HIGH · class: primary-official
14. **claim:** Godot 4.5 enabled WebAssembly SIMD by default for web exports.
    - source: https://app.cinevva.com/de/news/2025-09-18-godot-4-5-release · publisher: Cinevva (news aggregator) · pub_date: 2025-09-18 · confidence: LOW-MEDIUM (secondary, snippet) · class: secondary-aggregator

### Q4 Godot license & TypeScript
15. **claim:** Godot is MIT (Expat) licensed; usable commercially; no royalties mentioned; games must include Godot's copyright notice/license somewhere (link in credits acceptable); third-party components listed in COPYRIGHT.txt.
    - source: https://godotengine.org/license/ · publisher: Godot Engine · pub_date: undated · confidence: HIGH · class: primary-official
16. **claim:** GodotJS (godotjs/GodotJS) adds TS/JS to Godot 4.x with V8, QuickJS, quickjs-ng, JavaScriptCore or host-browser JS backends; self-described "essentially usable but still under testing"; workers experimental; no tagged releases; ~769 stars. Web/mobile export not explicitly documented.
    - source: https://github.com/godotjs/GodotJS · publisher: GitHub (godotjs) · pub_date: accessed snapshot · confidence: HIGH (for stated facts) · class: primary-official
17. **claim:** Older godotjs/javascript (QuickJS) branch targets Godot 4.1, VS Code debugger unavailable for 4.x; alternatives Gype (Godot 4.5, MIT, v2.1.9) and Gode (Godot 4.6, v0.3.0) exist; godot-lang-support classifies JS/TS as community-maintained vs GDScript "actively maintained, documented, and stable."
    - source: https://github.com/godotjs/javascript ; https://godotengine.org/asset-library/asset/edit/19743 ; https://github.com/Godot-Languages-Support/godot-lang-support · publisher: GitHub / Godot Asset Library · pub_date: various · confidence: MEDIUM (snippets) · class: secondary-aggregator

## Leads
- Measure actual tree-shaken sizes: Vite build of minimal pixi.js v8 app (+ pixi-filters GlowFilter) vs Phaser 4 — cheapest reliable answer.
- bundlephobia.com/package/pixi-filters returned only shell content (JS-rendered); try pkg-size.dev or npm unpacked size.
- Capgo "capacitor-apple-review-preflight" skill (skillselion.com) has a games checklist for 4.2.
- Apple guideline 4.7 (HTML5 mini games) text may matter if any content is downloaded post-install.
- HackerNoon author's game is a live shipped pixi v8 + Capacitor App Store example — could check App Store listing.

## Looked for but not found
- Official/bundlephobia gzipped size for pixi-filters (glow) and an official Phaser 4 size figure.
- Any documented approval/rejection of a Capacitor-wrapped PixiJS or Phaser game specifically; a list of shipped PixiJS/Phaser App Store games.
- 2025–2026 benchmarks of PixiJS/Phaser on mid-range Android WebView.
- Hard 2025–2026 numbers for Godot 4 web export FPS/load time on mobile browsers.
- GodotJS release dates or documented iOS/Android/web export support.
- Defold and Unity 6 web were not in scope of these questions.
