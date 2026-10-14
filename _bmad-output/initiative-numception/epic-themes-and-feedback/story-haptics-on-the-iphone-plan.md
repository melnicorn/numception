---
title: 'Haptics on the iPhone'
type: 'feature'
ticket: '3'
created: '2026-10-14'
status: 'in-review'
baseline_revision: 'fe98f4e236551303be76f652f2bff4d76ff83774'
route: 'full'
route_source: 'auto'
risk: 'low'
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/epic-themes-and-feedback.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/story-sound-through-a-feedback-director-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Solves give no touch feedback on the iPhone. FR-41 / CAP-17 asks for a light haptic tap on each solve in the Capacitor app.

**Approach:**
- Add `@capacitor/haptics` (8.0.x, matching Capacitor 8.5) behind the AD-16 `HapticsPort` in `packages/platform-native`.
- Wire it in the client only when running natively (`Capacitor.isNativePlatform()`). Use `noHaptics` otherwise; the iOS PWA has no haptics API.
- The FeedbackDirector calls `haptics.impact('light')` on each `PuzzleSolved`. Nothing fires on soft miss, wrong tap or transitions.
- Gate it with a new `haptics` flag (default on) alongside effects and music, with a dev-panel toggle. Entry 4 moves it into profile settings.

## Boundaries & Constraints

**Always:**
- platform-native imports app only (AD-1 lint).
- The adapter never throws: plugin errors are caught and ignored.
- The adapter is lazy-loaded or dynamic-imported, so the web/PWA bundle doesn't grow beyond what's needed. Stay under `pnpm check:budget`.
- Add the flag to `FeedbackFlags`. Old stored flags without `haptics` default to on.
- Run `cap sync` so iOS SPM picks up the plugin (Package.swift / CapApp-SPM updated by sync). The iOS build must succeed. The orchestrator builds; the agent may run `pnpm --filter @numception/client run cap:sync` and must leave the dev flavour synced.
- **Tests:**
  - director: solve → impact light, once per PuzzleSolved; none for the other events; the flag off means none.
  - adapter: unit test with a fake Haptics plugin.
  - Extend the e2e recording stub, if cheap, to record haptic calls; on the web the port is a no-op, so the stub just records director calls.
- Existing tests stay green.

**Never:**
- Haptics on transitions or misses, or Android-specific work.

</intent-contract>

## Code Map

- `packages/app/src/{haptics-port.ts,feedback-director.ts,feedback-flags.ts}`
- `packages/platform-native/src/*`
- `packages/platform-web/src/web-feedback-flags.ts`
- `packages/ui/src/dev-panel/sound-block.tsx`
- `apps/client/src/{main.ts,recording-audio.ts,test-hook.ts}`
- `apps/client/package.json`, `apps/client/ios/App/CapApp-SPM/Package.swift`

## Tasks & Acceptance

**Execution:**
- [x] Add the haptics flag and director mapping (+ tests).
- [x] Native adapter with `@capacitor/haptics` (+ test); client wiring; cap sync.
- [x] Dev-panel toggle.

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass.
- Given the iPhone Capacitor app, when a puzzle is solved, then a light tap is felt, and the dev toggle turns it off (user-confirmed).

## Implementation Notes

- **Flag:** `FeedbackFlags` gains `haptics` (default on); `parseFeedbackFlags` defaults a missing or malformed `haptics` to on, so flags stored before this entry read as haptics on. `webFeedbackFlags` writes all three. The audio port still hears only `{ effects, music }`.
- **Director:** `hapticsFor(events)` (exported from app) gives one `'light'` per `PuzzleSolved`, nothing for any other event, and nothing in a batch that pauses for the lifecycle (as `cuesFor`). Gated by `flags.haptics` alone, independent of `effects`.
- **Adapter (platform-native):** `nativeHaptics(plugin)` in `native-haptics.ts` maps kinds to Capacitor `ImpactStyle` values (`soft` plays `LIGHT`: Capacitor has no soft style) and swallows thrown and rejected plugin errors; it imports the plugin's types only, so its unit test uses a fake. `capacitorHaptics()` in `capacitor-haptics.ts` binds the registered `Haptics` plugin. `@capacitor/haptics ~8.0.2` (with `@capacitor/core ~8.5.3` as its peer) is a dependency of platform-native and of apps/client (Capacitor's sync discovers plugins from the app's dependencies). No build script, so `allowBuilds` is unchanged.
- **Client:** inside a native shell (`isNativeShell()`, the bridge's `Capacitor.isNativePlatform()` read through the global, so the web entry doesn't bundle @capacitor/core) the client dynamic-imports `@numception/platform-native` and swaps the adapter in behind a forwarding port; until then, and on the web, it is `noHaptics`. The plugin lands in lazy chunks (about 3.8 kB gzipped) that the web never loads.
- **Recording:** dev and playtest wrap the haptics port in `recordingHaptics` (`recording-audio.ts`); the test hook exposes `haptics()`. The e2e spec checks a light tap per solve, none on a wrong tap or round change, and that the dev-panel "Haptics" toggle stops them (persisting) without silencing sound.
- **Native projects:** `cap sync` added the plugin to `CapApp-SPM/Package.swift` (a path into `node_modules/.pnpm`, as Capacitor generates for pnpm) and, as a generated side effect, to the Android gradle files; no Android-specific work. A simulator Debug build of the dev flavour succeeded locally.

## Plan Change Log

## Review Triage Log

## Auto Run Result

Built and verified 2026-10-14. The full chain passes: 33 e2e tests pass and 1 is skipped. Waiting on the iPhone check, which is the user feeling the tap.
