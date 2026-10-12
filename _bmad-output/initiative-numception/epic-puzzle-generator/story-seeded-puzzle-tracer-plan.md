---
title: 'Seeded puzzle tracer'
type: 'feature'
ticket: '1'
created: '2026-10-11'
status: 'built'
baseline_revision: '952545fe89a7775b722a5994bd04b22a8de06098'
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
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** `core` has no generator yet: no PRNG, no tuning, no puzzle type. Every later entry of this epic grows the generator, and the path core → app → ui → playtest PWA is unproven for real game data.

**Approach:** The thinnest real path:
- **core:** a pinned pure-rand stream, a minimal valibot `TuningConfig` schema, and `realise(seed, nodeId, spec, versions)` that produces one + puzzle at n=3.
- **app:** a function that validates the tuning and asks core for the demo puzzle.
- **dev panel:** shows that puzzle, its seed and versions in the playtest PWA.
- **content:** the tuning file `content/tuning/1.json`, bundled by `apps/client` and passed in explicitly (AD-7).

## Boundaries & Constraints

**Always:**
- **Determinism (AD-3):**
  - core reads no clock, ambient randomness, locale or env.
  - Randomness only from pure-rand **8.4.2 (exact pin)** `xoroshiro128plus` in pure style, using integer distributions (`uniformIntDistribution` or equivalent) only.
  - No `Math.random`, `Math.*` float scaling or `uniformFloat*` in `packages/core/src/generator`.
- **Streams:** `realise` derives its stream from `seed` and the `NodeId` (`{ tier, index }`) with a fixed, documented integer mix (a small exported function, e.g. `nodeStream(seed, nodeId)`). Same inputs, same puzzle.
- **Puzzle:** n = 3, operator `+`: three **distinct positive integers** a, b, c with a + b = c, no zero.
  - Cell placement is a seeded permutation, so c's position varies.
  - Values are carried as a POC integer `Rational` (`{ n, d: 1 }`, serialised `"n"`) with a core `displayValue(r)` returning the display string. A full `Rational` with fractions is v1.
  - The puzzle records `answerIndex` and the versions `{ generatorVersion: 1, difficultyModelVersion: 1, tuningVersion: <from config> }`.
- **Tuning (AD-7):**
  - `content/tuning/1.json` carries `{ kind: "TuningConfig", schemaVersion: 1, tuningVersion: 1, generation: { operators: ["add"], maxValue: <int> } }`, kept minimal. Entry 3 extends it.
  - A valibot schema in core validates it and returns `Result<TuningConfig, DomainError>`. core never throws on bad input.
  - core never imports the JSON file. `apps/client` imports it and passes it down.
- **Errors:** `core` returns `Result<T, DomainError>` (discriminated `code`) and never throws on game input.
- **AD-1 import directions:**
  - `app` imports only `core`.
  - `ui` imports `app`, plus core types only (`import type`).
  - `apps/client` passes the tuning JSON into `mountDevPanel`.
  - `pnpm lint:deps` stays green.
- **Dev panel:** inside the existing panel, a "Puzzle" block showing seed, n, operator, the three cells in placement order (answer marked), and the three versions. The demo seed is a fixed constant, so reloads show the same puzzle.
- **Conventions:** one exported concept per file in core, `kebab-case.ts`, tests beside the source.
- **Tracer cleanup:** the existing `tracer-value`/`tracer-message` tracer stays (e2e and the page rely on `5/6`). Don't remove it in this ticket.

