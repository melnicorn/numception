# PRD Quality Review — Numception

Reviewed against `.claude/skills/bmad-prd/assets/prd-validation-checklist.md`. Inputs: `prd-numception.md`, `addendum.md`, `.memlog.md`. Stakes: public launch, with the POC as the first milestone. As the user asked, the relaxed kid-telemetry and data-minimisation decision is treated as settled. It is checked only for whether it is documented consistently (see Mechanical notes).

## Overall verdict

This PRD has a real thesis ("the math is the game", plus the nested zoom as the defining moment). Its Non-Goals and child-safety posture are unusually honest, and the POC slice is coherent and mostly testable. The risk is concentrated in two places. First, done-ness for the v1 layer: mastery plateau, fractions, Overdrive and the navigation between round types have no testable definition, and some have no FR at all. Second, a few contradictions and unmapped Open Questions would surface as blockers in story creation. The biggest are that Grown-up reverts to Kid on cold start while play resumes "exactly", and that core POC questions (OQ-8, OQ-11) have no default. Verdict: **adequate**. It is ready to drive the POC once the high findings are fixed, but not yet ready to drive v1 story creation.

## Decision-readiness — adequate

Decisions are stated as decisions, and the trade-offs come with what was given up. Examples: the general store listing ("so that adults don't mistake it for a children's app", §4.10, §9.1), deferring music despite the brief's "calm music" (§6.2 NOTE FOR PM), and the telemetry stance with its ordered fallback mitigations (§9.1 Risk). Addendum A6 records the rejected alternatives with reasons. The `[NOTE FOR PM]` callouts sit at real tensions, not safe checkpoints.

What weakens it is §12. Sixteen Open Questions are listed flat, and only OQ-3 has an owner and a revisit condition. A decision-maker can't tell which ones block the POC and which block v1. The risk most likely to sink the thesis, WebView performance for the effects-heavy zoom, sits only in addendum A1 ("the main argument against the pick").

### Findings
- **[high] Open Questions are not mapped to milestones or owners** (§12) — OQ-8 ("tap-to-enter or pinch? Does the player choose which tier-1 puzzle to enter?") and OQ-11 (shapes for n=7 and n=9; three-digit numerals at n=9) affect core POC interaction and rendering, because FR-1 [POC] requires every `n` from 3 to 9. OQ-1, OQ-2, OQ-3, OQ-4, OQ-10 and OQ-13 gate v1. None says which milestone it blocks, and none except OQ-3 has an owner. OQ-8 has no default assumption, unlike OQ-6, OQ-7 and OQ-9. *Fix:* add "Blocks: POC / v1 / Later" and an owner to each OQ. Give OQ-8 and OQ-11 a working default as `[ASSUMPTION]`, or narrow the POC's `n` range.
- **[medium] Renderer-performance risk to the defining moment is buried in the addendum** (§11, addendum A1 "Risk") — §1 says "The defining moment is that zoom and the solve transition". Addendum A1 says "No source measured glow or particle fps on mid-range phones". The PRD body only says "pending the renderer prototype" and gives no decision rule for when the prototype misses NFR-1. *Fix:* add a `[NOTE FOR PM]` in §11 or §6.1 that names the fallback. Either cut effects to hold 60 fps, or reopen the engine choice (for example a native renderer).
- **[low] OQ-16 reopens a decided FR** (§12 OQ-16 vs FR-3) — FR-3 already tags within-round operator mixing as "[Later]", but OQ-16 asks "v1 or Later?". *Fix:* either remove OQ-16 or change FR-3 to point to it.

## Substance over theater — strong

There are two personas, Miles and Don, plus a walk-on (Chris), and both drive decisions. Kid defaults (FR-16 softer cue, FR-19 Relaxed, FR-39 Kid view) trace to Miles. Grown-up stats and leaderboards (FR-39, FR-42) trace to Don. The Vision is specific to this product and could not be swapped into another puzzle-game PRD. Differentiation in §1 ("the math is the game", no "math used as a toll booth") follows from the research on category complaints and is enforced in §5 and §10. NFRs carry product-specific thresholds: 100 ms tap response, 700 ms power-cut merge, 4.5:1 and 3:1 contrast, 48 pt and 56 pt targets, 3 flashes per second. No findings.

## Strategic coherence — strong

The thesis is clear. The joy of the nested collapse, at a difficulty that adapts quietly and with no pressure, carries both a kid audience and an adult one. The POC slice proves exactly that thesis: core loop, two modes, prior and logging, onboarding. SM-1 to SM-4 test it directly. SM-2 ("can explain unprompted that answers become the next puzzle") is a good thesis metric, not an activity metric. The counter-metrics (SM-C1 to SM-C4) are thoughtful and tied to specific SMs. The scope kind is experience-first, and the scope logic matches it.

