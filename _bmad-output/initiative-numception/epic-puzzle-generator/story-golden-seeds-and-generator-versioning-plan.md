---
title: 'Golden seeds and generator versioning'
type: 'feature'
ticket: '2'
created: '2026-10-11'
status: done
baseline_revision: 'f67172c729170979f345d6fe336f9211c24662f5'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-seeded-puzzle-tracer-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** AD-6 requires every shipped generator version to stay runnable and any output change to fail CI unless the version is bumped. Puzzles must also reproduce identically under Node and WebKit, which is the iOS engine. Today `realise` is a single hard-coded v1 with no golden fixtures, no WebKit check and no purity check.

**Approach:**
- A `generatorVersion` dispatch registry behind `realise`.
- Golden-seed fixtures per version, verified by a Vitest test (Node) and by a Playwright test that runs the same core code in a WebKit page.
- A lock that guards the fixtures of versions marked shipped.
- A `tools/` purity check for the generator.

## Boundaries & Constraints

**Always:**
- **Dispatch:**
  - `realise(seed, nodeId, spec, versions)` keeps its signature and dispatches on `versions.generatorVersion` through a registry `{ [version]: generatorImpl }` in `core/generator`, where each version's implementation lives in its own module (e.g. `generator/v1/realise-v1.ts`).
  - An unknown version returns the existing `Result` error.
  - Every realised puzzle keeps carrying `{ generatorVersion, difficultyModelVersion, tuningVersion }` (it already does).
  - Telemetry carriage of these is FR-44, epic-adaptive-difficulty.
- **Fixtures:**
  - `packages/core/test/fixtures/golden-seeds/generator-v<N>.json`, with `{ kind: "GoldenSeeds", schemaVersion: 1, generatorVersion, cases: [...] }`.
  - Each case holds its inputs and the expected puzzle in a stable serialised form: inputs `seed`, `nodeId`, `spec`, and a fixture tuning file (`packages/core/test/fixtures/tuning/<name>.json`, not `content/`); expected values as strings, plus placement order, `answerIndex` and versions.
  - At least 50 cases spread across seeds and NodeIds.
  - The fixtures pin inputs, so editing `content/tuning/*.json` never trips them (epic Notes).
- **Node check:** a Vitest test that realises every case of every registered version and deep-compares with the fixture. A version registered without a fixture fails, and so does a fixture without a registered version.
- **WebKit check:**
  - A Playwright project, `golden-webkit`, loads a small static harness page (built with Vite from a dedicated entry, not part of `apps/client`), runs the same comparison in WebKit and reports mismatches.
  - It must fail when the outputs differ. Prove this once by corrupting a fixture locally; there's no need to commit that.
  - It runs in `pnpm e2e` and CI with the other projects.
- **Regeneration:** a `pnpm golden:update` script rewrites fixtures for versions not marked shipped only. It refuses to touch a shipped version.
- **Shipped guard:**
  - `packages/core/test/fixtures/golden-seeds/shipped.lock.json` maps each shipped version to the sha256 of its fixture file.
  - A check (Vitest or `tools/`) fails when a locked fixture's hash differs or a locked version is unregistered.
  - Per the epic Notes, generatorVersion 1 is **not** shipped until epic-poc-playtest's first release, so the lock starts empty (with a comment field explaining the policy), and tests exercise the guard with a temp lock.
- **Purity check:**
  - A `tools/check-core-purity.mjs` (+ test) fails on `Math.`, `uniformFloat`, `Date.now`, `performance.now`, `new Date`, `crypto.` or `Intl` in `packages/core/src/generator/**` and `packages/core/src/random/**` (non-test files), printing file:line.
  - Wire it into `pnpm lint:deps`, or a new script run in CI.
- **Docs:** `packages/core/test/fixtures/golden-seeds/README.md` explains in a few lines how to bump a version, regenerate and lock.

**Never:**
- New generation behaviour (other n, operators, bands): entries 3 and 4.
- Bumping generatorVersion in this ticket. v1 remains v1.
- Adding `@vitest/browser`. The WebKit run uses Playwright with a page harness.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Clean | registered v1, fixture matches | Node and WebKit golden checks pass | No error expected |
| Output drift | generator output changed, fixture not updated | both checks fail, naming the case | non-zero exit |
| Unknown version | `realise` with generatorVersion 99 | `Result` error, no throw | returned as error |
| Missing fixture | version registered with no fixture file | Node check fails | non-zero exit |
| Shipped edit | lock lists v1, fixture file changed | guard fails naming v1 | non-zero exit |
| Update refusal | `golden:update` while v1 is locked | refuses, exits non-zero, files unchanged | non-zero exit |
| Purity | `Math.random()` planted in a generator file | purity check fails at file:line | non-zero exit |

</intent-contract>

## Code Map

