---
title: Reconcile — brainstorm-modes-stickiness-name vs PRD
created: 2026-10-09
source: ../brainstorm-modes-stickiness-name/ (brainstorm-modes-stickiness-name.md, .memlog.md, feature-list-by-phase.md, brainstorm.html, concept-pitch.html)
target: prd-numception.md, addendum.md (memlog decisions treated as authoritative)
---

# Reconcile: brainstorm (modes, stickiness, name) → PRD

These items are excluded because PRD memlog decisions deliberately override them: the daily streak (now IN), totems/freezes being earn-only, the one-time unlock with no POC paywall, the relaxed telemetry rules, profiles and the parent gate, and the softer Kid power cut. Items that are present in substance are not listed.

Abbreviations: **BI** = brainstorm-modes-stickiness-name.md, **BM** = brainstorm .memlog.md, **FL** = feature-list-by-phase.md, **CP** = concept-pitch.html, **BH** = brainstorm.html.

## High

### G1. The "two engines carry everything" dependency map is missing, and the POC generator is not required to be seedable or extensible
- **Source:** BI §Core ("Two engines carry everything, and the POC must build both"); FL §Engine dependencies; BH Replay #3; BM synthesis line.
- **PRD:** absent as a principle. FR-5 (seeded generation) is v1. Addendum §A1 lists only what the `core` package contains, and §A3 is a sketch.
- **Gap:** the source treats the generator and uniqueness checker as the platform for seeds, Daily, ghosts, teacher mode, Library/Atlas rarity detection, Operator Sudoku (a whole-round uniqueness solver), top-down play (reverse uniqueness: each `c` has exactly one `a,b`) and upward-infinite Pyramid generation. The PRD never asks the POC generator to be deterministic from `(rootSeed, treePath, difficulty, generatorVersion)` or to expose pluggable solvers. If the POC generator uses unseeded randomness, it will need a rewrite at v1.
- **Fix:** add an addendum section (§A7, "Engine dependencies") that copies the FL map. Then add a POC consequence to FR-1/FR-2: generation is a pure function of seed + tree path + difficulty + version, even before seeds are exposed to players. Note reverse uniqueness and the whole-round solver as known Later extension points.

### G2. The zoom-as-layout navigation model (tier-2 overview of n glowing cells) is dropped
- **Source:** BI §Design principles ("Tier 2 is an overview of n glowing cells, and the player zooms into one tier-1 puzzle at a time"); FL POC §Inception ("Zoom-as-layout between tiers … solves the mobile screen-size problem"); BM "Zoom-as-layout".
- **PRD:** §4.2 says "One puzzle fills the frame". FR-9 covers only the collapse. OQ-8 asks about the gesture but not about the overview state.
- **Gap:** there is no requirement for an overview state in which the parent puzzle shows its n child puzzles as glowing cells (solved, unsolved, in progress), or for zooming into and out of it. This is the POC answer to the mobile screen-size problem and it shapes the camera/scene architecture.
- **Fix:** add an FR in §4.2 [POC]: "Tier overview and zoom-in". The parent tier shows its n children as cells whose solved state is shown as light, and the player zooms into one child at a time. Link it to OQ-8.

## Medium

### G3. Spatial menus (zoom out past the tree to reach settings, collection and modes) are dropped
- **Source:** BI §Design principles ("Menus are spatial … must also be a single-tap shortcut"); FL POC §Feel/UI ("Spatial menus + one-tap control surface"); BM direction by user.
- **PRD:** FR-40 keeps only the one-tap button and full-frame panel. Spatial navigation is absent.
- **Gap:** the user accepted spatial navigation "in theory" and added the shortcut as a supplement, not as a replacement. The PRD keeps only the shortcut, without saying it chose to.
- **Fix:** either add spatial menus as [v1]/[Later] (they fit naturally with the v1 home tree) or record in addendum §A6 that they were rejected in favour of the control surface, with the reason.

