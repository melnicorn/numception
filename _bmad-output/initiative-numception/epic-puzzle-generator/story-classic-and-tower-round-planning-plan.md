---
title: 'Classic and Tower round planning'
type: 'feature'
ticket: '5'
created: '2026-10-11'
status: done
baseline_revision: '1c31f72a96c6ffdb280507c67057882be14535b2'
route: 'full'
route_source: 'auto'
risk: 'high'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/epic-puzzle-generator.md'
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-puzzle-realisation-for-add-and-sub-plan.md'
warnings: ['oversized']
deferred:
  - summary: >-
      Band 1 had to widen from 1..20 (no carries) to 1..99 (one carry) so Classic n >= 7 and Tower + rounds can be planned under the epic's "leaf answers fit band 1" rule.
    evidence: |-
      With the old band 1, Classic at n >= 7 and every Tower + round were unplannable: upper-tier puzzles need many distinct values, and every value becomes a leaf answer. A round's tier-1 puzzles therefore use numbers up to 99, including one carry, from the start. This is a game-design tension, not a defect. Options for the user, epic-adaptive-difficulty or epic-poc-playtest: per-n band ranges in tuning, smaller n for early rounds, or accepting larger numbers in big rounds.
    location: >-
      content/tuning/1.json; architecture AD-4 / epic Notes (leaf answers fit band 1)
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Core can realise single puzzles but can't plan a round. FR-2 requires Classic (n tier-1 puzzles + 1 tier-2) and Tower (n² + n + 1 puzzles over three tiers) rounds in which every tier is a unique-triple puzzle, fully determined before the player starts tier 1. AD-4 requires top-down planning with lazy leaf realisation, and FR-6 requires an interface that later lets the Pyramid grow upward (OQ-4). epic-core-play-loop consumes this API.

**Approach:** A pure, deterministic round planner in core:
- **Seeds:** a documented `deriveSeed(rootSeed, roundOrdinal)` gives the round seed.
- **Upper tiers:** the planner realises every puzzle above tier 1 at plan time. The top is unconstrained. Each lower upper-tier node takes its parent's cell value as its answer contract.
- **Leaves:** fixed only by their answer contracts and realised lazily later.
- **Registry:** a `RoundType` registry with `plan` and `realise` for `classic` and `tower`.
- **Upward growth:** a plan option pins a cell value at a child index of the top node.

## Boundaries & Constraints

**Always:**
- **Seeds:** `deriveSeed(rootSeed, roundOrdinal) → uint32` lives in `core/random`, beside `nodeSeed`, as a documented integer mix (reuse `fmix32`). Changing it is an output change (AD-6). Node streams stay `nodeStream(roundSeed, nodeId)`.
- **Addressing (AD-4):** `NodeId = { tier, index }`, bottom-anchored (tier 1 holds the leaves). The children of `(k, i)` are `(k−1, i·n … i·n+n−1)`. Classic's top is `(2, 0)` with leaves `(1, 0..n−1)`. Tower's top is `(3, 0)`, with tier 2 `(2, 0..n−1)` and leaves `(1, 0..n²−1)`.
- **Child mapping:** cell `j` of a node, in placement order, is child `i·n + j`. Its value is that child's answer contract.
- **Plan request:** `{ type: 'classic'|'tower', n: 3..9, operator: 'add'|'sub', band?: int (round starting band, default 1), fixedTopCell?: { childIndex, value } }` plus the `TuningConfig`. Specs come from `specFor` (n and operator validated against tuning).
- **Planning rules:**
  - The top node is realised unconstrained in the starting band, or carries the fixed cell (below).
  - Every upper-tier node below the top is realised with `contract` = its parent's cell value.
  - **Leaf contracts must be realisable at tier 1 in the lowest band (band 1)** for the round's n and operator (epic Notes). Check realisability by actually realising the leaf in band 1 at plan time, with the leaf's own node stream, and discard the result. The leaf is realised for real later, by the selector's band.
  - If any child contract of a node is unrealisable, re-plan that node with the next attempt of its own bounded attempt loop: derive a different stream per attempt deterministically, e.g. an attempt counter mixed into the seed. If the attempts run out, fall back up to the parent, and finally return `Result` error `unplannable`.
  - All loops are bounded.
