---
title: 'Refactor sweep'
type: 'chore'
ticket: '12'
created: '2026-10-13'
status: done
baseline_revision: 'c0f35cd13d9ed128653017b8f8f6525cee71f661'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/epic-puzzle-generator.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-classic-and-tower-round-planning-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-generator-benchmark-gate-plan.md'
warnings: []
deferred:
  - summary: >-
      Generator v1's final-attempt fallback-triple path (fewer near-misses on a band's last attempt, reusing the band's last usable triple) has no direct test.
    evidence: |-
      Recommended in the 2.4 follow-up; the implementer couldn't build an input that reliably reaches it without restructuring. Covered indirectly by property tests, golden cases and the nightly 100,000-puzzle run. Candidate for a test seam when generator v2 is written.
    location: >-
      packages/core/src/generator/v1/realise-v1.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** This epic left cleanup behind:
- The CI benchmark gate passes with thin headroom: the slowest Tower n=9 plan took 43.56 ms on ubuntu-latest against the 50 ms limit (2.9 deferred).
- Plans 2.2, 2.4 and 2.5 recommended a follow-up review of the version policy, generation edge cases and the planner after their review-driven rework.

**Approach:** Cleanup only.
- **(1) Planner speed:** make Tower planning faster without changing its rules (FR-2, AD-4, the epic Notes). Target: on a laptop, `pnpm bench:generator` shows plan max at or under half today's (≈ 20 ms → ≤ 10 ms), or as close as a safe change allows. Profile first; the leaf band-1 contract checks are the likely cost.
  - **Golden:** if outputs change, v1 is unshipped, so regenerate the golden fixtures with `pnpm golden:update` and record it. Prefer optimisations that keep outputs identical, such as avoiding repeated work for the same node, cheaper rejection before a full realise, or allocation reductions.
- **(2) Code review sweep:** review `packages/core/src/{generator,rounds,spec,random,rules,difficulty,layout}`, `packages/core/test/golden` and `tools/{golden-*,bench,nightly}` for:
  - dead code, duplicated helpers that should be shared (except where independence is deliberate: `difficulty/column-steps` and the nightly checker stay independent of the generator);
  - stale or wrong comments;
  - inconsistent naming, and API exports that leak internals.

  Fix what's cleanup. Anything that changes behaviour or scope is **not** fixed here; record it in Implementation Notes as a new-story candidate.
- Keep every check green, the benchmark included.

</intent-contract>

## Code Map

- `packages/core/src/rounds/*` -- planner (`plan-tiers.ts`, `contract-floor.ts`, `realise-plan-node.ts`, `round-types.ts`, `plan-problems.ts`).
- `packages/core/src/generator/v1/*`, `realise.ts` -- generator v1.
- `tools/bench/generator.bench-test.ts` -- `pnpm bench:generator` prints plan max and realisation p95.
- `packages/core/test/golden/*`, `tools/golden-update.mjs`, `tools/golden-lock.mjs` -- golden machinery. `shipped.lock.json` is empty (v1 unshipped).
- `tools/round-content.test.ts`, `tools/generation-content.test.ts`, `tools/nightly/*` -- content-level checks that must stay green.

## Tasks & Acceptance

**Execution:**
- [x] Profile and speed up Tower planning (`packages/core/src/rounds/*`, possibly `generator/v1/*`), with tests unchanged or extended. -- CI headroom
- [x] Review-sweep cleanups across the listed folders. -- quality
- [x] Implementation Notes: before/after benchmark numbers, the cleanups made, and any new-story candidates found. -- record

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm bench:generator && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass, and `NIGHTLY_N=9 NIGHTLY_COUNT=20000 pnpm nightly:check` passes.
- Given `pnpm bench:generator` on a laptop, when it runs before and after the change, then the Tower n=9 plan max is clearly lower afterwards (target ≤ 10 ms).

## Implementation Notes

