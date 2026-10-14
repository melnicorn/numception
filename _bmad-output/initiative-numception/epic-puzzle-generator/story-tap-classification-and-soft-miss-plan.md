---
title: 'Tap classification and soft miss'
type: 'feature'
ticket: '6'
created: '2026-10-13'
status: 'built'
baseline_revision: '18aff275f68015aead3c8ec33ae5632fd86b2f1b'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
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

**Problem:** FR-4 and epic Done-when 5 require soft-miss classification for − puzzles as a core rule result. Today nothing in core says whether a tap is correct.

**Approach:** Add `classifyTap(puzzle, cellIndex) → Result<TapOutcome>` in a new `core/rules` folder.
- **Outcomes:** `'correct'` for the answer cell `c`. `'softMiss'` only for cell `b` of a `sub` puzzle, where `a − c = b` also holds (glossary). `'wrong'` for every other cell, including `b` of an `add` puzzle.
- **Bad index:** a cell index that isn't an integer in `0..n−1` returns an `invalid-cell` DomainError and never throws. Taps on shared edges never reach this, because layout hit-testing handles them.
- **Tests:** property tests (fast-check) over realised puzzles for every n and both operators. They re-derive the expected outcome from the cell values themselves rather than trusting `roles`.

</intent-contract>

## Implementation Notes

Oneshot: one small pure rule, one error code, and its tests.

- `packages/core/src/rules/{tap-outcome.ts,classify-tap.ts}` (+ unit and fast-check property tests); `invalid-cell` added to `DomainError`; exported from core.
- `core/rules` added to the purity check's `PURE_DIRS` (AD-3), with a test.

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 3 findings — high 0, medium 0, low 3, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` The property test returned early when `realise` failed, so it could pass vacuously. Fixed: it asserts `realise` succeeds (this band realises every n and operator).
  - `[low]` `[patch]` The property test overwrote `triple` and only checked it was defined, never that exactly one triple exists. Fixed: it collects all triples and asserts exactly one.
  - `[low]` `[patch]` The purity-check header comment's folder list read wrongly after adding `rules`. Fixed wording.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test` -- expected: all pass, including the classify-tap property tests

## Auto Run Result

**Summary:** `classifyTap(puzzle, cellIndex)` in the new `core/rules` folder returns `correct` for the answer cell, `softMiss` only for cell `b` of a − puzzle, and `wrong` otherwise (including `b` of a + puzzle). A bad cell index returns `invalid-cell` and never throws. This meets epic Done-when 5.

**Files changed:** `packages/core/src/rules/*` (+ tests), `packages/core/src/result/domain-error.ts`, `packages/core/src/index.ts`, `tools/check-core-purity.mjs` (+ test).

**Review findings:** 3 patches applied (low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 3.

**Verification:** `pnpm typecheck`, `lint:deps` (purity now covers `rules`), `test` (all pass, including a 300-run property over n 3..9 and both operators that re-derives outcomes from cell values), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (9) all pass.

**Residual risks:** none notable. The play loop applies soft-miss consequences (FR-4 effects) in epic-core-play-loop.
