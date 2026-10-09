# Research extract for PRD: Numception

Extracted 2026-10-09 from `_bmad-output/initiative-numception/`:
- `citation-check-2026-10-08.md`
- `research-arithmetic-difficulty-and-adaptive-scori/` (report, `.memlog.md`, 3 digests)
- `research-retention-in-math-puzzle-games/` (report, `.memlog.md`, 2 digests)
- `research-name-and-trademark/` (report, `.memlog.md`, 2 digests)
- `research-game-engine-selection/` (report, `.memlog.md`, 3 digests; two skimmed for product-relevant items)

All four research runs: 2026-10-08, preset "standard", validation "normal", web search only, plan approved for 2 breadth-first researchers, up to 2 rounds (per each memlog). Numbers in [n] refer to each report's own source appendix. Nothing below is new analysis; where the source itself labels something as inference, that label is kept.

---

## 1. Arithmetic difficulty and adaptive scoring

**Question asked.** How to model puzzle difficulty, rate player skill, score speed + accuracy, and auto-adapt difficulty (academic-lit).

**Key findings**
- There is no standard published difficulty score for a single `a ∘ b = c`, but there is a standard *method* (feature-based prior + empirical calibration), run at scale by Math Garden (Rekentuin) [10][11][12].
- Difficulty features (well replicated): operand magnitude / problem-size effect (most reliable effect, all four operations) [1][2][5]; strategy shortcuts (×9 can beat ×7/×8) [4]; ties easier [7]; multiplier tiers (×1, ×2, ×5, ×10 easiest; ×7, ×8 hardest) [6]; carries/borrows (steeper for borrows) [8][9]; subtraction/division harder than +/× at same size [5]; negatives harder (integer subtraction worse than addition) [22]. Curriculum anchor: Common Core, all one-digit products from memory by end of Grade 3 [23].
- Feature models explain varying amounts: 77% for generated number-series items [16]; "large proportions" in Math Garden [17]; ~20% in one arithmetic LLTM (unverified) [18].
- Elo with uncertainty-based K is about as good as heavier Bayesian systems; Glicko-style uncertainty "do[es] not bring significant advantages" (Pelánek) [10]. Glicko-2 needs 10–15 games per rating period [19]; TrueSkill/OpenSkill are multiplayer-oriented with no educational use found [24].
- Math Garden production: 20 s limit, 15 items/session, visible coin countdown, child-selectable 90/75/60% success targets, >1B answers, ratings correlate .78–.84 with national CITO math scores [12][13]. Known misfit: fast slips on easy items give outsized penalties; anxious high-ability children may answer too slowly under high stakes [12].
- Higher success-rate settings → children practised more and improved more [14]. Easier versions of a math game were played longer but taught slowest (10K/70K players) [15]. The "85% rule" is proven only for two-choice tasks; its author warns against applying it to schooling [26]. DDA evidence in games overall is mixed (low confidence) [27].
- Biggest caveat: the literature times *solving* `a ∘ b`; Numception asks the player to *find* the valid triple among `n` numbers, adding a search component (candidate pairs grow ~n², near-miss distractors). No published weights exist for those puzzle-level features.
- Two 2025 papers (snippet only) report Elo ratings becoming noisy / variance-inflated under adaptive item selection, which is Numception's setting [21].

**Recommendations (from report)**
1. Difficulty prior (medium confidence): transparent, versioned feature model. Equation features: log magnitude, digits, carries/borrows, operation, ties, multiplier tier, negative count/position. Puzzle features: `n`, near-miss distractors, mixed operators, missing operator. Hand-set weights first, refit from logged play (LLTM or regression on Elo-calibrated difficulties).
2. Ratings (high confidence): Elo with `U(n) = a/(1+b·n)` (a=1, b=0.05 start), separately for players and puzzle families. Separate player ratings per operator at minimum.
3. Normal-mode score (high confidence, known misfit): `S = (2·correct − 1)·(d − t)` × puzzle difficulty; soften fast-slip penalty (e.g. cap negative score on first error).
4. Zen-mode adaptation (medium confidence): correctness-only Elo, target ~85–90% success, no visible timer.
5. Instrument from day one: log every puzzle with features, chosen answer, time taken; watch for rating noise under adaptive selection.
- Cross-dimension: rate *item families / generator buckets* (e.g. "+ | two-digit | one carry | n=5 | 1 near-miss"), not individual puzzles; new puzzles inherit bucket Elo; features seed only brand-new buckets [20].
- Zen vs Normal maps onto engagement–learning trade-off: Zen easier (~85–90%, no clock, correctness only), Normal harder (~75%, visible clock, speed+accuracy) [14][15].

