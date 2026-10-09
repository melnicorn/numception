---
title: 'academic-lit research: Arithmetic difficulty and adaptive scoring'
type: 'academic-lit'
topic: 'Arithmetic difficulty and adaptive scoring'
decision: 'How to model puzzle difficulty, rate player skill, score speed+accuracy, and auto-adapt difficulty'
source: 'native run'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-10-08'
updated: '2026-10-08'
claims_verified: 4
claims_unverified: 4
---

# academic-lit research: Arithmetic difficulty and adaptive scoring

**Decision this research serves:** How to model puzzle difficulty, rate player skill, score speed+accuracy, and auto-adapt difficulty

## Executive summary

**There is no standard, published difficulty score for a single sum like `a ∘ b = c`, but there is a standard *method*, and an existing system (Math Garden) has run it at scale.** The recommended stack:

1. **A starting difficulty estimate from problem features.** A weighted sum of well-replicated features: operation, operand size, carries/borrows, ties, "easy" multipliers, and negatives [1][2][5][6][7][8][9]. Fitting difficulty as a weighted sum of item features with Rasch-style models (LLTM) is decades-old practice [3].
2. **Elo ratings for both player and puzzle family, updated after every puzzle.**
   - The update rule: P = 1/(1+e^−(θ−d)), θ += K(correct−P), d += K(P−correct) [10].
   - Use an uncertainty-based K = a/(1+b·n), starting at a=1, b=0.05, with separate settings for players and puzzles [10].
   - This is what Math Garden does with over a billion answers [11][12], and what Pelánek's review recommends [10].
3. **A speed-and-accuracy score for Normal mode:** the "high speed, high stakes" rule `S = (2·correct − 1)·(d − t)` with a visible time limit `d` [12][13]. A fast correct answer earns the remaining time, and a fast wrong answer loses it, which discourages guessing.
4. **A selectable target success rate.**
   - Math Garden lets children choose ~90% / 75% / 60% [11].
   - Children set to higher success rates practised more and improved more [14].
   - Easier versions of a math game were played longer but taught slowest [15].
   - So Zen mode defaults high (~85–90%) and Normal defaults ~75%.

What drives this answer:

- **Problem size is "what everyone finds".** It is the most reliable effect in cognitive arithmetic, across all four operations [1][2]. Strategy matters too: shortcut problems such as ×9 can be faster than smaller ×7 or ×8 ones [4][6].
- **Feature models work but explain differing amounts.** Features explained 77% of difficulty in generated number-series items [16]. Math Garden reports "large proportions" for add/sub/multiply [17]. One arithmetic LLTM explained only ~20% (unverified) [18]. Hence: features for the *prior*, Elo to *correct* it.
- **Simple Elo is about as good as heavier Bayesian systems.** Pelánek reports Glicko-style principled uncertainty "do[es] not bring significant advantages" over K=U(n) in student modelling [10]. Glicko-2 needs 10–15 games per rating period [19], and its one K-12 math use had no Elo comparison [20].

**Biggest caveat: our puzzle is not the task the literature measured.** The literature times *solving* `a ∘ b`. This game asks the player to *find* the one valid triple among `n` numbers, which adds a search component. The number of candidate pairs grows roughly as n², and near-miss distractors make it harder. Those puzzle-level features have no published weights; they are our design, to be calibrated by Elo from real play. Separately, two 2025 papers (snippet only) report Elo ratings becoming noisy under adaptive item selection, which is exactly our setting. Read them before we lock the rating design [21].

## Canon: what makes a single sum hard

| Feature | Direction | Evidence |
|---|---|---|
| Operand magnitude (sum/product) | Harder as size grows, in all four operations; holds even for tiny sums | [1][2][5] |
| Strategy / shortcuts | The number of solution steps explained more variance than the sum for addition (partial R² .23–.29 vs .09–.10); ×9 shortcuts beat ×7/×8 | [4] |
| Ties (4+4, 6×6) | Easier and faster | [7] |
| Multiplier tier | ×1, ×2, ×5, ×10 easiest; ×7, ×8 hardest | [6] |
| Carries / borrows | Each carry adds difficulty, steeper for borrows | [8][9] |
| Operation | Even skilled adults use step-by-step procedures, not recall, for larger subtraction and division → harder than + / × at the same size | [5] |
| Negatives | Students do worse on integer subtraction than addition; comparing negatives is slower | [22] |
| Curriculum anchor | Common Core: know all one-digit products from memory by the end of Grade 3 | [23] |

