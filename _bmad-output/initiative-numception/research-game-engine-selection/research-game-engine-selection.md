---
title: 'technical research: Game engine selection'
type: 'technical'
shape: 'select'
topic: 'Game engine selection'
decision: 'Which engine or stack to build the game on across iOS, Android, and web'
source: 'native run'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-10-08'
updated: '2026-10-08'
claims_verified: 8
claims_unverified: 3
claims_disputed: 1
---

# technical research: Game engine selection

**Decision this research serves:** Which engine or stack to build the game on across iOS, Android, and web

## Executive summary

**Build web-first in TypeScript, using Phaser 4 or PixiJS v8 for rendering, and wrap it for iOS and Android with Capacitor 8.** Keep the puzzle generator, difficulty model and scoring in an engine-agnostic TypeScript package. That package is the cheapest way to back out of this choice later. Of the six options, only the web-TypeScript stacks score well on both of your two heaviest-weighted criteria: fitting your TypeScript skills and effects quality.

What drives the answer:

1. **Unity and Godot are weakest exactly where your hard requirements bite: mobile web.**
   - **Unity:** officially supports only iOS Safari 15+ and Android Chrome 58+, with no hardware guidance [1]. Reported build sizes are several MB to over 12 MB, and the figures conflict [3][4]. Safari also blocks Unity save data (IndexedDB) when the game runs inside an iframe [1].
   - **Godot:** its own docs say native exports beat web "by a significant margin", that Safari has WebGL 2 issues [8], and that C# projects can't export to web at all [8].
2. **The web stacks are healthy and current.** All of these shipped releases in the last 1–3 months: PixiJS 8.22.0 (2026-10-01) [10], Phaser 4.2.1 (2026-07-09, v4 stable since April 2026) [11], and Capacitor 8.5.3 (2026-10-07) [12]. Their bundles are likely in the hundreds of KB versus several MB for engine runtimes, but those sizes come from search snippets only [15][16].
3. **The main risk for the Capacitor wrapper is App Store review, not rendering.**
   - Apple's guideline 4.2 rejects apps that are "a repackaged website" [17], and a Capacitor vendor reported a 4.2 rejection of a wrapped web app, though the citation check could not confirm this on the fetched page [18].
   - No source documents a WebGL *game* being rejected. A game with "lasting entertainment value" is what 4.2 asks for [17].
   - The one 2026 account of a PixiJS v8 + Capacitor iPhone game hit WebKit audio and media quirks, not frame-rate limits [19].

**Biggest caveat:** no source measured 2D glow and particle frame rates on mid-range phones for *any* candidate. A 1–2 day prototype — the same neon scene built in Phaser 4 and PixiJS v8, wrapped in Capacitor, run on a mid-range Android phone and an older iPhone — settles that, and should come before architecture locks in.

## Requirements frame

Agreed with the user at the plan gate.

**Hard gates:**
- one codebase for iOS (phone and tablet), Android, and web including mobile web
- smooth 60fps 2D vector, glow and particle effects on mid-range phones
- a reasonable web download

**Weighted preferences:**

| Preference | Weight |
|---|---|
| Fits the developer's TypeScript skills | ×3 |
| Effects quality | ×3 |
| Speed of building a proof of concept | ×2 |
| Offline play and local saves | ×2 |
| Licence and cost | ×1 |
| Ecosystem health | ×1 |

## Candidate screen

| Candidate | Current version | Screen result |
|---|---|---|
| Phaser 4 + Capacitor | 4.2.1 [11] / 8.5.3 [12] | Finalist |
| PixiJS v8 + Capacitor | 8.22.0 [10] / 8.5.3 [12] | Finalist |
| Defold | 1.13.2 [20] | Finalist |
| Godot 4 (GDScript) | 4.7.2 [7] | Finalist. C# is ruled out for web [8]. |
| Unity 6 | 6.6 [1][2] | Finalist, but borderline on the web-download gate [3][4] |
| Flutter + Flame | Flame 1.38.2 [22] | Finalist, but borderline on the web-download gate [23] |
| Cocos Creator | 3.8.6 (Mar 2025) [25] | **Cut.** No 2026 release surfaced, so ecosystem freshness is unconfirmed. |

## Evidence per candidate

