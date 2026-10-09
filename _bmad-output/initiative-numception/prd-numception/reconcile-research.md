---
title: Reconcile — research inputs vs PRD
created: 2026-10-09
inputs: citation-check-2026-10-08.md; research-arithmetic-difficulty-and-adaptive-scori; research-retention-in-math-puzzle-games; research-name-and-trademark; research-game-engine-selection
against: prd-numception.md, addendum.md (memlog decisions treated as authoritative)
---

# Reconcile: research inputs vs PRD

Scope: gaps where the PRD or addendum dropped, weakened or misstated a research recommendation, constraint, risk or metric. Excluded as deliberate memlog overrides: relaxed kid telemetry and third-party processors (vs. "no tracking libraries in kid profiles"), legal review deferred to pre-launch (vs. "COPPA from day one"), kid stats collect-everything, daily streak IN, no POC paywall.

Abbreviations: ARITH = research-arithmetic-difficulty-and-adaptive-scori.md; RET = research-retention-in-math-puzzle-games.md; NAME = research-name-and-trademark.md; ENG = research-game-engine-selection.md; CC = citation-check-2026-10-08.md.

## High

### G1. Normal score formula needs a per-puzzle time limit `d` that the PRD never defines
- **Source:** ARITH Exec summary item 3 and Recommendation 3: `S = (2·correct − 1)·(d − t)` "with a visible time limit `d`"; Math Garden uses 20 s.
- **PRD:** FR-15 says only "scaled by puzzle difficulty and speed". Addendum §A2 quotes the formula. The only clock in Normal is the chain window, which governs combo, not a per-puzzle deadline. Nothing says what `d` is, what happens when `t > d`, or how the chain-window setting (Relaxed 1.5×, Off) changes `d`.
- **Why it matters:** the `core` scoring module and NFR-5 (identical scoring across platforms) cannot be built or tested without it.
- **Fix:** add to FR-15 (or the addendum) the definition of `d` per puzzle: a fixed value, one derived from bucket difficulty, or one tied to the chain window. Add the rule for `t ≥ d` (floor at 0 points) and how Relaxed and Off scale `d`. Add a testable consequence: the same inputs give the same points on every platform.

### G2. Addendum feeds the speed-based score into the rating without the model the research says that needs
- **Source:** ARITH Recommendation 2 (Elo on correctness), Recommendation 4, and Open question 4: an expected-score equation for the speed-accuracy rule (Maris & van der Maas 2012) is "needed only if we want a proper probabilistic model rather than Elo on correctness."
- **PRD:** Addendum §A2 says of the HSHS score: "The negative term can still feed the internal rating, with fast slips softened." FR-21 does not say whether the rating uses correctness only or speed as well. That open question is absent from §12.
- **Why it matters:** this choice decides the data model and update rule of the rating module. Mixing a speed score into a correctness-Elo update without a matching expected-score model breaks the `P` calibration that SM-8 and FR-20 depend on.
- **Fix:** state in FR-21 or §A2 that v1 ratings update on correctness only in both modes, with speed affecting points only. Otherwise add an OQ to adopt the Maris & van der Maas expected score before architecture.

## Medium

### G3. Retention targets rest on a disputed vendor figure; D28 target has no source
- **Source:** RET Benchmarks: all-mobile median D28 0.85%, and "75% of games are below 3%". The puzzle figures D1 ~32% and D7 ~12% are low confidence with "unclear origins", and no D28 figure is given. RET Staleness: benchmarks stale since 2026-08.
- **PRD:** SM-5 assumption D1 ≥ 30%, D7 ≥ 12%, D28 ≥ 5%. D7 12% is the disputed vendor figure. D28 5% is about 6× the median and above where three-quarters of games sit, with no source at all. The fact that 75% of games fall below 3% D28 is dropped from the addendum (§A5).
- **Fix:** in SM-5, mark D7 and D28 as unsourced placeholders. Add the "75% < 3% D28" context to §A5. Alternatively, anchor the provisional targets to the sourced top quartile (D1 ≈ 27%, D7 7–8%) until the 2026 GameAnalytics puzzle data is pulled.

