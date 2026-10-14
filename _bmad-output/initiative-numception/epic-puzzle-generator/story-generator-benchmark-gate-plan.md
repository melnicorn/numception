---
title: 'Generator benchmark gate'
type: 'chore'
ticket: '9'
created: '2026-10-13'
status: done
baseline_revision: '9e546765fa12cb21782ea3a6847e71a6cbd26950'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred:
  - summary: >-
      CI headroom on the plan gate is thin: the slowest Tower n=9 plan took 43.56 ms on ubuntu-latest against the 50 ms limit (laptop: 19.98 ms).
    evidence: |-
      CI run on 6d5919e: "tower n=9 round plan: n=200 max 43.56 ms after re-timing the 5 slowest (limit 50 ms per plan)". Realisation p95 is 0.33 ms, far under 10 ms. The plan gate may flake as the generator grows. Candidate for the epic's Refactor sweep (2.12): speed up Tower planning, e.g. cheaper leaf-contract checks.
    location: >-
      tools/bench/generator.bench-test.ts; packages/core/src/rounds/plan-tiers.ts
    severity: medium
---

<intent-contract>

## Intent

**Problem:** AD-19 and epic Done-when 3 require a CI benchmark gate: realisation p95 ≤ 10 ms per node, and a round plan ≤ 50 ms. Today only laptop-ceiling timing checks exist, inside the parallel unit suite.

**Approach:** A dedicated `pnpm bench:generator`, separate from `pnpm test` so parallel workers don't add noise, runs in CI after the unit tests.
- **Plan timing:** 100 Tower rounds at n=9, for both operators under `content/tuning/1.json`, after a JIT warm-up.
- **Realisation timing:** every leaf of those rounds is realised lazily at bands 1..4.
- **Gate:**
  - Realisation fails if its p95 exceeds 10 ms per node.
  - Plan fails if its p95 exceeds 50 ms. p95 rather than max, because a single GC pause on a shared runner shouldn't fail CI; the max is printed for visibility.
- **Gate logic:** a pure, unit-tested `evaluateBenchmark(samples, limits)`, so a slowed generator provably fails. The benchmark runs on a single worker.

</intent-contract>

## Implementation Notes

Oneshot: one Vitest benchmark file run through its own config, plus a pure gate function and its unit test.

- `tools/bench/{evaluate-benchmark.mjs,evaluate-benchmark.test.ts,generator.bench-test.ts,vitest.bench.config.ts}`; `pnpm bench:generator`; CI step after `pnpm test`; `vitest.config.ts` and `tsconfig.tooling.json` include `tools/bench`.
- Summary lines go to `process.stdout`, because Vitest 5 hides `console.log` output for passing tests.

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 6 findings — high 0, medium 2, low 3, false 1, maybe-false 0
- findings:
  - `[medium]` `[patch]` The plan gate used p95, but AD-19 says "a round plan ≤ 50 ms" with no percentile. Fixed: every plan must be ≤ 50 ms, after re-timing the five slowest best-of-3 so a single GC pause can't fail CI.
  - `[low]` `[patch]` Each leaf was realised at one band, not at bands 1..4 as planned. Fixed: every leaf at every band (64,800 samples).
  - `[medium]` `[patch]` A uniform slowdown hit the 120 s test timeout before the gate printed. Fixed: a 60 s sampling budget (exceeding it fails, with a message), so a slowed generator always reaches the verdict. Demonstrated locally: an 11 ms spin in leaf realisation gave "✘ leaf realisation … p95 11.25 ms" and "✘ sampling stopped at the 60 s budget".
  - `[low]` `[patch]` Only synthetic samples proved the gate. Covered by the real-path slowed run above, recorded here (not committed as a test).
  - `[low]` `[patch]` Stale "CI benchmark gate is a later entry" comments in `round-content` and `generation-content` tests. Fixed to point at `tools/bench/generator.bench-test.ts`.
  - `[false]` `[reject]` "`lenses_ran` set before the review finished." The workflow records the lenses at launch; the CI evidence follows this push.

## Verification

**Commands:**
- `pnpm bench:generator` -- expected: passes and prints p50, p95 and max for plans and realisation
- `pnpm test` -- expected: passes, including the `evaluateBenchmark` unit tests (a synthetic slow sample fails the gate)
- CI on push -- expected: the bench step is green on ubuntu-latest

## Auto Run Result

**Summary:** `pnpm bench:generator` (single worker, separate from `pnpm test`) runs in CI after the unit tests. It plans 100 Tower rounds at n=9 per operator from `content/tuning/1.json` and realises every leaf lazily at every band.
- **Plans:** fail if any plan exceeds 50 ms (the five slowest are re-timed best-of-3).
- **Realisation:** fails if its p95 exceeds 10 ms per node.
- **Time budget:** a 60 s sampling budget guarantees a verdict even for a uniformly slowed generator.
- **Gate logic:** the pure `evaluateBenchmark` is unit-tested.

**Files changed:** `tools/bench/*`, `package.json`, `vitest.config.ts`, `tsconfig.tooling.json`, `.github/workflows/ci.yml`, comments in `tools/{round,generation}-content.test.ts`.

**Review findings:** 5 patches applied (2 medium, 3 low), 0 deferred, 1 rejected (false).

**Follow-up review recommended:** false. Patched: high 0, medium 2, low 3. Both mediums were proven by the slowed-run demonstration.

**Verification:**
- Laptop: plan max 19.98 ms, realisation p95 0.15 ms (64,800 samples), about 5 s total.
- Slowed run: ✘ verdict with numbers.
- `pnpm typecheck`, `lint:deps`, `test` (with the gate's unit tests), `build` and `e2e` all pass.

**Residual risks:** on CI (ubuntu-latest) the gate passed with plan max 43.56 ms against the 50 ms limit, which is thin headroom (deferred to the Refactor sweep), and realisation p95 0.33 ms.