**Decisions made.** None logged as user decisions. Memlog records only "Plan approved" (research plan) and: "Report assembled; citation semantic check not run on this report (budget) — flagged".

**Implications for product requirements**
- Capabilities: per-puzzle difficulty estimate from a versioned feature model; adaptive puzzle selection toward a target success rate per mode; player skill rating (per operator); puzzle-family rating; Normal-mode speed+accuracy scoring with visible time limit; Zen-mode correctness-only adaptation with no visible timer; possibly player-selectable difficulty target (Math Garden precedent 90/75/60%).
- Constraints: fast-error penalty must be softened; anxious players should not be punished for slowness (Zen); generated puzzles must map to rated buckets.
- Metrics/telemetry: per-puzzle log (features, answer chosen, response time, correct/incorrect); observed success rate vs target per mode; rating stability.
- Default targets: Zen ~85–90% success; Normal ~75%.

**Open risks / questions**
- Puzzle-level search difficulty (n, distractors) has no published model; needs prototype + playtest data.
- Elo noise under adaptive selection [21]; flagged "stale as of 2026-10: read and refresh before architecture" and "the one claim that could change the rating design".
- Hidden-timer scoring rule (Řihák 2015) if speed should count silently in Zen.
- Expected-score equation for HSHS (Maris & van der Maas 2012) only if a probabilistic model is wanted.
- Unverified per memlog: [14] success rate → practice, [16] 77%, [18] ~20%, [21] Elo variance inflation.
- Citation check was NOT run on this report.

---

## 2. Retention in math puzzle games

**Question asked.** Which progression, unlock, and reward mechanics to put in the PRD (domain + user-voice).

**Key findings**
- Forgiving streaks are the best-evidenced return mechanic: letting *any* lesson extend the streak (vs a harder daily goal) raised D14 retention 3.3% and DAU 1% (relative) [1]; weekend streak protection: +4% return a week later, −5% streak loss [2]; retention "most fragile in the first seven days" [3]. 7-day streak holders 2.4× as likely to return next day (observational) [1, digest]. Two streak freezes: +0.38% DAU (unverified) [15]. Streak Wager +14% D7 [2] but loss-aversion; not recommended for kids.
- Rewards/competition backfire for the Zen audience: expected tangible rewards reduce intrinsic motivation (d ≈ −0.28 to −0.40), worse for children; encouraging feedback +0.33 overall but non-significant for children (d = 0.11) [4]. Maths-anxious children disliked the leaderboard even controlling for rank (n=1,389) [5]; losing teams lost motivation [6]. In adults, high rank bred complacency, low rank raised effort [18].
- Player/parent complaints centre on monetization and "math as toll booth": Prodigy membership upsells [7]; 16 membership ads vs 4 math problems in 19 minutes, status tied to paying [8]; Prodigy's math gates the game [9]; Number Match ads every round [10]; 95% of apps for ages 0–5 contained ads [11]. Kids/ed apps widely share data with advertisers [22]. DragonBox reviews flag missing hints [24].
- Timers contested: Boaler advocacy says timed tests harm [19]; a 2024 study (113 4th–5th graders) found visible vs hidden timing made no anxiety difference, while harder problems did raise anxiety; beating your own best motivates, peer comparison demotivates [20]. WWC rates timed fluency practice strong; NCTM advises avoiding speed drills [21].
- Gamification in learning: positive but heterogeneous (g = 0.49 cognitive / 0.36 motivation / 0.25 behaviour) [16]; math-specific g = 0.44 with CI crossing zero (low confidence) [17].
- Biggest caveat: no source measured how level progression, unlocks or achievements affect D1/D7/D30 in casual puzzle games [12]. Streak evidence comes from one company (Duolingo), partly from 2017.

