---
title: 'Dependency boundaries and banned-list lint'
type: 'chore'
ticket: '4'
created: '2026-10-09'
status: done
baseline_revision: 'db4ac65fc09957a34f3a65a4df610a1d4f2c1f25'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** AD-1's import directions and banned list exist only on paper. Nothing stops game rules leaking into adapters, Capacitor or DOM code reaching the domain, or an ad, analytics, crash or live-update SDK (or a remote script) slipping in. Later epics (the puzzle generator first) wait on this guard.

**Approach:** Add dependency-cruiser 18.5.x with `.dependency-cruiser.cjs` at the repo root, encoding the architecture's dependency diagram and AD-1's rules plus banned-package rules. Add a small check that no banned package appears anywhere in the lockfile and no source or HTML loads a remote script, stylesheet or font. Run both in CI as `pnpm lint:deps`, with tests proving that a forbidden import and a banned package each fail.

## Boundaries & Constraints

**Always:**
- Import directions follow the diagram (architecture § Design Paradigm) and AD-1:
  - `core` imports only itself and the pinned pure dependencies `pure-rand` and `valibot`. No workspace package, no Node built-in, nothing else. Its `*.test.ts` files may also import `vitest` and `fast-check`.
  - `app` imports `core` only (plus itself).
  - `render` and `ui` import `app`. They may import `core` only as type-only imports.
  - `platform-web` and `platform-native` import `app` only.
  - `apps/client` may import any package.
  - Nothing under `packages/` imports `apps/` or `prototypes/`.
- Library confinement: only `render` (and `prototypes/`) may import `phaser` or `pixi.js`/`pixi-filters`. Only `ui` imports `preact`/`@preact/*`. Only `platform-native` and `apps/client` import `@capacitor/*`.
- `prototypes/` is outside the package rules (it may import its renderer libraries) but may never be imported from `packages/` or `apps/client/src`.
- The banned list (advertising, attribution, third-party analytics, crash SDKs, live-update and OTA plugins) is one named list, written once and used by both the dependency-cruiser rule and the lockfile check, with a comment per group.
- Remote loading is forbidden: no `http(s)://` script, stylesheet, font, CSS `url()`/`@import`, or dynamic `import()` in `packages/*/src`, `apps/client/src`, `apps/client/index.html` or `content/`.
- No circular dependencies; no unresolvable imports in `packages/` and `apps/client/src`.
- The clean workspace passes.

**Never:**
- Changing package code to satisfy the rules unless the current code genuinely violates AD-1. If it does, record the violation and its fix in Implementation Notes.
- Flavours, the dev panel, the size budget (later tickets).
- Weakening a rule to make a test pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Clean | the current workspace | `pnpm lint:deps` exits 0 | No error expected |
| Inward violation | `core` imports `@numception/app`, or `app` imports `ui` | lint fails, naming the rule and both files | non-zero exit |
| Library confinement | `core` or `app` imports `preact`, `@capacitor/core` or `phaser` | lint fails | non-zero exit |
| Value import of core from ui/render | `import { x } from '@numception/core'` in `ui` (not `import type`) | lint fails | non-zero exit |
| Prototype import | anything in `packages/` imports `prototypes/…` | lint fails | non-zero exit |
| Banned import | a source imports e.g. `@sentry/browser` or `@capgo/capacitor-updater` | lint fails | non-zero exit |
| Banned package installed | the lockfile contains a banned package, even transitively and even unimported | lint fails, naming the package | non-zero exit |
| Remote load | `<script src="https://cdn…">` in `index.html`, or `@import url(https://fonts…)` in CSS | lint fails, naming file and line | non-zero exit |
| Allowed core deps | `core` imports `valibot`/`pure-rand`; a core test imports `vitest` | passes | No error expected |

</intent-contract>

## Code Map