- `packages/core/src/generator/realise.ts` -- the current v1 implementation, with `describeValue` and validation, returning `Result`. Split it into the dispatching `realise` plus `v1/` implementation. Keep the validation shared, and keep the error codes and messages stable (tests pin them).
- `packages/core/src/generator/generator-version.ts` (`GENERATOR_VERSION`), `versions-for.ts`, `puzzle-versions.ts` -- version plumbing from 2.1.
- `packages/core/src/random/*` -- `RandomStream` (opaque), `nextInt`, `nodeStream` (hand-written 32-bit multiply, deliberately avoiding `Math.imul`, because AD-3 bans `Math.*` in the generator).
- `packages/core/src/generator/realise.test.ts` -- holds inline snapshots of v1 output. Keep them, or move them into the fixture.
- `playwright.config.ts` -- projects `webkit` (client e2e, :4173), `bakeoff-phaser` (:4174) and `bakeoff-pixi` (:4175), each with its own `webServer`. Add `golden-webkit` the same way on a new port.
- `vitest.config.ts` -- includes `packages/**/src/**/*.test.{ts,tsx}`, `apps/client/*.test.ts` and `tools/*.test.ts`. Widen it if the Node golden test sits under `packages/core/test/`.
- `tsconfig.json` + `tsconfig.tooling.json` -- new TS files (harness, tools, tests outside `src`) must be in a project that `tsc -b` checks.
- `.dependency-cruiser.cjs` -- the harness and tests may import core. Keep `lint:deps` green.
- Root `package.json` scripts and `.github/workflows/ci.yml` (install → typecheck → lint:deps → test → build → check:flavours → check:budget → e2e): put the purity check where it runs on every change.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/generator/realise.ts`, `generator/v1/*`, `generator/registry.ts` (+ tests) -- version dispatch. -- AD-6
- [x] `packages/core/test/fixtures/golden-seeds/*`, `packages/core/test/fixtures/tuning/*`, `packages/core/test/golden.test.ts` (or similar) -- fixtures and the Node check. -- golden seeds
- [x] Golden harness entry + `playwright.config.ts` project + spec -- WebKit check. -- Node and WebKit identity
- [x] `tools/golden-update.mjs` (or core script), `shipped.lock.json`, guard check (+ tests) -- regeneration and the shipped guard. -- version policy
- [x] `tools/check-core-purity.mjs` (+ test), `package.json`, CI -- the purity check. -- AD-3
- [x] `packages/core/test/fixtures/golden-seeds/README.md` -- the bump workflow. -- maintainability

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass, including the `golden-webkit` project and the purity check.
- Given a locally corrupted expected value in the v1 fixture, when the Node and WebKit golden checks run, then both fail naming the case (revert afterwards).
- Given `Math.random()` planted in a generator file, when the purity check runs, then it fails at that file:line (revert afterwards).

## Implementation Notes

- `realise` validates (shared, same codes and messages) then dispatches through the frozen `GENERATORS` registry (`generator/registry.ts`, `Object.hasOwn` lookup); v1 lives in `generator/v1/realise-v1.ts`. The unsupported-version message lists the registered versions, which reads exactly as before while only v1 is registered.
- Shared golden logic is pure TS in `packages/core/test/golden/` (format, `realiseCase`, `compareGoldenSeeds`, `checkGoldenCoverage`, stable `formatGoldenSeeds`). Fixtures and tuning fixtures load with `import.meta.glob`, which Vitest, the Vite harness build and Vite's `runnerImport` all resolve, so Node and WebKit run the same code with no `node:fs` in core tests (AD-1 rules). `packages/core/test/tsconfig.json` is a new `tsc -b` project.
- Case spec is derived from its tuning fixture when inputs are generated (`golden-inputs.ts`); versions are the fixture's generatorVersion, this build's difficultyModelVersion and the tuning's tuningVersion. 88 cases across 10 seeds, 6 NodeIds and 4 tuning fixtures (`small`, `wide`, `tiny`, `extreme`). The existing inline snapshots in `realise.test.ts` are kept and agree with the fixture.
- `pnpm golden:update` (`tools/golden-update.mjs`) loads `update-entry.ts` through Vite `runnerImport` (vite added to root devDependencies at the existing `~8.3.4`). Default: every registered unshipped version; refuses (exit 1, nothing written) for a requested shipped version or when none is left.
- Shipped guard: `tools/golden-lock.mjs` + `tools/golden-lock.test.ts` (runs in `pnpm test`; temp locks exercise changed hash, unregistered and missing fixture). Lock starts empty with a `comment`.
- WebKit: `tools/golden-harness/` (own Vite entry, own tsconfig project), Playwright project `golden-webkit` on :4176, base `./` so BASE_PATH doesn't apply.
- Review fixes: `PuzzleVersions` fields are plain `number`; `realise` accepts any registered generatorVersion and records any positive difficultyModelVersion (only generatorVersion dispatches). Golden case inputs pin `versions` and the comparison rejects a case whose name isn't `caseName(input)`, whose spec isn't `specForTuning(tuning)`, or whose pinned generator/tuning versions disagree with the fixture/tuning. `GENERATORS`, `GeneratorImpl` and `registeredGeneratorVersions` are no longer exported from core's index (tests and the harness import from `src/generator`). v1 fixture regenerated (inputs gained `versions`; expected values unchanged).
- Purity: `tools/check-core-purity.mjs` (comments skipped, strings not) appended to `pnpm lint:deps`.

## Plan Change Log

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 6 findings — high 0, medium 2, low 4, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` Golden inputs didn't pin `difficultyModelVersion`, and `validate` required it to equal the build's constant, so a difficulty-model bump would break every case and every v1 replay (AD-6). Fixed: case inputs pin all three versions, `validate` accepts any positive integer `difficultyModelVersion` (record only), and the fixture is regenerated with `versions` added (no expected values changed). New tests cover replaying under difficulty model 2 and 7.
  - `[medium]` `[patch]` `PuzzleVersions.generatorVersion` admitted only the current literal version, so typed code couldn't request a registered older version without casts. Fixed: version fields are `number`, dispatch decides validity, and the casts are removed.
  - `[low]` `[reject]` The purity check doesn't parse regex literals, so `/a\/*b/` could blank out a planted `Math.random()`. Rare pattern, none in core today, and handling it means adding a regex-literal lexer to the check.
  - `[low]` `[patch]` `GENERATORS` was exported from core's public index, letting consumers skip validation and the Result contract. Fixed: the registry, `GeneratorImpl` and `registeredGeneratorVersions` are no longer public, and tools import from `src/generator`.
  - `[low]` `[patch]` The golden comparison never checked a case's name against its inputs, or its spec against its tuning fixture. Fixed: name, spec (`specForTuning`), pinned generator/tuning versions and the presence of `versions` are all checked, with tests.
  - `[low]` `[reject]` Implementation Notes say 88 cases; the fixture has 90. The fix would edit this build's plan, and the fixture is the record.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0
- Corrupt one expected value in `generator-v1.json`, then run `pnpm test` and `CI=1 pnpm exec playwright test --project golden-webkit` -- expected: both fail; revert
- Plant `Math.random()` in `packages/core/src/generator/v1/*.ts`, then run the purity check -- expected: fails at file:line; revert

## Auto Run Result

**Summary:**
- **Dispatch:** `realise` dispatches through a version registry (v1 moved unchanged to `generator/v1/`).
- **Golden seeds:** 90 golden-seed cases pin inputs (seed, NodeId, spec, a fixture tuning file, all three versions) and expected puzzles. Vitest checks them under Node, and the new `golden-webkit` Playwright project checks them in WebKit, both through the same comparison code.
- **Version policy:** `pnpm golden:update` regenerates only unshipped versions. `shipped.lock.json` (empty until the POC release, per the epic Notes) plus a lock guard fail CI when a shipped fixture changes.
- **Purity:** `tools/check-core-purity.mjs` (run in `lint:deps`) bans `Math.`, `uniformFloat`, clock, Date, crypto and Intl in `core/generator` and `core/random`.

**Files changed:**
- `packages/core/src/generator/{realise.ts,registry.ts,generator-impl.ts,v1/*,puzzle-versions.ts}`, `index.ts` (+ tests): version dispatch.
- `packages/core/test/{golden.test.ts,golden/*,fixtures/golden-seeds/*,fixtures/tuning/*}`: fixtures, shared comparison, README.
- `tools/golden-harness/*`, `playwright.config.ts`: the WebKit check (port 4176).
- `tools/golden-update.mjs`, `tools/golden-lock.mjs` (+ tests): regeneration and the shipped guard.
- `tools/check-core-purity.mjs` (+ test), root `package.json` (scripts, vite devDependency), `vitest.config.ts`, `tsconfig.json`, `.github/workflows/ci.yml` comments.

**Review findings:** 4 patches applied (2 medium, 2 low), 0 deferred, 2 rejected (regex-literal blind spot in the purity check; case count in notes).

**Follow-up review recommended:** true. Patched: high 0, medium 2, low 2. The unverified risk is the version-policy semantics: the AD-6 guarantee (old shipped versions stay replayable under later difficulty-model and generator bumps) is now designed in but has only been exercised with synthetic versions. Review it again at the first real version bump.

**Verification:**
- With and without `BASE_PATH=/numception/`: `pnpm install --frozen-lockfile`, `typecheck`, `lint:deps` (with purity), `test` (all pass), `build`, `check:flavours`, `check:budget` and `CI=1 pnpm e2e` (9, including `golden-webkit`) all pass.
- A corrupted fixture value fails both the Node and WebKit checks, naming the case.
- A planted `Math.random()` fails the purity check at file:line.

**Residual risks:**
- The purity check's regex-literal blind spot.
- Fixtures load through Vite's `import.meta.glob` with a hand-written type declaration.