- **Profile** (500 Tower n = 9 plans per operator, `content/tuning/1.json`): ~85% of plan time was the 81 band-1 leaf checks, which almost always succeed (add: 84 leaf realisations per plan on average, 0 failing), so neither memoisation nor earlier rejection had much to save. Inside each realisation, ~80% of CPU was `fillDistractors`' candidate test (`isNear`, `nearsSomePair`, `turnsPlainNear`, `completesTriple`): O(cells²) per candidate, up to 192 candidates per fill, most rejected.
- **Speed-up, output identical** (`generator/v1/distractor-checks.ts`, new): the candidate test moves behind a `DistractorChecks` interface with two implementations. `directChecks` is the old scan. `tableChecks` keeps per-value counters over the band (present, completes a triple, near-miss, would turn a placed plain distractor near), updated on each push and pop, so a test is O(1). `fillDistractors` uses the table for bands at most `TABLE_RANGE` = 1024 wide and the scan above that. The draws and the order of candidates are unchanged; only the cost of the yes/no test changed.
  - Equivalence: `distractor-checks.prop.test.ts` (fast-check, 300 runs) compares both implementations on every value in and around random bands, after random push/pop sequences, with small and large deltas. Mutation-checked: dropping any one counter contribution fails it (the skip-value exclusions are masked by the `completes` counter, so they are equivalent either way).
  - Output: `pnpm golden:update` rewrote `generator-v1.json` with zero diff. A scratch hash over Classic and Tower plans (n 3..9, both operators, 40 ordinals each, lazy leaves at every band) and 60 direct realisations per n × operator × band, under `content/tuning/1.json` and every fixture tuning (rounds, small, tiny, wide, extreme), matched before and after. No golden regeneration was needed.
  - `fill-distractors.test.ts` gains a band wider than `TABLE_RANGE`, so the scan path stays covered.
- **Benchmark** (`pnpm bench:generator`, this laptop):
  - Before (c0f35cd): plan max 20.51 ms; leaf realisation p50 0.03 ms, p95 0.15 ms, max 2.89 ms.
  - After: plan max 3.67 / 3.69 / 3.76 ms (three runs); leaf realisation p50 0.02 ms, p95 0.06 ms, max 0.34–0.51 ms.
  - Scratch profile, 500 plans per operator: add mean 7.0 → 1.5 ms, p95 12.6 → 2.5 ms, max 21.2 → 3.7 ms; sub mean 5.1 → 1.3 ms, p95 9.5 → 2.3 ms, max 18.9 → 3.8 ms.
- **Cleanups** (no behaviour change):
  - `core/index.ts` no longer exports the PRNG internals `randomStream`, `RandomStream`, `nextInt`, `nodeSeed` and `nodeStream`; nothing outside core used them. `mul32` is no longer exported from `random/mix32.ts` (used only there).
  - Shared helpers: `result/describe-value.ts` (was `describeValue` in `realise.ts` and a near-copy `show` in `plan-request.ts`; a bigint now prints as `10n` in plan-request messages too) and `random/uint32-max.ts` (was in both files).
  - `rounds/plan-problems.ts`: tiers come from `ROUND_TYPES` instead of a second table; stale header fixed (the nightly check and the dev panel inspector do not use it, and nor do the golden checks).
  - `rounds/plan-tiers.ts`: unused `Context.tiers` removed.
  - `test/golden/golden-seeds.ts`: the duplicated tuning/version checks of `planCase` and `realiseCase` are one `caseTuning`; versions, clamp and band copies use shared serialisers (fixture text unchanged, as `golden:update` showed); stale `golden.test.ts` path fixed here and in `tools/golden-harness/src/main.ts`; `buildGoldenSeeds` doc says exactly which planning error is recorded.
