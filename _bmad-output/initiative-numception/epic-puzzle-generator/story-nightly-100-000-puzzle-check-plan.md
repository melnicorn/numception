---
title: 'Nightly 100,000-puzzle check'
type: 'chore'
ticket: '10'
created: '2026-10-13'
status: done
baseline_revision: '5f6916f04796d8c93c8510757bcb04ab36fec8d7'
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

**Problem:** FR-1, AD-19 and epic Done-when 1 need a nightly run in which an **independent** checker finds exactly one valid triple in 100,000 generated puzzles per n and enabled operator, and every sampled round passes at every tier. Nothing runs at that scale today.

**Approach:**
- **Workflow:** `.github/workflows/nightly.yml`, run on a schedule and by `workflow_dispatch`, as a matrix over n = 3..9.
- **Per job:** run `pnpm nightly:check`, which realises 100,000 puzzles per enabled operator for that n under `content/tuning/1.json`, spread across every band, and plans 200 Classic and 200 Tower rounds.
- **Checker:** a separate brute-force module (`tools/nightly/independent-check.mjs`) that shares no code with the generator. For puzzles it checks distinct positive integers, exactly one valid triple, and an answer consistent with the operator. For rounds it checks that every upper-tier puzzle is unique, that child contracts equal their parent's cells, and that every leaf realised in band 1 answers its contract.
- **Size knobs:** `NIGHTLY_N` and `NIGHTLY_COUNT` pick the n and the count, so the same file runs a small smoke locally.
- **Unit tests** in the regular suite prove the checker rejects planted bad puzzles: two triples, none, duplicates, zero, the wrong answer, and a bad child contract.

</intent-contract>

## Implementation Notes

Oneshot: an independent checker module with its tests, one Vitest run file with its own config, and a workflow.

- `tools/nightly/{independent-check.mjs,independent-check.test.ts,uniqueness.nightly-test.ts,vitest.nightly.config.ts}`, `.github/workflows/nightly.yml` (daily 06:17 UTC and manual dispatch, matrix n 3..9), `pnpm nightly:check`; `vitest.config.ts` and `tsconfig.tooling.json` include `tools/nightly`.
- Locally, n=9 at 100,000 puzzles per operator plus 800 rounds takes about 14 s.

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 3 findings — high 0, medium 1, low 2, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` Leaf puzzles of sampled rounds were checked only for their answer, never for uniqueness, so contract-constrained tier-1 puzzles went unchecked, against Done-when 1 ("every round passes at every tier"). Fixed: leaves realised in band 1 go through `puzzleProblems` too; a unit test plants a leaf with extra triples.
  - `[low]` `[patch]` Invalid `NIGHTLY_COUNT` or `NIGHTLY_ROUNDS` values gave a green no-op run. Fixed: both are validated, and attempted puzzle and round totals are asserted.
  - `[low]` `[patch]` Served-band coverage wasn't reported or checked. Fixed: the served-band spread is printed, and a band serving no puzzles fails (locally all four bands serve 25% each).

## Verification

**Commands:**
- `pnpm test` -- expected: the checker's unit tests pass, and planted bad puzzles are rejected
- `NIGHTLY_N=9 NIGHTLY_COUNT=2000 pnpm nightly:check` -- expected: passes, printing counts
- GitHub: dispatch the nightly workflow once -- expected: every n job green

## Auto Run Result

**Summary:** A nightly GitHub workflow (schedule plus manual dispatch, matrix n 3..9) runs `pnpm nightly:check`. It realises 100,000 puzzles per enabled operator across every band and checks 200 Classic and 200 Tower rounds, all judged by an independent brute-force checker that shares no code with the generator.
- **Puzzles:** distinct positive integers, exactly one valid triple, and an answer consistent with the operator.
- **Rounds:** every tier valid, child contracts equal their parent's cells, and leaves answer their contracts.

**Files changed:** `tools/nightly/*`, `.github/workflows/nightly.yml`, `package.json`, `vitest.config.ts`, `tsconfig.tooling.json`.

**Review findings:** 3 patches applied (1 medium, 2 low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 1, low 2.

**Verification:**
- The checker's unit tests reject planted bad puzzles and rounds.
- `NIGHTLY_N=9 NIGHTLY_COUNT=20000 pnpm nightly:check` passes, with all four bands served.
- A bad `NIGHTLY_COUNT` fails.
- `pnpm typecheck`, `lint:deps` and `test` pass.
- The GitHub workflow is dispatched once after this push.

**Residual risks:** the checker runs only against `content/tuning/1.json`; other tunings are covered by the property tests.