Not verified this run: the Groen & Parkman "min" model of addition, carry-effect costs in milliseconds, and any "five effect".

## State of the art: rating players and problems

**Math Garden (Rekentuin), the closest precedent.**
- *Rating:* It updates the child's ability and each item's difficulty after every answer [11][12].
- *Scale:* 3,648 children and over 3.5M answers in the first 10 months [11]; later, over 1 billion answers [12].
- *Settings:* a 20 s limit; 15 items per session; a coin countdown shows the score; selectable 90/75/60% difficulty [12].
- *Ratings vs national tests:* they correlate .78–.84 with national math test (CITO) scores [13].
- *Known problem:* fast slips on easy items produce outsized penalties, and anxious high-ability children can answer too slowly under high stakes [12].

**Pelánek (2016) review: recommended defaults.** Notation is as published [10]:
- **Expected score:** `P = 1/(1 + e^−(θs − di))`, with ratings initialized to 0.
- **Update:**
  - `θs := θs + K(correct − P)`
  - `di := di + K(P − correct)`
- **K:** use the uncertainty function `U(n) = a/(1 + b·n)`, with `a = 1, b = 0.05` as a starting point. Use separate functions for items (many answers, stable) and players (fewer answers, changing). Reset a changed item to 0.
- **Response time:** the paper suggests a time extension for mathematics. If the timer is *hidden*, as in Zen mode, use a different scoring rule than high-speed-high-stakes (Řihák 2015, lead).

**Alternatives considered:**

| System | Fit for one player vs. generated items with response time | Evidence |
|---|---|---|
| Elo + U(n) | **Best fit**: simple, per-answer, has a response-time variant | [10][11] |
| Glicko-2 | Gives per-player confidence intervals, but needs 10–15 games per rating period or a continuous-time adaptation; no Elo comparison exists for learners | [19][20] |
| TrueSkill / OpenSkill | Built for multiplayer and team ranking; no educational use found | [24] |
| Duolingo half-life regression | Models forgetting and spacing, not difficulty matching | [25] |

## Methods and limitations: adapting difficulty

- **Success-rate target.** Math Garden samples at ~.75 by default [11]. Higher success rates drove more practice and more improvement in children [14]. The "85% rule" is proven only for two-choice learning tasks; its author warns against applying it to schooling [26].
- **The engagement vs. learning trade-off is real.** In a math game played by 10K and 70K players, "subjects were more engaged and played longer when the game was easier", while the most engaging versions taught slowest [15].
- **Evidence for automatic difficulty adjustment in games is mixed overall** (low confidence, snippet-level reviews) [27].

## Cross-dimension insights

- **Zen vs. Normal maps onto the engagement–learning trade-off** [14][15]. Zen should run easier (high success, long relaxed play, no visible clock, scored by correctness only). Normal should run harder (~75%, visible clock, speed-and-accuracy score). This also matches the retention research: difficulty spikes, not timers, raise anxiety.
- **Item families as the rated unit** [20] solve the "never-seen generated puzzle" problem. Rate a generator bucket, e.g. "+ | two-digit | one carry | n=5 | 1 near-miss", rather than individual puzzles. Each new puzzle inherits its bucket's Elo rating, and features are used only to seed brand-new buckets.

## Recommendations

**Feed: PRD (difficulty and scoring requirements), architecture (the `core` rating module).**

1. **Difficulty prior (medium confidence).**
   - A transparent, versioned feature model.
     - *Equation features:* log magnitude, digits, carries/borrows, operation, ties, multiplier tier, negative count/position.
     - *Puzzle features:* `n`, near-miss distractors, mixed operators, whether the operator is missing.
   - Hand-set weights first, then refit them from logged play (LLTM or regression on Elo-calibrated difficulties) [3][16].
