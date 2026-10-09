---
reviewer: rubric-walker
target: ../architecture-numception.md
memlog: ../.memlog.md
driving-spec: ../../prd-numception/prd-numception.md (+ addendum.md)
context: greenfield, initiative altitude, purpose build-substrate, goal = low-risk POC that grows into iOS/Android/web without rewrite
date: 2026-10-09
---

# Rubric Review: Architecture Spine, Numception

## Verdict

**REVISE BEFORE SLICING EPICS (conditional pass).** The spine is strong where it matters most. The functional core / imperative shell split, determinism, exact rationals, versioning, the response log plus selection propensities, the renderer port and the persistence port all close real divergence points, and the Rules are mostly concrete and checkable. Work on `core` can start now.

Five high findings need fixing before feature or epic agents work in parallel:

- Two are growth-path defects in puzzle identity: tree addressing for the endless Pyramid, and keeping old generator versions.
- One is a timing contract that every play feature touches.
- Two are silent operational dimensions: release and versioning of app builds, and offline play and durable storage on the web.

There are no critical findings. Over-engineering is mild and mostly justified.

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 5 |
| Medium | 11 |
| Low | 8 |

## Checklist summary

| Criterion | Result |
| --- | --- |
| Fixes the real divergence points for the level below | Mostly. It misses: solve-time origin and the input lock during transitions (H5), layout geometry ownership (M8), persistence cadence vs `Tick` (M5), PRNG sub-streams and seed source (M6), round-generation placement (M7), and bucket-rating scope (M4). |
| Every AD Rule is enforceable and prevents its divergence | Mostly. AD-1 and AD-3 name no lint tool or rule (M10). AD-11's gate covers only `SwitchProfile` (M3). AD-10's "after each command batch" is ambiguous (M5). |
| Nothing under Deferred lets units diverge | Fails on one item. "Upward generation… the AD-4 signature already supports it" is not true as written (H1). The rest of the deferrals are safely isolated behind ports or data. |
| Named tech is verified-current | Pass. Versions match `research-stack-versions.md` (2026-10-09), and the TS 6 / Preact 10 / pnpm 11 choices are justified. Lint tooling is missing from the stack (M10). |
| Covers the driving PRD's capabilities | Mostly. FR-55 notifications and the FR-33 share deep link have no home (M11). FR-38 delete-all and the FR-35 gated entries are under-specified (M3). Arch-owned OQ-15 and OQ-22 are not acknowledged (L7). |
| Every owned dimension decided, deferred or open | Fails on the operational envelope. Release/versioning (H3), web offline (H4), crash reporting (M1) and dependency policy (M2) are silent. Telemetry identity (M9) is also silent. Hosting and CI are covered as assumptions, and PIN security is partly covered (M3). |
| Over-engineered for a low-risk POC | Mildly, in rating pluggability and v1 port stubs (L3). The package split and the log fields earn their cost. |

## Findings

### High

**H1. Puzzle addressing is anchored at the top, so it breaks for the endless Pyramid. The deferral claim is wrong.**
*Location:* AD-4; Deferred, "Upward generation for the endless Pyramid".
AD-4 makes `treePath` "child indexes from the top puzzle" and plans rounds top-down. The v1 Pyramid grows upward (PRD FR-12, OQ-4), so each new top re-roots the tree and changes every existing puzzle's path. Logged `ResponseRecord`s and saved trees would stop resolving. Generating upward is also bottom-up, the opposite of "top puzzle first". The Deferred line says "the AD-4 signature already supports it", but that is not true as written. A Pyramid epic would either migrate the addressing or invent a second scheme. Both outcomes are what AD-4 exists to prevent.
*Fix:* Make addresses stable under upward growth. Two options:
- An address relative to the round or structure root, plus a tier. For example, `{structureId, tier, indexWithinTier}`, or a path anchored at tier 1 / the leftmost leaf.
- A rule that a Pyramid's root seed and its addresses are anchored at the bottom, and that a new top gets a new address without changing the children's.

Also state that Classic and Tower use the same scheme. Then either reword the Deferred line to say exactly which property is guaranteed, or move OQ-4 into an Open Questions section with the constraint that addresses never change once issued.

