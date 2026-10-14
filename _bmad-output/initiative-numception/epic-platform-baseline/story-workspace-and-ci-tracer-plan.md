---
title: 'Workspace and CI tracer'
type: 'chore'
ticket: '1'
created: '2026-10-09'
status: done
baseline_revision: '770889ea451715b49e9b929ecb5c14841cc8f498'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-numception/architecture-numception/architecture-numception.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** There is no code yet: no workspace, no packages, no CI, no deploy. Every later ticket needs the Structural Seed packages, a test harness and a pipeline to land in.

**Approach:** Scaffold the pnpm workspace with every Structural Seed package, pass one value computed in `core` through `app` and `ui` into the `apps/client` page, and add a GitHub Actions workflow that runs typecheck, Vitest, the build and a Playwright WebKit check on every push, then deploys the built page to GitHub Pages from `main`.

## Boundaries & Constraints

**Always:**
- Package names are `@numception/<name>`; files are `kebab-case.ts`; `*.test.ts` sits beside its source.
- One shared `tsconfig.base.json` sets `strict`, `module`, `moduleResolution` and `target` explicitly.
- Imports point inward (AD-1): `core` has no runtime dependencies; `app` imports `core`; `ui` imports `app` and is the only package that imports Preact; `apps/client` imports `ui` and never imports `preact`.
- Pin the Stack versions: Node 24, pnpm 11 (keep the existing `devEngines`), TypeScript 6.0.x, Vite 8.3.x, @preact/preset-vite 2.10.x, Vitest 5.0.x, @playwright/test 1.64.x, preact 10.29.x.
- `import.meta.env` and the Pages base path are read only inside `apps/client`.
- The page makes no third-party runtime requests (no CDN, no remote fonts).

**Never:**
- dependency-cruiser or banned-list lint (ticket 1.4), flavours or the dev panel (1.5), the PWA, offline or size budget (1.6), Capacitor (1.2), renderer libraries (1.3/1.8/1.9).
- Game rules or player-facing features.
- Pushing, creating a remote, or touching any hosting account. That is the human step for this ticket.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tracer value | `core` computes `1/2 + 1/3` exactly | the page shows `5/6` inside an element with `data-testid="tracer-value"` | No error expected |
| Pages subpath | `BASE_PATH=/numception/` at build time | asset URLs in `dist/index.html` start with `/numception/` | defaults to `/` when unset |
| Type error | a type error anywhere in a package | `pnpm typecheck` exits non-zero | CI job fails |

</intent-contract>

## Code Map

- `package.json` -- exists: an `npm init` stub with `devEngines` pnpm ^11.18.0 and `"type": "module"`. Rewrite it as a private workspace root and keep `devEngines`.
- `pnpm-lock.yaml` -- exists, contains only `packageManagerDependencies`. Regenerate it with `pnpm install`.
- `.gitignore` -- exists (`_bmad/render/`, `node_modules/`). Add `dist/`, `test-results/`, `playwright-report/`, `*.tsbuildinfo`.
- `_bmad/`, `.claude/`, `_bmad-output/`, `skills-lock.json` -- tooling. Don't touch them, and keep them out of TS, Vitest and Playwright globs.
- Structural Seed (architecture § Structural Seed): `packages/{core,app,render,ui,platform-web,platform-native}`, `content/`, `apps/client`, `prototypes/renderer-bakeoff/` (not a workspace member).

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `pnpm-workspace.yaml`, `.node-version`, `.gitignore` -- workspace root. Members are `packages/*` and `apps/*`. Scripts: `typecheck` (`tsc -b`), `test` (`vitest run`), `build` (client build), `e2e` (Playwright). -- one entry point for CI
- [x] `tsconfig.base.json`, `tsconfig.json` (solution file with project references) -- strict, ES2022, `module: ESNext`, `moduleResolution: bundler`, `isolatedModules`, `verbatimModuleSyntax`. -- explicit settings, since TS 6 changed the defaults
- [x] `packages/core/` -- `package.json`, `tsconfig.json`, `src/index.ts`, `src/tracer-value.ts` (exact rational `1/2 + 1/3` → `"5/6"`, reduced by integer gcd), `src/tracer-value.test.ts`. -- the computed value
- [x] `packages/app/` -- `src/tracer-message.ts` (returns the core value; no other logic) plus its test. -- core → app hop
- [x] `packages/ui/` -- `src/tracer-badge.tsx` (Preact component showing the value in `data-testid="tracer-value"`), `src/mount-tracer.ts` (`mountTracer(el: HTMLElement)` renders it), JSX via `jsxImportSource: preact`. -- app → ui hop; keeps Preact inside ui
- [x] `packages/render/`, `packages/platform-web/`, `packages/platform-native/` -- each a `package.json`, `tsconfig.json` and `src/index.ts` with a one-line role comment and `export {}`. -- seed packages that later tickets fill in
- [x] `content/README.md`, `prototypes/renderer-bakeoff/README.md` -- one line on each folder's role. -- seed folders
- [x] `apps/client/` -- `package.json`, `tsconfig.json`, `index.html`, `src/main.ts` (calls `mountTracer`), `vite.config.ts` (preact preset, `base` from `process.env.BASE_PATH ?? '/'`). -- composition root
- [x] `vitest.config.ts` (root) -- includes `packages/**/src/**/*.test.{ts,tsx}`. -- unit test runner
- [x] `playwright.config.ts`, `apps/client/e2e/tracer.spec.ts` -- WebKit project only. `webServer` runs Vite preview of the built client. The spec asserts `tracer-value` shows `5/6`. -- WebKit run
- [x] `.github/workflows/ci.yml` -- `ci` job on push and pull_request: checkout, pnpm/action-setup, setup-node 24 with pnpm cache, `pnpm install --frozen-lockfile`, typecheck, test, build with `BASE_PATH=/${{ github.event.repository.name }}/`, `playwright install --with-deps webkit`, e2e. `deploy` job: needs `ci`, runs only on push to `main`, uploads `apps/client/dist` with `actions/upload-pages-artifact`, deploys with `actions/deploy-pages`, permissions `pages: write` and `id-token: write`. -- CI and deploy