**Recommendations (from report)**
1. Daily habit (high): streak extended by one solved puzzle, both modes; built-in streak protection (freezes earned by playing, not bought); no streak wagers for kids.
2. Zen rewards (medium-high): encouraging feedback, visual growth/collection metaphor, no leaderboards; unlocks tied to demonstrated mastery, framed as new play, not prizes; not contingent payment for playing.
3. Normal competition (medium): personal-best first, then friend or nearby-rank boards; global leaderboards opt-in, with fractal/pyramid depth as the "bragging rights" board.
4. The math is the game (high): never gate play behind problems; every interaction is the puzzle.
5. Monetization and privacy (high on risk, medium on remedy): no ads in any mode reachable by children; no third-party ad/tracking libraries in kid profiles; one-time unlock or simple premium tier; design for COPPA compliance from day one.
6. Hints (medium): optional hints for stuck players.
7. Instrument retention from first prototype: D1/D7/D28, streak survival, session length by mode.
- Cross-dimension: Zen/Normal split is evidence-supported; difficulty, not the timer, is the anxiety lever (ties to adaptive success rate); a no-ads, one-time-unlock design stands out in the category.
- Digest-level "avoid" list (labelled inference): interstitial/rewarded ads in kid mode; cosmetic status tied to payment; "ask a parent" purchase prompts; daily play caps as paywall. "Include": plain-language, weekly-cadence parent summary (vendor evidence only).

**Decisions made.** None logged as user decisions (plan approval only).

**Implications for product requirements**
- Capabilities: daily streak (1 puzzle extends) in both modes; earned streak freezes; Zen encouraging feedback + growth/collection visual; mastery-based unlocks; Normal personal bests; friend/nearby-rank boards; opt-in global leaderboards (pyramid/fractal depth board); optional hints; possibly parent progress summary.
- Constraints: no ads reachable by children; no third-party ad/tracking SDKs in kid profiles; COPPA by design; no paid status/cosmetics visible to kids; no loss-aversion mechanics (wagers) for kids; no gating of play behind math; monetization = one-time unlock or simple premium.
- Metrics: D1/D7/D28 retention, streak survival, session length, by mode; first-7-day retention as the fragile window; A/B tests for progression/unlock effects.

**Open risks / questions**
- No primary data on progression/unlock/achievement effects on retention; must A/B ourselves.
- Puzzle-genre retention medians only in GameAnalytics chart images.
- What parents actually want in progress reports (vendor material only; suggests a small parent interview round).
- Staleness: Duolingo experiments (2017–2020) stale; GameAnalytics benchmarks stale since 2026-08 (pull 2026 report); kids-ad prevalence (2018) and Prodigy figures (2021) dated.
- Zen-mode "encouraging feedback" inference weakened by citation check (child effect non-significant).

---

## 3. Name and trademark

**Question asked.** Whether "Kakooma" is usable and what direction the new name should take (domain). Not legal advice; trademark databases could not be queried this run.

**Key findings**
- Kakooma is an active brand of Greg Tang / Tang Math, existed by 2011 [1]; Tang Math sells Kakooma® online variants and physical card products [3][4]; an iOS app listing exists but now 404s [2]. Consistent ® use implies a federal registration (inference; number/classes unconfirmed) [3][4].
- The mechanic is not protectable by copyright: game idea, name, method of play excluded [5]; §102(b) excludes rules/mechanics, protection covers art/text/AV [6]. Patents are the only route to protecting a mechanic [6].
- A third-party "Kakooma: Math Brain Puzzles" iOS app appeared in 2025 [7] (borrowed the name = the risk to avoid).
- KenKen precedent: Nextoy holds KenKen/KenDoku marks; rivals publish the same puzzle as Calcudoku/Mathdoku [8][9]. Descriptive names ("-doku", "-le") are crowded; that they are weak marks is the report's inference. Protectable names are invented coinages (KenKen; Sudoku in Japan), inferred pattern.
- Store rules: Apple app name ≤30 chars, unique, no minor changes to others' names or use of others' brands [14]; Apple search truncates ~26 chars (low-medium) [16]; Google Play title ≤30 chars, no emoji, no ranking/price claims [15].

