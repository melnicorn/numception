# Digest: Unity 6 & Godot 4.x for a 2D neon/zen math puzzle (iOS/Android/web incl. mobile web)

Round: r1-1 | Accessed: 2026-10-08 | Researcher scope: Unity 6, Godot 4.x | ~13 tool calls

Confidence: high = official doc/blog read this run; medium = official source seen via search summary, or multiple consistent secondary sources; low = single secondary/vendor/anecdotal source.
Class: fact (official), measurement (reported number), opinion/vendor, inference.

## Unity 6

| # | Claim | Source URL | Publisher | Pub date | Accessed | Confidence | Class |
|---|---|---|---|---|---|---|---|
| U1 | Current Unity manual header is "Unity 6.6 (6000.6)". Unity 6.3 is the LTS line (6.3 LTS docs exist). | https://docs.unity3d.com/Manual/webgl-browsercompatibility.html | Unity | undated (live docs, 6.6) | 2026-10-08 | high | fact |
| U2 | Unity 6.6 released ~early Sept 2026 ("Unity 6.6 is now available" forum post); an unofficial news rewrite gives 2026-09-01 and says 6.6 gets LTS-like stability commitment until 6.7. | https://discussions.unity.com/t/unity-6-6-is-now-available/1735357 ; https://app.cinevva.com/news/2026-09-01-unity-6-6-webgpu-production | Unity forums; Cinevva (secondary) | ~2026-09 | 2026-10-08 | medium (date), low (LTS-like claim) | fact / secondary |
| U3 | Officially supported mobile browsers for Unity Web: iOS Safari 15+ and Android Chrome 58+. The page states "The Unity Web platform supports some mobile browsers" and gives no mobile hardware/memory guidance; advises latest browser versions. | https://docs.unity3d.com/Manual/webgl-browsercompatibility.html | Unity | live docs (6.6) | 2026-10-08 | high | fact |
| U4 | Safari does not support IndexedDB for Unity content running inside an iFrame (affects PlayerPrefs/persistent saves when embedded, e.g. on portals). | same as U3 | Unity | live docs | 2026-10-08 | high | fact |
| U5 | At Unite 2023 Unity said mobile browser support comes in Unity 6, and that high-end devices from the last 2-3 years were most likely to work well; promised clearer minimum-hardware guidance later (not found this run). | https://gamemakers.jp/article/2023_12_04_56453/ (via search summary) | Gamemakers.jp | 2023-12-04 | 2026-10-08 | medium | fact (historical) |
| U6 | Unity 6.6 moved WebGPU out of experimental to a supported Web graphics API; WebGL 2 remains the default; WebGPU opt-in via disabling Auto Graphics API; automatic silent fallback to WebGL 2 (check SystemInfo.graphicsDeviceType); adds device filter lists; WebGPU needs secure context. Also adds Progressive Asset Loading and Wasm64. | https://discussions.unity.com/t/webgpu-out-of-experimental-in-unity-6-6/1734694 ; https://docs.unity3d.com/6000.6/Documentation/Manual/WebGPU-features.html | Unity | ~2026-09 | 2026-10-08 | medium (search summary of official pages, not fetched in full) | fact |
| U7 | Wasm32 Unity web builds still do not support C# threads (C/C++ native threads only). | https://discussions.unity.com/t/webgpu-out-of-experimental-in-unity-6-6/1734694 (forum reply, via search summary) | Unity forums | ~2026-09 | 2026-10-08 | low-medium | fact (staff/forum reply, unverified who) |
| U8 | Runtime Fee cancelled for games built with any Unity version incl. Unity 6 (Sept 2024). Unity Personal free up to $200k revenue+funding; splash screen optional for Unity 6 Personal; Pro $2,200/seat/yr from 2025-01-01 required above $200k. Unity said it would consider price increases annually. No 2026 pricing change found. | https://unity.com/blog/unity-is-canceling-the-runtime-fee (KR mirror seen) ; https://www.pocketgamer.biz/unity-cancels-infamous-runtime-fee/ | Unity; PocketGamer.biz | 2024-09-12 | 2026-10-08 | medium-high (2024 facts); 2026 status unverified | fact |
| U9 | Unity web build size, empty/minimal: forum report ~3.3 MiB for a Unity 6 URP minimum without stripping; FRVR: runtime ~12 MB unstripped, ~5 MB default stripping, recommends <=8 MB initial download; CrazyGames: empty project Brotli 14.7 MB -> 12.5 MB with "Disk Size with LTO" (version unstated). Numbers conflict widely — measure. | https://discussions.unity.com/t/about-the-problem-of-assembly-weight-for-webgl-and-about-the-garbage-in-the-assembly-editor-log/1570976 ; https://docs.frvr.com/engines/unity/optimization/ ; https://docs.crazygames.com/resources/optimization-tips/ | Unity forum user; FRVR; CrazyGames | 2024-2025 (approx) | 2026-10-08 | low-medium | measurement |
| U10 | Load-time / iOS risk: Utsubo (Three.js agency, competitor bias) estimates Unity web exports take 8-30 s to interactive; Playgama FAQ (updated Sept 2026) says mobile load time and memory matter more than GPU, oversized builds can stall/crash on iOS Safari. | https://www.utsubo.com/blog/threejs-vs-unity-web-comparison ; https://playgama.com/blog/?p=14508 | Utsubo; Playgama | 2026-02; 2026-09 | 2026-10-08 | low | opinion/vendor |

## Godot 4.x