### Findings
- **[medium] Daily Seed is the same for every player, which cuts against the adaptive thesis without saying so** (FR-32, UJ-6, addendum A3) — "Every player can play the same Daily Seed round each day". Miles (8) and Don (adult) would get identical content, but §1 promises "an 8-year-old and a daily-brain-game adult both stay in their sweet spot". Addendum A3 gives competitive seeds "a fixed difficulty curve" but doesn't say what that curve is. OQ-4 is too general to cover this. *Fix:* decide the Daily Seed's difficulty. Options are one curve for all, per-band seeds (for example a Kid seed and a Grown-up seed), or "same seed, difficulty-scaled". Record the trade-off against comparability.
- **[medium] Some v1 metrics have no target** (§7 SM-6, SM-9) — SM-6 (streak survival) is a *primary* v1 metric with no threshold, and SM-9 has none either. SM-5 at least carries an assumed target. *Fix:* give provisional targets tagged `[ASSUMPTION]`, or say explicitly "baseline from the soft launch, target set after N weeks".
- **[low] POC thresholds assume exactly five playtesters** (SM-1 to SM-3: "At least 4 of 5") — *Fix:* state the cohort size, or express the thresholds as ≥ 80% with a minimum N.

## Done-ness clarity — thin

The POC FRs are mostly well specified. Good examples are FR-1 (100,000-puzzle independent check), FR-10 ("Killing the app at any moment… restores the same puzzle, solved cells, tier and mode"), FR-16 (700 ms and 500 ms), FR-25 and FR-26 (crossfade of at least 400 ms, at most 3 flashes per second) and FR-38 (delete-all to first-run state). The v1 layer is much weaker. The feature that unlocks all v1 content (FR-22) has no definition. Several v1 scope items in §6.1 have no FR. Normal-mode tuning is described with adjectives, and one cross-FR contradiction would block implementation.

### Findings
- **[high] Cold-start profile reversion contradicts "resume exactly"** (FR-34, FR-10, UJ-3) — FR-34 says "Grown-up mode reverts to Kid on cold start". FR-10 says relaunch "restores the same puzzle, solved cells, tier and mode". UJ-3 (Don, Grown-up) ends with "the next launch resumes exactly there". Read literally, Don lands in the Kid profile and would have to pass the parent gate every morning. That adds friction to the adult "quick daily mental workout" JTBD (§2.1), and the PRD doesn't acknowledge the trade-off. *Fix:* decide which rule wins. For example, "cold start resumes the Kid profile's state; switching to Grown-up resumes Grown-up's exact state behind the gate". Then update FR-10's consequence and UJ-3's resolution to match.
- **[high] Mastery plateau is undefined, yet it gates all v1 content** (FR-22, glossary "Mastery plateau") — FR-22 has no consequences, and the glossary defines a plateau as "solving reliably at their level". That plateau triggers FR-24, which is how × and ÷ reach players (FR-3), so v1's operator rollout can't be tested. *Fix:* give an operational definition, for example "player rating for operator X changes by less than δ over the last N puzzles while success is at or above the mode target". Tag the numbers `[ASSUMPTION]` and add a consequence for false positives and false negatives.
- **[high] v1 scope items have no FR** (§6.1 v1 list, §4.1 Notes, §4.4 Notes) — §6.1 lists "Dot faces and fractions (FR-31, FR-3)", but FR-3 defines only ×/÷ plus "unless fraction content is enabled". No FR covers fraction generation, representation or uniqueness, and fractions aren't trivial for a generator built on uniqueness. "Overdrive, graded cooling and the clean bonus (§4.4 notes)" are also v1 scope with no FR or consequences. *Fix:* add FRs for fractions (range, representation, how uniqueness works with ÷) and for Overdrive, graded cooling and the clean bonus. Otherwise move them to Later.
- **[medium] Normal-mode tuning and several consequences use adjectives instead of bounds** (FR-1, FR-9, FR-12, FR-15, FR-10) — Examples:
  - FR-1: "fast enough that no loading state is ever shown". NFR-1, which it cites, has no time bound for generation.
  - FR-9: "The first round collapse… is long and slow. Later ones are shorter."
  - FR-12: "Progress altitude shows landmarks as the tree grows" and "the fog lifts like mist at dawn".
  - FR-15: "points… scaled by puzzle difficulty and speed", with combo steps between 1x and 2x left unstated, and no length for the Standard chain window.
  - FR-10 and §4.12: "pauses both Normal timers", where the two timers are never named.

  Addendum A2's scoring formula is explicitly overridden for display, so no points formula remains. *Fix:* give each item a number or a tunable parameter with a starting value, for example "first collapse ≤ X s, later ones ≤ Y s", "generation ≤ Z ms on the reference device", "Standard window = W s, combo steps 1x/1.25x/1.5x/2x". Alternatively, cite the exact section of the UX spine that owns the number.
