# Spine Pair Review — Numception

## Overall verdict
The pair is a strong, decision-dense contract for the play view: every `{token}` reference resolves, component names line up across both spines, and memlog decisions are carried through with assumptions flagged rather than silently invented. The main risks for downstream consumers are token extraction and coverage gaps. The frontmatter holds one hybrid theme (Kiln + Vector Noir), so the other five themes exist only in prose tables. Normal themes have no `soft-miss` hex. The POC Tower round has no flow, and Normal-mode play has no flow either. Several POC surfaces (Normal unlock moment, Zen constellation, control surface) have no states and no component spec.

## 1. Flow coverage — adequate
Checked: the sources and memlog define no formal UJ IDs, so I extracted the journeys from the memlog (Miles, Don) and the POC/v1 surfaces from the sources (brainstorm, feature-list-by-phase). Both memlog journeys are present, each with a named protagonist, numbered steps, a **Climax** beat and a failure path.
### Findings
- **high** The POC **Tower round** (3-tier mini-pyramid, n=3 → 13 puzzles; brainstorm l.51, feature-list l.27) is absent from both spines: no IA row, no flow, no zoom/depth behaviour beyond tier 2 (EXPERIENCE.md → Information Architecture, Key Flows). *Fix:* add an IA row and a short flow, or record in Open Questions that it is descoped.
- **high** No flow covers Normal-mode play, even though power cut, combo heat, timer line, point stream and round-end flash are core to the POC. Flow 2 mentions Normal only in passing and is phased Later (EXPERIENCE.md → Key Flows). *Fix:* add Flow 3 (for example Miles or an adult after the Normal unlock): the unlock moment, a combo build, a power cut as the failure path, round-end flash, and transition.
- **medium** No returning-player / resume flow, although "launch straight into next unsolved puzzle; save every tap" is a stated rhythm (EXPERIENCE.md → Foundation). *Fix:* add a short flow covering cold open mid-round, including mid-tier-2 and mid-transition resume.
- **low** Flow 1 step 9 introduces × (v1 per feature-list) without a phase label, mixing POC and v1 in one flow (EXPERIENCE.md → Flow 1). *Fix:* tag step 9 "v1".
- **low** Flow 1's failure path depends entirely on the unconfirmed soft-miss assumption (Open Question 2). *Fix:* add the guided wrong tap (step 4) as the confirmed failure path; keep the soft miss as the secondary one.

## 2. Token completeness — thin
Checked: all frontmatter tokens (colors, typography, rounded, spacing, components) and all 53 distinct `{path}` references in both spines. Every reference resolves. I recomputed the contrast figures for Kiln and Vector Noir.
### Findings
- **critical** `soft-miss` has no hex for any Normal theme. The Normal themes table has no `soft-miss` row, yet soft miss applies to − / ÷ in both modes and must "never be red" (DESIGN.md → Colors → Normal themes; EXPERIENCE.md → State Patterns "Soft miss"). The grammar says "every theme supplies a hex for each role". *Fix:* add a `soft-miss` row to the Normal table (and `number-sunk` too, if it is meant to be Zen-only; mark it as such in the grammar).
- **high** Only one theme is machine-readable. The frontmatter is a hybrid of Kiln (Zen roles) and Vector Noir (Normal-only roles), which is not a shippable theme. The per-theme colours and typography for the other five themes live only in prose tables (DESIGN.md frontmatter l.15–65; Colors; Typography). Downstream code that mirrors the frontmatter gets one hybrid palette. *Fix:* emit per-theme token sets (for example `kiln-surface`, `vector-noir-surface` …, or one theme block or file per theme) and keep the grammar table as the role contract.
- **high** The menu button, the only visible control, uses `{colors.operator}`. On Kiln (the first-run theme) that is about 2.6:1 on `surface` and 2.9:1 on tile, below the spine's own 3:1 operator floor and the WCAG non-text 3:1 (DESIGN.md frontmatter `menu-button`; Colors → Zen themes "Floor misses"). *Fix:* give the menu button its own role (for example `control`) at ≥ 3:1, or base it on `number`.
- **medium** Kiln `line` contradicts itself: the frontmatter gives `#A14E36`, while the Zen table says "none (gaps between tiles)" (DESIGN.md l.20 vs l.202). *Fix:* use one value and state what transitions interpolate from when the role is "none".
- **medium** `typography.guide` has no `fontSize` ("not yet specified"), and it is the only word-bearing text for an 8-year-old (DESIGN.md frontmatter l.62–65). *Fix:* commit a size (≥ `number-floor`) per theme or as one shared value.
- **medium** No contrast targets for load-bearing non-number pairs: `timer-line` / `timer-track`, `error-number` / `error-fill`, `cell-locked` vs `cell-unsolved` (Kiln locked vs sand is about 1.3:1, so it relies on shadow only). Power-cut `number-dimmed` is listed as "intended" at 2.9:1 (Obsidian Facet actually computes about 2.4:1 on facet), yet play continues immediately and the numbers must stay readable (DESIGN.md → Colors). *Fix:* state targets for these pairs and decide whether dimmed numerals must stay ≥ 3:1.
- **medium** "Cell-unsolved: none" and "cell-active: current combo-glow step" in the Normal table are not hex values. The second is a valid reference but is not expressed as `{colors.…}` (DESIGN.md → Normal themes). *Fix:* write `cell-active: {colors.combo-glow-*}` explicitly and `cell-unsolved: transparent`.
- **low** The tier-2 operator opacity is a range ("25–45%") rather than a value (DESIGN.md → Colors grammar; Components). *Fix:* commit a value per theme.