**Acceptance Criteria:**
- Given a fresh clone, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` run, then every command exits 0.
- Given the built client served by `vite preview`, when the page opens in WebKit, then it shows `5/6`.
- Given a deliberate type error in `packages/core`, when `pnpm typecheck` runs, then it exits non-zero.
- Given `apps/client` source, when it is searched for `preact` imports, then there are none.
- Given the repo is pushed to GitHub with Pages set to "GitHub Actions", when `main` is pushed, then CI turns green and the Pages URL shows `5/6` (human step; can't be verified locally).

## Implementation Notes

- Every package is a `composite` TS project emitting declarations only to `${configDir}/.tsbuild/` (so `tsc -b` works). `.tsbuild/` is added to `.gitignore` in addition to the listed entries.
- TS 6 defaults `types` to `[]`; the base keeps that explicitly. Node types are enabled only in the Node-side projects (`apps/client/tsconfig.node.json`, root `tsconfig.tooling.json`). `core`, `app` and the seed packages have `lib: ["ES2022"]` (no DOM).
- `apps/client` has two TS projects: `tsconfig.json` (browser `src/`) and `tsconfig.node.json` (`base-path.ts`, `vite.config.ts`, `e2e/`). The root `tsconfig.tooling.json` checks `vitest.config.ts` and `playwright.config.ts`.
- `core`'s `tracerValue(a = [1,2], b = [1,3])` takes optional fractions so the test can exercise gcd reduction and the `"n"` form.
- Versions are pinned with `~` (patch only): typescript 6.0.3, vite 8.3.4, @preact/preset-vite 2.10.6, vitest 5.0.3, @playwright/test 1.64.0, preact 10.29.8, @types/node 24.19.1. @types/node 24.19.2 was released on the day of implementation and failed pnpm 11's `minimumReleaseAge`, so 24.19.1 is used instead of adding an exclusion.

- Orchestrator (verify step): added `apps/client/base-path.test.ts` and widened the Vitest include to `apps/client/*.test.ts` (and `tsconfig.node.json`) so the matrix's "Pages subpath" row, including the default-to-`/` case, has a test.
- Review patch: `apps/client` now lists `preact` ~10.29.8 as a devDependency so that the preset's dev-only `preact/debug` injection resolves. No Preact import was added to `apps/client/src`.

## Plan Change Log

- Base path: resolved in one helper, `apps/client/base-path.ts` (normalises slashes, defaults to `/`). Both `vite.config.ts` and `playwright.config.ts` import it, so the read stays inside `apps/client` and the preview server and baseURL always match the build.
- CI: `BASE_PATH` is set at **job** level, not only on the build step. Otherwise `vite preview` in the e2e step would serve at `/` while the HTML references `/<repo>/assets/`, and the WebKit check would fail.
- Deploy: `actions/upload-pages-artifact` runs as the last step of the `ci` job (only on push to `main`), so the deployed bundle is exactly the one e2e tested; the `deploy` job only runs `actions/deploy-pages`. The plan put the upload in `deploy`, which would have needed a rebuild there.
- CI also uploads the Playwright report on failure and uses `pnpm/action-setup@v4` with `version: 11` (no `packageManager` field exists; `devEngines` takes over the exact version).

## Review Triage Log

### 2026-10-09 — Review pass
- verdicts: 3 findings — high 1, medium 1, low 1, false 0, maybe-false 0
- findings:
  - `[high]` `[patch]` `basePath(undefined)` in `apps/client/base-path.test.ts` hits the parameter default, which reads `process.env.BASE_PATH`, and CI sets that variable at job level, so `pnpm test` would fail on every push. Fixed: the test now passes `''`. `BASE_PATH=/numception/ pnpm test` passes.
  - `[medium]` `[patch]` `pnpm dev` failed: @preact/preset-vite injects `import "preact/debug"` into `apps/client/src/main.ts`, and pnpm's strict layout can't resolve `preact` from `apps/client`. Fixed: added `preact` ~10.29.8 as a client devDependency and updated the lockfile. The dev server now serves `/src/main.ts` with 200.
  - `[low]` `[reject]` The wider Vitest include (`apps/client/*.test.ts`) isn't recorded in the Plan Change Log. The fix would be editing this build's plan, which the triage rules reject. It is recorded in Implementation Notes instead.

## Design Notes

GitHub Pages is the static host because CI is already GitHub Actions (epic Notes assumption): no second account, and the deploy is two first-party actions. Cloudflare Pages remains an option when ticket 1.6 revisits hosting.

The tracer value is an exact rational so the hop exercises AD-5's direction (core produces display strings) without building the real `Rational` type, which belongs to the generator epic.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile` -- expected: exits 0
- `pnpm typecheck` -- expected: exits 0
- `pnpm test` -- expected: core, app and client base-path tests pass (also with `BASE_PATH` set, as in CI)
- `BASE_PATH=/numception/ pnpm build && grep -c '/numception/assets/' apps/client/dist/index.html` -- expected: ≥1
- `pnpm build && pnpm e2e` -- expected: the WebKit spec passes
- `grep -rn "from 'preact" apps/client/src` -- expected: no output

## Auto Run Result

**Summary:** Scaffolded the pnpm workspace with every Structural Seed package. The value `5/6`, computed exactly in `core`, passes through `app` and is shown by `ui` (the only package that imports Preact) on the `apps/client` page. Added a GitHub Actions workflow: typecheck → Vitest → build → Playwright WebKit on every push and PR, then a GitHub Pages deploy from `main`.

**Files changed:**
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, `.gitignore`: workspace root, pinned toolchain, scripts.
- `tsconfig.base.json`, `tsconfig.json`, `tsconfig.tooling.json`: strict shared TS config and project references for `tsc -b`.
- `packages/core/*`: `tracerValue` (exact rational sum) and its tests.
- `packages/app/*`: `tracerMessage` (core → app hop) and its test.
- `packages/ui/*`: `TracerBadge` and `mountTracer` (app → ui hop; Preact stays inside ui).
- `packages/{render,platform-web,platform-native}/*`: empty seed packages with role comments.
- `content/README.md`, `prototypes/renderer-bakeoff/README.md`: seed folders.
- `apps/client/*`: composition root, Vite config, the `base-path.ts` helper and its test, the WebKit e2e spec.
- `vitest.config.ts`, `playwright.config.ts`: test runners.
- `.github/workflows/ci.yml`: the CI and Pages deploy workflow.

**Review findings:** 2 patches applied (1 high, 1 medium), 0 deferred, 1 rejected (low: the fix would have been a plan edit; the change is recorded in Implementation Notes instead).

**Follow-up review recommended:** true. Patched: high 1, medium 1, low 0. Risk not yet verified: the workflow has never run on GitHub. The action versions, `pnpm/action-setup` with `devEngines`, and the Pages base path at the real repo name are confirmed only by the first real push.

**Verification:** `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (6/6, with and without `BASE_PATH=/numception/`), `pnpm build` (asset URLs under `/numception/assets/` when `BASE_PATH` is set), and `CI=1 pnpm e2e` (WebKit shows `5/6` under both base paths) all pass. A deliberate type error in core made `pnpm typecheck` exit 2. `apps/client/src` contains no Preact import. The implementer confirmed the dev server serves `/src/main.ts` without resolve errors.

**Residual risks / human step (ticket is HITL):** the repo has no remote. The ticket's own check ("a push turns CI green and the deployed URL shows a value computed in core") needs a human to create the GitHub repo, push, set Pages → Source to "GitHub Actions", and confirm the Pages URL shows `5/6`.