**H2. No rule for keeping old generator versions. Cross-version Daily Seed and regeneration are undefined.**
*Location:* AD-6; AD-4; Deployment, v1 Daily Seed bullet.
Several things only work if old `generatorVersion`s stay runnable:
- FR-6: "regenerating any logged puzzle… reproduces it exactly".
- Golden fixtures pinned per `generatorVersion`.
- Saved Pyramid trees regenerated across app updates.
- "a `generatorVersion` fixed per day" for the Daily Seed.

The spine never says whether `core` keeps every past generator, or only the current one with a bump. Two agents will decide differently. The Daily Seed rule also can't work across app versions as written: an old client can't run a newer generator, and nothing says which version the day uses. Finally, the `hash` in `hash(UTC date ‖ dailySeedSalt)` is not named. `crypto.subtle` is async and lives in the shell, so it can't be used inside a pure, sync `core`.
*Fix:* Add a rule to AD-6:
- `core` keeps a registry `generators[generatorVersion]`.
- Retired versions stay runnable and keep their golden fixtures for as long as any supported save, log or seed can reference them. State the policy explicitly, for example "never deleted before v2".
- Competitive seeds carry their `generatorVersion`. A client that lacks it says the seed is unavailable and does not fall back to a different version.

Also pin the seed hash as a named pure integer hash inside `core`, such as a specified 32-bit FNV-1a or a pure-rand seed derivation, and version it.

**H3. Release and versioning of app builds is silent.**
*Location:* the whole spine. AD-6 and AD-18 come closest; Deployment and environments.
The seven version integers don't include the app or build itself. Records carry no `appVersion`/build, `platform` (web/iOS/Android), flavour or renderer. This leaves several gaps:
- Playtest telemetry from different builds, or from web vs native, can't be separated, even though response times are platform-sensitive (NFR-5).
- There is no rule for downgrades or rollbacks. A static-host rollback or an older native build meeting a snapshot with a newer `saveFormatVersion` is exactly where forward-only migrations corrupt data.
- There is no app version or build-number scheme across stores and web.
- Nothing says whether playtest and prod native builds use different bundle IDs, so their saves could collide.
- There is no explicit ban on over-the-air JS or code updates, such as Capgo or Appflow live updates (NFR-6, App Store 2.5.2). AD-7 only says that config is data.

*Fix:* Add an AD for release and versioning:
- One semver `appVersion` from the root, stamped at build time, with the build number derived from CI.
- `appVersion`, `platform`, `flavour` and `rendererId` recorded on every `EventLog` session-start event, or in an envelope.
- Snapshot loads with a newer `saveFormatVersion` open read-only, or fall back without overwriting, never down-migrate. Keep the last-good snapshot.
- Distinct app IDs per flavour (`…playtest`).
- No live-update or OTA code plugins, ever; only data configs.
- A web deploy is immutable, content-hashed assets plus a versioned `index.html`.

**H4. Offline play and durable storage on the web are undecided, and the POC playtest is the web build.**
*Location:* AD-10; AD-16; Deployment (static host).
The PRD makes offline play a POC requirement on every platform (NFR-2: "Every POC and v1 play feature works offline"), and the POC is a web build (PRD §11). The spine has no service-worker or PWA caching decision, so a reload while offline fails. It also covers storage eviction only for WKWebView, not for browser Safari, where script-writable storage is evicted after 7 days without interaction unless the site is installed. It also doesn't mention `navigator.storage.persist()`. Without a decision, one agent ships a service worker with its own caching strategy and another ships none. A stale service worker cache combined with a new save format then hits H3.
*Fix:* Decide one of the following:
- **(a)** POC web is online-load with offline play after load. State this as an accepted deviation and list it as an open question.
- **(b)** Use a precache service worker, for example `vite-plugin-pwa`, pinned and verified, with an update-on-next-launch policy.

Also add `navigator.storage.persist()` to the web `StoragePort` adapter and record that the web build's save durability is best-effort. Name the PWA tooling in the Stack table if you choose (b).

