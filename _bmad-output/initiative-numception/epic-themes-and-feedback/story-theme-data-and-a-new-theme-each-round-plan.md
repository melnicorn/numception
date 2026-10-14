---
title: 'Theme data and a new theme each round'
type: 'feature'
ticket: '1'
created: '2026-10-14'
status: 'in-review'
baseline_revision: '5b23e8bde86fd99430aa1a3015554aa1aa7440f3'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/epic-themes-and-feedback/epic-themes-and-feedback.md'
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/DESIGN.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** Every round looks the same: Kiln tokens are hard-wired in `core/src/view/kiln-tokens.ts`, and the round change is a 400 ms crossfade that the user said "didn't give a sense of new round; it looked like the values in the triangles were replaced". FR-25 and AD-15 call for a new theme each round, chosen by core from theme data.

**Approach:**
- **Theme data:** validated files in `content/themes/` — Kiln and Moonwater, both Zen themes — checked against a `ThemeTokens` schema.
- **Selection:** core's `selectPresentation` picks a theme per round with no consecutive repeat over the Zen pool, seeded from the round seed. The round stores `themeId` and the save carries it.
- **View:** `PlayVM.theme` comes from the catalogue.
- **Round change:** the round-start beat becomes a whole-frame theme change that clearly reads as a new round.

## Boundaries & Constraints

**Always:**
- **ThemeTokens schema (valibot, in core):**
  - Covers what render and ui use today: surface, cell fill, line, line width and join, number, operator, operator wash, solved fill and number, press, soft-miss, font family and weight, the sizes, and the operator dim alpha.
  - Adds the DESIGN role names it can carry now: `surface-deep`, `accent`, `control`, `focus`, `cell-active`, `cell-locked`, and `number-sunk` (Zen).
  - Adds a `mode` tag (`zen` | `normal`) and `inset`.
  - Strict, with path-naming errors.
- **Theme files:**
  - `content/themes/kiln.json` matches today's Kiln values exactly, so the look doesn't change for Kiln rounds.
  - `content/themes/moonwater.json` takes its values from DESIGN.md's Moonwater rows. Moonwater's halo is **not** drawn yet (entry 6 adds the cheap glow); no filter glow.
  - Font: DESIGN's Moonwater face is SF Pro Rounded, so use the stack `ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`. Await `document.fonts.load` for the active faces before the first draw if the renderer measures text.
  - A catalogue loader in app (or client) parses and validates every bundled theme. The client bundles them (offline), and a theme that fails validation is left out with a dev log. If none load, fall back to Kiln built-ins.
- **Selection (AD-15):**
  - `selectPresentation(state, tuning, catalogIds, rng) → { themeId }` runs when a round is created, filtered by mode (`zen` for now).
  - No consecutive repeat while more than one theme is available. Randomize is seeded from the round's seed, so it's deterministic.
  - `Round.themeId` is persisted: bump the save format with a migration that gives existing rounds `kiln`.
  - A resume reopens in the same theme.
- **View:** `selectView` sets `PlayVM.theme` from the catalogue by the round's `themeId` (catalogue tokens passed in, like tuning). Rename the `KilnTokens` type to `ThemeTokens` where it is the general type.
- **Round change:**
  - The `roundStart` beat draws a whole-frame change from the old round's theme to the new one: the background surface and every tile and line shift, and the old board leaves while the new arrives.
  - **Light/dark changes:** a change between a light and a dark theme passes through a mid-luminance frame (Accessibility Floor).
  - **Duration:** retune `roundTransitionMs` in a new tuning version, `content/tuning/2.json` (AD-7; keep `1.json`), to about 900 ms (× Calm). The client uses the latest tuning version.
  - **Read as a new round:** the beat must clearly read as "new round" (user feedback), e.g. the whole field changes colour with the new board scaling in. No flashes above 3 per second.
- **ui:** the guide line and dev panel follow the active theme's colours where they use theme colours today.
- **Tests:**
  - core: the schema rejects bad themes; selection has no consecutive repeat over many rounds and is deterministic per seed; Zen only gets Zen themes; the save migration and the theme surviving save and load.
  - render: unit tests where practical.
  - e2e: consecutive rounds' `theme.themeId` differ (test hook), and the surface colour differs between rounds; a reload keeps the theme.
  - Existing tests stay green.