### G4. The ripple hint is misstated as a player-invoked "highlight the answer region" hint
- **Source:** BI §Content ("A ripple hint fades one distractor per solved neighbour … capped … k=1 easy, k=2 very easy … a, b and c are never faded"); BM ripple-hint decisions; FL v1 "Ripple hint with hint budget".
- **PRD:** FR-30 says "use a hint that highlights the answer region … budget of 1 hint per puzzle … never fades a, b or c".
- **Gap:** the mechanic changed from passive distractor fading, earned by solving neighbours (which ties into the "light moving through the structure" idea), to an active hint that highlights the answer. That contradicts its own "never fades a/b/c" clause. The budget semantics changed too: the budget was a cap on fades, not a count of hints.
- **Fix:** rewrite FR-30 as "Ripple hint (easy modes only)": each solved neighbour fades one distractor, fades are capped at k=1 (easy) or 2 (very easy) per puzzle, and `a`, `b` and `c` are never faded. If an active hint is also wanted, make it a separate FR.

### G5. Power-grid wiring is phased v1 but has no FR and is missing from §6.1
- **Source:** FL v1 §Inception ("Power-grid wiring … partly powered puzzle is soft-lit in a different colour, full power lights it up and unlocks it"); BI v1 candidates; BH (whole page metaphor "send power up the wire").
- **PRD:** mentioned only in §4.8 Notes ("power-grid wiring visual are v1"). There is no FR and it is not in the §6.1 v1 list.
- **Gap:** this is one of the core "state as light" expressions. It also has a gating meaning ("full power … unlocks it") that affects Pyramid navigation. With no FR, epics will miss it.
- **Fix:** add an FR under §4.3 or §4.8 [v1] covering partial and full power states and the unlock semantics, and list it in §6.1.

### G6. Fog of war semantics changed
- **Source:** BM ("only one puzzle visible at start; solving it reveals its neighbours"; "Zen fog = mist lifting at dawn; the reveal is the reward"); FL v1 Fog of war, plus Later "Pyramid fog map" (territory pushed out of the fog).
- **PRD:** FR-12 says "Fog of war hides unbuilt territory" [v1].
- **Gap:** the PRD merges the v1 neighbour-reveal mechanic (solving a puzzle reveals the adjacent puzzles, so the reveal is the reward) with the Later fog map. The neighbour-reveal rule and its reward framing are lost, and the scope (rounds or only the Pyramid) is unstated.
- **Fix:** give fog of war its own consequence: at start only one puzzle is visible, and each solve reveals its neighbours. Say whether this applies in Classic/Tower rounds or only in the Pyramid. Keep "Pyramid fog map / territory" as Later.

### G7. Fractions are v1 scope with no FR
- **Source:** BI §Content ("Fractions: definitely in, with escalating complexity such as mixed denominators"); FL v1 Fractions.
- **PRD:** §6.1 v1 says "Dot faces and fractions (FR-31, FR-3)", but FR-3 does not mention fractions. They appear only in §4.1 Notes and the FR-3 ÷ consequence.
- **Gap:** this v1 content type affects the generator, uniqueness checking, the difficulty features and rendering, yet it has no testable requirement and no explanation of how it is introduced (via surprise-at-mastery?).
- **Fix:** add an FR in §4.1 [v1]: fraction content with an escalation ladder (like denominators, then mixed denominators), introduced through FR-24, with difficulty features added to §A2.

### G8. The state-as-light principle that keeps two modes cheap is not stated as a constraint
- **Source:** BI §Core ("State is shown as light, so Zen and Normal differ mostly in palette and intensity. That keeps two modes cheap to build."); BH Replay #2.
- **PRD:** §10 keeps the design test, but no architecture or NFR statement says that modes are a palette and intensity parameter over one shared scene. The theme system (FR-25/26) could push toward per-mode art.
- **Gap:** this cost and architecture principle isn't passed on to the architect.
- **Fix:** add to §4.4 or the addendum: "Mode and theme are parameters of one rendering of state-as-light (palette, intensity, motion), not separate scenes."

## Low

### G9. Points flowing into session and lifetime totals is under-specified
- **Source:** BI §Mode rules ("flow visibly into the session total, then into the lifetime total, and are bigger and brighter for harder pieces"); CP Normal.
- **PRD:** FR-15 mentions a "point stream" but says nothing about a session or lifetime total, or about brightness scaling with difficulty. FR-39 stats have no lifetime points.
- **Fix:** add FR-15 consequences: the stream feeds a session total and then a lifetime total, and its size and brightness scale with puzzle difficulty. Add lifetime points to Grown-up stats.

