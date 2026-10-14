---
title: 'Number ranges by puzzle size'
type: 'feature'
ticket: '13'
created: '2026-10-14'
status: done
baseline_revision: 'f70fcb30e1f1ea9d63f58fc8e74ed62548568691'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-tuning-schema-for-generation-plan.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-classic-and-tower-round-planning-plan.md'
warnings: []
deferred:
  - summary: >-
      Rounds starting above band 1 mostly fail to plan at small n under content/tuning/1.json, because upper-tier cells come from the start band but leaf contracts must fit band 1's narrow per-n range.
    evidence: |-
      Review measurement on 600 ordinals: Tower + n=3 band 2 349/600 unplannable (was 0); Classic + n=5 band 2 479/600; Tower − n=5 band 2 600/600. Start band 1 plans 100% at every n, type and operator. The play loop's stand-in starts every round at band 1. Settle when level progression is designed (epic-adaptive-difficulty): e.g. draw upper tiers from band 1's range, or relax the leaf-band rule to the start band.
    location: >-
      content/tuning/1.json; packages/core/src/rounds/plan-tiers.ts; epic Notes "leaf answers fit band 1"
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Entry 2.5 had to widen band 1 in `content/tuning/1.json` to 1..99 with one carry so large Classic and Tower rounds can be planned under the rule that leaf answers fit band 1. Even n=3 puzzles, where new players start, can therefore show numbers up to 99. The user decided (2026-10-14) that value ranges depend on puzzle size n.

**Approach:**
- **Schema:** let each TuningConfig band carry per-n value ranges.
- **Specs:** `specFor` picks the range for the requested n, so the generator and planner see an ordinary band for that n.
- **Content:** in `content/tuning/1.json`, small n keeps easy numbers (band 1 at n=3 within 1..20) and larger n widens as needed, while every round type, n and operator still plans.

## Boundaries & Constraints

**Always:**
- **Band shape:** a band becomes `{ band, ranges: [{ nMin, nMax, minValue, maxValue, maxCarries }] }`.
  - The ranges must cover every n in the tuning's `n.min..n.max` exactly once: contiguous, no overlap, no gap.
  - Each range follows the existing value rules: `minValue ≥ 1`, `maxValue ≥ minValue + 2`, at most `MAX_TUNING_VALUE`.
  - Strict schema with path-naming errors. v1 is unshipped, so the schema changes in place with no migration.
- **specFor and the generator:** `specFor(tuning, { n, operator, band, contract? })` resolves every band (requested and fallbacks) to its range for that n. The generator's `PuzzleSpec`/`PuzzleBand` shape (`{ band, minValue, maxValue, maxCarries }`) is **unchanged**, so neither the generator nor golden outputs need to change except through specs. The planner's "band 1" rule now means band 1's range for the round's n.
- **Content (`content/tuning/1.json`):**
  - Band 1 at n=3 stays within 1..20. The intent is n 3–5 at 1..20; larger n may widen.
  - Choose `maxCarries` and ranges so Classic and Tower plan for every n 3..9 and both operators. Allow a carry at small n only if needed to plan, and say why.
  - Higher bands also get per-n ranges, monotone in difficulty.
  - Record the chosen numbers and their reasoning in Implementation Notes.
- **Golden:**
  - The fixture tunings under `packages/core/test/fixtures/tuning/` move to the new shape.
  - Prefer one range spanning their n so puzzle outputs stay byte-identical. If a fixture's derived specs are unchanged, its golden cases must be unchanged.
  - Regenerate only where the specs really change, and record which cases changed.
- **Consumers stay green:** the demo puzzle, round inspector, round-content, generation-content, nightly and benchmark checks.