2. **Ratings (high confidence).**
   - Elo with `U(n) = a/(1+b·n)` (a=1, b=0.05 to start) for players and for puzzle families, separately [10].
   - Keep separate player ratings per operator, at minimum, so a player can be strong at + and weak at ÷.
3. **Normal-mode score (high confidence, with a known misfit).**
   - `S = (2·correct − 1)·(d − t)` multiplied by puzzle difficulty, for points [12][13].
   - Soften the fast-slip penalty, e.g. cap the negative score on the first error [12].
4. **Zen-mode adaptation (medium confidence).** Correctness-only Elo, target ~85–90% success, no visible timer [11][14][15].
5. **Instrument from day one.**
   - Log every puzzle with its features, the chosen answer and the time taken. This is the dataset that refits the weights.
   - Watch for rating noise under adaptive selection [21].

## Open questions

- **Puzzle-level search difficulty** (n, distractors) has no published model. A prototype plus playtest data answers it.
- **Elo noise under adaptive selection** (EDM 2025, "Keeping Elo alive"). Read the two papers before the architecture is final [21].
- **Hidden-timer scoring rule** (Řihák 2015), for Zen mode, if we want speed to count silently.
- **Expected-score equation for the speed-and-accuracy rule** (Maris & van der Maas 2012). Needed only if we want a proper probabilistic model rather than Elo on correctness.

## Source appendix