- **Reviewed, left as is:** `difficulty/column-steps` and `tools/nightly/independent-check.mjs` stay independent of the generator (deliberate). `rules`, `difficulty`, `layout`, `spec`, `tools/bench`, `tools/nightly` and the golden lock/update tools had nothing to clean up. The band copies in `spec-for` and `realise-v1` sit in different layers; `fixtureFileName` exists in both `tools/golden-lock.mjs` (plain Node) and `golden-seeds.ts` (loaded through Vite), which can't share code without a build step.
- **New-story candidates** (these change behaviour or scope, so not fixed here):
  - `planFreeTop` returns `unplannable` at the first `unrealisable` top attempt, but `planUpper` moves on to the next attempt's stream (the 2.5 review fix). Making the top consistent would change outputs only for rounds that are unplannable today (v1 is unshipped, so the golden can be regenerated).
  - `contractFloor`'s tier-1 floors (add 3, sub 1) repeat v1's `MIN_CONTRACT`. A later generator version with other minimums would need both changed. Consider one generator-level definition the planner can read without importing v1 internals.
  - `packages/app/src/inspect-round.ts` keeps its own `UINT32_MAX` (outside this sweep's folders). It could use a core export if core chooses to publish one.
  - `tools/round-content.test.ts` still times Tower n = 9 plans (laptop ceiling, 50 ms) inside `pnpm test`, overlapping the benchmark gate. Dropping it is a test-scope decision.
- **CI headroom:** not measured on ubuntu-latest in this session. At the old laptop-to-CI ratio (19.98 → 43.56 ms) the new 3.7 ms laptop max suggests about 8 ms on CI, against the 50 ms limit.

- Orchestrator (2026-10-13), dispositions of the other deferred items:
  - 2.5 band-1 widening → carried to `epic-adaptive-difficulty/epic-adaptive-difficulty.md` Notes (a design decision for the user, not cleanup).
  - 2.11 phone airplane check → already carried in epic-poc-playtest's Notes.
  - 2.9 thin CI headroom → fixed here (planner speed).
- Follow-up reviews recommended by 2.2 and 2.4:
  - 2.2: version-policy semantics reviewed and left as is; AD-6 replayability stays exercised only with synthetic versions until the first real version bump.
  - 2.4: the final-attempt fallback-triple path still has no direct test (deferred); the exhaustive-search bound is unchanged and covered by the narrow-band tests and the nightly run.

## Plan Change Log

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 5 findings — high 0, medium 0, low 5, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` The sweep "fixed" the golden comments to point at `golden/golden-seeds.test.ts`, but `packages/core/test/golden.test.ts` is the real Node golden check. Fixed: both comments restored.
  - `[low]` `[patch]` Notes didn't record outcomes for the 2.2 and 2.4 follow-ups. Fixed: outcomes recorded; the untested fallback-triple path deferred.
  - `[low]` `[patch]` The carried-over note added to epic-adaptive-difficulty wasn't recorded. Fixed: recorded in Implementation Notes.
  - `[low]` `[reject]` The shared `describeValue` prints a bigint as `10n` instead of `bigint` in plan-request error messages. Dev-only messages, and more informative.
  - `[low]` `[patch]` The distractor-check property test drew only narrow bands and small deltas. Fixed: widths up to the table's 1,024 limit and deltas up to 2,000 (the reviewer's 3,000-scenario stress run found zero mismatches).

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm bench:generator && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- `NIGHTLY_N=9 NIGHTLY_COUNT=20000 pnpm nightly:check` -- expected: passes

## Auto Run Result

**Summary:**
- **Planner speed:** Tower planning is about 5.5× faster with byte-identical output. A new incremental lookup table answers the distractor candidate checks (the dominant cost) in constant time; a property test proves it equal to the direct scan.
- **Benchmark:** laptop Tower n=9 plan max went from 20.51 to 3.77 ms, and realisation p95 from 0.15 to 0.06 ms.
- **Cleanups:** random internals are no longer exported from core; `describeValue` and `UINT32_MAX` are shared; `plan-problems` reads tiers from `ROUND_TYPES`; an unused field and duplicated golden checks are removed.
- **Deferred items:** dispositioned (band widening carried to epic-adaptive-difficulty; phone check in epic-poc-playtest).

**Files changed:** `packages/core/src/generator/v1/{distractor-checks.ts,distractor-checks.prop.test.ts,fill-distractors.ts}` (+ test), `packages/core/src/{index.ts,result/describe-value.ts,random/uint32-max.ts,random/mix32.ts,rounds/*,generator/realise.ts}`, `packages/core/test/golden/golden-seeds.ts`, `tools/golden-harness/src/main.ts`, `epic-adaptive-difficulty.md` (carried-over note).

**Review findings:** 4 patches applied (low), 1 deferred (fallback-triple test seam), 1 rejected (bigint message wording).

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 4.

**Verification:**
- `generator-v1.json` is byte-identical.
- `pnpm install --frozen-lockfile`, `typecheck`, `lint:deps`, `test`, `bench:generator` (plan max 3.77 ms, realisation p95 0.06 ms), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (14) all pass.
- `NIGHTLY_N=9 NIGHTLY_COUNT=20000 pnpm nightly:check` passes.
- CI benchmark numbers are confirmed on this push.

**New-story candidates (behaviour changes, not done):**
- Make `planFreeTop` retry streams like `planUpper`.
- `contractFloor` duplicates v1's `MIN_CONTRACT`.
- The app's `inspect-round.ts` keeps its own `UINT32_MAX`.
- `round-content.test.ts` timing overlaps the benchmark gate.
