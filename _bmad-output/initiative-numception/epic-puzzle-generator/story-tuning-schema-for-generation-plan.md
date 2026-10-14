---
title: 'Tuning schema for generation'
type: 'feature'
ticket: '3'
created: '2026-10-11'
status: done
baseline_revision: 'e139ac0e31529e297780d540ce47f3803fc485fd'
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
  - '{project-root}/_bmad-output/initiative-numception/epic-puzzle-generator/story-golden-seeds-and-generator-versioning-plan.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** `TuningConfig` holds only `operators: ["add"]` and one `maxValue`. Entry 4 (realisation for + and − at every n under bands) needs the full generation section in data. AD-7 and FR-3 require the schema to reject content the POC doesn't enable (× and ÷), and require that a shipped tuning file can never disappear.

**Approach:** Extend the valibot `TuningConfig` schema (still `schemaVersion: 1`, because v1 is unshipped) and `content/tuning/1.json` with the generation section entry 4 reads. Keep today's generator output identical by deriving the tracer spec from the new fields. Add a CI check over `content/tuning/`.

## Boundaries & Constraints

**Always:**
- **Generation section** (`generation`, strict, unknown keys rejected):
  - `operators`: non-empty, unique, from `["add", "sub"]` only. × and ÷ don't exist in the picklist, so a config naming them fails validation (FR-3 POC).
  - `n`: `{ min, max }` integers with 3 ≤ min ≤ max ≤ 9.
  - `bands`: a non-empty array ordered by `band`. Each band is `{ band: int ≥ 1 (contiguous from 1), minValue: int ≥ 1, maxValue: int ≥ minValue + 2, maxCarries: int ≥ 0 }`. Values bound every cell, and `maxCarries` bounds column carries or borrows of the triple. Value ceiling is `MAX_TUNING_VALUE`.
  - `distractors`: `{ nearMissDelta: int ≥ 1, nearMissShare: number in [0, 1] }`. nearMissShare is the target fraction of the n − 3 distractors that are near-misses, a parameter entry 4 interprets. Floats are allowed here because they're tuning weights, never generation arithmetic (AD-3: quantised before use).
  - `retries`: `{ maxAttempts: int in 1..1000 }`, the bound on realisation retries before falling back a band.
  - Cross-field rules via valibot `check`s with clear messages. Examples: n range valid, bands contiguous, `maxValue` ≥ `minValue` + 2.