**Unity 6.**
- *Version and web support:* The current manual is 6.6. Mobile browser support is limited to iOS Safari 15+ and Android Chrome 58+, with no stated hardware minimum [1].
- *Graphics:* WebGPU left experimental in 6.6, but WebGL 2 remains the default [2].
- *Saves:* Safari blocks IndexedDB inside iframes, which breaks saves on web game portals [1].
- *Licence:* The Runtime Fee was cancelled in 2024. Personal is free up to $200k revenue; Pro is $2,200 per seat per year above that [5].
- *Download size and load time:* Reported compressed web builds range from ~5 MB to 12.5 MB, and the figures conflict widely [3][4]. One competitor estimates 8–30 s to become interactive (low confidence, biased source) [6].
- *Language:* C# only, so no TypeScript fit (unverified belief, but uncontested).

**Godot 4.7.**
- *Version and health:* Stable 4.7.2 shipped on 2026-08-18, with 4.8 in development [7]. The licence is MIT; a credits notice is required [9].
- *Web export:* Web export is WebGL 2 only. The default single-threaded build needs no COOP/COEP headers. C# cannot export to web. Native exports "will always perform better by a significant margin", and Safari has WebGL 2 issues [8].
- *Download size:* The default export is large. One developer trimmed it to ~5 MB with a custom template (medium-low confidence) [21].
- *TypeScript:* Support exists only through GodotJS, which describes itself as "still under testing" and has no tagged releases [24].

**Defold 1.13.**
- *Size:* An empty HTML5 build is 1.06 MB [20], the smallest of the engines that ship their own runtime.
- *Licence and health:* Free with no royalties, under a source-available licence. Monthly releases continue [20][26].
- *Language:* Lua. TypeScript is available only through a community tool that was not verified this run.

**Flutter + Flame.**
- *Size:* The renderer alone adds 2.0–2.7 MB.
- *iOS:* iOS browsers always get the heavier CanvasKit renderer, because a WebKit bug was still open in Sep 2026 [23].
- *Performance and language:* No mobile-browser benchmarks exist [23]. The language is Dart.

**Phaser 4.**
- *Status:* v4.0.0 went stable on 2026-04-10 with a rebuilt WebGL renderer. 4.2.1 shipped on 2026-07-09 [11], and shipped games are migrating to v4 [13].
- *Mobile:* There is an official tutorial for shipping to iOS and Android with Capacitor [14].
- *Bundle size:* about 341 KB gzipped for 4.1.0 (search snippet only, low confidence) [16].
- *Features:* scenes, tweens, input, audio and particles are built in, which is why it scores highest for proof-of-concept speed.

**PixiJS v8.**
- *Releases:* stable roughly every 2–6 weeks in 2026 [10].
- *Effects:* glow comes per-filter from `pixi-filters/glow`. Filters default to resolution 1, which can look soft on high-DPI phones [27].
- *Bundle size:* about 244 KB gzipped for the full import (snippet only, low confidence), and it can be tree-shaken [15].
- *Scope:* it is a renderer, not a game framework. Scenes, tweens and input are ours to build or pull in.

**Capacitor 8 (wrapper for both web stacks).**
- *Health:* 8.5.3 is current, 9.0 is in alpha, and older major versions still get patches [12].
- *App Store rules:* guideline 2.5.2 allows JavaScript bundled in the app but bars downloading code that changes features [17].
- *Known WebKit issue:* the iPhone mute switch can silence Web Audio unless an `<audio>` element is kept active [19]. That is a known fix to plan for.

## Decision matrix

Scores are 1–5, multiplied by the weights. Re-weight freely; the scores are judgment calls grounded in the evidence above.

| Criterion (weight) | Phaser 4 | PixiJS v8 | Defold | Godot 4.7 | Unity 6 | Flutter+Flame |
|---|---|---|---|---|---|---|
| TypeScript fit (×3) | 5 | 5 | 2 | 1 | 1 | 1 |
| Effects quality (×3) | 4 | 4 | 4 | 4 | 5 | 3 |
| Proof-of-concept speed (×2) | 5 | 4 | 3 | 4 | 3 | 3 |
| Offline and local saves (×2) | 4 | 4 | 4 | 4 | 3 | 4 |
| Licence and cost (×1) | 5 | 5 | 5 | 5 | 3 | 5 |
| Ecosystem health (×1) | 4 | 5 | 4 | 5 | 4 | 4 |
| **Total (max 60)** | **54** | **53** | 41 | 41 | 37 | 35 |

**Pick:** Phaser 4 + Capacitor.

**Runner-up:** PixiJS v8 + Capacitor. It wins instead if the prototype shows Phaser 4's newer renderer stuttering on mid-range phones, or a meaningfully larger bundle. It also wins if we want full control of the render loop for custom effects such as fractal zoom. The top two are effectively tied; let the prototype decide.