### G10. × and ÷ in the POC: "only if cheap" became a hard ban
- **Source:** FL POC ("× and ÷ are added only if cheap").
- **PRD:** FR-3 says "A POC build has no code path that serves × or ÷ puzzles to players."
- **Fix:** soften to "players are not served × or ÷ in the POC, but the generator may support them internally if cheap", or record the reason for the hard ban.

### G11. Dot faces have contradictory phase tags, and the layout intent is missing
- **Source:** BI §Content (dice-style faces up to about 12, "subitizing-friendly layouts", "not literal dominoes"); FL v1.
- **PRD:** §4.1 Notes say "[Later] dot faces … are a v1 representation option", while FR-31 says [v1]. Subitizing-friendly layouts are not mentioned.
- **Fix:** change the Notes tag to [v1]. Add an FR-31 consequence: subitizing-friendly, dice-style layouts for values above 6, not dominoes.

### G12. Whether the home-tree glide is opt-in or the default is inconsistent
- **Source:** CP ("Home is that tree: zoom out to see how big it is, then glide to the next unsolved puzzle"); BM "Home screen: zoom out … then glide".
- **PRD:** FR-7 says "[v1] An opt-in 'zoom out to see the tree' beat". UJ-5 shows it as the default entry.
- **Fix:** pick one. The source intends it as the default home behaviour, skippable with a tap.

### G13. The sensory detail of the power cut is thinned
- **Source:** BI §Mode rules (glow dies, lines flicker dark, dark red flash and pulse, background fades, bass power-down, reboot at a dim 1x).
- **PRD:** FR-16 and FR-41 cover the reset, the ≤500 ms limit and the power-down sound. "Background fades" and "reboot at dim 1x" are absent.
- **Fix:** add a one-line consequence to FR-16, or confirm that the UX spine owns this.

### G14. The Zen counterpart to the lightning strike is dropped
- **Source:** BI v1/Later candidates ("The Zen equivalent is a growing tree or river delta").
- **PRD:** §6.2 Later lists only "the lightning strike".
- **Fix:** list it as "lightning strike (Normal) / growing tree or river delta (Zen)".

### G15. "Next round assembles at the edge of view" is replaced by a theme transition
- **Source:** BI §Design principles ("next round assembles at the edge of view"); FL POC "No end screen".
- **PRD:** FR-11 says the next round arrives "through a theme transition".
- **Gap:** the "infinite by default" spatial continuity (the next round is already forming nearby) is weaker in the PRD.
- **Fix:** add to FR-11 or FR-26 that the next round becomes visible or assembles before the transition completes, or record that the theme transition replaces this.

### G16. Two distinct "descent" ideas are conflated
- **Source:** BM has "Descent mode: start at a huge locked top puzzle, tap a cell to dive in until real numbers, solve back up" (coach) and, separately, "Top-down reverse mode: given c, select a and b … working downward" (user).
- **PRD:** §6.2 lists "Descent (top-down) mode" as one item.
- **Fix:** list them as two Later items. Only the reverse mode needs reverse uniqueness.

### G17. Ghost duels mean recorded-tap replay, but the PRD shows manual time sharing
- **Source:** BM ("race a friend's recorded taps asynchronously"); FL Later Ghost duels.
- **PRD:** UJ-2 describes manual time sharing, with no ghost.
- **Fix:** relabel UJ-2 as "seed challenge", or note that ghost replay needs per-tap timing in seeded runs (FR-44 is a possible base).

### G18. The naming rationale and tagline are dropped
- **Source:** BI §Open questions ("Innumerable" as a possible tagline; Latin *summa* = sum and highest point, which ties the name to the climb motif).
- **PRD:** OQ-1 lists only the shortlist.
- **Fix:** add the tagline candidate and the *summa* rationale to OQ-1.

**Total: 18 gaps** (2 high, 6 medium, 10 low).