- **Fixed top cell (OQ-4):** with `fixedTopCell`, the top puzzle must contain `value` at cell `childIndex`. Reach it by bounded search over candidate top puzzles containing `value`, then a deterministic move of that cell to `childIndex`, updating roles and answerIndex. It doesn't have to be cleverer than that. Return `unplannable` if nothing is found within the bound.
- **Plan record (JSON-safe):** `{ kind: 'RoundPlan', schemaVersion: 1, roundSeed, type, n, operator, startBand, tiers, nodes }`, where every node is `{ nodeId, contract?, puzzle? }`. Upper-tier nodes carry `puzzle` (a full `Puzzle`); tier-1 nodes carry only `contract`. Add `versions` too.
- **RoundType registry:** `ROUND_TYPES: { classic, tower }`, each `{ plan(request, tuning, roundSeed, versions) → Result<RoundPlan>, realise(plan, nodeId, band, tuning) → Result<Puzzle> }`.
  - `realise` for a leaf uses the plan's contract and the requested band, with lower bands as fallbacks via `specFor`, so a clamp is recorded when the band can't host the contract.
  - For an upper-tier node, `realise` returns the planned puzzle.
  - `onSolve` and `isComplete` belong to the play-loop epic. Leave the registry open for them.
- **Determinism and purity:** same inputs give the same plan. Generator-folder purity rules apply to planner code placed under `core/generator` (or a new `core/rounds` folder; extend the purity check to it).
- **Tuning content:** if `content/tuning/1.json`'s placeholder bands make Tower at n=9 unplannable for an operator, adjust its band values. It's unshipped, so this is allowed. Record the change in Implementation Notes. Golden fixtures use their own fixture tunings.
- **Golden:** add round-plan golden cases (Classic and Tower, several n, both operators, one fixed-top-cell case) to the golden suite, so plans are pinned under Node and WebKit like puzzles. Either extend the golden file format with a `plans` section or add `rounds-v1.json`, and keep `golden:update` and the lock guard working for it.
- **Performance target:** a Tower plan at n=9 should run well under 50 ms on a laptop. Entry 9 gates it in CI.
- **Tests:** round-consistency tests for every n in 3..9, both operators, Classic and Tower:
  - every upper-tier puzzle has exactly one valid triple;
  - each child's contract equals its parent's cell;
  - every leaf contract realises in band 1 with answer = contract;
  - node counts are n + 1 and n² + n + 1;
  - plans are deterministic.

  Add a fast-check property over seeds and ordinals.

**Never:**
- Pyramid, Rapid Fire or Daily round types (v1). Mode state, scoring, solve flow, onSolve, isComplete.
- Selecting leaf bands (epic-adaptive-difficulty). Leaves get a band passed in.
- Shareable seeds or Daily Seed hashing (v1).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Classic | n 3..9, add or sub | n + 1 nodes; top unique; leaf contracts = top cells; each realises in band 1 | No error expected |
| Tower | n 3..9, add or sub | n² + n + 1 nodes; every tier-2 puzzle's answer = top cell; leaf contracts = tier-2 cells | No error expected |
| Determinism | same rootSeed, ordinal, request, tuning | identical plan | No error expected |
| Lazy leaf | `realise(plan, leaf, band 3)` | a puzzle whose answer = contract; clamp recorded if band 3 can't host it | No error expected |
| Upper node | `realise(plan, top)` | the planned puzzle | No error expected |
| Fixed top cell | `fixedTopCell { childIndex 2, value v }` | top's cell 2 = v; still unique | `unplannable` if not found |
| Bad request | n 10, unknown type, operator not enabled in tuning | `invalid-request` / spec error | returned as error |
| Unplannable | a tuning whose band 1 can't host any leaf contract | `unplannable`, no throw, bounded time | returned as error |

</intent-contract>

## Code Map