**Never:**
- Level progression, selection between bands or n, or anything about how a player moves between them (tabled by the user).
- Changing generator algorithms.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Small n stays easy | content tuning, band 1, n=3 | every realised value in 1..20 | No error expected |
| Large rounds plan | content tuning, Classic and Tower, n 3..9, + and − | all plan (round-content check) | No error expected |
| Gap or overlap | band ranges covering n 3–5 and 7–9 only, or 3–6 and 5–9 | `invalid-tuning` naming the band | returned as error |
| Range rules | a range with `maxValue < minValue + 2` | `invalid-tuning` | returned as error |
| Fallbacks per n | request band 3 at n=4 | fallback bands are band 2 and band 1 at their n=4 ranges | No error expected |
| Golden | fixture tunings in the new shape, one range each | golden outputs unchanged | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/tuning/tuning-config.ts` -- `BandSchema` (band, minValue, maxValue, maxCarries) and `GenerationSchema` (operators, n, bands, distractors, retries); `TuningBand` type; `MIN_N` and `MAX_N`.
- `packages/core/src/spec/spec-for.ts` -- builds `PuzzleSpec` with `band` and `fallbackBands` from tuning bands (the `band()` helper maps TuningBand to PuzzleBand). Resolve per n here.
- `packages/core/src/rounds/*` -- the planner reads bands through `specFor`. Check every place that reads `tuning.generation.bands` directly, e.g. contract checks, `contract-floor.ts` and `plan-problems.ts`.
- `packages/app/src/{demo-puzzle.ts,inspect-round.ts,round-inspector-options.ts}` -- read bands (e.g. served-band `maxValue`, leaf band options).
- `content/tuning/1.json`, `packages/core/test/fixtures/tuning/*.json`, `packages/core/test/golden/*` (`specForTuning`) -- data and golden derivation.
- `tools/{round-content,generation-content,tuning-content}.test.ts`, `tools/nightly/*`, `tools/bench/*` -- content-level checks.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/tuning/*` (+ tests) -- per-n ranges with coverage checks. -- schema
- [x] `packages/core/src/spec/spec-for.ts` (+ tests), plus any direct band readers in core and app -- resolve per n. -- wiring
- [x] `content/tuning/1.json`, fixture tunings, golden (regenerate only if specs change) -- data. -- user decision
- [x] A test asserting band 1 at n=3 from content stays within 1..20 for a large sample. -- verify

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm bench:generator && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass, and `NIGHTLY_N=9 NIGHTLY_COUNT=20000 pnpm nightly:check` and `NIGHTLY_N=3 NIGHTLY_COUNT=20000 pnpm nightly:check` pass.
- Given `content/tuning/1.json`, when band-1 puzzles at n=3 are realised, then every value lies in 1..20, and Classic and Tower rounds plan for every n and operator.

## Implementation Notes

- **Schema** (`core/tuning/tuning-config.ts`): a band is the strict `{ band, ranges }`; each range is the strict `{ nMin, nMax, minValue, maxValue, maxCarries }` with `nMin`/`nMax` in 3..9, a forwarded `nMax >= nMin` check on `…ranges.i.nMax` and the old `maxValue >= minValue + 2` check on `…ranges.i.maxValue` (values still capped at `MAX_TUNING_VALUE`). Within a band, ranges must be non-empty and contiguous in n order (each `nMin` = previous `nMax` + 1), reported at `generation.bands.<i>.ranges` with a message naming the band ("the ranges of band 2 must be ordered by n, with no gap or overlap …"; a band-level `partialCheck` forwarded to `ranges`), which catches gaps (3–5, 7–9), overlaps (3–6, 5–9) and disorder. Coverage of `n.min..n.max` (first `nMin`, last `nMax`) is a generation-level `partialCheck` forwarded to `generation.bands` whose message names the band(s), e.g. "the ranges of band 2 must cover n 3..9 exactly". The old flat band shape is rejected as unknown keys. `TuningBandRange` is exported.
- **specFor**: resolves the requested band and every lower fallback (nearest first) to its range for the request's n (`bandAt`), so `PuzzleSpec`/`PuzzleBand` are unchanged. A tuning that bypassed validation and has no range for n gets `invalid-spec` ("band X has no range for n Y"), not a throw. Every other band reader in core and app reads only band numbers (`.band`), and every value read goes through `specFor`, so the planner, plan-problems, round inspector, demo, nightly and bench needed no change for resolution.
- **Planner change (see Plan Change Log)** (`core/rounds/plan-tiers.ts`): an unconstrained top draw holding a cell below `contractFloor(op, tier − 1)` is now discarded without counting toward `NODE_PLAN_ATTEMPTS` (16), bounded by `TOP_DRAW_LIMIT` = 256 draws; failure messages say which bound ran out. Draw order is unchanged and only floor-failing draws (which could never plan) are skipped, so every top that planned before is still the first one accepted: plans that succeeded before are byte-identical (all 23 golden plan cases unchanged, including the pinned `small` Tower add n 3 `unplannable`, which has no floor-passing top whose children plan without carries). Intermediate nodes and the fixed-top search are untouched. Review follow-up: an `unrealisable` top draw no longer aborts the plan; as in `planUpper` it spends one counted attempt and the next draw (its own stream) is tried. `unplannable` comes only when the attempts run out, saying "the top puzzle is unrealisable in start band B (k attempts)" when every counted draw was unrealisable, else noting how many were. Plans that succeeded before never met an unrealisable top draw, so they are unchanged (golden zero diff). Tested: classic add n 7 in 1..30 with `maxAttempts` 1, round seeds whose first top draw is unrealisable, now plan from a later draw.
- **Content ranges** (`content/tuning/1.json`):

  | band | n 3–4 | n 5–6 | n 7–8 | n 9 |
  |---|---|---|---|---|
  | 1 | 1..20 c1 | 1..30 c1 | 1..60 c1 | 1..99 c1 |
  | 2 | 1..50 c1 | 5..99 c1 | 10..199 c1 (n 7–9) | |
  | 3 | 5..99 c1 | 10..199 c2 | 10..499 c2 (n 7–9) | |
  | 4 | 10..199 c2 | 10..499 c2 | 10..999 c2 (n 7–9) | |

  Why: measured by planning 200 rounds (2 root seeds × 100 ordinals) per type × operator × n for candidate band-1 ranges.
  - **Carry at n 3 (needed):** with 0 carries, Tower add at n 3 can't be planned at all: every usable top contains 10, 11 or 12 (both addends ≥ 7 and the sum ≤ 20), and none of those splits into addends ≥ 3 without a units carry. Within 1..20 one carry is also the most possible (tens never carry), so c1.
  - **n 3–4 at 1..20:** with the planner change, 0 failures. Without it, Tower add fails 25/200 at n 3 and 45/200 at n 4 (only about 1 top in 8 clears the floor).
  - **n 5 is 1..30, not the intended 1..20:** Tower add at n 5 in 1..20 still failed 7/200 with the planner change. 1..30 gives 0, and n 6 follows it.
  - **n 7–8 at 1..60:** 1..40 and 1..50 plan but have slow outliers (27 ms Tower sub at n 7, 36 ms Tower add at n 8, measured in parallel runs). 1..60 gives ≤ 4 ms.
  - **n 9 keeps 1..99:** 1..60 plans but with 20 ms outliers, and the CI headroom under 50 ms is already thin.
  - **Higher bands:** monotone in difficulty both across bands at a given n and across n within a band. n 7–9 keep the previous single-range values, so the n 9 benchmark is unchanged. Every band at every n serves unconstrained puzzles (nightly: 0 unrealisable).
- **Fixtures/golden**: every fixture tuning (`tiny`, `small`, `wide`, `extreme`, `rounds`) now has one range per band spanning its `n.min..n.max` with the old values, so derived specs are unchanged; `pnpm golden:update` rewrote `generator-v1.json` byte-identically (no golden case changed, puzzle or plan).
- **Tests**: `parse-tuning.test.ts` covers every new rule (gap, overlap, disorder, coverage start/end, nMin/nMax bounds, per-range value rules, the old flat shape, a narrower n range); `spec-for.test.ts` covers per-n resolution at range edges, fallbacks at their n (band 3 at n 4 → band 2 and band 1 at their n 4 ranges) and the unvalidated-tuning error; `round-types.test.ts` covers the floor skip (Tower add n 3 in 1..20 plans for 100 ordinals) and the new no-top-clears-the-floor message, and its lazy-leaf clamp tests moved to n 7 (bands 2..4 now start below 10 at small n). `tools/generation-content.test.ts` adds: 10,000 band-1 n 3 puzzles per operator from content, every value in 1..20, and 100 Classic + 100 Tower rounds per operator at n 3 whose planned cells and band-1 leaves all lie in 1..20. Test copies of tuning v1 (app demo/inspector tests, round-types, round-plan property) follow the new content; the demo puzzle under v1 is now `3, 10, 7` (band 1 at n 3, maxValue 20).

## Plan Change Log

- 2026-10-14 — **Planner bound change (outside the Code Map's "reads bands through specFor"):** no band-1 range within 1..20 lets Tower add plan reliably at n 3 under the 16-draw top loop (12.5% of rounds unplannable at best, at 1..20 c1), which conflicts with both the "n 3 within 1..20" rule and the "every round type, n and operator plans" acceptance criterion. I fixed this in the round planner rather than the generator, which stays as it is: top draws that the existing `contractFloor` rule shows can never plan no longer use up attempts. Earlier successful plans and all golden outputs stay byte-identical. The orchestrator or user should confirm this is acceptable under "Never: changing generator algorithms" (it touches `core/rounds`, not `core/generator`).
- 2026-10-14 — **n 5 deviates from the stated intent (n 3–5 at 1..20):** n 5–6 use 1..30, because Tower add at n 5 in 1..20 stays about 3.5% unplannable. The hard rule (n 3 within 1..20) holds.

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 3 findings — high 0, medium 1, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[defer]` With band 1 narrowed at small n, rounds starting above band 1 mostly fail to plan at n 3–6 (e.g. Tower + n=3 band 2: 349/600 unplannable, previously 0). Start band 1 still plans 100% everywhere. The play loop's stand-in sequence only starts at band 1, and choosing start bands is the level progression the user tabled. Deferred to epic-adaptive-difficulty, with options: draw upper tiers from band 1's range, or let leaf contracts use the start band.
  - `[low]` `[patch]` `planFreeTop` aborted on any unrealisable top draw, now possible anywhere within 256 draws. Fixed: unrealisable top draws count as attempts and are skipped like in `planUpper`, with accurate per-cause messages. Golden zero diff; a new test plans after an early unrealisable draw.
  - `[low]` `[patch]` Gap and overlap errors didn't name the band. Fixed: the message names the band number; tests updated.

## Verification

**Commands:**
- the acceptance chain above -- expected: all exit 0

## Auto Run Result

**Summary:** TuningConfig bands now carry per-n value ranges (`ranges: [{ nMin, nMax, minValue, maxValue, maxCarries }]`, covering the tuning's n range exactly, with path- and band-naming errors). `specFor` resolves each band and its fallbacks for the requested n, so the generator's spec shape and golden outputs are unchanged.
- **Content ranges for band 1:** 1..20 at n 3–4, 1..30 at n 5–6, 1..60 at n 7–8, 1..99 at n 9, each with one carry (needed for Tower + at small n). Higher bands rise with band and n.
- **Planner:** stops spending attempts on top draws that provably can't plan, and skips unrealisable top draws. Previously successful plans are byte-identical.

**Files changed:** `packages/core/src/tuning/*`, `packages/core/src/spec/spec-for.ts`, `packages/core/src/rounds/plan-tiers.ts` (+ tests), `content/tuning/1.json`, `packages/core/test/fixtures/tuning/*.json`, test copies of tuning v1, `tools/generation-content.test.ts`.

**Review findings:** 2 patches applied (low), 1 deferred (start bands above 1 at small n), 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 2.

**Verification:**
- Golden zero diff.
- `pnpm typecheck`, `lint:deps`, `test`, `bench:generator` (Tower n=9 max about 3.8 ms), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (14) all pass.
- The nightly check at 20,000 puzzles passes at n=3 and n=9.
- Every n=3 band-1 value is within 1..20.

**Residual risks:**
- n=5 got 1..30 rather than the intended 1..20 (Tower + n=5 failed 7/200 at 1..20).
- Rounds starting above band 1 at small n (deferred).
