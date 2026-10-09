---
title: Reconcile — PRD vs Architecture Spine
spine: ../architecture-numception.md (+ .memlog.md)
input: ../../prd-numception/prd-numception.md, ../../prd-numception/addendum.md
date: 2026-10-09
---

# Reconcile: PRD → Architecture Spine

Scope: PRD requirements, NFRs and quiet constraints with architectural consequence that the spine does not land (no home, no guaranteeing AD/convention), or that a spine decision contradicts. Pure UX/visual detail ignored. The spine was not edited.

Severity: **High** = blocks POC or causes a v1 rework/compliance failure; **Med** = needs an AD/convention line before the relevant epic; **Low** = clarify in passing.

## Summary

| # | Gap | Severity | Phase |
|---|---|---|---|
| 1 | Round generation ≤50 ms and "no loading states" have no guaranteeing rule | High | POC |
| 2 | iOS mute-switch technique in AD-16 inverts the PRD requirement | High | POC/v1 |
| 3 | Web offline and web storage durability not landed (POC is web) | High | POC |
| 4 | Parent gate covers only `SwitchProfile`; other gated surfaces have no guard | High | POC/v1 |
| 5 | Daily Seed / replay need old generator versions runnable; spine only pins fixtures | High | v1 |
| 6 | Bucket-rating reset on version change contradicts AD-8 key and K "uncertainty bump" | Med | POC |
| 7 | Push notifications: no port, no Kid rule, and contradicts "telemetry is the only backend" | Med | v1 |
| 8 | Delete-all has no defined operation or scope | Med | POC |
| 9 | Seed/share link format, deep-link handling and Kid image-only card have no home | Med | v1 |
| 10 | Web privacy: strictly-necessary cookies, self-hosted fonts/assets, no runtime CDN | Med | POC |
| 11 | No dependency/permission guardrail (no ad SDKs, no IDFA/camera/mic/contacts prompts) | Med | POC/v1 |
| 12 | Initial web download ≤5 MB gz and launch-freeze budget not guaranteed | Med | POC |
| 13 | Snapshot written every tap grows unboundedly with the endless Pyramid | Med | v1 |
| 14 | Review prompt and purchase prompt timing rules have no home | Med | v1 |
| 15 | No-OTA-code (2.5.2) only partly landed; no ban on live-update plugins/remote JS | Med | v1 |
| 16 | FR-44 fields missing from `ResponseRecord` (cell tapped, profile type) | Low | POC |
| 17 | AD-11 "everything keyed by profileId" vs ER diagram bucket ratings unscoped | Low | POC |
| 18 | "No × / ÷ code path in POC" (FR-3) not enforced; tuning switcher could enable it | Low | POC |
| 19 | Input during transitions is dropped (FR-8/OQ-9) — no layer owns the drop | Low | POC |
| 20 | Cross-engine float determinism (`Math.exp`) vs NFR-5 parity / replay test | Low | POC |
| 21 | NFR-3 crash-free ≥99.5% unmeasurable: no crash-reporting path | Low | v1 |
| 22 | Kid telemetry mitigations (OQ-3) need a per-`profileKind` policy hook in transport | Low | v1 |
| 23 | Log retention/compaction undefined; replay-on-launch could cause launch freeze | Low | POC |

Total: **23 gaps** (5 High, 10 Med, 8 Low).

## Detail