**Never:**
- Other n or operators, distractors, bands, round planning, golden-seed fixtures or version dispatch (entries 2–5).
- Fractions, negatives, × or ÷.
- Reading tuning from globals or the network.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Determinism | same seed, NodeId, spec, tuning | identical puzzle (values, placement, answerIndex) | No error expected |
| Variety | different seeds or NodeIds | different puzzles across a sample (not all equal) | No error expected |
| Validity | any seed | three distinct integers in 1..maxValue, the answer cell equals the sum of the other two | No error expected |
| Bad tuning | missing `generation`, wrong `kind`, `maxValue` < 3, an operator other than `add` | `Result` error with a code, no throw | returned as error |
| Dev panel | playtest PWA, panel opened | Puzzle block with seed, cells, answer marker and versions; same after reload | No error expected |
| Prod | prod build | no dev panel, so no puzzle block (unchanged) | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/index.ts` -- currently exports `tracerValue`. Add the new exports. `packages/core/package.json` has no deps: add `pure-rand` `8.4.2` exact and `valibot` `~1.5.x`. dependency-cruiser already allows exactly these in core (`CORE_PURE_DEPS`), and `vitest`/`fast-check` in core tests.
- `packages/app/src/index.ts` -- exports `tracerMessage`. Add the demo-puzzle function (e.g. `demoPuzzle(tuningJson, seed)` returning a plain view-friendly object or a Result). The app rule allows only core imports.
- `packages/ui/src/dev-panel/dev-panel.tsx` (+ `mount-dev-panel.ts`) -- the panel shell with `DEV_PANEL_ID`. It must remain the dev-panel marker that `tools/check-flavours.mjs` checks. `mountDevPanel(el)` gains the tuning argument.
- `apps/client/src/main.ts` -- guarded dynamic import of `@numception/ui/dev-panel` behind `__NUMCEPTION_DEV_PANEL__`. Import `content/tuning/1.json` inside that branch, so prod never bundles it. Allow the JSON import in `apps/client/tsconfig.json` (`resolveJsonModule`) if needed.
- `content/` -- only `README.md` today. Create `content/tuning/1.json`.
- `apps/client/e2e/dev-panel.spec.ts` -- the existing dev-panel e2e (playtest preview). Extend it to assert the Puzzle block.
- `tools/check-budget.mjs`, `tools/check-flavours.mjs` -- must stay green: prod must contain no dev-panel marker, and the size budget must hold.
- pnpm 11 enforces a minimum release age; pure-rand 8.4.2 and valibot 1.5.0 are old enough.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/random/*` -- pinned xoroshiro128plus stream helpers and `nodeStream(seed, nodeId)` (documented mix), with tests. -- determinism base
- [x] `packages/core/src/numbers/*` -- POC integer `Rational`, `displayValue`, with tests. -- AD-5 shape
- [x] `packages/core/src/tuning/*` -- valibot `TuningConfig` schema (minimal) and `parseTuning(json)` returning a Result, with tests. -- AD-7
- [x] `packages/core/src/generator/*` -- `Puzzle`/`NodeId`/`PuzzleSpec`/versions types, and `realise(seed, nodeId, spec, versions)` for + at n=3, with tests for every matrix row. -- the generator seed
- [x] `content/tuning/1.json` -- minimal config. -- tuning v1
- [x] `packages/app/src/*` -- demo-puzzle function and test. -- core → app
- [x] `packages/ui/src/dev-panel/*`, `apps/client/src/main.ts` -- Puzzle block; client passes the tuning JSON. -- app → ui → PWA
- [x] `apps/client/e2e/dev-panel.spec.ts` -- assert the Puzzle block (three cells, answer equals the sum of the other two, same after reload). -- browser proof

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass.
- Given the playtest preview, when the dev panel is opened twice across a reload, then it shows the same three-cell puzzle whose answer equals the sum of the other two cells.
- Given the prod build, when it is searched, then it contains no dev-panel marker and no tuning JSON.

## Implementation Notes

- `PuzzleSpec` carries `maxValue` (built from `tuning.generation.maxValue` by app), so `realise(seed, nodeId, spec, versions)` keeps the planned signature without taking the tuning.
- `realise` draws `c` in `3..maxValue`, then `a` in `1..⌊(c−1)/2⌋` (`b = c − a > a`), then a Fisher–Yates placement. The schema caps `maxValue` at 2^31 − 1 so the halving shift is exact.
- `nodeSeed` mix: `h0 = fmix32(seed)`, `h1 = fmix32((h0 ^ tier) + 0x9e3779b9)`, `h2 = fmix32((h1 ^ index) + 0x9e3779b9)` (uint32, MurmurHash3 finaliser). The 32-bit multiply is hand-rolled because `core/random` reads nothing from `Math`; checked against a `Math.imul` reference over 20,000 inputs (not committed).
- `realise` validates seed (uint32), NodeId, spec and versions and returns `invalid-seed` / `invalid-node-id` / `invalid-spec` / `unsupported-version` instead of throwing.
- ui stays off core entirely: app returns a plain `DemoPuzzleView` (cell texts from core `displayValue`).
- The real `content/tuning/1.json` is checked by `tools/tuning-content.test.ts` (app tests may not import `content/` under the AD-1 rules); `tsconfig.tooling.json` now references `packages/core`.
- In dev/playtest, Rollup puts core/app in the shared entry chunk (the tracer already imports app); the JSON is its own chunk. Prod contains neither the JSON nor the schema literal.
- No fast-check in the workspace yet, so the matrix tests use deterministic seed sweeps.