- **Hitl step:** the orchestrator installs on the iPhone and the user confirms the round change now reads as a new round.

**Never:**
- Washi Ink, the Normal themes, glow, the transition library (entries 5–6), sound (entry 2), settings (entry 4), or textures.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| New round | round N+1 | different theme from round N (with 2 Zen themes: alternates) | No error expected |
| Determinism | same rootSeed and ordinals | same theme sequence | No error expected |
| Resume | reload mid-round | same theme | No error expected |
| Old save | format before this change | migrates; rounds get `kiln` | No error expected |
| Bad theme file | invalid JSON or schema | left out of the catalogue; others still work | logged in dev only |
| Light/dark change | Kiln → Moonwater | passes through a mid-luminance frame | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/view/{kiln-tokens.ts,play-vm.ts,select-view.ts,node-view.ts}`: `KILN_TOKENS` is a frozen constant; `PlayVM.theme: KilnTokens`; node-view hard-wires `theme: KILN_TOKENS`.
- `packages/core/src/state/{round.ts,start-round.ts,beat.ts}`: round creation (add selection here); the `transitionId` is `'default'` in `beat.ts`.
- `packages/core/src/save/*`: format version, migrations (currently version 2) and `check-game-state`.
- `packages/core/src/tuning/*` and `content/tuning/1.json`: tuning versions. `tools/tuning-content.test.ts` enforces contiguous versions and `shipped.json`.
- `packages/render/src/{create-renderer.ts,paint-view.ts,beat-motion.ts}`: the `roundStart` branch draws `previousTop` with a crossfade.
- `packages/app/src/index.ts`: re-exports for adapters (`KILN_TOKENS` is exported).
- `packages/ui/src/guide-line/*`, `packages/ui/src/dev-panel/*`: Kiln token use.
- `apps/client/src/main.ts`: tuning loading (globs `content/tuning`); add the themes glob.
- DESIGN.md: the Moonwater token rows and the Accessibility Floor (mid-luminance).

## Tasks & Acceptance

**Execution:**
- [ ] ThemeTokens schema, catalogue and theme files (+ tests).
- [ ] `selectPresentation`, `Round.themeId`, save migration (+ tests).
- [ ] View wiring; render whole-frame round change.
- [ ] Tuning v2 with the new `roundTransitionMs`; client loads the latest.
- [ ] e2e.

**Acceptance Criteria:**
- Given the repo, when `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && pnpm check:flavours && pnpm check:budget && CI=1 pnpm e2e` run, then all pass.
- Given the iPhone, when rounds are played, then consecutive rounds alternate Kiln and Moonwater with a whole-screen theme change that the user says reads as a new round.

## Implementation Notes

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 5 findings — high 1, medium 1, low 3, false 0, maybe-false 0
- findings:
  - `[high]` `[patch]` The client ran only the latest tuning (v2), so a round pinned to v1 (the user's iPhone save) soft-locked: the next lazily realised leaf was rejected. Fixed: every bundled tuning version is loaded (`TuningsByVersion`), and core realises a round's leaves with its pinned tuning (AD-7) while new rounds use the latest. Test in `pinned-tuning.test.ts`.
  - `[medium]` `[patch]` Board pixels went dark→light→dark during Kiln→Moonwater (the fused old top uncovered a still-light field). Fixed: a new timeline (colours over the first half, then the old top leaves, then the new board arrives), with a composited-pixel monotonicity test in both directions.
  - `[low]` `[patch]` Numeral weight was chosen from the animated size, so it popped mid-beat. Fixed: chosen from the rest size, with a test.
  - `[low]` `[patch]` A saved themeId missing from the catalogue drew as Kiln but stayed as the "previous" id, allowing two Kiln rounds in a row. Fixed: the drawn theme is passed on, with a test.
  - `[low]` `[patch]` The guide line used new-theme colours over the blending band during roundStart. Fixed: hidden during the round change, with a test.

## Verification

**Commands:**
- The acceptance chain above. Expected: everything exits 0.