- **[medium] The parent gate isn't implementable as written on the POC platform** (FR-35, §11) — the gate is "a device PIN or platform parental controls". The POC runs on the web (§11), which exposes neither. No flow defines who sets an app PIN when first launch is always Kid (FR-34). *Fix:* specify an app-level PIN that is set up the first time someone enters Grown-up (with a recovery path), and use device authentication or platform controls where available.
- **[medium] Navigation between round types and entry points is missing** (FR-7, FR-11, FR-12, FR-13, FR-32, FR-40) — v1 has the Pyramid (home), Classic and Tower, Rapid Fire and the Daily Seed. But FR-40's control surface lists none of them, and FR-11 says a round "leads straight into the next round". Nothing says how a player starts Rapid Fire or the Daily Seed, or whether Classic and Tower still exist once the Pyramid is home. *Fix:* add an FR for round-type selection and entry points (or a "Play" entry on the control surface), and state how Classic and Tower relate to the Pyramid in v1.
- **[medium] Who picks `n` is unspecified** (glossary "n", FR-1, FR-11, addendum A2) — `n` is a difficulty feature in the generator bucket, but no FR says whether the adaptive engine, the player or the round type chooses it, or whether it can change between rounds. *Fix:* add a consequence to FR-20 or FR-11, for example "n is selected by the adaptive engine per round, starting at n=3".
- **[medium] Reference devices are unnamed** (NFR-1, SM-4, addendum A1) — NFR-1 says "a mid-range Android phone and an iPhone at least 3 years old", and SM-4 says "the reference devices". Neither is pinned down enough to test. *Fix:* name the models, for example a specific Galaxy A-series phone and an iPhone 13 or 14, and keep the list in the PRD.
- **[low] Several FRs have no testable consequences** (FR-17, FR-19, FR-22, FR-27, FR-30, FR-31, FR-36, FR-37) — Some are self-evident, such as FR-37. Others are not:
  - FR-30 sets a hint budget only for "easy" and "very easy" and is silent about harder bands.
  - FR-17's "whether the round was clean" leaves "clean" undefined (for example, does a soft miss count?).
  - FR-36's "do not exist" could be checked with an accessibility-tree assertion.

  *Fix:* add one or two consequences each.
- **[low] Success-rate tolerances differ without explanation** (FR-20 vs SM-7) — FR-20 says "each player's success rate… within ±7 points", while SM-7 says "median per-player success rate within ±5 points". The statistics differ, but the PRD doesn't say how they relate. *Fix:* add one line explaining that FR-20 is an acceptance bound per player and SM-7 is a fleet-level health metric.

## Scope honesty — adequate

§5 Non-Goals does real work: no ads, no pay-to-win, no communication features, "No math used as a gate". §6.2 separates Later from Parked. The Assumptions Index round-trips (18 inline, 18 indexed). Open-item density is 16 OQs, 18 assumptions and 3 NOTE FOR PM callouts. That is high for a public-launch PRD, but acceptable for a POC-first plan, provided the OQs are gated by milestone (see Decision-readiness).

### Findings
- **[medium] Phase tags in §4 and the §6.1 milestone lists don't match** (§6.1) — three tagged FRs are missing from the lists:
  - FR-6 [POC] generator versioning is not in the POC list.
  - FR-5 [v1] seeded generation is not in the v1 list, although FR-32 depends on it.
  - FR-36 [v1] Kid-profile social surface absent is not in the v1 list. That is a child-safety requirement, so leaving it out risks it being dropped during ticketing.

  *Fix:* add FR-6 to the POC list, and FR-5 and FR-36 to the v1 list.
- **[low] Phase wording contradicts itself in a few places** (§4.1 Notes, glossary "Operator") — §4.1 Notes reads "[Later] dot faces… are a v1 representation option (FR-31)". The glossary says "Fractions and further operators arrive later as content", while §6.1 puts fractions in v1. *Fix:* drop the stray "[Later]", and reword the glossary to "arrive as content (fractions in v1; powers and roots Later)".
- **[low] Push notifications are mentioned once and never scoped** (§12 OQ-3: "given kid telemetry, platform IDs and push") — no FR, Non-Goal or NFR covers push, and UJ-5 implies none ("nothing nags him to come back"). *Fix:* add "No push notifications in v1" to §5, or add an FR if they're wanted.