**Strongest argument against the pick:** Unity and Godot give better tooling for particles, shaders and editors, and Godot's native exports outperform any WebView. If the game's appeal ends up resting on heavy effects, the web stack's performance ceiling inside a WebView is the risk. The mobile-web requirement still rules both out unless the web build becomes optional.

**Cheapest reversibility hedge:** put the puzzle generator, uniqueness checker, difficulty model, scoring and save format in a pure-TypeScript `core` package with no rendering dependency. The renderer then becomes a replaceable layer, and the same core can run on a server for leaderboard validation.

## Cross-dimension insights

- **The mobile-web requirement decides this choice.** Drop it and Godot (native exports, MIT licence) becomes competitive. Keep it and every engine with its own runtime pays a download and Safari penalty that the web stacks don't [1][8][23].
- **The web stack's risks are in WebKit behaviour and App Store review, not rendering.** The rendering stack itself is healthy [10][11][12]. Plan Apple-facing native touches (haptics, Game Center, offline play) as product requirements so the app clearly offers more than a website [17][18].

## Recommendations

1. **Architecture:** web-first TypeScript, Capacitor 8 for the app stores, and an engine-agnostic `core` package. Medium confidence: mobile performance is unmeasured.
2. **Prototype before architecture locks in:** build the same scene in Phaser 4 and PixiJS v8 — neon lines, glow, 200 particles — inside Capacitor. Measure frame rate and gzipped size on a mid-range Android phone and an iPhone ≥ 3 years old. This turns the low-confidence size and performance claims into facts.
3. **PRD:** add requirements for native app features (haptics, Game Center / Play Games leaderboards, full offline play) to answer App Store guideline 4.2 [17]. Add an audio requirement covering the iOS mute-switch behaviour [19].

## Open questions

- Actual gzipped bundle sizes for Phaser 4 and PixiJS v8 with the glow filter: the prototype's Vite build answers this.
- Frame rates on mid-range Android WebView and on iOS: the prototype answers this.
- Real App Store outcomes for Capacitor-wrapped WebGL games: no public case found. Mitigate in the product design.
- Defold's TypeScript tooling (ts-defold) health, which matters only if Defold returns as a contender.

## Source appendix