| # | Claim | Source URL | Publisher | Pub date | Accessed | Confidence | Class |
|---|---|---|---|---|---|---|---|
| G1 | Latest 4.x stable: Godot 4.7.2 maintenance release (2026-08-18). 4.8 in dev (dev 7 on 2026-09-29). Steady cadence of releases/posts (ecosystem health signal). | https://godotengine.org/blog/ | Godot Foundation | 2026-08-18 / 2026-09-29 | 2026-10-08 | high | fact |
| G2 | "Projects written in C# using Godot 4 currently cannot be exported to the web." (stable = 4.7 docs; 4.6 docs same). Recommends Godot 3 for C# web. | https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html | Godot docs | live (4.7) | 2026-10-08 | high | fact |
| G3 | C# web prototype (GodotCon Boston, May 2025) was a WIP draft PR, no committed timeline; prototype .pck 72 MiB, 23.8 MiB Brotli. | https://godotengine.org/article/live-from-godotcon-boston-web-dotnet-prototype/ | Godot Foundation | 2025-05 | 2026-10-08 | medium (via search summary) | fact |
| G4 | Web export uses Compatibility renderer, WebGL 2.0 only; Forward+/Mobile renderers unsupported; WebGPU not supported yet. | same as G2 | Godot docs | live (4.7) | 2026-10-08 | high | fact |
| G5 | Single-threaded web export (added 4.3) is the default and needs no COOP/COEP headers; thread support is optional and requires cross-origin isolation headers (COOP same-origin, COEP require-corp) + secure context, or the PWA service-worker workaround; without them a threaded build "will not run". | same as G2 | Godot docs | live (4.7) | 2026-10-08 | high | fact |
| G6 | Docs: native Android/iOS exports "will always perform better by a significant margin" than web; on mobile "CPU and GPU performance is at a premium" plus Wasm overhead; "Safari has several issues with WebGL 2.0 support" — recommends Chromium/Firefox. No specific iOS Safari support statement. | same as G2 | Godot docs | live (4.7) | 2026-10-08 | high | fact |
| G7 | Old complaint FIXED: 4.0-4.2 docs said Godot 4 HTML5 exports could not run on macOS/iOS (SharedArrayBuffer/WebGL2 bugs); that warning is absent from current 4.7 docs after single-threaded export landed in 4.3. A 2026 dev.to post says it "currently works" on iOS Safari but bug reports are more frequent than desktop. | https://docs.godotengine.org/en/4.2/... (via search); https://dev.to/ziva/godot-4-fur-web-spiele-export-wasm-und-browser-performance-4315 | Godot docs (old); dev.to (ziva) | 2023; 2026 | 2026-10-08 | medium (fix inferred from doc diff); low (iOS anecdote) | inference / opinion |
| G8 | Persistence: user:// on web is IndexedDB-backed; users must allow cookies/IndexedDB; iframe embeds need third-party cookies; private browsing prevents persistence; OS.is_userfs_persistent() can false-positive. | same as G2 | Godot docs | live (4.7) | 2026-10-08 | high | fact |
| G9 | Size: docs say .wasm/.pck "usually large"; .wasm gzips to ~1/4. Popcar measured default web export 42.0 MB uncompressed -> 16.0 MB with custom template (3D off, wasm-opt), later updated for 4.5 to 5.37 MB; 2020 issue: 13.4 MB wasm -> 3.1 MB Brotli. dev.to claim of "35 MB compressed" for empty 4.4 conflicts and is likely uncompressed. Practical: expect ~8-10 MB gzipped default, ~2-5 MB with custom template (inference). | https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html ; https://popcar.bearblog.dev/how-to-minify-godots-build-size/ ; https://github.com/godotengine/godot/issues/20996 | Godot docs; Popcar blog; GitHub | live; 2025; 2020 | 2026-10-08 | medium (official ratio); low-medium (numbers) | measurement / inference |
| G10 | Godot license: MIT, free (not verified this run — training belief). | — | — | — | — | unverified belief | — |

## Cross-cutting notes for scoring
- TypeScript fit: neither engine offers first-class TS (Unity = C#; Godot = GDScript, C# not web-exportable). Not evidenced this run beyond G2; treat as unverified belief that TS fit is poor for both.
- Effects: Unity 2D URP has built-in 2D lights/bloom/particles; Godot Compatibility renderer on web supports glow but with reduced features vs Forward+ (unverified this run — check Godot "Compatibility renderer glow" docs).
- Mobile web 60fps on mid-range phones: no official benchmarks found for either engine.

## Leads
- Unity 6.6 "What's new" + WebGPU manual: https://docs.unity3d.com/6000.6/Documentation/Manual/WhatsNewUnity66.html (fetch for mobile WebGPU caveats).
- Unity Web mobile hardware guidance / "Web platform on mobile" manual page (not located).
- Godot 4.7 release notes (wasm64 web export claim from gtstu.com unverified); Godot Compatibility renderer feature table for 2D glow (WorldEnvironment glow in Compatibility since 4.3?).
- Godot web export optimizer asset (store.godotengine.org) for size breakdowns.
- Test plan: build empty 2D project in both engines, Brotli, measure first-load on mid-range Android + iPhone over throttled 4G.

## Looked for but not found
- Official Unity minimum mobile hardware guidance for Unity Web on mobile (promised 2023).
- Any 2026 Unity pricing change (only 2024/2025 data found).
- Official Godot statement on iOS Safari support level for 4.3+ web exports.
- Authoritative, current (2026) empty-2D-project compressed web build sizes for either engine.
- Independent mobile-browser FPS benchmarks for 2D glow/particles in either engine.
- Godot C# web export shipping date (still unsupported in 4.7 docs; no timeline).