### 1. Round generation ≤50 ms and no loading states — High
- **PRD:** NFR-1 (round gen ≤50 ms on reference devices; no loading states between tiers/rounds); FR-1 consequence 4; FR-9 "no loading screen"; §5 non-goal.
- **Spine:** absent. AD-4 mandates top-down planning with uniqueness checks (potentially rejection-sampling heavy, esp. Tower at n=9) but no AD bounds generation cost, requires pre-generation, or tests it. AD-19 has no performance test. Capability map routes NFR-1 to "all".
- **Fix:** add a rule (AD-4 or new AD): the next round is generated ahead (during the current round's top puzzle or idle frames, off the tap path) and handed to `core` as a ready plan; generator must be bounded (max attempts with deterministic fallback, still seed-reproducible). Add a CI/nightly benchmark asserting p95 full Tower round at n=9 ≤50 ms on a throttled profile, plus a reference-device check in the renderer prototype.

### 2. iOS mute switch: AD-16 technique contradicts FR-41 — High
- **PRD:** FR-41 "respects the mute switch exactly as native games do"; FR-43; addendum A1.
- **Spine:** AD-16 "native `AudioPort` handles the iOS mute switch (a looped silent audio element started on the first tap)".
- **Problem:** the silent-`<audio>` loop is the known trick for making Web Audio play *through* the mute switch (it moves output to the playback/media session). Native games use the ambient session: silenced by the switch and mixing with the user's music. The spine's technique likely inverts the requirement and also pauses other apps' audio.
- **Fix:** restate AD-16 as the outcome: "audio session = ambient (respects ringer switch, mixes with other audio)"; on native set the session category via a small native shim or plugin; keep the silent-element trick only if device testing proves it is needed for unlock, and verify on device in the prototype.

### 3. Web offline and storage durability — High
- **PRD:** NFR-2 (every play feature offline, no banner; saves survive); FR-10, FR-43; §11 POC is a web build; NFR-3.
- **Spine:** AD-10 covers native durability (Filesystem vs evictable WKWebView storage) but for web only says "IndexedDB". No service worker/app-shell caching, so a reload with no connection fails; no `navigator.storage.persist()`; Safari ITP can wipe IndexedDB after 7 days without interaction.
- **Fix:** add to AD-10/AD-16: web build ships a precaching service worker (all JS, themes, fonts, audio) with versioned cache and no runtime fetches for play; request persistent storage on first save; document the residual web eviction risk for streak/Pyramid (ties to OQ-18).

### 4. Parent gate scope — High
- **PRD:** FR-35 (gate on Kid→Grown-up, For grown-ups [POC], purchases, external links, review prompts [v1]); FR-36 (Kid social entries absent); FR-42; FR-46.
- **Spine:** AD-11 says the gate "dispatches `SwitchProfile` only after the gate passes". No rule that For grown-ups, outbound links, purchases, review prompts, leaderboard/platform sign-in go through the gate; no `LinkPort`/review port; nothing stops `GameServicesPort` auto-authenticating (Game Center shows a sign-in banner on launch) while a Kid profile is active.
- **Fix:** add a "gated capabilities" rule: every outbound link, purchase, review prompt, game-services auth and For grown-ups entry is an `app` command guarded by one `requireGate()`; in `kid` the adapter calls are never made (not merely hidden). `GameServicesPort.authenticate` only on explicit Grown-up opt-in.

### 5. Old generator versions must stay runnable — High
- **PRD:** FR-6 ("regenerating any logged puzzle … reproduces it exactly, on every platform"); FR-32 (players on different platforms same date get identical content); FR-5.
- **Spine:** AD-6 pins golden fixtures per `generatorVersion`; deployment section says Daily Seed uses "a `generatorVersion` fixed per day" but never says how. Players on different app versions (store rollout lag, web vs native) would run different generators on the same day.
- **Fix:** add to AD-6: the client bundles every generator version still in use (or a defined support window); Daily Seed version chosen by a deterministic date→version schedule shipped as data; a client lacking that version hides the Daily Seed rather than serving different content. Offline tooling keeps all versions for log replay.

### 6. Bucket-rating reset on version change — Med (contradiction)
- **PRD:** FR-21 "When the generator or difficulty-model version changes a bucket's definition, that bucket's rating resets to its prior"; addendum A2.
- **Spine:** AD-8 keys the rating store by `(entityType, entityId, operator, chainId, algoVersion)` — no `generatorVersion`/`difficultyModelVersion`, and `bucketId` is a feature string without version. Memlog/AD-8 apply an "uncertainty bump on generatorVersion change", which is not a reset.
- **Fix:** either include a bucket-definition version in `bucketId` or the key (so a changed definition is a new entity starting at its prior), and scope the K bump to player ratings only.

### 7. Push notifications — Med
- **PRD:** FR-55 (Grown-up only, opt-in, off by default; Kid never requests a push token or receives push).
- **Spine:** FR-55 is listed under AD-11/AD-16 but no `NotificationPort` exists; push token is device-level while profiles share the device; the deployment section says v1's only backend is telemetry, which cannot send remote push.
- **Fix:** decide local scheduled notifications (no token, no server) behind a `NotificationPort`; schedule only while active profile is `grown-up` with opt-in; cancel all on switch to Kid; never request permission in Kid.

### 8. Delete-all — Med
- **PRD:** FR-38 (removes every profile, rating, stat and save; returns to first-run); FR-35 (forgotten PIN reset via delete-all).
- **Spine:** FR-38 bound by AD-10 but `StoragePort` has no defined wipe, and data lives in three stores (Filesystem, Preferences `DeviceSettings`, logs; IndexedDB + SW caches on web).
- **Fix:** `StoragePort.deleteAll()` contract covering every store including `DeviceSettings`/PIN hash and pending telemetry queue; ends in first-run state (Kid default); covered by a test.

### 9. Seed links, deep links, share card — Med
- **PRD:** FR-5 (seeds carry content only: no sender, identity, free text, tracking); FR-33 (Grown-up link opens the Daily Seed; Kid card image-only; incoming links open as solo play); A3 (personal seeds replay logged adaptive difficulty).
- **Spine:** capability map says `core/seeds`, `SharePort`; no seed/link encoding (what goes in: seed, generatorVersion, difficulty curve, layout flag), no rule forbidding identifiers in it, no inbound deep-link handling (`LifecyclePort`/Capacitor `appUrlOpen`, web route, universal-link domain), no home for share-card image rendering.
- **Fix:** define a versioned `SeedLink` schema in `core` with an allowlist of fields (no ids/ULIDs); inbound links handled by `app` as a `StartSeededRound` command (solo, no reply); `SharePort.shareImage` plus off-screen card render in `render`; Kid path never constructs a URL.

### 10. Web privacy constraints — Med
- **PRD:** §9.1 Web: strictly necessary cookies only, self-hosted fonts and assets, no third-party CDN calls at runtime.
- **Spine:** absent (fonts, CSP, cookies not mentioned).
- **Fix:** convention: all fonts/assets bundled by Vite; strict CSP `connect-src` limited to the first-party telemetry/config host; no cookies set by the app.

### 11. Dependency and permission guardrails — Med
- **PRD:** FR-45 (third-party ad SDKs never included); §5 no ads; §9.1 no camera, mic, contacts or ad-tracking prompts.
- **Spine:** AD-1 lint covers import direction only.
- **Fix:** CI dependency allowlist/denylist (ad/attribution SDKs), and a check of `Info.plist`/`AndroidManifest` permissions (no ATT/IDFA, `AD_ID` removed, no camera/mic/contacts).

### 12. Download size and launch freeze — Med
- **PRD:** NFR-1 (initial web download ≤5 MB gzipped; no visible freeze on launch; 8.5 s reference freeze in A1); FR-7.
- **Spine:** prototype measures size and cold start but no budget rule or CI size check; nothing on lazy-loading non-play `ui`/dev panel or theme/audio assets.
- **Fix:** CI bundle-size budget; first frame needs only `core` + `render` + current theme; rest lazy-loaded after first interactive frame.

### 13. Snapshot growth with the Pyramid — Med
- **PRD:** FR-10 save every tap; FR-12 endless Pyramid; NFR-1 100 ms tap.
- **Spine:** AD-10 writes one whole `ProfileSnapshot` (GameState + ratings, incl. Pyramid tree) atomically after each command batch.
- **Fix:** store Pyramid as answers + `treePath`s (puzzles regenerable per AD-4) or as separate segments; writes off the frame path (async, coalesced); set a snapshot size budget.

### 14. Review and purchase prompt rules — Med
- **PRD:** FR-35 (review prompt gated, never during play/transitions, never in Kid); FR-46 (purchase never prompted during play or transitions).
- **Spine:** `PurchasePort` exists; no review port; no rule tying prompts to non-play states.
- **Fix:** fold into gap 4: prompts are only issued by `app` from non-play states (control surface open, round boundary after flash), Grown-up only, behind the gate.

### 15. No OTA code — Med
- **PRD:** NFR-6 / addendum A1 (App Store 2.5.2: no downloaded code that changes features).
- **Spine:** AD-7 says fetched config is data only. No rule banning Capacitor live-update plugins or remote script loading, nor that `TuningConfig` may not contain feature flags.
- **Fix:** convention: no live-update plugins, no remote `import()`/eval; config schema forbids feature toggles (only numeric/tuning values); CSP `script-src 'self'`.

### 16. FR-44 fields — Low
- **PRD:** FR-44 requires profile type and the cell tapped.
- **Spine:** AD-8 `ResponseRecord` lists profile but not `profileKind` or tapped cell.
- **Fix:** add `profileKind` and `tappedCell` (cell index / role a|b|c|distractor).

### 17. Bucket ratings partitioning — Low
- **Spine:** AD-11 "every persisted record except `DeviceSettings` is keyed by `profileId`" vs ER diagram where `BUCKET_RATING` hangs off `PUZZLE`, not `PROFILE`.
- **Fix:** state whether bucket ratings are per-profile or device-wide (and how offline-batch replacements apply).

### 18. POC operator exclusion — Low
- **PRD:** FR-3 "A POC build has no code path that serves × or ÷".
- **Spine:** AD-18 dev panel can switch tuning configs; nothing says enabled operators are build-gated.
- **Fix:** enabled operators allowlisted per release in the composition root; validator rejects configs enabling × / ÷ in POC.

### 19. Input during transitions — Low
- **PRD:** FR-8 / OQ-9 (dropped, no penalty).
- **Spine:** no layer owns it; if `core` accepts the `TapCell`, state changes mid-animation.
- **Fix:** `core` state carries an input-lock window (time-based, advanced by `Tick`) so the drop is deterministic and replayable.

### 20. Float determinism across engines — Low
- **PRD:** NFR-5 (ratings and scoring identical across platforms); FR-6.
- **Spine:** AD-3 allows floats in ratings/scores; `Math.exp` is not bit-identical between JSC and V8, so replay and quantised selection could diverge at band edges.
- **Fix:** quantise rating outputs (fixed decimals) before persisting/selecting, or use a deterministic exp implementation in `core`.

### 21. Crash-free metric — Low
- **PRD:** NFR-3 (crash-free sessions ≥99.5% at v1); FR-45 assumption allows processor-contracted crash services.
- **Spine:** no crash-reporting path; `AppError` events only cover handled failures.
- **Fix:** v1 deferred item: session-start/clean-exit markers in `EventLog` (first-party) or a processor-contracted crash SDK behind a port, subject to gap 11.

### 22. Kid telemetry policy hook — Low
- **PRD:** §9.1 risk / OQ-3 mitigations (aggregate-only for Kid, consent via gate).
- **Spine:** AD-12 has one transport, no per-profile policy.
- **Fix:** `TelemetryTransport` applies a per-`profileKind` policy (full / aggregate / off) read from config, so a legal outcome needs no schema change.

### 23. Log retention and replay cost — Low
- **Spine:** AD-8 makes ratings a projection of an unbounded `ResponseLog`; no retention, compaction or rule that replay never runs on the launch path (NFR-1 no launch freeze; FR-39 stats windows need 30 days + all-time aggregates).
- **Fix:** snapshot is authoritative at launch; replay only on migration, off the critical path; define segment rotation and all-time aggregates kept in the snapshot.