**Recommendations (from report)**
1. Rename (high): drop "Kakooma" everywhere.
2. Naming direction (medium, partly inferred): invented coined word, 2–3 syllables, distinct in sound from Kakooma, KenKen, "-doku"; ideally evoking nesting/fractals, triangles/geometry, the a ∘ b = c triple, or neon look; store title ≤30 chars, coined word first.
3. Clearance checklist per shortlisted name: USPTO tmsearch classes 9/28/41; WIPO Global Brand Database; App Store + Play search; .com/.app/.game domains; Steam and itch.io; social handles; attorney knockout search before launch.

**Decisions made**
- Rename done 2026-10-08: project, repo and docs now use working title **Numception** (report rec. 1; memlog event "Project renamed to working title Numception; initiative folder moved to initiative-numception"). The memlog does not record who made the call or why beyond the research recommendation. "Numception" is a *working title*; no clearance on it is recorded.

**Implications for product requirements**
- Constraint: no use of "Kakooma" or confusingly similar names in product, store metadata, or assets; art, text and presentation must be original.
- Constraint: final name must fit ≤30 chars in store titles with distinctive word first; must pass clearance checklist before branding spend / launch.

**Open risks / questions**
- KAKOOMA registration details unconfirmed (manual USPTO search needed; does not change recommendation).
- Possible Tang patent on the format: check Google Patents (inventor "Gregory Tang") before launch.
- Who built the 2025 third-party Kakooma app, licensed or challenged: unknown.
- Staleness: re-verify Kakooma brand status before launch; store naming rules by 2027-04-08 or before submission.

---

## 4. Game engine selection

**Question asked.** Which engine or stack to build on across iOS, Android, and web (technical, "select" shape).

**Requirements frame (agreed with user at plan gate)**
- Hard gates: one codebase for iOS (phone and tablet), Android, and web including mobile web; smooth 60fps 2D vector, glow and particle effects on mid-range phones; reasonable web download.
- Weighted preferences: TypeScript fit ×3; effects quality ×3; proof-of-concept speed ×2; offline play and local saves ×2; licence/cost ×1; ecosystem health ×1.

**Key findings**
- Unity and Godot are weakest on mobile web: Unity supports only iOS Safari 15+/Android Chrome 58+ with no hardware guidance, multi-MB builds, Safari blocks IndexedDB saves in iframes [1][3][4]; Godot native beats web "by a significant margin", Safari WebGL 2 issues, no C# web export [8].
- Web stacks are current: PixiJS 8.22.0 (2026-10-01), Phaser 4.2.1 (2026-07-09; v4 stable since April 2026), Capacitor 8.5.3 (2026-10-07) [10][11][12].
- Main wrapper risk is App Store review (guideline 4.2 "repackaged website"; asks for "lasting entertainment value") [17], not rendering. A 2026 PixiJS v8 + Capacitor iPhone game hit WebKit audio/media quirks (mute switch silences Web Audio unless an `<audio>` element is kept active), not frame-rate limits [19].
- Guideline 2.5.2: bundled JS fine; downloading code that changes features is barred [17].
- No source measured 2D glow/particle frame rates on mid-range phones for any candidate.
- Matrix totals (max 60): Phaser 4 54, PixiJS v8 53, Defold 41, Godot 41, Unity 37, Flutter+Flame 35; Cocos Creator cut.