## 3. Component coverage — adequate
Checked: DESIGN.md → Components (15 entries) against EXPERIENCE.md → Component Patterns (14 rows). All named components appear in both with real rules. `puzzle-cell-solved` and `puzzle-cell-locked` are covered as states of `puzzle-cell`.
### Findings
- **high** These surfaces are named in the IA and flows but have no component in either spine: **Zen constellation / garden** (POC), **Normal unlock moment** (POC, Flow 1 step 8), and **round overview / tier-2 collapse** (Flow 1 climax). For the climax, only the cell's solved state is specified; the collapse animation and zoom have no spec (EXPERIENCE.md → IA). *Fix:* add rows to both spines, even if the visual is marked "not designed".
- **medium** `Power cut`, `Sinking number` and `Theme transition` have no kebab-case IDs and no frontmatter component entries, unlike every other component (DESIGN.md → Components). *Fix:* add `power-cut`, `sinking-number` and `theme-transition` entries and use those IDs in EXPERIENCE.md.
- **medium** The soft-miss acknowledgement is a state with a colour but no component (visual or behavioural): what moves, how long, and whether it sounds (EXPERIENCE.md → State Patterns). *Fix:* add a `soft-miss` component row to both spines.
- **low** `control-surface`, `stats-panel`, `menu-button` and `point-stream` are "layout / visual not designed". This is acknowledged in Open Question 18, but story-dev cannot build from them yet. *Fix:* none needed now; keep them tracked.

## 4. State coverage — thin
Checked: every IA surface tagged POC, against empty / cold-load / focus / error / offline / interrupted / reduced-motion states.
### Findings
- **high** Normal **timer expiry** has no state (EXPERIENCE.md → Component Patterns "Timer line" defers to Open Question 21). It is a core POC Normal outcome. *Fix:* decide the expiry rule (for example the round ends with no points lost and the next round starts) and add a state row.
- **high** App backgrounding / interruption (phone call, app switch, lock) is not covered. In particular, it is not stated whether the Normal timer pauses or what resume shows mid-transition (EXPERIENCE.md → State Patterns). *Fix:* add an "Interrupted / backgrounded" row.
- **medium** Input during a theme transition is ambiguous: "Never blocks the next tap longer than the transition itself" implies that taps can be blocked (EXPERIENCE.md → Component Patterns "Theme transition"). *Fix:* state whether taps queue, are dropped, or skip the transition.
- **medium** Web is the platform and the POC test bed is a desktop browser, but there is no keyboard, mouse or hover input and no focus state (EXPERIENCE.md → Interaction Primitives, Accessibility Floor). *Fix:* add a desktop input row (click = tap; keyboard optional or out of scope) and a focus treatment for the menu button.
- **medium** The control surface, Normal unlock moment and Zen constellation have no states (open, dismiss mid-Normal, first unlock, empty constellation) (EXPERIENCE.md → State Patterns). *Fix:* add at least the empty and first-show states.
- **low** Save failure / storage loss is not covered, although "save every tap" is a promise (EXPERIENCE.md → Foundation). *Fix:* add one row (silent retry; never block play).

## 5. Visual reference coverage — adequate
Checked: files in `.working/` (directions-1, shape-system-1, shape-n4-diamonds, theme-transitions-1, theme-transitions-2-nature, sources-digest) and `imports/` (original-brief). There are no `mockups/` or `wireframes/` folders. All five renders and the brief are linked inline at the relevant section, with what they illustrate named. Spines-win-on-conflict is stated in both spines.
### Findings
- **medium** All visual links point into `.working/` ("to be promoted"), a scratch location. The links break or go stale once it is promoted or cleaned (DESIGN.md intro; EXPERIENCE.md intro). *Fix:* promote the renders to `mockups/` and update the links before handoff.
- **low** `.working/sources-digest.md` and `reconcile-original-brief.md` are not referenced. They are working files rather than visuals, but the reconcile file lists dropped ideas a consumer should see (see §7). *Fix:* fold the relevant items into Open Questions; leave the files unlinked.
- **low** There are no screen-level references for the menu, control surface, stats or round end (acknowledged in Open Question 18). *Fix:* none needed now.