| # | Claim/finding it supports | Publisher | Pub date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | Unity 6.6 mobile browser support; Safari iframe IndexedDB limitation | [Unity docs](https://docs.unity3d.com/Manual/webgl-browsercompatibility.html) | live (6.6) | 2026-10-08 | high |
| [2] | Unity 6.6 released; WebGPU out of experimental, WebGL 2 default | [Unity forums](https://discussions.unity.com/t/webgpu-out-of-experimental-in-unity-6-6/1734694) | 2026-09 | 2026-10-08 | medium |
| [3] | Unity web build ~5–12 MB depending on stripping | [FRVR docs](https://docs.frvr.com/engines/unity/optimization/) | ~2025 | 2026-10-08 | low-medium |
| [4] | Unity empty project 12.5–14.7 MB Brotli; conflicting forum figure ~3.3 MiB | [CrazyGames docs](https://docs.crazygames.com/resources/optimization-tips/) | ~2025 | 2026-10-08 | low-medium |
| [5] | Runtime Fee cancelled; Personal free under $200k | [PocketGamer.biz](https://www.pocketgamer.biz/unity-cancels-infamous-runtime-fee/) | 2024-09-12 | 2026-10-08 | medium-high |
| [6] | Unity web 8–30 s to interactive (competitor estimate) | [Utsubo](https://www.utsubo.com/blog/threejs-vs-unity-web-comparison) | 2026-02 | 2026-10-08 | low |
| [7] | Godot 4.7.2 stable 2026-08-18; 4.8 in dev | [Godot blog](https://godotengine.org/blog/) | 2026-08-18 | 2026-10-08 | high |
| [8] | Godot web: WebGL 2 only, no C# web export, native much faster, Safari WebGL 2 issues | [Godot docs 4.7](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html) | live (4.7) | 2026-10-08 | high |
| [9] | Godot MIT licence, credits notice required | [Godot licence](https://godotengine.org/license/) | undated | 2026-10-08 | high |
| [10] | PixiJS v8.22.0 released 2026-10-01; release cadence | [PixiJS GitHub releases](https://github.com/pixijs/pixijs/releases) | 2026-10-01 | 2026-10-08 | high |
| [11] | Phaser 4.0.0 stable 2026-04-10; 4.2.1 2026-07-09 | [Phaser GitHub releases](https://github.com/phaserjs/phaser/releases) | 2026-07-09 | 2026-10-08 | high |
| [12] | Capacitor 8.5.3 2026-10-07; 9.0 alpha; older majors patched | [Capacitor GitHub releases](https://github.com/ionic-team/capacitor/releases) | 2026-10-07 | 2026-10-08 | high |
| [13] | Shipped games migrating to Phaser 4 | [Phaser news](https://phaser.io/news/2026/05/hexstorm-tears-of-arcadia-is-now-on-phaser-v4) | 2026-05 | 2026-10-08 | medium |
| [14] | Official Phaser + Capacitor mobile tutorial | [Phaser tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor) | 2024-09 | 2026-10-08 | medium |
| [15] | pixi.js ~244 KB gzipped full import | [DepScope](https://depscope.dev/pkg/npm/pixi.js) | unknown | 2026-10-08 | low |
| [16] | Phaser 4.1.0 ~341 KB gzipped | [DepScope](https://mcp.depscope.dev/pkg/npm/phaser) | unknown | 2026-10-08 | low |
| [17] | App Store guidelines 4.2 and 2.5.2 text | [Apple](https://developer.apple.com/app-store/review/guidelines/) | live | 2026-10-08 | high |
| [18] | Capacitor app rejected under 4.2 as too close to browsing (seen in a search snippet only; the fetched page did not support it) | [Capgo blog](https://capgo.app/de/blog/app-store-rejection/) | unknown | 2026-10-08 | low |
| [19] | PixiJS v8 + Capacitor iPhone game: WebKit media/mute-switch traps | [HackerNoon](https://hackernoon.com/three-ios-webkit-traps-that-blacked-out-my-ar-game-and-how-i-caught-them) | 2026-09-21 | 2026-10-08 | medium |
| [20] | Defold empty HTML5 build 1.06 MB; v1.13.2 2026-09-29 | [Defold blog](https://defold.com/2026/05/04/Defold-1-12-4/) | 2026-05-04 | 2026-10-08 | high |
| [21] | Godot web export trimmed to ~5 MB with custom template | [Popcar blog](https://popcar.bearblog.dev/how-to-minify-godots-build-size/) | 2025 | 2026-10-08 | low-medium |
| [22] | Flame 1.38.2 current; Flutter Favorite | [pub.dev](https://pub.dev/packages/flame) | ~2026-08 | 2026-10-08 | high |
| [23] | Flutter web renderer 2.0–2.7 MB; iOS always CanvasKit; no mobile benchmarks | [Start Debugging](https://startdebugging.net/2026/09/canvaskit-vs-skwasm-for-flutter-web-in-2026/) | 2026-09-17 | 2026-10-08 | medium-high |
| [24] | GodotJS "still under testing", no tagged releases | [GitHub godotjs](https://github.com/godotjs/GodotJS) | snapshot | 2026-10-08 | high |
| [25] | Cocos Creator 3.8.6 latest found (Mar 2025) | [Cocos](https://www.cocos.com/en/post/f539c7888e620701228458d6b89b80c7) | 2025-04-02 | 2026-10-08 | medium |
| [26] | Defold free, no royalties, source-available licence | [Defold](https://defold.com/open) | n/a | 2026-10-08 | high |
| [27] | PixiJS v8 glow via pixi-filters/glow; filter resolution default 1 | [pixijs-skills](https://skills.sh/pixijs/pixijs-skills/pixijs-filters) | n/a | 2026-10-08 | medium |

## Staleness map

Re-check windows: versions 1 mo · ecosystem 6 mo · pricing 3 mo · store policy 6 mo. Computed with `recon_kit.py staleness`.

| Claim | Class | Published | Re-check by |
|---|---|---|---|
| Unity pricing / Runtime Fee [5] | pricing | 2024-09 | **stale now**: confirm current Unity plans before relying on it |
| Phaser 4.2.1 is latest [11] | versions | 2026-07 | **stale now**: check for 4.3+ |
| Unity, Godot, PixiJS, Capacitor versions [1][8][10][12] | versions | 2026-10 | 2026-11-01 |
| Flutter web payload [23] | ecosystem | 2026-09 | 2027-03-01 |
| App Store 4.2 / 2.5.2 text [17] | policy | 2026-10 | 2027-04-01 |

Two entries are already stale and the rest come due on **2026-11-01**. A selection report older than two quarters should be refreshed before anyone acts on it.

_"Verified" in the ledger means the claim was read directly from the vendor's own docs or release page this run. Snippet-only figures are marked unverified._
