---
title: 'Bucket features and bucketId'
type: 'feature'
ticket: '7'
created: '2026-10-13'
status: 'built'
baseline_revision: '2175176881fc6bfda74af06ae04aa4ec4f446288'
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
deferred: []
---

<intent-contract>

## Intent

**Problem:** epic-adaptive-difficulty waits on "bucket features": a canonical, versioned key that groups realised puzzles by difficulty features (addendum A2; Consistency Conventions `bucketId` e.g. `dm1|add|d2|c1|n5|nm1`; AD-8/AD-9). Core can't compute it today.

**Approach:** Two pure functions in a new `core/difficulty` folder, with the epic Notes' definitions.
- **`bucketOf(puzzle)`** returns `{ features, bucketId }`:
  - `features = { difficultyModelVersion, operator, digits, carries, n, nearMisses }`.
  - `digits` is the digit count of the largest cell.
  - `carries` counts the column carries of `a + b` for `+`, and the borrows of `a − b` for `−`.
  - `nearMisses` is the recorded count of near-misses placed.
  - `bucketId = dm<v>|<op>|d<digits>|c<carries>|n<n>|nm<nearMisses>`.
- **`parseBucketId(id)`** returns `Result<BucketFeatures>` and round-trips exactly. It rejects malformed ids (`invalid-bucket-id`) and never throws.

The carry and borrow counting is written independently of generator v1, so a future generator version can't silently redefine a bucket. Ties are always 0 under the distinct-values decision, so there's no segment for them. Changing the definition means bumping `difficultyModelVersion` (AD-8).

</intent-contract>

## Implementation Notes

Oneshot: two pure functions, types, an error code and tests.

- `packages/core/src/difficulty/{bucket-features.ts,column-steps.ts,bucket-of.ts,format-bucket-id.ts,parse-bucket-id.ts}` (+ tests); `invalid-bucket-id` in `DomainError`; exported from core.
- `columnSteps` re-implements carries and borrows independently of generator v1 (same results, separate definition owned by the difficulty model).

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 6 findings — high 0, medium 0, low 6, false 0, maybe-false 0
- findings:
  - `[low]` `[reject]` `core/difficulty` isn't in the AD-3 purity check. By design: AD-3 allows floats in ratings, probabilities and scores, which epic-adaptive-difficulty will put in this folder. Bucket determinism is pinned by tests instead.
  - `[low]` `[patch]` `bucketOf` parsed `serialiseRational` output, which would silently give NaN and 0 carries once fractions serialise as `n/d`. Fixed: reads `c.n`.
  - `[low]` `[patch]` The round-trip property covered only near-miss count 0, one band and dm1. Fixed: it now varies band (with fallbacks), contract, near-miss count and difficulty-model version, and asserts the carry limit of the served band.
  - `[low]` `[patch]` Exact inversion was tested only format→parse. Fixed: added a parse→format property.
  - `[low]` `[reject]` `parseBucketId` accepts any `dm` version and any n. By design: buckets of older difficulty models must stay parseable (AD-8 keeps old keys), and callers compare `difficultyModelVersion` with the build's.
  - `[low]` `[patch]` The test helper built a `Puzzle` with `as Puzzle`. Fixed: a typed declaration, so the fixture breaks if `Puzzle` changes.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test` -- expected: pass, including fixed-puzzle bucket ids and a round-trip property over realised puzzles

## Auto Run Result

**Summary:** `bucketOf(puzzle)` computes a realised puzzle's difficulty features (difficulty-model version, operator, digit count of the largest cell, carries or borrows of the triple, n, near-misses placed) and its canonical `bucketId` (`dm1|add|d2|c1|n5|nm1`). `parseBucketId` inverts it exactly, returning `invalid-bucket-id` for malformed input and never throwing. This delivers the "bucket features" epic-adaptive-difficulty waits on.

**Files changed:** `packages/core/src/difficulty/*` (+ tests), `packages/core/src/result/domain-error.ts`, `packages/core/src/index.ts`.

**Review findings:** 4 patches applied (low), 0 deferred, 2 rejected (purity scope by design; version acceptance by design).

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 4.

**Verification:** `pnpm typecheck`, `lint:deps`, `test` (all pass, including fixed-puzzle ids, a 400-run round-trip property and a parse→format property), `build` and `CI=1 pnpm e2e` (9) all pass.

**Residual risks:** the feature set is the epic's assumption (no tie segment in the POC). epic-adaptive-difficulty may refine it with a `difficultyModelVersion` bump.