- `packages/core/src/generator/realise.ts` -- `realise(seed, nodeId, spec, versions)` validates and dispatches (generatorVersion registry). Returns `Result<Puzzle>`, with error codes including `invalid-spec` and `unrealisable`.
- `packages/core/src/generator/{puzzle.ts,puzzle-spec.ts}` -- `Puzzle { seed, nodeId, spec, cells: Rational[], roles {a,b,c}, answerIndex, servedBand, clamp?, nearMisses, versions }`. `PuzzleSpec { n, operator, band, fallbackBands, contract?, nearMissCount, nearMissDelta, maxAttempts }`.
- `packages/core/src/spec/spec-for.ts` -- `specFor(tuning, { n, operator, band, contract? })` returns a `Result<PuzzleSpec>` with lower bands as fallbacks.
- `packages/core/src/random/node-stream.ts` -- `nodeSeed(seed, nodeId)` (documented fmix32 mix, hand-written `mul32`) and `nodeStream`. Put `deriveSeed` here or beside it, documented the same way.
- `packages/core/src/generator/v1/*` -- generator internals, one concept per file. Don't change their output.
- `packages/core/test/golden/*`, `tools/golden-update.mjs`, `tools/golden-lock.mjs`, `tools/golden-harness/*` -- the golden machinery to extend for plans.
- `tools/check-core-purity.mjs` -- scans `core/generator` and `core/random`. Add `core/rounds` if planner code goes there.
- `content/tuning/1.json` -- POC bands: 1..20 c0, 1..50 c1, 5..99 c1, 10..999 c2. Band 1 at n=9 is tight (entry 4 notes).
- `packages/core/src/index.ts` -- public exports. Don't export internals.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/random/derive-seed.ts` (+ tests) -- round seed derivation. -- AD-4
- [x] `packages/core/src/rounds/*` (or `generator/rounds/*`) (+ tests) -- NodeId helpers (children, tiers), plan record types, the planner with bounded re-plan, the fixed top cell, the RoundType registry with classic and tower. -- FR-2, OQ-4
- [x] `packages/core/src/rounds/*.prop.test.ts` -- round-consistency property over seeds and ordinals. -- AD-19
- [x] Golden machinery + fixtures -- pinned round plans under Node and WebKit. -- AD-6
- [x] `tools/check-core-purity.mjs` (+ test) -- cover the planner folder. -- AD-3
- [x] `content/tuning/1.json` -- only if needed for Tower n=9 plannability, with a note. -- POC content

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass, including the round-consistency tests and the Node and WebKit golden checks for plans.
- Given `content/tuning/1.json`, when Classic and Tower rounds are planned for every n in 3..9 and both operators over 50 ordinals each, then all plan successfully, and a Tower plan at n=9 takes under 50 ms on a laptop.

## Implementation Notes