- `package.json` (root) -- scripts `typecheck`, `test`, `build`, `e2e`. Add `lint:deps` and the `dependency-cruiser` devDependency.
- `.github/workflows/ci.yml` -- the `ci` job runs install → typecheck → test → build → e2e. Add `pnpm lint:deps` after typecheck.
- `pnpm-workspace.yaml` -- members `packages/*`, `apps/*`, `prototypes/renderer-bakeoff/*`.
- Workspace packages resolve through `exports: { ".": "./src/index.ts" }` symlinks under `node_modules/@numception/*`. dependency-cruiser must resolve them to `packages/<name>/src/...` real paths (`preserveSymlinks: false`, with the TS config for resolution) so path rules apply.
- Current imports: `apps/client/src/main.ts` → `@numception/ui`; `packages/ui` → `@numception/app` and `preact`; `packages/app` → `@numception/core`; `core`, `render`, `platform-web` and `platform-native` import nothing. Root `vitest.config.ts`, `playwright.config.ts`, `apps/client/*.ts` (configs and tests) and `prototypes/**` are tooling or prototype code.
- `tsconfig.base.json` / root `tsconfig.json` -- any new `.ts` test or tool file must be inside a TS project that `tsc -b` checks (e.g. extend `tsconfig.tooling.json`). `vitest.config.ts` includes `packages/**/src/**/*.test.{ts,tsx}` and `apps/client/*.test.ts`. Widen it for new tests.
- pnpm 11 enforces a minimum release age. If the newest patch is too new, pin the previous one.

## Tasks & Acceptance

**Execution:**
- [x] `tools/banned-packages.cjs` (or similar) -- the single named banned list, grouped with comments: ad SDKs (e.g. AdMob/Google Mobile Ads, AppLovin, ironSource, Unity Ads), attribution (AppsFlyer, Adjust, Branch, Kochava, Singular), third-party analytics (Firebase/GA analytics, Mixpanel, Amplitude, Segment, PostHog), crash SDKs (Sentry, Bugsnag, Crashlytics), live-update and OTA (Capgo updater, Ionic Appflow/live-updates, Capawesome live-update, CodePush). -- one source of truth
- [x] `.dependency-cruiser.cjs` -- forbidden rules for every Always bullet above (named, with a `comment` citing AD-1), plus no-circular and not-to-unresolvable, scoped to `packages/` and `apps/client/src`. Type-only allowance for `render`/`ui` → `core`. Test-file allowance for `core`. -- the boundary lint
- [x] `tools/check-supply.mjs` (or similar) -- fails on any banned package in `pnpm-lock.yaml`, and on remote script/style/font/`url()`/`@import`/`import()` URLs in the scoped sources and HTML. Prints file:line or the package name. -- what dependency-cruiser can't see
- [x] `package.json` -- `lint:deps` runs dependency-cruiser over `packages apps/client/src` with the config, then the supply check. Add the dependency-cruiser devDependency. -- one command
- [x] `.github/workflows/ci.yml` -- run `pnpm lint:deps` after typecheck. -- CI enforcement
- [x] `tools/*.test.ts` and fixtures -- Vitest tests driving dependency-cruiser's API against small fixture trees (or temp dirs) and the supply check against fixture lockfile and HTML text, covering every matrix row. Fixtures must not be swept up by the real `lint:deps` run, `tsc -b` or the e2e. -- proves violations fail

**Acceptance Criteria:**
- Given the clean workspace, when `pnpm lint:deps` runs, then it exits 0.
- Given a temporary `import { tracerMessage } from '@numception/app'` added to `packages/core/src/index.ts`, when `pnpm lint:deps` runs, then it exits non-zero naming the rule (revert afterwards).
- Given a temporary `@sentry/browser` entry in a package's dependencies plus lockfile (or a lockfile fixture), when the supply check runs, then it exits non-zero naming the package.
- Given the repo, when `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && CI=1 pnpm e2e` run, then all pass.

## Implementation Notes