**H5. No contract for solve-time origin or the input lock during transitions.**
*Location:* AD-14; AD-17; AD-2. Touches FR-8, FR-9, FR-15, FR-44, OQ-9.
Solve time `t` drives Normal scoring and `responseMs` drives telemetry (and OQ-22 later). Nothing says when the clock for a puzzle starts: when the state activates it, or when `render` finishes the zoom-in. Zoom and collapse durations vary by Motion setting ("Calm… slower zooms"; the first collapse lasts at most 3 s). If the clock starts at state activation, Calm players and kids are systematically scored and logged as slower. The OQ-9 default is "input during a transition is dropped", but no rule says whether `render` drops taps, `app` drops them, or `core` ignores them. Each play-feature agent will choose differently.
*Fix:* Add a rule to AD-14 or AD-17:
- `render` dispatches `PuzzleShown { puzzleRef }` and `TransitionEnded { id }` commands. Timing is the shell's `Tick`.
- `core` holds an `inputLocked` / `activeTransition` state. Solve time and chain-window time accrue only from `PuzzleShown` while unlocked.
- `TapCell` received while locked is a no-op in `core`, and is logged as `InputDropped` if wanted. That makes OQ-9 a one-line change in `core`.

Because `render` holds no truth, a lost `TransitionEnded` (for example after an app kill) must resolve to the end state on resume. FR-10 already requires this.

### Medium

**M1. Crash reporting is silent.**
*Location:* operational envelope; AD-12 and Conventions/Errors.
NFR-3 sets a crash-free target of at least 99.5% at v1, but nothing would measure it. Native crashes, WebContent process kills and WebGL context-loss loops don't reach `EventLog`. The PRD allows processor-contracted crash reporting, subject to OQ-3.
*Fix:* For the POC, route `window.onerror` and `unhandledrejection` to `EventLog` as `AppError`, and log a `SessionStart` with no matching clean `SessionEnd` as a crash proxy. For v1, defer to a `CrashReportPort` with these constraints: a processor contract, no profile ID or free text, and Kid-profile handling per OQ-3. List the candidate (for example Sentry Capacitor) as an assumption.