## Plan Change Log

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 4 findings — high 0, medium 0, low 4, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` The `RandomStream` brand was optional, and `clone()` exposed a mutable generator, so raw pure-rand generators typechecked and the "pure style" claim wasn't enforced. Fixed: opaque type with a required `unique symbol` brand and no methods, plus `@ts-expect-error` type tests showing raw generators and `.next()` are rejected.
  - `[low]` `[patch]` `realise` built its error messages with `JSON.stringify`, which throws on bigints and cycles, so bad input could throw. Fixed: a safe `describeValue`, object checks before field reads, and tests for bigint, circular, null and undefined inputs returning error Results.
  - `[low]` `[patch]` `puzzle-versions.ts` and `tuning-config.ts` exported several concepts each. Fixed: split into `generator-version.ts`, `difficulty-model-version.ts`, `versions-for.ts` (factory renamed `versionsFor`), `puzzle-versions.ts` (type) and `max-tuning-value.ts`.
  - `[low]` `[patch]` `next-int.ts` and the versions factory had no tests beside them. Fixed: added `next-int.test.ts` and `versions-for.test.ts`.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` exported -- expected: all exit 0
- `grep -rn "Math\.\|uniformFloat\|Date\.now\|performance\.now" packages/core/src/generator packages/core/src/random` -- expected: no output
- `grep -rl '"TuningConfig"' apps/client/dist/prod` -- expected: no output

## Auto Run Result

**Summary:** The first real generator path:
- **core:** a pinned pure-rand 8.4.2 xoroshiro128plus stream behind an opaque `RandomStream`, with integer-only `nextInt` and a documented `nodeStream(seed, nodeId)` mix.
- **numbers:** a POC integer `Rational` with `displayValue`.
- **tuning:** a valibot `TuningConfig` with `parseTuning` returning a `Result`, plus `content/tuning/1.json`.
- **generator:** `realise(seed, nodeId, spec, versions)` produces a distinct-positive-integer `+` puzzle at n=3 with seeded placement and versions.
- **app:** `demoPuzzle` feeds it to a new Puzzle block in the playtest dev panel. The client bundles the tuning JSON only in dev-panel flavours.

**Files changed:**
- `packages/core/src/{result,random,numbers,tuning,generator}/*` (+ tests), `packages/core/package.json`, `index.ts`: generator foundations.
- `content/tuning/1.json`, `tools/tuning-content.test.ts`, `tsconfig.tooling.json`: tuning v1 and its content check.
- `packages/app/src/demo-puzzle.ts` (+ test), `index.ts`: core → app.
- `packages/ui/src/dev-panel/*`, `apps/client/src/main.ts`, `apps/client/e2e/dev-panel.spec.ts`: dev panel Puzzle block and its e2e.

**Review findings:** 4 patches applied (all low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 4.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm install --frozen-lockfile`, `typecheck`, `lint:deps`, `test` (231), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (8) all pass.
- No `Math.`, `uniformFloat` or clock reads in `core/generator` or `core/random`.
- Prod contains no tuning JSON or schema.

**Residual risks:**
- The 32-bit multiply in the seed mix is hand-written to avoid `Math.imul` under the plan's grep. Inline snapshots pin it, and it was checked against `Math.imul` over 20,000 inputs, but that check isn't committed. Entry 2's purity check should ban float `Math.*`, not integer ops.
- fast-check isn't installed yet; entry 4 adds it.