- **No AD-1 violations in the current code.** No package code changed. The clean workspace passes `pnpm lint:deps`. Cruised: 15 modules, 12 dependencies, 14 files scanned for remote loads.
- **dependency-cruiser 18.5.0** (`~18.5.0`). It was published 2026-09-30, so it clears pnpm's minimum release age.
- **Type-only detection** needs `tsPreCompilationDeps: true`. Without it, dependency-cruiser drops `import type` edges entirely. `adapters-import-core-types-only` then uses `dependencyTypesNot: ['type-only']`. `import { type X }` (inline type modifier) counts as a value import under `verbatimModuleSyntax` and is rejected. Use `import type`.
- **`app` rule reading.** "`app` imports `core` only" is applied literally to non-test `app` source: no npm packages and no Node built-ins. The existing `packages/app/src/tracer-message.test.ts` imports `vitest`, so `app` test files get the same `vitest`/`fast-check` allowance as `core` tests (`app-tests-import-only-core-and-test-deps`). Without it the clean workspace would fail. `render`, `ui` and the platform packages are restricted only among workspace packages. Their npm use is limited by the confinement rules and the banned list.
- **Library-path matching.** The `npm()` helper in `.dependency-cruiser.cjs` matches both resolved pnpm paths (`node_modules/.pnpm/x@v/node_modules/x/...`) and unresolved bare specifiers. A banned or confined import is caught even when the package is not installed.
- **Banned-list globs.** `*` stays within one name segment. An unscoped entry also matches under any scope, so `*admob*` catches `@capacitor-community/admob`. Generic words (adjust, branch, segment) are exact names, to avoid false positives such as `adjust-sourcemap-loader`. dependency-cruiser rejects regexes with nested quantifiers ("unsafe regular expression"), so an optional scope is written as two alternatives, not as `(@scope/)?`.
- **`exclude`** is anchored to `^packages/<name>/(.tsbuild|dist)/`. A first, unanchored `/dist/` pattern also hid `vitest/dist/index.d.ts` and silently dropped the test-file edges.
- **Lockfile parsing** is line-based for pnpm lockfile v9, including pnpm 11's multi-document form. It reads `packages:`/`snapshots:` keys, `snapshots:` dependency entries and `importers:` dependency entries. It ignores `peerDependencies` ranges in `packages:`, which are not installs.
- **Remote-load scan** covers `<script src>`, any `<link href>`, CSS `@import`, `url()` (in any scanned file, including JSON in `content/`), dynamic `import()`, and static or side-effect `import ... from`. It flags `http://`, `https://` and protocol-relative `//` URLs, and reports `file:line`.
- **Real-repo `core -> @numception/app`.** `core` has no `@numception/app` dependency link, so the import does not resolve. Lint reports `core-imports-only-pure-deps` and `not-to-unresolvable` with the specifier as `to`. When the import resolves (the fixture tests link every workspace package), the violation names both real file paths.
- **Known gap.** The automatic JSX runtime import (`preact/jsx-runtime`, which `tsc` injects for `.tsx`) is not a source-level import, so dependency-cruiser does not see it. Today only `ui` has a JSX config. A `.tsx` file in another package would not trip `preact-only-in-ui`. It would fail `tsc` without a JSX config, though.
- **Tests.** `tools/dependency-boundaries.test.ts` uses the real config and builds temp fixture workspaces in the OS temp dir, with pnpm-style stub installs. `tools/check-supply.test.ts` covers inline lockfile and HTML fixtures, temp-dir repos and the CLI. Both are in `vitest.config.ts`, and `tsconfig.tooling.json` now type-checks `tools/*.ts|mjs|cjs` (`allowJs` + `checkJs`).