### G4. Rating mechanics dropped: separate K functions, and resetting changed items
- **Source:** ARITH Pelánek defaults: "Use separate functions for items (many answers, stable) and players (fewer answers, changing). Reset a changed item to 0." Recommendation 2: "for players and for puzzle families, separately".
- **PRD:** Addendum §A2 gives a single `U(n)`. FR-6 records generator and model versions, and FR-21 seeds new buckets from the prior. Neither says what happens to bucket ratings when the generator or difficulty-model version changes.
- **Why it matters:** generator versioning is a POC feature, so a stale bucket rating would mis-serve difficulty after every generator update.
- **Fix:** in §A2, specify separate `U(n)` parameters for players and buckets. Add an FR-21 consequence: when a bucket's generator or feature definition changes, that bucket's rating resets to the new prior.

### G5. The renderer tie-break criteria were dropped, including the one that matters most for this game
- **Source:** ENG Decision matrix. The pick is Phaser 4. PixiJS v8 wins instead if Phaser stutters on mid-range phones, if its bundle is meaningfully larger, or "if we want full control of the render loop for custom effects such as fractal zoom."
- **PRD:** Addendum §A1 says only "effectively tied, and a prototype decides". The decision criteria are gone, and the prototype scene (lines, glow, 200 particles) does not include the zoom or round collapse, which is the product's defining moment (§1, FR-9).
- **Fix:** list the three tie-break criteria in §A1. Add a camera zoom and pull-out of nested puzzles to the prototype scene, so it measures the effect the game is built around.

### G6. Load stall seen in the reference Capacitor and PixiJS game is not recorded as a risk
- **Source:** CC, engine row [19]: the AURADUEL PixiJS v8 + Capacitor game had "an 8.5 s main-thread freeze while loading". The ENG exec summary only reports its audio and media quirks.
- **PRD:** FR-7 requires launch straight into play, and NFR-1 bans loading states. The §A1 known items list the mute switch and filter resolution but not cold-start or main-thread stalls. There is no cold-start or time-to-interactive target.
- **Fix:** add a §A1 known risk. Add to the renderer prototype a measurement of cold-start time to first interactive frame on the reference devices. Add a cold-start budget to NFR-1.

### G7. Theme packs "earned through play milestones" contradicts the retention guidance on contingent rewards
- **Source:** RET Recommendation 2: "Don't use unlocks as a contingent payment for playing. Unlock content because the player has demonstrated mastery, framed as new play, not prizes". Supporting evidence: expected tangible rewards d ≈ −0.28 to −0.40, worse for children (CC: supported).
- **PRD:** the FR-27 assumption says packs are "earned through play milestones". FR-24 follows the guidance for operators, but packs do not.
- **Fix:** reword the FR-27 assumption so packs arrive through the surprise-at-mastery or discovery pattern (FR-22/FR-24), not as announced milestone prizes. Add this criterion to OQ-10.

### G8. Naming criteria are absent; the shortlist doesn't follow them
- **Source:** NAME Recommendation 2. The name should be an invented coinage, 2–3 syllables, distinct in sound from Kakooma, KenKen and "-doku". Descriptive names end up crowded. Store titles should put the distinctive word first, because Apple search truncates at about 26 characters.
- **PRD:** OQ-1 lists Sumspire, Infinum, Numsummit, Summara and Summalux. Most are descriptive "Sum-/Num-" compounds. §9.2 and NFR-6 keep the clearance checklist and the 30-character cap, but not the naming direction or the first-word and truncation guidance.
- **Fix:** add the naming criteria to OQ-1 or §9.2. Add to NFR-6: the distinctive word comes first, and the title is checked at about 26 characters. Note that "Sum-" compounds are likely to clear as weak or crowded marks.

## Low

### G9. Duolingo lifts are relative, but are written as if absolute
- **Source:** RET [1] and CC: "+3.3% D14, +1% DAU", which CC confirms are both relative.
- **PRD:** Addendum §A5 says "+3.3% D14 retention and +1% DAU" with no qualifier, so it can be read as percentage points.
- **Fix:** add "(relative)".

### G10. Kakooma trademark is stated as fact
- **Source:** NAME Exec summary 1 and CC. A registration is inferred from the ® mark and "almost certainly exists", but the number, classes and status are unconfirmed. The open question calls for a manual USPTO check, and the staleness map says to re-verify "before launch, whatever the date".
- **PRD:** Addendum §A6 says "Kakooma: trademarked by Tang Math". §9.2 has no step to confirm the registration.
- **Fix:** reword it to "marked ® by Tang Math; registration unconfirmed". Add a manual tmsearch check of KAKOOMA to the §9.2 pre-launch list.

