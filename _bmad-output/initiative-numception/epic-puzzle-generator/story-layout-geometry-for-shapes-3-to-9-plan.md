---
title: 'Layout geometry for shapes 3 to 9'
type: 'feature'
ticket: '8'
created: '2026-10-13'
status: 'built'
baseline_revision: '1cc9944df268205adaab47530eda8305d71e750a'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-numception/ux-numception/DESIGN.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** AD-13 makes `core/layout` the owner of pure cell geometry. `render` draws and hit-tests from it (the runtime flow says "TapCell via core/layout hit-test"), and `ui` derives keyboard focus order and the accessible tree from it. No geometry exists yet for the per-n shapes (DESIGN.md § Shapes, addendum A4), and epic-core-play-loop needs it.

**Approach:** A pure `core/layout` module:
- Normalised polygon layouts for the POC shapes 3A, 4A (1:1.25), 5B, 6A, 7A, 8A and 9B, keyed by shape id, so the 7B and 9C backups (OQ-11) can be added later.
- A hit-test that maps a point to a cell, or to nothing on shared edges and the operator.
- Keyboard focus order.

## Boundaries & Constraints

**Always:**
- **Registry:** `SHAPES: Record<ShapeId, ShapeLayout>` with `ShapeId = '3A'|'4A'|'5B'|'6A'|'7A'|'8A'|'9B'`, plus `defaultShapeFor(n)` mapping n 3..9 to these picks. Unknown n returns a `Result` error, never a throw.
- **Coordinates:** a layout lives in a unit box `[0,1]×[0,1]` and declares its intended `aspect` (width / height). 4A is 1 : 1.25, so `aspect = 0.8`; most shapes are 1. The renderer scales x by aspect. Cell geometry is polygons only, so curves are approximated with enough vertices to look right. Floats are fine here; this isn't generation code, so the purity check doesn't apply.
- **`ShapeLayout`:**
  - `{ shapeId, n, aspect, nesting: 'becomes' | 'contains', cells: CellGeometry[], operator: OperatorGeometry }`.
  - `CellGeometry = { index, polygon: [x, y][], labelPoint: [x, y], inscribedRadius, becomes: boolean }`. `index` is 0..n−1 and matches puzzle cell placement order. `becomes` says whether this cell has the whole puzzle's general shape (FR-9).
  - `OperatorGeometry = { polygon, labelPoint, inscribedRadius }`. The operator is always in the centre and contains `(0.5, 0.5)`.
  - Nesting per DESIGN.md: 3A, 4A, 6A and 8A become; 5B becomes partially (petals don't, the centre peer does: mark per cell); 7A and 9B contain.
- **Geometry fidelity:** follow the DESIGN.md Shapes table and the mockups (`ux-numception/mockups/shape-system-1.html`, `shape-n4-diamonds.html`, `key-play-n3.html`, `key-play-n6-n9.html`). Read their SVG for proportions. The mocks lose to DESIGN.md where they conflict. Shapes are initial picks, not locked, so the aim is faithful, simple geometry, not pixel-matching.
- **Invariants (tested for every shape):**
  - exactly n cells plus one operator;
  - every polygon simple, counter-clockwise and inside the unit box;
  - no two regions overlap, where a shared edge doesn't count as overlap;
  - the operator contains the centre;
  - each `labelPoint` lies inside its polygon at distance ≥ `inscribedRadius` from every edge;
  - `inscribedRadius > 0`.
- **Hit-test:** `hitTest(layout, point, edgeTolerance) → number | null` (cell index or null).
  - Returns null for points outside every cell, inside the operator (the operator is never an answer), and within `edgeTolerance` (normalised units; the caller converts px or pt) of an edge shared by two regions. Shared edges are no-ops (FR-8).
  - Edges on the outer boundary aren't shared, so a tap near the outer rim still hits.
- **Focus order:** `focusOrder(layout) → number[]` visits every cell exactly once. The rule is clockwise by label-point angle around the centre, starting from 12 o'clock, ties broken by distance from centre. Document it. The operator isn't focusable.
- **Purity of API:** no DOM, no renderer types, no `Math.random`. Pure functions of their inputs. One exported concept per file, with tests beside the source.

**Never:**
- Breakpoints, phone landscape or tablet layouts (OQ-14; deferred to UX).
- Rendering, themes, insets or line widths (render and themes).
- The 7B and 9C backup shapes (the registry stays open for them).
- Choosing shapes at runtime (`defaultShapeFor` only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Every shape | 3A … 9B | invariants hold; cell count = n | No error expected |
| Hit inside | each cell's `labelPoint` | that cell's index | No error expected |
| Shared edge | midpoint of an edge shared by two cells, tolerance 0.01 | null | No error expected |
| Outer rim | a point just inside an outer-boundary edge | that cell | No error expected |
| Operator | (0.5, 0.5) | null | No error expected |
| Outside | (−0.1, 0.5), (0.5, 1.2) | null | No error expected |
| Focus | any shape | permutation of 0..n−1, starting with the cell at 12 o'clock | No error expected |
| Default shape | n 3..9 | 3A, 4A, 5B, 6A, 7A, 8A, 9B | n 2 or 10 → `Result` error |
| 4A aspect | 4A | `aspect = 0.8` | No error expected |

</intent-contract>

## Code Map

- `packages/core/src/` -- folders `generator`, `numbers`, `random`, `result`, `rounds`, `rules`, `spec`, `tuning`, `difficulty` exist. Create `layout/`. Core conventions: kebab-case, one exported concept per file, tests beside the source, `Result<T, DomainError>` for bad input. `packages/core/src/result/domain-error.ts` is a discriminated union, so add a code such as `invalid-shape` if needed.
- `packages/core/src/index.ts` -- public exports. Export the layout API and types.
- `.dependency-cruiser.cjs` -- core may import nothing outside core except pure-rand and valibot, and layout needs neither.
- `tools/check-core-purity.mjs` -- `PURE_DIRS` covers generator, random, rounds and rules only. Leave layout out (trig is allowed there).
- `_bmad-output/initiative-numception/ux-numception/DESIGN.md` § Shapes (lines ~413–430) and the mockups listed above -- the geometry sources.
- fast-check is available in core tests for hit-test properties (e.g. random points inside a cell, away from shared edges, hit that cell).

## Tasks & Acceptance

**Execution:**
- [x] `packages/core/src/layout/{shape-id.ts,shape-layout.ts}` -- types. -- API
- [x] `packages/core/src/layout/shapes/{shape-3a.ts,…,shape-9b.ts}` + `shapes.ts` registry + `default-shape-for.ts` -- geometry per shape. -- A4
- [x] `packages/core/src/layout/{hit-test.ts,focus-order.ts}` -- hit-test and focus order. -- FR-8, a11y
- [x] Tests beside each file: the invariants for every shape, the hit-test matrix rows and a fast-check property, focus order, defaults and errors. -- verification
- [x] `packages/core/src/index.ts`, `domain-error.ts` -- exports and error code. -- integration

**Acceptance Criteria:**
- Given the repo, when `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && CI=1 pnpm e2e` run, then all pass, with the layout invariants checked for all seven shapes.
- Given any shape, when a random point inside a cell farther than the tolerance from every shared edge is hit-tested, then it returns that cell, and points on shared edges return null.

## Implementation Notes

- Coordinates are screen-style (y down). "Counter-clockwise" means as seen on screen, so the shoelace sum is negative. Focus order's "clockwise" is on screen too.
- 5B: in DESIGN.md and the mock, the centre pentagon (the "peer") is the operator, not a cell. So the five petals are the only cells, and all have `becomes: false`. `nesting` is therefore `'contains'`, with a comment citing DESIGN.md's "Becomes, partial". A test checks every shape: `nesting === 'becomes'` exactly when some cell becomes.
- 4A carve is 18% of the half-diagonals (shape-n4-diamonds.html). 7A and 9B carves are 42% and 44% of the radius (shape-system-1.html). Shapes 3A, 5B, 6A, 7A and 9B sit on the circle of r 0.5 around the centre. 8A fills the box.
- Label points are found on each region's axis of symmetry by a deterministic search. `inscribedRadius` is the label point's distance to the nearest edge, in unit-box units before aspect scaling. `hitTest` measures edge distance in drawn proportions (x scaled by `aspect`), so its tolerance is in units of the drawn height: `tolerancePx / drawnHeightPx`.
- `hitTest` floors the tolerance at 1e-9. A tap exactly on a shared edge is then a no-op even at tolerance 0, despite float noise.

## Plan Change Log

## Review Triage Log

### 2026-10-13 — Review pass
- verdicts: 3 findings — high 0, medium 0, low 3, false 0, maybe-false 0
- findings:
  - `[low]` `[patch]` 5B kept `nesting: 'becomes'` while no cell becomes (the centre is the operator, per DESIGN.md "Operator space: Natural (peer cell)"). Fixed: 5B `nesting: 'contains'` with the reason, plus an all-shapes invariant: nesting is 'becomes' iff some cell becomes. Note: the plan's "the centre peer does" was a misreading of DESIGN.md; the centre peer is the operator.
  - `[low]` `[patch]` The hit-test edge tolerance was measured in the square unit box, while 4A is drawn at aspect 0.8, so the shared-edge dead zone was distorted on its diagonal seams. Fixed: edge distances are measured in drawn proportions (x × aspect, tolerance in drawn-height units), with the px conversion documented and tested on 4A diagonal and 8A vertical seams.
  - `[low]` `[patch]` The focus-order docs said it starts with "the cell at 12 o'clock", but 5B, 7A and 9B have a seam there. Fixed wording: the first cell clockwise from 12 o'clock by label-point angle.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint:deps && pnpm test && pnpm build && CI=1 pnpm e2e` -- expected: all exit 0

## Auto Run Result

**Summary:** New pure `core/layout` with normalised polygon layouts for the POC shapes 3A, 4A (aspect 0.8), 5B, 6A, 7A, 8A and 9B, keyed by shape id.
- **Per-cell data:** label points, inscribed radii and `becomes` flags, plus a centre operator region.
- **Lookup:** `defaultShapeFor(n)` (`invalid-shape` outside 3..9).
- **`hitTest`:** a point maps to a cell, or null on shared edges (tolerance in drawn proportions), on the operator and outside.
- **`focusOrder`:** clockwise from 12 o'clock.

**Files changed:** `packages/core/src/layout/**` (types, shapes, geometry helpers, hit-test, focus order, with tests), `packages/core/src/result/domain-error.ts`, `packages/core/src/index.ts`.

**Review findings:** 3 patches applied (low), 0 deferred, 0 rejected.

**Follow-up review recommended:** false. Patched: high 0, medium 0, low 3.

**Verification:**
- `pnpm typecheck`, `lint:deps`, `test` (all pass) and `build`, and `CI=1 pnpm e2e` 9/9.
- Tests cover the layout invariants for all seven shapes (simple CCW polygons in the unit box, no overlap, operator at the centre, labels inside), every hit-test matrix row, and a 2,000-run fast-check hit-test property.
- The implementer compared SVG renderings with the mockups by eye.

**Residual risks:**
- Shapes are initial picks (OQ-11), with carve sizes taken from the mockups.
- 8A fills the unit box while the radial shapes sit on a 0.5 circle, so the renderer may need to inset 8A for visual balance.