## Plan Change Log

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 5 findings — high 0, medium 1, low 4, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` `findRemoteLoads` matched one line at a time, so a formatter-split `<link>`/`<script>` tag or `import(` with a remote URL passed. Fixed: patterns now run over the whole file and the reported line comes from the URL's offset. Added three multi-line tests. Checked by hand: a split `<link href="https://…">` in `apps/client/index.html` now fails at line 15.
  - `[low]` `[patch]` The `check-supply.mjs` entry guard compared the real path to an unresolved `argv[1]`, so running it through a symlink silently skipped the check (fail-open). Fixed: both paths are now resolved before comparing. Added a symlinked-run test.
  - `[low]` `[patch]` The CodePush pattern missed the `codepush` spelling (`capacitor-codepush`, `@capacitor-community/codepush`). Fixed: added `*codepush*` with tests.
  - `[low]` `[patch]` `sentry-cordova` and `raven-js` weren't banned. Fixed: added `*sentry*` and `raven-js` to the crash group with tests.
  - `[low]` `[reject]` In the real workspace a core → app import names the bare specifier rather than `packages/app/src/index.ts`, because `core` has no workspace link to `app` and the import can't resolve. The rule is still named and the lint fails. The fixture tests show both files when the import resolves, and making the real case resolve would mean adding a forbidden dependency.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && CI=1 pnpm e2e` -- expected: all exit 0
- Temporary edit: add `import { tracerMessage } from '@numception/app';` to `packages/core/src/index.ts`, run `pnpm lint:deps` -- expected: non-zero exit naming the core rule. Then revert.
- Temporary edit: add `<script src="https://cdn.example.com/x.js"></script>` to `apps/client/index.html`, run `pnpm lint:deps` -- expected: non-zero exit naming file:line. Then revert.

## Auto Run Result

**Summary:** AD-1 is now enforced in CI. `pnpm lint:deps` runs dependency-cruiser 18.5.0 with `.dependency-cruiser.cjs`: inward import directions per package, type-only core imports from `render`/`ui`, library confinement (renderer libraries, Preact, `@capacitor/*`), no prototype imports, the banned list, no remote imports, no cycles and no unresolvable imports. It then runs `tools/check-supply.mjs`, which fails on any banned package anywhere in `pnpm-lock.yaml` and on remote script, style, font, `url()`, `@import` or `import()` loads in the scoped sources, HTML and `content/`. Both read the single grouped list in `tools/banned-packages.cjs`.

**Files changed:**
- `.dependency-cruiser.cjs`: named boundary, confinement and banned rules citing AD-1.
- `tools/banned-packages.cjs`: the single banned list (ads, attribution, analytics, crash, live-update/OTA).
- `tools/check-supply.mjs`: lockfile and remote-load check.
- `tools/dependency-boundaries.test.ts`, `tools/check-supply.test.ts`: fixture-based tests for every matrix row (temp dirs, outside the real lint).
- `package.json`, `pnpm-lock.yaml`: `lint:deps` script, dependency-cruiser devDependency.
- `.github/workflows/ci.yml`: `pnpm lint:deps` after typecheck.
- `vitest.config.ts`, `tsconfig.tooling.json`: include and typecheck `tools/`.

**Review findings:** 4 patches applied (1 medium, 3 low), 0 deferred, 1 rejected (bare-specifier target in the real workspace: the import can't resolve, the rule is still named, and the fixtures show both files).

**Follow-up review recommended:** false. Patched: high 0, medium 1, low 3.

**Verification:** `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint:deps` (clean: 15 modules, 12 dependencies, 14 files scanned), `pnpm test` (120/120), `pnpm build` and `CI=1 pnpm e2e` (3/3) all pass. Deliberate violations fail: core importing `@numception/app` (exit 2, `core-imports-only-pure-deps`), app importing `preact` (`preact-only-in-ui`, `app-imports-only-core`), a remote `<script>` in `index.html` (exit 1, file:line), and a split remote `<link>` (file:line). Banned lockfile entries are covered by fixtures.

**Residual risks:** the lockfile check parses pnpm's v9 lockfile line by line, and a future format change could silently find nothing. TypeScript adds `preact/jsx-runtime` itself for `.tsx` outside `ui`, so dependency-cruiser never sees it (`tsc` would likely catch a missing JSX setup). An `app` package that later needs an npm dependency will need its rule widened.