**Recommendations (from report)**
1. Architecture: web-first TypeScript; Capacitor 8 for app stores; engine-agnostic pure-TS `core` package (generator, uniqueness checker, difficulty model, scoring, save format), also usable server-side for leaderboard validation. Medium confidence.
2. Prototype before architecture locks: same neon scene (lines, glow, 200 particles) in Phaser 4 and PixiJS v8 inside Capacitor; measure fps and gzipped size on mid-range Android and an iPhone ≥3 years old.
3. PRD: add native app features (haptics, Game Center / Play Games leaderboards, full offline play) to answer guideline 4.2; add an audio requirement covering iOS mute-switch behaviour.

**Decisions made**
- Report "Pick": Phaser 4 + Capacitor; runner-up PixiJS v8 + Capacitor ("effectively tied; let the prototype decide"). No user decision on the engine is logged in the memlog (plan approval only). Requirements frame was agreed with the user at the plan gate.

**Implications for product requirements (PRD body, product-level only)**
- Platforms: iOS (phone + tablet), Android, web including mobile web, from one codebase.
- Performance: smooth 60fps 2D vector/glow/particle effects on mid-range phones; reasonable web download size.
- Offline play and local saves.
- Native app value to satisfy App Store 4.2: haptics, Game Center / Play Games leaderboards, full offline play.
- Audio must work correctly with the iOS mute switch behaviour (defined product behaviour).
- No post-install code downloads that change features (App Store 2.5.2).

**Open risks / questions**
- Actual bundle sizes and mid-range mobile fps: unmeasured (prototype answers).
- No public case of Capacitor-wrapped WebGL game App Store outcome; mitigate via product design.
- Strongest argument against pick: if appeal rests on heavy effects, WebView performance ceiling is the risk.
- Staleness: Unity pricing and Phaser "latest" already stale; other versions re-check by 2026-11-01.

---

## Tech/implementation choices (for PRD addendum, not PRD body)