- **Seeds** (`core/random`): `mix32.ts` now holds `mul32`/`fmix32`/`GOLDEN` (moved out of `node-stream.ts`, output unchanged — the puzzle golden cases did not move). `deriveSeed(rootSeed, ordinal) = fmix32((fmix32(rootSeed) ^ ordinal) + 0x85ebca77)`, documented and pinned by an inline snapshot.
- **Planner** (`core/rounds/`, one concept per file): `round-node-id.ts` (top, tier width, node count, children/parent, membership, top-down order), `round-plan.ts` (types), `plan-request.ts` (request checks → `invalid-request`; tuning ranges → `specFor`'s `invalid-spec`; bad seed → `invalid-seed`), `attempt-seed.ts`, `move-cell.ts`, `contract-floor.ts`, `plan-tiers.ts` (the planner), `realise-plan-node.ts`, `round-types.ts` (`ROUND_TYPES` + `planRound`/`realiseRoundNode` dispatchers), `plan-problems.ts` (independent consistency check, not exported from the package index).
  - Attempts: an upper-tier node gets up to `NODE_PLAN_ATTEMPTS` = 16 realisations from `nodeStream(attemptSeed(roundSeed, k), nodeId)`, where `attemptSeed(s, 0) = s` and `attemptSeed(s, k) = fmix32((fmix32(s) ^ k) + GOLDEN)`; the puzzle records the seed it used, so `realise(puzzle.seed, nodeId, spec)` reproduces it. An `unrealisable` attempt moves on to the next attempt (each has its own stream). A node whose attempts run out fails to its parent; the top's failure is `unplannable`, with a message per cause (top unrealisable in the start band; no top with every child plannable; fixed value below the floor; no candidate containing the fixed value; no such candidate with every child plannable).
  - Leaf check: band 1 spec, the leaf's own stream (`nodeStream(roundSeed, leaf)`), result discarded. `realise(plan, leaf, B)` tries band B and the bands between B and 1; if none serves, it realises band 1 exactly as the check did (fresh stream, band-1 spec) and records `clamp { requestedBand: B, servedBand: 1 }`, so the guaranteed contract is always met.
  - Pruning: outcomes are memoised per node and contract only (a leaf's band-1 check, an upper node's failure), never carried across nodes, since success depends on each node's own stream. `contractFloor` rejects contracts below what the puzzle definitions allow for any node (`add` leaf ≥ 3, `add` tier 2 ≥ 7 since both addends must be leaf contracts ≥ 3 and distinct; `sub` ≥ 1). Without the floor, a Tower top cell of 3..6 cost a full 16-attempt loop at tier 2 to discover; with it the Tower `add` n = 9 max is ~25 ms (500 ordinals).
  - Fixed top cell: up to `FIXED_TOP_ATTEMPTS` = 64 candidate tops in the starting band, odd attempts with `value` as the answer contract (so they contain it), even ones unconstrained; the first candidate containing `value` whose children plan has that cell swapped to `childIndex` (`moveCell`; roles and answerIndex follow). The plan echoes `fixedTopCell`. A moved top no longer equals `realise(puzzle.seed, …)`; the plan is its record.
  - Plan record as in the contract, plus `fixedTopCell?`; the top carries no `contract`.
- **Tuning content** (`content/tuning/1.json`, unshipped): under the old POC bands (band 1 = 1..20, no carries) Classic n ≥ 7 and every Tower `add` round were unplannable (every leaf contract must fit band 1 at the round's n). Bands are now 1..99 c1, 10..199 c1, 10..499 c2, 10..999 c2. All Classic and Tower rounds, n 3..9, both operators, plan for 500 ordinals each at the default start band. `packages/app/src/demo-puzzle.test.ts`'s copy of tuning v1 follows (demo puzzle is now 35, 95, 60); `realise.prop.test.ts` keeps the old narrow bands as an edge case, comment updated.
- **Golden**: `generator-v1.json` gains a `plans` section (23 plan cases: Classic and Tower, n 3/5/7/9, both operators, root seeds and ordinals 0..2, start band 2, two fixed-top-cell cases, `wide` tuning, and an expected `unplannable` under `small`). Each expects the round seed, every node (planned puzzles in full: seed, nodeId, spec, cells, roles, answerIndex, servedBand, clamp, nearMisses, versions), and leaf (1, 0) realised lazily in the tuning's highest band. Only `unplannable` is pinned as an expected error; any other planning error fails the case. New tuning fixture `rounds.json` (tuningVersion 5) mirrors the new POC bands. `compareGoldenSeeds` requires the `plans` array; the shipped-lock hash covers it since it is the same file; the WebKit harness reports a plan count (≥ 20 asserted).
- **Tests**: unit tests per rounds file; `round-types.test.ts` runs the consistency check for every n × operator × type (3 ordinals each); `round-plan.prop.test.ts` (fast-check) over root seeds × ordinals for both types plus fixed-top-cell honouring; `tools/round-content.test.ts` plans 50 ordinals per n × operator × type from `content/tuning/1.json` and asserts Tower n = 9 under 50 ms (best-of-5 re-time of the 5 slowest, as in `generation-content.test.ts`).
- **Measured** (this laptop, 500 ordinals, `content/tuning/1.json`): Tower n = 9 `add` p95 ≈ 13.5 ms, max ≈ 25 ms; `sub` p95 ≈ 10 ms, max ≈ 21 ms; Classic n = 9 max ≈ 3 ms.
- **Start band above 1**: allowed and pinned in the golden, but often `unplannable` at larger n (upper puzzles in band 2+ hold cells above band 1's 99, which no leaf can take). That follows from the epic's rule that leaf contracts fit the lowest band.

## Plan Change Log

## Review Triage Log

### 2026-10-12 — Review pass
- verdicts: 6 findings — high 0, medium 3, low 3, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` Cross-node `badContracts` pruning rejected a contract for every later node on a tier after one node failed, though success depends on each node's stream (8 contracts split by leaf index in a scratch check). Fixed: memoisation keyed per node and contract only; `contractFloor` kept, since it holds for every node.
  - `[medium]` `[patch]` `planUpper` stopped its attempt loop at the first `unrealisable`, though each attempt uses a different stream. Fixed: it continues within the 16-attempt bound.
  - `[medium]` `[patch]` Lazy leaf realisation fell back to band 1 on a stream already advanced by band B's attempts, so it might not reproduce the planner's band-1 check. Fixed: after B..2 fail, band 1 is realised exactly as the planner checked it, with clamp recorded. A test forces band 2/4 failure and gets the planner's puzzle.
  - `[low]` `[patch]` Every `unplannable` message blamed leaf contracts. Fixed: distinct messages per cause, with tests.
  - `[low]` `[patch]` Golden `planCase` pinned any planning error code. Fixed: only `unplannable` is recorded; other codes throw, with a test.
  - `[low]` `[patch]` Golden plan puzzles omitted `spec`, `nodeId` and `versions`. Fixed: included (spec with contract, fixed key order); `plans` section regenerated, puzzle cases unchanged.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0

## Auto Run Result

**Summary:** Core now plans Classic (n + 1 puzzles) and Tower (n² + n + 1) rounds top-down from a documented `deriveSeed(rootSeed, roundOrdinal)`:
- **Addressing:** bottom-anchored NodeIds; cell j of node (k, i) is child (k−1, i·n + j).
- **Upper tiers:** every puzzle above tier 1 is realised at plan time. The top is unconstrained in the starting band; lower nodes take their parent's cell as contract.
- **Leaves:** each leaf contract is verified to realise in band 1 with that leaf's own stream, with bounded per-node re-planning and `unplannable` errors.
- **Registry:** `ROUND_TYPES { classic, tower }` provides `plan` and lazy `realise` (band fallback ending in the planner's exact band-1 puzzle, clamp recorded).
- **Upward growth:** `fixedTopCell` supports later upward growth (OQ-4).
- **Golden:** 23 golden plan cases are pinned under Node and WebKit.

**Files changed:**
- `packages/core/src/random/{derive-seed.ts,mix32.ts,node-stream.ts}` (+ tests): seeds.
- `packages/core/src/rounds/*` (+ unit, round-type and property tests), `packages/core/src/result/domain-error.ts`, `index.ts`: the planner and registry.
- `packages/core/test/golden/*`, `packages/core/test/fixtures/{golden-seeds/generator-v1.json,tuning/rounds.json}`: plans in the golden suite.
- `tools/check-core-purity.mjs` (+ test): covers `core/rounds`.
- `tools/round-content.test.ts`: 50 rounds per type, n and operator from content, plus Tower n=9 timing.
- `content/tuning/1.json`: bands 1..99 c1, 10..199, 10..499, 10..999.
- `packages/app/src/demo-puzzle.test.ts`: follows the new bands.

**Review findings:** 6 patches applied (3 medium, 3 low), 1 deferred (band-1 widening, a design tension for the user), 0 rejected.

**Follow-up review recommended:** true. Patched: high 0, medium 3, low 3. The unverified risk is planner reliability across tunings other than the content and fixture ones (per-node memoisation, attempt bounds and the lazy band-1 guarantee were reworked in review). Entry 10's nightly check and entry 9's CI timing will probe it.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm install --frozen-lockfile`, `typecheck`, `lint:deps` (purity covering `core/rounds`), `test`, `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (9, including the WebKit golden check) all pass.
- Every type, n 3..9 and operator plans 500 rounds from content.
- Tower + n=9 plan time is p95 13.5 ms and max 25.4 ms on a laptop.

**Residual risks:**
- Tower + n=9 leaves limited headroom under 50 ms on slower CI runners (entry 9).
- Starting bands above 1 are often unplannable at large n, by the band-1 leaf rule.
- The fixed-top-cell search fails about 2% of the time (simple bounded search, as planned).