| # | Claim/finding it supports | Publisher | Pub date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | Problem-size effect most reliable; all four operations | [Carleton Univ. tech report (Zbrodoff & Logan via review)](https://carleton.ca/cognitivescience/wp-content/uploads/2004-05.pdf) | 2004 | 2026-10-08 | high |
| [2] | Ashcraft 1992 foundational cognitive arithmetic review | [Cognition (Benford Online listing)](https://benfordonline.net/fullreference/18) | 1992 | 2026-10-08 | high (existence/scope) |
| [3] | Item-feature regression and LLTM for arithmetic difficulty | [Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.00884/full) | 2019 | 2026-10-08 | medium |
| [4] | Strategy steps vs operand size; ×9 shortcuts | [Tschentscher & Hauk, Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.01188/full) | 2015 | 2026-10-08 | high |
| [5] | Problem size holds for tiny additions; procedures for larger subtraction/division | [Campbell & Xue, JEP: General](https://pubmed.ncbi.nlm.nih.gov/11409105) | 2001 | 2026-10-08 | medium |
| [6] | Multiplier tiers ×1,2,5,10 easy; ×7,8 hard | [MONA](https://tidsskrift.dk/mona/article/download/150689/193404/332306) | 2024 | 2026-10-08 | medium |
| [7] | Tie effect | [eScholarship](https://escholarship.org/content/qt35458505/qt35458505.pdf) | n.d. | 2026-10-08 | high |
| [8] | Carry effect: categorical and continuous components | [Klein et al., Behavioral and Brain Functions](https://behavioralandbrainfunctions.biomedcentral.com/articles/10.1186/1744-9081-6-70/tables/1) | 2010 | 2026-10-08 | high |
| [9] | Difficulty rises with carries, steeper for borrows | [Cho et al., arXiv/ICCM](https://arxiv.org/abs/1905.03617) | 2019 | 2026-10-08 | medium |
| [10] | Elo equations, U(n), item vs learner K, Glicko adds little, RT extensions | [Pelánek, Computers & Education (author manuscript)](https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf) | 2016 | 2026-10-08 | high |
| [11] | Math Garden Elo on player and item; 0.75 target; 3,648 children | [Klinkenberg et al., Computers & Education](https://dare.uva.nl/id/de65bb65-d198-4dbc-ac7b-bc25ca23e627) | 2011 | 2026-10-08 | high |
| [12] | Production settings: 20 s, 90/75/60 choice, >1B responses, fast-error misfit | [Brinkhuis et al., J. Learning Analytics](https://learning-analytics.info/index.php/JLA/article/view/5796) | 2018 | 2026-10-08 | high |
| [13] | HSHS rule wording; CITO correlation .78–.84 | [Klinkenberg, CAA 2014 (SURF)](https://www.surf.nl/files/2019-04/Artikel%20High%20Speed%20High%20Stakes%20Scoring%20Rule.pdf) | 2014 | 2026-10-08 | high |
| [14] | Higher success rate → more practice and improvement | [Jansen et al., Learning and Individual Differences](https://dare.uva.nl/id/789fc422-4935-49ca-bcba-803239522951) | 2013 | 2026-10-08 | medium-high |
| [15] | Easier math game → longer play, slower learning (10K/70K players) | [Lomas et al., CHI 2013](https://www.stat.cmu.edu/~brian/463-663/project-part-one/Optimizing%20Challenge.pdf) | 2013 | 2026-10-08 | high |
| [16] | Generated items: features explain 77% of difficulty | [Sun, Liu & Luo, Frontiers (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6491774/) | 2019 | 2026-10-08 | medium |
| [17] | Math Garden: features explain "large proportions" of difficulty | [Straatemeier thesis summary (IOPS)](https://www.iops.nl/concluded-iops-projects/straatemeier-marthe/) | 2014 | 2026-10-08 | medium |
| [18] | Arithmetic LLTM features explain ~20% (unconfirmed source) | [JERO / Waxmann (page 404)](https://www.waxmann.com/) | unknown | 2026-10-08 | low (unverified) |
| [19] | Glicko-2 equations; best with 10–15 games per period | [Glickman, glicko2.pdf](http://www.glicko.net/glicko/glicko2.pdf) | 2022-03-22 | 2026-10-08 | high |
| [20] | Glicko-2 for K-12 math; item families as rated units; no Elo baseline | [Park, EDM 2021](https://educationaldatamining.org/EDM2021/virtual/static/pdf/EDM21_paper_8.pdf) | 2021 | 2026-10-08 | high |
| [21] | Elo variance inflation under adaptive selection (snippet only) | [EDM 2025](https://educationaldatamining.org/edm2025/proceedings/2025.EDM.long-papers.99/2025.EDM.long-papers.99.pdf) | 2025 | 2026-10-08 | low (unverified) |
| [22] | Negative numbers: slower comparisons; integer subtraction harder | [Frontiers in Human Neuroscience](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2012.00007/full) | 2012 | 2026-10-08 | medium |
| [23] | Common Core 3.OA.C.7 | [CCSSI](https://www.thecorestandards.org/Math/Content/3/OA/) | 2010 | 2026-10-08 | high |
| [24] | OpenSkill MIT, multiplayer focus | [openskill.py](https://github.com/vivekjoshy/openskill.py) | 2024 | 2026-10-08 | medium |
| [25] | Duolingo half-life regression | [Settles & Meeder, ACL 2016](https://aclanthology.org/P16-1174/) | 2016 | 2026-10-08 | high |
| [26] | 85% rule for binary tasks only | [Wilson et al., Nature Communications](https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579) | 2019 | 2026-10-08 | high |
| [27] | DDA review: evidence mixed | [Souza et al., Entertainment Computing (UFG repository)](https://repositorio.bc.ufg.br/items/36654b2c-0c40-4a08-8d21-8ff7f53765c4) | 2025 | 2026-10-08 | low |

## Staleness map

Academic-lit freshness: the canon has no freshness bar (check whether it has been superseded); state-of-the-art claims ≤ 12 months.

| Claim | Class | Published | Re-check by |
|---|---|---|---|
| Cognitive-arithmetic effects [1]–[9] | seminal | 1992–2019 | no bar; superseded-check only |
| Elo defaults [10], Math Garden settings [11][12] | method | 2011–2018 | no bar; [21] may supersede adaptive-selection behaviour |
| Elo under adaptive selection [21], DDA reviews [27] | state of the art | 2025 | **stale as of 2026-10**: read and refresh before architecture |

Earliest action: **read [21] now**. It is the one claim that could change the rating design.