- Stack recommendation: web-first TypeScript; renderer Phaser 4 (pick, 54/60) or PixiJS v8 (runner-up, 53/60); Capacitor 8 wrapper for iOS/Android. Prototype decides between the two.
- Engine-agnostic pure-TS `core` package: puzzle generator, uniqueness checker, difficulty model, scoring, save format; no rendering dependency; reusable server-side for leaderboard validation.
- Rejected/deprioritized: Unity 6 (C#, multi-MB web, Safari iframe IndexedDB), Godot 4.7 (no C# web, weaker web perf; TS only via untested GodotJS), Defold (Lua), Flutter+Flame (2.0–2.7 MB renderer, Dart), Cocos Creator (cut, no 2026 release).
- Known technical items: PixiJS glow via `pixi-filters/glow`, filters default to resolution 1 (soft on high-DPI) [27]; iOS mute switch fix = keep a silent `<audio>` element active [19]; avoid OTA JS feature updates (2.5.2).
- Prototype spec: neon lines + glow + 200 particles, Phaser 4 vs PixiJS v8 in Capacitor; measure fps + gzipped size on mid-range Android and iPhone ≥3 years old.
- Rating module (`core`): Elo with `U(n) = a/(1+b·n)`, a=1, b=0.05, separate functions for players vs puzzle families; P = 1/(1+e^−(θ−d)); θ += K(correct−P); d += K(P−correct); new/changed item reset to 0. Per-operator player ratings. Rated unit = generator bucket.
- Scoring formula (Normal): `S = (2·correct − 1)·(d − t)` × puzzle difficulty, capped negative on first error.
- Difficulty feature model: versioned, hand-set weights then refit via LLTM/regression on Elo-calibrated difficulties.
- Read EDM 2025 / "Keeping Elo alive" [21] before architecture is final (proposes two parallel rating chains, per digest).
- Licences/cost: Phaser, PixiJS MIT-style free (scored 5/5); Unity Personal free under $200k (stale pricing claim); Godot MIT with credits notice.

## Success metrics / benchmarks cited

- GameAnalytics all-mobile-games medians: D1 22.9% (Q1 2024); D7 3.4–4.2%; D28 0.85%; 75% of games below 3% D28 [ret 12][13].
- Top quartile: D1 ≈26.5–27.7% (2024 data); D7 7–8% [ret 13].
- Puzzle genre had the highest D7 of any genre (numbers only in chart images) [ret 12]. Older (~2019) GameAnalytics guidance: top puzzle titles 15–25% D7, 6% D28 "healthy" (low-medium, dated; digest only).
- Vendor-blog puzzle figures D1 31.85% / D7 12.18% / D30 5.35%: low confidence, unclear provenance, memlog status "disputed" [ret 14].
- Duolingo streak effects: +3.3% D14, +1% DAU (relative) [ret 1]; weekend protection +4% return / −5% streak loss [ret 2]; two freezes +0.38% DAU (unverified) [ret 15]; Streak Wager +14% D7 [ret 2] (not recommended for kids).
- Retention fragile in first 7 days [ret 3].
- Recommended product metrics: D1/D7/D28, streak survival, session length by mode [ret rec 7]; per-puzzle logs (features, answer, time) [arith rec 5]; success rate vs target (Zen ~85–90%, Normal ~75%).
- Math Garden reference: ratings correlate .78–.84 with CITO [arith 13]; 20 s limit, 15 items/session [arith 12].
- Performance targets: 60fps on mid-range phones; web download "reasonable" (no number set); Defold empty HTML5 1.06 MB, pixi.js ~244 KB gz and Phaser 4.1 ~341 KB gz (both low confidence) as reference points.

## Citation check: flagged unreliable

Scope: only executive-summary claims with inline [n] in the engine, name and retention reports (~30 fetches). **The arithmetic-difficulty report was not citation-checked** (memlog: skipped for budget).

**Not supported**
- Engine [18]: a Capacitor app was rejected under 4.2. The Capgo page never cites 4.2 nor describes a specific rejection. (Report text downgraded accordingly.)

**Partly supported**
- Engine [3][4]: Unity build-size range holds, but the "~3.3 MiB forum figure" is not on the CrazyGames page.
- Name [2][3][4]: Kakooma® online variants confirmed; card game is "Sold out", Amazon not named on the page, Teachers Pay Teachers appears in no source, iOS listing [2] is 404.
- Name [8][10]: "crowded and weak" descriptive names. Nerdle HQ lists only Mathler/Numberle; "weak" is the report's own inference.
- Name [8][11]: invented coinages protectable; [11] not checked; labelled inferred.
- Name [12][13]: USPTO supports common-law/state search but names no Nice classes; classes 9/28/41 rest on GleanMark (not checked).
- Retention [4]: d = +0.33 for encouraging feedback is the overall figure; for children it was non-significant (d = 0.11) and verbal rewards "do not enhance free-choice behavior for children". Weakens the Zen-mode (kids) inference.

**Unreachable (unverified)**
- Engine [15][16]: web bundle sizes (DepScope HTTP 410).
- Name [6]: ABA §102(b) page (403). Name [7]: third-party Kakooma app (403).
- Retention [6]: losing teams lost motivation (Tampere access denied). Retention [11]: 95% of 0–5 apps contain ads (Michigan Medicine 403).

**Not checked**
- Retention [7] Prodigy upsell reviews, [9] Prodigy math-gating, [10] Number Match ads, [12] evidence-gap claim. Name [9], [13], [15].

**Memlog-level statuses worth noting**
- Disputed: Unity web build size [eng 3]; puzzle benchmarks D1 31.85% / D7 12.18% [ret 14].
- Unverified: Flutter renderer size [eng 23]; pixi/Phaser gz sizes [eng 15][16]; Kakooma federal registration [name 2]; third-party Kakooma app [name 7]; Weekend Amulet / Streak Wager [ret 2]; leaderboard/anxiety [ret 5]; timing visibility [ret 20]; success rate → practice [arith 14]; 77% [arith 16]; ~20% LLTM [arith 18]; Elo variance inflation [arith 21].