- **Compatibility:**
  - The old top-level `generation.maxValue` is removed.
  - The tracer/demo spec (app `demoPuzzle` and core's golden `specForTuning`) takes `maxValue` from band 1.
  - The fixture tuning files under `packages/core/test/fixtures/tuning/` and `content/tuning/1.json` are rewritten so band 1's `maxValue` equals each file's old `maxValue`.
  - **Golden expected outputs must not change.** Run the golden check unchanged. If the fixture file's serialised inputs change, regenerate with `pnpm golden:update` and confirm every expected value is identical.
- **`content/tuning/1.json`:** POC hand-set values with + and −, n 3..9, and about 4 bands, e.g. band 1 values 1..20 with 0 carries, rising to band 4 at 10..999. Exact numbers are a judgement call; note them in Implementation Notes.
- **Content check:**
  - Extend `tools/tuning-content.test.ts`, or add `tools/check-tuning-content.mjs` and run it in CI.
  - Every `content/tuning/*.json` parses, its file name equals `tuningVersion`, versions run 1..N with no gap, and every version listed in `content/tuning/shipped.json` exists.
  - `shipped.json` starts empty with a comment field: v1 is unshipped until the POC release (epic Notes). The check is exercised with temp dirs.
- **Errors:** `parseTuning` keeps returning `Result`, with error messages naming the failing path.

**Never:**
- Generating with bands, −, other n or distractors (entry 4). This ticket only defines and validates the data.
- Non-generation tuning sections (scoring, ratings, durations), which belong to the consuming epics.
- Feature weights for the difficulty prior (epic-adaptive-difficulty).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid | `content/tuning/1.json` | `parseTuning` ok | No error expected |
| × or ÷ | `operators: ["add","mul"]` or `["div"]` | error naming `generation.operators` | returned as error |
| Bad n | `n: { min: 2, max: 9 }` or `{ min: 6, max: 5 }` or `max: 10` | error | returned as error |
| Bad bands | empty, non-contiguous, `maxValue < minValue + 2`, `minValue: 0` | error | returned as error |
| Bad distractors or retries | `nearMissShare: 1.5`, `maxAttempts: 0` | error | returned as error |
| Unknown key | an extra field anywhere in `generation` | error | returned as error |
| Golden unchanged | v1 golden fixtures after the schema change | identical expected outputs; Node and WebKit golden checks pass | No error expected |
| Tuning drives output | band 1 `maxValue` changed in a test config | the demo puzzle's values change with no code change | No error expected |
| Removed shipped file | `shipped.json` lists 1, `1.json` missing (temp dir) | check fails naming version 1 | non-zero exit |
| Gap | `1.json` and `3.json` only (temp dir) | check fails | non-zero exit |

</intent-contract>

## Code Map

- `packages/core/src/tuning/tuning-config.ts` -- `TuningConfigSchema` (strictObject: kind, schemaVersion 1, tuningVersion, generation { operators picklist(['add']), maxValue }) and its type. `max-tuning-value.ts` holds `MAX_TUNING_VALUE`. `parse-tuning.ts` (+ test) wraps valibot in a Result.
- `packages/core/src/generator/operator.ts` -- the `Operator` type. Align it with the picklist (`'add' | 'sub'`) without making realise accept `sub` yet. realise must still reject or not offer `sub` until entry 4. Choose the minimal safe change and note it.
- `packages/app/src/demo-puzzle.ts` -- builds the spec from tuning: switch it to band 1.
- `packages/core/test/golden/{golden-inputs.ts,golden-seeds.ts}` -- `specForTuning` derives the spec from a tuning fixture: switch it to band 1. The fixtures in `packages/core/test/fixtures/tuning/{tiny,small,wide,extreme}.json` use the old shape.
- `packages/core/test/fixtures/golden-seeds/generator-v1.json` -- 90 cases. Its expected values must stay identical.
- `content/tuning/1.json`, `tools/tuning-content.test.ts` -- the content file and its existing check (parses, name equals version).
- `apps/client/src/main.ts` -- passes `content/tuning/1.json` to the dev panel. The dev panel e2e asserts the demo puzzle is valid, so keep it green.
- `.github/workflows/ci.yml`, root `package.json` -- where a new check runs, if one is added.

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/tuning/*` (+ tests) -- the extended schema with cross-field checks and every matrix error row. -- AD-7 data
- [x] `content/tuning/1.json`, `packages/core/test/fixtures/tuning/*.json` -- new shape, band 1 keeping each old maxValue. -- tuning v1
- [x] `packages/app/src/demo-puzzle.ts`, `packages/core/test/golden/*` (+ tests) -- spec from band 1. Golden outputs unchanged. -- compatibility
- [x] `content/tuning/shipped.json`, tuning content check (+ tests with temp dirs), CI wiring -- no-removal and no-gap rules. -- AD-7 retention

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run (also with `BASE_PATH=/numception/`), then all pass with golden expected values unchanged.
- Given a tuning config naming `mul` or `div`, when parsed, then it is rejected.
- Given a test config whose band 1 `maxValue` differs, when the demo puzzle is generated, then its values differ from the default config's, with no code change.

## Implementation Notes

- **Schema** (`core/tuning/tuning-config.ts`): `generation` is a strictObject of `operators` (picklist of `OPERATORS`, min length 1, unique check), `n` (ints 3..9 each, forwarded `min <= max` check on `n.max`), `bands` (min length 1, contiguous-from-1 check on `generation.bands`; each band strict, with a forwarded `maxValue >= minValue + 2` check on `bands.i.maxValue`, values capped at `MAX_TUNING_VALUE`), `distractors` (`nearMissDelta` int 1..MAX_TUNING_VALUE, `nearMissShare` number 0..1) and `retries.maxAttempts` int 1..1000. `MIN_N`, `MAX_N`, `TuningBand` and `OPERATORS` are exported from core. Bands are not required to rise monotonically (not in the contract; entry 4 / the selector can add it).
- **Operator** (minimal safe change): `generator/operator.ts` now defines `OPERATORS = ['add', 'sub']` and `Operator` from it; the tuning picklist reuses it, so they can't drift. `realise`'s existing runtime validation (`operator !== 'add'` → `invalid-spec`, message unchanged) still rejects `sub`; a test pins that. The demo maps `sub` to `−` for display.
- **Tracer spec**: `demoPuzzle` and golden `specForTuning` take `maxValue` from `bands[0]` (the schema guarantees it; a defensive unreachable branch handles `undefined` under `noUncheckedIndexedAccess`). The operator is `add` whenever it is listed, else the first operator (so `["sub","add"]` still realises `add`; a `sub`-only tuning gets realise's `invalid-spec` until entry 4). Tested in both the demo and `specForTuning`.
- **Fixtures**: `small/wide/tiny/extreme` keep band 1 `maxValue` 20/1000/3/2147483647 with `n {3,3}`, `minValue 1`, maxCarries 0/2/0/9, `nearMissDelta 1`, `nearMissShare 0`, `maxAttempts 1`. The golden fixture serialises only the tuning file's name and the derived spec, so `pnpm golden:update` rewrote `generator-v1.json` byte-identically (`git diff e139ac0` is empty).
- **`content/tuning/1.json` POC values**: operators `add, sub`; n 3..9; bands 1: 1..20 / 0 carries, 2: 1..50 / 1, 3: 5..99 / 1, 4: 10..999 / 2; distractors `nearMissDelta 2`, `nearMissShare 0.5`; `retries.maxAttempts 100`. Band 1 keeps the old maxValue 20, and the demo puzzle under it is unchanged (`1, 3, 2`, checked against the baseline commit and pinned in an inline snapshot).
- **Content check**: chose the test route. `tools/tuning-content.mjs` exports `checkTuningContent({ dir, parse })` (parser injected, so no TS import from an .mjs) and `readShipped`; `tools/tuning-content.test.ts` runs it over `content/tuning/` and temp dirs (removed shipped file, gap, not starting at 1, empty dir, misnamed version, invalid config, invalid JSON, stray name, malformed `shipped.json`). It runs in `pnpm test`, so in CI (comment added in `ci.yml`). `content/tuning/shipped.json` is `{ comment, shipped: {} }`, mapping each shipped tuningVersion to the sha256 of its file (mirroring `tools/golden-lock.mjs`); the check fails when a shipped file is missing or its hash differs (temp-dir tests cover both, plus malformed entries); the client imports only `1.json`, so it isn't bundled.

## Plan Change Log

## Review Triage Log

### 2026-10-11 — Review pass
- verdicts: 2 findings — high 0, medium 0, low 2, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` `shipped.json` only checked that listed versions exist, so a shipped tuning file could be edited silently. Fixed: shipped entries map version to sha256 (mirroring golden-lock), and the check fails on a hash mismatch or a missing file, with temp-dir tests. Deleting a file and its lock entry in one commit remains a deliberate act for review, the same as golden-lock.
  - `[low]` `[patch]` The tracer spec took `operators[0]`, so the valid reorder `["sub","add"]` broke the demo until entry 4. Fixed: `add` is used whenever listed, otherwise the first operator, with tests. Golden outputs unchanged.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` -- expected: all exit 0
- Same with `BASE_PATH=/numception/` -- expected: all exit 0
- `git diff e139ac0e31529e297780d540ce47f3803fc485fd -- packages/core/test/fixtures/golden-seeds/generator-v1.json | grep '"expected"' -A30 | grep '^[-+]' | grep -v versions` -- expected: no changed expected values

## Auto Run Result

**Summary:** `TuningConfig` (schemaVersion 1) now carries the full generation section entry 4 reads: operators from `add`/`sub` only (× ÷ can't be expressed), an n range in 3..9, contiguous integer bands with value ranges and carry allowance, distractor near-miss parameters and a retry bound. Unknown keys and cross-field violations are rejected with path-naming errors.
- **Content:** `content/tuning/1.json` holds hand-set POC values (+ and −, n 3..9, four bands).
- **Spec:** the tracer and golden specs read band 1, so golden outputs are byte-identical.
- **Content check:** a tuning content check enforces file name = version, no gaps, and a sha256 lock for shipped files (empty until the POC release).

**Files changed:**
- `packages/core/src/tuning/*`, `packages/core/src/generator/operator.ts`, `index.ts` (+ tests): schema and operators.
- `content/tuning/1.json`, `content/tuning/shipped.json`, `packages/core/test/fixtures/tuning/*.json`: data.
- `packages/app/src/demo-puzzle.ts`, `packages/core/test/golden/*` (+ tests): spec from band 1, add-preferred.
- `tools/tuning-content.mjs` (+ test), `.github/workflows/ci.yml` comment: content check.

**Review findings:** 2 patches applied (low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 2.

**Verification:** with and without `BASE_PATH=/numception/`, the full chain passes (`typecheck`, `lint:deps`, `test`, `build`, `check:flavours`, `check:budget`, `CI=1 pnpm e2e` 9/9). `generator-v1.json` is byte-identical to the baseline. `mul` and `div` are rejected. A different band 1 `maxValue` changes the demo puzzle with no code change.

**Residual risks:** the POC band values are hand-set placeholders. Nothing interprets `maxCarries`, `nearMissShare` or `maxAttempts` until entry 4.