### G11. Clearance checklist is incomplete and overstates its sourcing
- **Source:** NAME Recommendation 3 includes Steam and itch.io. Google Play titles: no ranking or price claims, no emoji. CC: Nice classes 9, 28 and 41 come from a secondary source, and USPTO names no classes.
- **PRD:** §9.2 omits Steam and itch.io, and NFR-6 omits the Play metadata rules.
- **Fix:** add the missing checks. Note that the attorney should confirm the classes.

### G12. Staleness flags were dropped
- **Source:** ENG Staleness map: "Phaser 4.2.1 is latest" is "stale now: check for 4.3+". RET: the Duolingo experiments (2017–2020) are stale. ARITH: the 2025 Elo papers are "stale as of 2026-10".
- **PRD:** Addendum §A1 flags only the Unity pricing as stale. §A5 does not mark the Duolingo data as dated or single-company.
- **Fix:** add these staleness notes. Mark the streak evidence as single-company and partly from 2017 (RET "Biggest caveat").

### G13. Retention is not instrumented from the first prototype
- **Source:** RET Recommendation 7 (high confidence): "Instrument retention from the first prototype. Track D1/D7/D28, streak survival, and session length by mode."
- **PRD:** FR-44 in the POC logs puzzle events only, stored locally. Retention and session events arrive only with v1 FR-45, so SM-5, SM-6 and SM-C1 have no baseline before launch.
- **Fix:** add session start and end and day-return events to the FR-44 POC log, so playtests can produce a provisional baseline.

### G14. Native features for guideline 4.2 are hidden behind the default Kid profile
- **Source:** ENG Cross-dimension insight: plan native touches (haptics, Game Center, offline) "so the app clearly offers more than a website".
- **PRD:** FR-43 and NFR-6 rely on leaderboards for 4.2. But FR-36 and FR-42 remove them from the Kid profile, which is what every first launch, including App Review's, sees (FR-34).
- **Why it matters:** this is a derived risk to a launch gate.
- **Fix:** in NFR-6, record which native features a reviewer sees in the default Kid profile. Consider review notes that point to the Grown-up features.

### G15. Personal-best surfacing and friend or nearby-rank boards are dropped
- **Source:** RET Recommendation 3: "Personal-best first, then friend or nearby-rank boards". Also [20]: beating your own best time motivates.
- **PRD:** FR-17 has no "new personal best" cue (UJ-3 assumes one). FR-42 has only global and PB boards.
- **Fix:** add a PB indication to the FR-17 consequences. Add friend or nearby-rank boards to FR-42 or to Later.

### G16. Success-rate targets are presented without the research caveats
- **Source:** ARITH: the "85% rule" is proven only for two-choice tasks, and its author warns against applying it to schooling [26]. Evidence for dynamic difficulty adjustment in games is "mixed overall" [27].
- **PRD:** §4.4 and FR-20 state the targets with no caveat.
- **Fix:** add a one-line caveat in §A2 that the targets are provisional and set by playtest.

### G17. No rule for a new player's starting rating
- **Source:** ARITH Pelánek: ratings start at 0, and K is high early on.
- **PRD:** FR-21 covers new buckets but not new players or new profiles. A 6-year-old and an adult would get the same first puzzles.
- **Fix:** state the starting rating per profile type, or say that guided rounds (FR-23) calibrate it.

### G18. Unchecked claims are stated as fact in the Vision
- **Source:** CC retention rows [7] (Prodigy upsells) and [9] ("math gates the game"): both "not checked". [10] (Number Match ads): "not checked".
- **PRD:** §1 says the category's "most common complaints are ads, upsells and 'math that gates the game.'"
- **Fix:** soften it to "frequent complaints", or cite the NBC/CCFC count, which was checked and supported.

### G19. Incidental: the PRD's two success-rate tolerances disagree
- **PRD:** FR-20 uses ±7 points per player. SM-7 uses ±5 points on the median.
- **Fix:** reconcile them or state why they differ. This one is internal to the PRD, not a source gap.

## Count

19 gaps: 2 high, 6 medium, 11 low.