## Downstream usability — adequate

This PRD sits at the top of a chain (architecture, then tickets), so this dimension matters. The glossary is strong and mostly obeyed. IDs are contiguous and unique: UJ-1 to UJ-6, FR-1 to FR-46, SM-1 to SM-9, SM-C1 to SM-C4, NFR-1 to NFR-6, OQ-1 to OQ-16. Every FR carries a phase tag. Sections mostly stand alone through glossary terms. Two cross-references are wrong and there is some term drift.

### Findings
- **[medium] FR-22 points to the wrong FR** (§4.5 FR-22) — "uses that as the trigger for new content (FR-23)". FR-23 is Guided first rounds, so the target should be FR-24 (Surprise-at-mastery). *Fix:* change it to FR-24.
- **[medium] Glossary drift on load-bearing terms** — four collisions with defined terms:
  - "Grown-up mode" (§4.10, FR-34 consequences) collides with the glossary's **Mode** (Zen or Normal only). It should be "Grown-up profile".
  - "layer" and "layers found" (UJ-1 title, FR-39 Kid view) are a synonym for **tier**.
  - "sky" and "lights in your sky" (§1, FR-39) are a synonym for **constellation**.
  - "the tower" (§2.1 Emotional JTBD) refers to the growth visual, but **Tower** is a round type.

  "Fast mode" (UJ-1, FR-18) is player-facing copy for Normal and should be marked as copy. Terms used but not defined: totem, Overdrive, fog of war, landmarks and progress altitude, home view, round time ("both Normal timers"), clean round, hint (FR-23 and FR-30 describe different hints). *Fix:* switch to the glossary terms, add the missing ones, and mark player-facing copy as copy.
- **[low] Some UJ → FR links are wrong or incomplete** — UJ-3 (a Normal session) cites "FR-14–FR-17", but FR-14 is Zen; it should be FR-15–FR-17 plus FR-19 (chain window). UJ-1 omits FR-25 (theme per round) and FR-41 (narration and tones). UJ-5 omits FR-7 (the home-tree glide on launch). UJ-4 omits FR-2. *Fix:* correct the lists.

## Shape fit — strong

This is a consumer product with meaningful UX and two audiences, so UJs with named protagonists are the right shape, and the PRD has them, mirroring the UX spine's flows. Detail is delegated to the UX spine and the addendum without leaving capability gaps, apart from the navigation gap noted above. The level of formality suits a chain-top PRD for a public launch. No findings.

## Mechanical notes

- **Cross-references:**
  - FR-22 → FR-23 should be FR-24.
  - UJ-3 → FR-14 should be FR-19 (or drop FR-14).
  - All other FR → FR and FR → NFR references resolve: FR-1 → NFR-1, FR-3 → FR-24, FR-14 → FR-20, FR-24 → FR-22, FR-25 → NFR-4, FR-27 → FR-46, FR-30, FR-31.
  - SM "Validates" lists resolve.
- **Phase tags, §4 vs §6.1:** FR-6 is missing from POC, and FR-5 and FR-36 are missing from v1. The "[Later]" in the §4.1 Notes contradicts "v1". FR-20 and FR-3 split their phases correctly, and §6.1 reflects that.
- **ID continuity:** no gaps or duplicates in UJ, FR, SM, SM-C, NFR or OQ.
- **Assumptions Index:** 18 inline and 18 indexed, a full round-trip. FR-34's inline tag is a bare "[ASSUMPTION]" with no statement; the index supplies the statement. Move the statement inline.
- **UJ protagonists:** UJ-4's "any player, n=3" has no named protagonist. That's acceptable for a mechanic demo, but naming Don or Miles would fit the pattern.
- **Telemetry and data-minimisation decision (consistency check only, not reopened):** it is documented consistently in §4.11 ("The same data is captured for Kid and Grown-up profiles"), §4.15 (NOTE FOR PM with the revisit condition), §9.1 Data and Risk (with ordered mitigations), OQ-3 (owner and revisit condition) and addendum A6. All of these match memlog entries 18–19, which supersede the earlier entry 12. The FR-45 assumption allowing processor-contracted third-party analytics stays inside the relaxation and keeps the no-ads line (memlog 23). The only loose thread is that OQ-3 mentions "push", which appears nowhere else (see Scope honesty).
- **Sources:** §0 lists "the citation check" without a path.