**M2. There is no dependency or update policy beyond pinning pure-rand.**
*Location:* Stack; Deferred ("Upgrading to TypeScript 7 or Preact 11").
Several policies are missing:
- Lockfile discipline (`--frozen-lockfile` in CI).
- Range policy (the table uses `x.y.x` without stating a rule).
- Update cadence and tooling (Renovate or Dependabot).
- How Capacitor majors and store SDK requirements are tracked (Google Play's annual target-API deadline, Xcode minimums).
- The addendum's "re-check versions by 2026-11-01".

pixi.js ships minors every 2 weeks.
*Fix:* Add a short convention:
- Use exact or `~minor` pins for runtime deps, and an exact pin for anything that shapes output (pure-rand, and later the renderer).
- Batch updates monthly through a bot.
- Re-verify the stack at each milestone gate.
- Plan a Capacitor major upgrade once a year, aligned to store SDK deadlines.
- Any dependency that can change generator output requires a `generatorVersion` bump (already in AD-6).

**M3. Parent-gate and PIN security are under-specified.**
*Location:* AD-11; AD-10 (`DeviceSettings`); FR-35, FR-38.
"Salted hash of the PIN" doesn't name:
- the KDF (for example PBKDF2-SHA-256 through WebCrypto with a stated iteration count);
- the PIN length;
- attempt throttling or backoff;
- where the salt lives;
- the reset path (FR-35 assumes device authentication, but no plugin is in the stack).

The Rule only gates `SwitchProfile`, but FR-35 also gates For grown-ups, purchases, external links and review prompts. Without a single gate service, each feature builds its own check. FR-38 delete-all has to wipe the filesystem, Preferences and IndexedDB, but `StoragePort` defines no `deleteAll`.
*Fix:* Add an `app` gate service: `requireGate(reason) → Promise<boolean>`. Every gated entry must use it, and a boundary lint can flag gated commands dispatched outside it. Specify the KDF and parameters, a backoff after N failures, and the PIN length (from UX). Add `StoragePort.wipeAll()` that clears every store and returns to first run. Defer device-authentication reset as v1, with a named port.

**M4. AD-11 contradicts AD-8 and the ER diagram on bucket-rating scope.**
*Location:* AD-11 ("every persisted record except `DeviceSettings` is keyed by `profileId`"); AD-8; the Persisted data ER diagram (`BUCKET_RATING` hangs off `PUZZLE`, not `PROFILE`).
Bucket difficulty describes the content, not the player. It is plausibly device-wide or fleet-wide (and v1 offline-batch replacement implies a global source). AD-11 forces it to be per profile. Two agents will store it differently.
*Fix:* State the scope explicitly, for example "bucket ratings are device-scoped, updated from all profiles' responses, and replaceable by a shipped batch". Add the exception to AD-11 and correct the ER diagram. Because ratings are rebuilt from the log, either choice is cheap, but only one choice should exist.

**M5. Persistence cadence vs `Tick` is ambiguous, and the replay test needs a command log nobody persists.**
*Location:* AD-10 ("after each command batch"); AD-17; AD-19 ("`step` folded over a command log").
`Tick` changes `GameState` (the chain window and timers) every frame. Read literally, AD-10 means an atomic snapshot write about 60 times a second over the Capacitor bridge. The replay test assumes a command log, but only events are persisted.
*Fix:* State the rules:
- Snapshots are written after any non-`Tick` command that changed state, and on `Pause`.
- Timer state is persisted with whatever value it had at the last write.
- Writes are coalesced so that at most one is in flight.

Also say whether a command log is persisted (dev and playtest only, or test fixtures only).

**M6. PRNG sub-streams and the seed source are unspecified.**
*Location:* AD-3; AD-4; Conventions/IDs.
Nothing says where a round seed comes from (the shell's CSPRNG, passed on a `StartRound` command?). Nothing says whether values, distractors and cell layout share one PRNG stream. If they share a stream, a layout change (OQ-7 competitive layout, shape tweaks under OQ-11) shifts the numbers too, and breaks golden fixtures and Daily Seed parity for no content reason.
*Fix:* Require derived independent streams per purpose: `deriveSeed(seed, treePath, "values" | "distractors" | "layout")`, using a pinned pure hash. State that root seeds are created in the shell and passed in on commands.

**M7. The spine doesn't say where round generation runs, given the 50 ms budget.**
*Location:* AD-2; AD-4; NFR-1.
A whole-round plan can take up to 50 ms, which is 3 frames, at round start. That's when a theme transition is playing, and "no visible freeze" applies. If `core.step` generates the round synchronously on round start, the transition stutters. Agents will choose differently between generating inside `step`, pre-generating in `app`, or using a worker.
*Fix:* Rule: `app` pre-plans the next round during the current one, for example in idle time or a worker, by calling pure `core.planRound(...)`. `StartRound { plan }` carries the plan into `step`, and `step` never generates a whole round itself. Determinism is unaffected.

**M8. Ownership of layout geometry is missing.**
*Location:* AD-13; AD-14; PRD addendum A4; FR-8.
Cell polygons per `n` (A4 shapes), shared-edge "does nothing" taps, keyboard arrow-key movement between cells and the order of the accessible tree all depend on the same geometry. `render.hitTest` and `ui` keyboard navigation would each derive it on their own.
*Fix:* Put shape layout (cell polygons in normalised coordinates, adjacency and focus order per `n` and shape variant) in `core` as pure view-model data with its own `layoutVersion`, or include it in `generatorVersion` for competitive layouts. `render` scales it, and `ui` uses its adjacency for arrow keys.

**M9. The telemetry identity for v1 upload isn't decided.**
*Location:* AD-12; Deferred ("Telemetry backend").
Upload needs some identifier for retention metrics (SM-5). Without a rule, the uploader will send `profileId` (a ULID), a persistent identifier for a child. That is exactly the OQ-3 exposure, and the mitigations ("aggregate-only telemetry for Kid profiles") would then require a schema change.
*Fix:* Decide now: uploaded events carry a separate, resettable `telemetryInstallId` (and an optional per-profile pseudonym), never `profileId`, and the envelope can be dropped per `profileKind`. The upload envelope is applied by the `TelemetryTransport`, not stored inside `core` events.

**M10. Boundary and determinism rules name no enforcement tooling, and lint is missing from the Stack.**
*Location:* AD-1 ("lint boundary rules enforce this in CI"); AD-3; the Stack table.
No linter, boundary plugin or formatter is listed. The memlog chose TS 6 because of typescript-eslint, but typescript-eslint isn't in the table. AD-3's bans (`Math.random`, `Date.now`, `performance.now`, `Intl`) have no mechanical check.
*Fix:* Add ESLint with typescript-eslint, plus eslint-plugin-boundaries or dependency-cruiser, verified for TS 6 and Vite 8, to the Stack. In AD-3, require `no-restricted-globals` / `no-restricted-properties` for those APIs scoped to `packages/core`. Also have each package's `dependencies` list only what AD-1 allows (`core`: pure-rand and valibot only).

**M11. Notifications (FR-55) and share deep links (FR-33) have no home.**
*Location:* Capability map; AD-16.
FR-55 (local streak reminders for Grown-ups, never a push token in Kid) has no port and is missing from the map. Remote push would also contradict "the only backend is telemetry". The FR-33 Grown-up card's "link that opens the same Daily Seed" is a cross-platform URL contract (universal links, app links and the web route) between the share producer and the link handler.
*Fix:* Add a `NotificationsPort` (local-only for v1, Grown-up-gated in `app`). Defer the deep-link URL format to the v1 Daily Seed epic, with a constraint that the link carries only `{date, generatorVersion}`, with no identity (FR-5).

### Low

**L1. The `ResponseLog` / `EventLog` overlap is ambiguous** (AD-10 vs AD-12). `ResponseRecord` is "one member" of the `TelemetryEvent` union, but it is also stored in its own `ResponseLog`. *Fix:* Say whether it is written once to `ResponseLog` and referenced from `EventLog`, or exported as a union over both.

**L2. Where settings live is ambiguous** (AD-2, AD-10, AD-11). `SetSetting` and `SwitchProfile` are listed as commands on a per-profile `GameState`. However, `SwitchProfile` acts across profiles, and some settings sit in `DeviceSettings`. Motion and chain-window defaults are per `profileKind`. *Fix:* Add a table of which settings are per profile and which are per device. Also say that device-level commands go through an `app`-level reducer in `core` (still pure), not straight to storage.

**L3. Mild over-engineering for a POC** (AD-8, AD-16). Some of this pays off and some doesn't yet:
- Worth keeping now: logging the full response record, the selection propensities, and the `chainId` / `algoVersion` keys. That data can't be reconstructed later.
- Machinery to defer: swapping the K function, bucket update rule and selector through `TuningConfig`, plus bucket provenance and bulk replacement. None of it protects data.
- `PurchasePort`, `GameServicesPort` and `TelemetryTransport` appear in AD-16 as if they exist now.

*Fix:* Reword AD-8 so the POC uses one implementation per component with versioned IDs, and pluggability arrives when a second implementation exists. In AD-16, say that v1 ports are defined when their epic starts, with no stubs in the POC. Six packages are acceptable, because they are the enforcement mechanism for AD-1.

**L4. No budget checks in CI** (AD-18, NFR-1). There is no CI check on the 5 MB gzipped web budget, and no check that the `prod` bundle excludes the dev panel. *Fix:* Add a size-limit check and a grep for a dev-panel marker in the `prod` build.

**L5. Float math may differ between engines on replay** (AD-3, AD-8). `Math.exp` in the Elo P function may differ in the last unit of precision between JavaScriptCore and V8. *Fix:* State that rating replay is compared within a tolerance, and that only quantised outputs must match exactly across platforms.

**L6. Log growth and export are unaddressed** (AD-10, AD-12). Append-only segments grow without bound, and nothing says how playtesters on native builds export logs. *Fix:* Add a segment size, roll and retention note. POC export goes through the dev panel and `SharePort`.

**L7. The spine has no Open Questions section.** Arch-owned PRD OQ-15 (hidden-timer Zen scoring) and OQ-22 (speed-informed ratings) are not mentioned. The log already stores `responseMs`, so they're supported, but they should be recorded as open. *Fix:* Add an Open Questions section listing OQ-4, OQ-15, OQ-18 and OQ-22 and what each would change.

**L8. Smaller gaps in tests and web privacy:**
- `@playwright/test` is in the Stack, but no AD or CI step uses it.
- The PRD §9.1 web rule (self-hosted fonts and assets, no third-party CDN at runtime) is not a convention.

*Fix:* Add a smoke end-to-end test (launch → solve → reload → resume) to AD-19, and add a "no runtime third-party origins" convention, which can be checked with a CSP in the web build.

## What is strong (keep as is)

- AD-2 / AD-3 / AD-17: commands carry time, `core` is pure, and the shell is the only clock. This is the right backbone for parity, replay and the Daily Seed.
- AD-5: exact rationals from day one remove the FR-48 migration.
- AD-8 / AD-9: logging propensities and pre-update ratings is the cheapest possible insurance on OQ-5, and it is properly justified.
- AD-10: native file storage instead of WKWebView storage, with atomic snapshots, is backed by the research.
- AD-14: the renderer port makes deferring the Phaser-vs-PixiJS choice safe.
- The Stack is verified the same day against the registry, with reasoned conservative picks (TS 6, Preact 10, exact pure-rand).