## 6. Bloat & overspecification — adequate
### Findings
- **medium** The EXPERIENCE.md intro says game rules are "not restated here", yet the Modes table restates source rules: target success %, combo mechanics and wrong-tap economics (EXPERIENCE.md → Modes). *Fix:* keep only the experience-facing rows (timer, score display, wrong-tap treatment, palette) and link the rest.
- **low** Soft miss is described in four places: State Patterns, Game-rule Notes, the Flow 1 failure path and Open Question 2. *Fix:* keep one canonical rule (Game-rule Notes) and reference it.
- **low** Open Questions repeats most of the inline [ASSUMPTION] tags one for one (23 items). That is acceptable as an index, but items 1, 4, 5 and 9 add nothing beyond the inline tag. *Fix:* optional trim.
- **low** The spacing scale `'1'`–`'6'` is defined but never referenced (DESIGN.md frontmatter). *Fix:* drop it, or use it in the control-surface and stats specs.

## 7. Inheritance discipline — adequate
Checked: all six `sources` paths resolve. Glossary and component names were compared across both spines, the sources digest and the memlog. EXPERIENCE token refs all resolve to DESIGN tokens.
### Findings
- **medium** Items from the reconcile pass were dropped without reaching Open Questions: the Zen intensity cap on transitions ("a shattering crystal in Zen?"), whether the kid profile defaults to Zen permanently, confirmation that the Normal countdown pressure is intentionally replaced by the outline line, operator mixing within a round, and the Tower round (reconcile-original-brief.md → Dropped qualitative ideas). *Fix:* add these to Open Questions.
- **medium** "Streak" is never defined. The memlog says a soft miss "must not break a streak", while EXPERIENCE.md uses "streak", "streak/combo" and "combo" interchangeably, and the sources also have a daily streak (retention research) (EXPERIENCE.md l.111, l.181, l.210). *Fix:* say "combo" if that is what is meant, or define the streak.
- **medium** Combo steps drift from the sources. The sources describe the multiplier as 1x → 1.2x … → 2x in steps; the spines define three glow stops (1x / 1.6x / 2x) with no mapping from multiplier to glow (DESIGN.md → Colors; EXPERIENCE.md → Modes). *Fix:* state how the intermediate steps interpolate between the three stops.
- **low** The name for one surface drifts: "End-of-round flash" (IA), "Round-end flash" / `round-end-flash` (Components) and "Normal end-of-round flash" (Open Question 10). *Fix:* use "Round-end flash" everywhere.
- **low** These assumptions were introduced by the spines rather than taken from the memlog: default Normal theme = Vector Noir, the 4.5:1 contrast floor, the menu pausing the Normal timer, narration being unskippable, `rounded.full` for the menu, and the transition drawing from the incoming pack. All are tagged [ASSUMPTION] and listed in Open Questions; none is silently invented. *Fix:* confirm them with the user.
- **low** EXPERIENCE.md frontmatter has no `description`; DESIGN.md has one. *Fix:* add one line.

## 8. Shape fit — strong
DESIGN.md sections follow canonical order (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts). EXPERIENCE.md has all eight required defaults. Inspiration & Anti-patterns is present (it is triggered by the reference products in the sources), and Responsive & Platform is present (it is triggered by multiple surfaces). The invented sections (Modes, Theme & Transition System, Sound & Haptics, Profiles & Child Safety, Seeds, Game-rule Notes, Open Questions) each carry decisions a game consumer needs; this follows the memlog decision to cover game concerns with invented sections.
### Findings
- **low** Seeds is a thin section that is mostly Later-phase and repeats an assumption. *Fix:* fold it into Game-rule Notes.
- **low** Theme packs (a collection and unlock concept) sits under DESIGN.md → Colors. *Fix:* keep only the visual pack anatomy in DESIGN and move unlock behaviour to EXPERIENCE → Theme & Transition System, where it is partly restated already.

## Mechanical notes
- All 53 distinct `{colors|typography|spacing|rounded}` references in both spines resolve to frontmatter tokens. No broken references.
- All six `sources` paths resolve. The `ux-numception.md` index links both spines.
- Component IDs are consistent across DESIGN frontmatter, DESIGN prose and EXPERIENCE Component Patterns. Exceptions: `power-cut`, `sinking-number` and `theme-transition` have no IDs.
- Name drift: End-of-round flash / Round-end flash; streak / combo.
- Value conflict: Kiln `line` is `#A14E36` in the frontmatter but "none" in the table.
- Recomputed contrasts: Kiln `operator` on `surface` is 2.6:1 (not listed; this is where the menu button sits). Obsidian Facet `number-dimmed` on facet is about 2.4:1 (listed as 2.9:1). Kiln `number` on `surface` is 4.52:1, so guide text passes by a hair.
- No Mermaid diagrams.
- EXPERIENCE.md frontmatter has no `description`.
