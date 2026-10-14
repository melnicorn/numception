---
title: 'Dev panel round inspector'
type: 'feature'
ticket: '11'
created: '2026-10-13'
status: done
baseline_revision: 'f2e689723a15fb16f160cfc6285e7155939acada'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-seeded-puzzle-tracer-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-classic-and-tower-round-planning-plan.md'
warnings: []
deferred:
  - summary: >-
      Human check of Done-when 6 on a phone: the deployed playtest PWA in airplane mode plans a Tower n=9 round in the dev panel.
    evidence: |-
      Covered in WebKit e2e (offline reload, 91 lines, determinism, a 375x667 viewport). The phone check waits on the Pages custom domain (www.shellmelwood.com) resolving; it is already carried in epic-poc-playtest's notes for the airplane-mode check.
    location: >-
      deployed playtest PWA
    severity: low
---

<intent-contract>

## Intent

**Problem:** Epic Done-when 6 says the generator must be delivered in the playtest PWA, offline, on a phone. Today the dev panel shows one demo puzzle. Nobody can see a planned round, its tiers, contracts, versions or buckets without running tests.

**Approach:**
- **app:** an `inspectRound` function that validates a chosen bundled tuning, plans a Classic or Tower round for a chosen n, operator and seed, realises the leaves lazily, and returns a plain, view-ready round.
- **ui:** a "Round inspector" block in the dev panel with controls and a text rendering of every tier.
- **client:** passes **all** bundled tuning files, not just `1.json`, so the inspector can switch between them (epic Notes: the full tuning switcher through the store is epic-core-play-loop's).

## Boundaries & Constraints

**Always:**
- **app** (`packages/app/src/inspect-round.ts`):
  - `inspectRound(tunings: Record<string, unknown>, request: { tuningVersion, type: 'classic'|'tower', n, operator, seed, leafBand? })` returns `{ ok: true, view } | { ok: false, error: { code, message } }`. It never throws.
  - **Round seed:** `deriveSeed(seed, 0)`, documented, or the seed used directly as the round seed. Choose one and document it.
  - **View:** `{ tuningVersion, type, n, operator, operatorSymbol, seed, roundSeed, versions, tiers: [{ tier, nodes: [{ label: 't<tier>.<index>', contract?, cells: [{ text, isAnswer }], answerText, servedBand, clamped: boolean, bucketId }] }] }`.
  - Tiers are listed top first (tier 3 → 1). Leaves are realised with `realiseRoundNode` at `leafBand`, default 1.
  - Values are formatted with core `displayValue` (adapters never format values, AD-5). `bucketId` comes from core `bucketOf`. app imports core only (AD-1).
- **ui** (`packages/ui/src/dev-panel/round-inspector.tsx`, added under the existing Puzzle block):
  - **Controls:** tuning version, type, n (limited to the selected tuning's n range), operator (from the tuning), seed (integer input, default the demo seed), leaf band (from the tuning's bands), and a "Plan round" button. Every control has an accessible name.
  - **Output:** text grouped by tier, one line per puzzle: label, cells in placement order with the answer marked, and the bucketId. A summary line shows the puzzle count (n + 1 or n² + n + 1) and the versions.
  - **Errors:** shown as text, never thrown.
  - **Scroll:** the panel must stay usable on a phone (scrollable region, safe areas). A Tower at n=9 is 91 lines.
  - **Lifecycle:** components hold only transient UI state; the computed view comes from app.
- **client** (`apps/client/src/main.ts`):
  - Inside the existing guarded dev-panel branch, load every `content/tuning/*.json` with `import.meta.glob` (eager or lazy), keyed by tuning version, and pass the map to `mountDevPanel`.
  - Prod must still bundle no dev-panel code and no tuning JSON (`check:flavours` and the existing prod checks stay green).
  - The existing demo Puzzle block keeps working: it uses `1.json`, or the lowest version, from the same map.
- **Offline:** the PWA precache already covers every built file. The inspector must work with the network off; nothing it needs is fetched at runtime.
- **e2e** (`apps/client/e2e/`, WebKit playtest preview):
  - Open the panel, choose Tower, n=9 and operator sub, then plan. Expect 91 puzzle lines.
  - Every line's marked answer equals its parent cell, where checkable from the text: assert on the tier-2 and tier-1 relation through the labels or contract fields.
  - The same seed gives identical output after a reload.
  - Choosing Classic at n=3 gives 4 lines.
  - Then go offline, reload and plan again; it still works.

**Never:**
- A real tuning switcher (`SetActiveTuning` through the store), rendering puzzles graphically, or editing tuning in the panel.
- Showing the inspector in prod.
- Timing measurements in app (no clock reads in app or core paths; AD-17).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tower n=9 sub | defaults otherwise | 91 puzzle lines, tiers 3 → 1, answers marked, bucketIds shown | No error expected |
| Classic n=3 add | | 4 lines | No error expected |
| Determinism | same inputs, after a reload | identical output | No error expected |
| Leaf band 4 | Tower n=5 | leaves realised at band 4 with `clamped` shown where it fell back | No error expected |
| Bad seed | seed `-1` or `abc` | error text, no crash | error shown |
| Unknown tuning version | map without it | error text | error shown |
| Offline | playtest PWA, network off after first load | inspector still plans | No error expected |
| Prod | prod build | no inspector, no tuning JSON | check fails otherwise |

</intent-contract>

## Code Map

- `packages/app/src/demo-puzzle.ts` (+ test) -- the pattern to follow: parse the tuning, `specFor`, `realise`, and map to a plain view with `displayValue`. It exports `DEMO_SEED`.
- core public API (`packages/core/src/index.ts`): `parseTuning`, `deriveSeed`, `planRound(request, tuning, roundSeed, versions)`, `realiseRoundNode(plan, nodeId, band, tuning)`, `versionsFor`, `displayValue`, `bucketOf`, `childrenOf`, `nodeCount`, and the `RoundPlan` and `Puzzle` types. A RoundPlan's nodes are `{ nodeId, contract?, puzzle? }`, with puzzles on upper tiers only.
- `packages/ui/src/dev-panel/{dev-panel.tsx,puzzle-block.tsx,mount-dev-panel.ts}` -- the panel shell. `DEV_PANEL_ID` is the dev-panel marker. `mountDevPanel(el, tuning)` changes to take the map. ui imports app (plus core types only).
- `apps/client/src/main.ts` -- the guarded branch `if (__NUMCEPTION_DEV_PANEL__)` with dynamic imports of `@numception/ui/dev-panel` and `content/tuning/1.json`.
- `content/tuning/1.json` -- the only tuning file today. `shipped.json` sits beside it and must **not** be passed as a tuning; filter it out of the glob.
- `apps/client/e2e/dev-panel.spec.ts`, `offline.spec.ts` -- existing dev-panel and offline e2e patterns: the playtest preview, `context.setOffline`, and waiting for the service worker to control the page.
- `tools/check-flavours.mjs` -- asserts no dev-panel marker in prod. It must stay green.

## Tasks & Acceptance

**Execution:**
- [x] `packages/app/src/inspect-round.ts` (+ tests for every matrix row reachable in app) -- the round view. -- core → app
- [x] `packages/ui/src/dev-panel/round-inspector.tsx`, `dev-panel.tsx`, `mount-dev-panel.ts` -- the inspector UI. -- app → ui
- [x] `apps/client/src/main.ts` (+ types if needed) -- all bundled tunings into the panel. -- composition root
- [x] `apps/client/e2e/round-inspector.spec.ts` -- the browser proof, including offline. -- Done-when 6 (browser)

**Acceptance Criteria:**
- Given the repo, when `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass, including the inspector e2e and its offline case.
- Given the deployed playtest PWA on a phone in airplane mode after first load, when the dev panel plans a Tower round at n=9, then all 91 puzzles show, and the same seed shows the same round after reload. This is a human check, once the Pages domain resolves.

## Implementation Notes

- **Round seed:** `roundSeed = deriveSeed(seed, 0)`: the inspected round is round ordinal 0 of a run started from `seed`, as the play loop will derive it. Documented on `inspectRound`; the view carries both `seed` and `roundSeed`.
- **app:** `inspect-round.ts` (`inspectRound`) plus `round-inspector-options.ts` (`roundInspectorOptions(tunings)`: per tuning version, the n range, operators with symbols and band numbers, or the parse error; `defaultTuningVersion` = 1 if present, else the lowest). ui needs these to limit its controls and can't parse tuning itself (AD-1). `seed` may be a number or decimal text, parsed strictly to uint32 (`-1`, `abc`, `''`, `1.5`, 2^32 → `invalid-seed`). A missing key, or a file whose `tuningVersion` differs from its key, is `unknown-tuning`. Every node is realised with `realiseRoundNode` (upper tiers return their planned puzzle). A try/catch guards the never-throws promise. The view also carries `tier`, `index`, `leafBand` and `puzzleCount`.
- **ui:** `round-inspector.tsx` under the Puzzle block. Controls use `<label htmlFor>` (a wrapping label made the select's accessible name include its value). Line format: `t<tier>.<index>[ =<contract>]: <cells, answer in [brackets]> · b<servedBand>[ clamped] · <bucketId>`. The panel now has `maxWidth`/`maxHeight` inside the safe areas with `overflowY: auto`. The demo Puzzle block gets `tunings[defaultTuningVersion]`.
- **client:** `import.meta.glob(['…/content/tuning/*.json', '!…/content/tuning/shipped.json'], { import: 'default' })` (lazy) inside the guarded branch, keyed by file stem (`tools/tuning-content.test.ts` already requires files to be named after their tuningVersion). The negative pattern must be written relative like the positive one; `!**/shipped.json` did not exclude it. Playtest/dev now emit `1-*.js` only; prod has no tuning chunk.
- **e2e:** `round-inspector.spec.ts`: Tower n=9 sub (91 lines, tiers 3→1, every answer equals its parent's cell `i·n + j` and its contract, identical after reload), Classic n=3 (4 lines), bad seed error then recovery, offline reload and plan, and a 375×667 viewport check that the panel fits and scrolls to the last line.

## Plan Change Log

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 5 findings — high 0, medium 0, low 5, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` The contract text was built with `String()` instead of core `displayValue` (AD-5). Fixed: `displayValue(rational(contract))`.
  - `[low]` `[reject]` `parseSeed` accepts surrounding spaces and leading zeros. Friendlier in a dev-panel text input, unambiguous (still a uint32), and harmless.
  - `[low]` `[patch]` `roundInspectorOptions` listed a tuning whose version mismatched its key as valid, while `inspectRound` rejected it. Fixed: the same check, with a test.
  - `[low]` `[patch]` Changing a control left the previous round on screen. Fixed: output clears on any input change (e2e asserts it).
  - `[low]` `[patch]` A failed tuning chunk rejected unhandled and the panel never mounted. Fixed: failed tunings are skipped and the panel mounts with the rest; a panel load failure is shown as text in its host. Console logging here runs only in dev and playtest builds, where the dev panel exists.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0

## Auto Run Result

**Summary:** The playtest and dev panels gain a Round inspector.
- **Controls:** pick a bundled tuning, Classic or Tower, n, operator, seed and leaf band, then plan.
- **Output:** every tier's puzzles as text, top first: label, cells with the answer bracketed, contract, served band or clamp, and `bucketId`, plus a count and versions summary.
- **Computation:** `inspectRound` and `roundInspectorOptions` in app do the work through core (`deriveSeed(seed, 0)`, `planRound`, `realiseRoundNode`, `displayValue`, `bucketOf`).
- **Loading:** the client passes all bundled tunings (`shipped.json` excluded) inside the dev-panel guard, so prod is unchanged.
- **Offline:** it works offline via the existing precache.

**Files changed:** `packages/app/src/{inspect-round.ts,round-inspector-options.ts,index.ts}` (+ tests), `packages/ui/src/dev-panel/{round-inspector.tsx,dev-panel.tsx,mount-dev-panel.ts,puzzle-block.tsx}`, `apps/client/src/main.ts`, `apps/client/e2e/round-inspector.spec.ts`.

**Review findings:** 4 patches applied (low), 1 deferred (the phone check waits on DNS), 1 rejected (lenient seed input).

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 4.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm typecheck`, `lint:deps`, `test`, `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (14) all pass.
- The e2e covers Tower n=9 sub (91 lines, parent-child relation, determinism after reload), Classic n=3, a bad seed, offline and a phone viewport.
- Prod has no tuning JSON.

**Residual risks:** the phone check is pending DNS. The tuning-load failure paths are typechecked but have no e2e.
