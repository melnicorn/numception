# Research: Elo Under Adaptive Item Selection (variance inflation, drift) — Architecture Implications

Date: 2026-10-09 · Scope: Numception rating module (per-operator player Elo vs. puzzle generator-bucket Elo, uncertainty K `U(n)=a/(1+b·n)`, a=1, b=0.05; adaptive selection targeting P(success) ≈ 0.85–0.90 Zen, ≈ 0.75 Normal).

## Correction to prior report

The flagged paper is **not an EDM 2025 paper**. It is:

- **Bolsinova, Gergely & Brinkhuis (2025). "Keeping Elo alive: Evaluating and improving measurement properties of learning systems based on Elo ratings."** *British Journal of Mathematical and Statistical Psychology* 79(1), 95–110. DOI 10.1111/bmsp.12395. Open access: https://pmc.ncbi.nlm.nih.gov/articles/PMC12784335/ · https://research.tilburguniversity.edu/en/publications/keeping-elo-alive-evaluating-and-improving-measurement-properties/

The EDM 2025 paper from the same group is different (multidimensional Elo): Vermeiren, Hofman & Bolsinova, "Evaluating multidimensional extensions of the Elo rating systems…", https://educationaldatamining.org/edm2025/proceedings/2025.EDM.long-papers.99/2025.EDM.long-papers.99.pdf

The closely related production paper (Math Garden / Prowise Learn):

- **Vermeiren, Kruis, Bolsinova, van der Maas & Hofman (2025). "Psychometrics of an Elo-based large-scale online learning system."** *Computers and Education: AI* 8, 100376. DOI 10.1016/j.caeai.2025.100376. https://pure.uva.nl/ws/files/271920922/1-s2.0-S2666920X25000165-main.pdf · https://dare.uva.nl/id/ae30cc1e-4000-4581-8d02-83ff00959b10

Background:
- Hofman et al. (2020), *Journal of Intelligence* 8(1):10, explains why Elo has no standard errors and why rating variance inflates, and proposes Urnings. https://doaj.org/article/5606408e805f4900894a518c474fe254
- Bolsinova et al. (2022), "Urnings", *JRSS-C* 71, 91–118. https://pure.uva.nl/ws/files/67783263/Royal_Stata_Society_Series_C_2021_Bolsinova_Urnings_A_new_method_for_tracking_dynamically_changing_parameters_in.pdf
- Pelánek (2016), "Applications of the Elo rating system in adaptive educational systems", *Computers & Education*. https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf
- I found no 2024–2026 Pelánek paper on adaptive-selection drift.

---

## 1. What goes wrong, and when

Two separate problems come up. They have different causes and different fixes.

### 1a. Variance inflation / non-convergence (Bolsinova et al. 2025)

**Mechanism.** Item selection uses the *current* ratings, and those ratings contain errors. Selection therefore correlates with the error.
- **Person side:** for a high-ability player, items whose difficulty is currently *over*estimated are more likely to be picked. The selected item's expected error is positive, so the player's update is biased outward. Low-ability players get the mirror effect.
- **Item side:** hard items tend to be served to players who are currently overestimated, and easy items to players who are underestimated. Each update pushes the item further out.
- The two effects reinforce each other. High abilities and difficulties creep up, low ones creep down, and the spread of ratings keeps growing without converging.
- The authors stress that "harder items for abler players" is not the cause. With selection based on the *true* values, there is no inflation. Selecting on noisy *estimates* is the cause.

**Conditions** (Rasch simulation: 1,000 persons, 200 items, K=0.3, target p=.7 baseline):

| Factor | Effect |
|---|---|
| Items updated online **and** adaptive selection | Required. Fixed items + adaptive, or updated items + random selection: no inflation. |
| Larger K | Stronger inflation. Doubling K roughly halves the time to reach the problem regime. |
| Target success p | Strongest at p = .5, weaker at extreme targets. Moving p from .7 to .9 needs about 50% more responses to converge, similar to lowering K from .3 to .2. |
| Small item K in practice | The authors suspect this is why real systems show mild inflation. They cite about a 3% rise in ability SD over 4 years in Math Garden (Hofman et al. 2020). |
| Uncertainty-based K (Pelánek/Glicko-style) | **Not evaluated** in the paper. |

Plain Elo is also biased "outward" even under random selection: ability is overestimated above the mean and underestimated below it. Ratings are not unbiased estimators in any scenario.

### 1b. Scale drift / deflation (Vermeiren et al. 2025, Prowise Learn production data)

- **Mechanism:** Elo is zero-sum. Players learn, so they win more often than the model expects, and they "take points" from items.
- **Observed size:** in one Prowise game, the mean item rating fell from 5 to −4 over two years. Players' ratings followed the item mean down, so learners looked like they were getting worse.
- **Within a single day this is harmless.** Rankings and adaptive matching still work.
- **Over time it breaks things:**
  - Ratings cannot be compared across time, which matters for progress displays.
  - Returning lapsed players are served items that are too hard, because the item ratings have deflated.
- The paper says this drift "will always occur" in an Elo-based learning system.

**Item clustering.** A strategy that works on only a subset of items pulls that subset away from the rest of the bank. Prowise mitigates this with "mirror item" tags and a ring length, a minimum gap before items with the same tag repeat.

### Relevance to Numception

- **Partly protective:**
  - We rate a modest number of **generator buckets**, not thousands of individual items. Each bucket gets heavy traffic, so `U(n)` drives bucket K toward 0 quickly. With b=0.05, U ≈ 0.17 at n=100 and ≈ 0.02 at n=1000. This approximates the "fixed items" scenario, which does not inflate.
  - Targets of 0.75–0.90 are far from 0.5, which further damps inflation.
- **Exposed:**
  - **Cold start** for new buckets and new operators, while bucket K is still large.
  - **Deflation** of bucket ratings as the player base improves.
  - **Frozen buckets.** Pure `a/(1+b·n)` has no floor and no reset, so a bucket can stay miscalibrated once n is large (for example after a generator code change). Prowise uses a K floor (min person K 0.2, min item K 0.001) and a trend-based K instead of a count-based K.
  - **Per-operator player ratings with count-decaying K stop tracking learning.** Prowise moved away from a count-based uncertainty to a residual-trend-based K for this reason.

## 2. Mitigations and strength of evidence

| Mitigation | What it is | Evidence | Fit for Numception |
|---|---|---|---|
| **Two parallel chains ("parallel Elo")** | Each player and bucket keeps θ⁰/δ⁰ and θ¹/δ¹. Responses alternate by the player's response-count parity. When chain c is being updated, the item is **selected using chain 1−c**. Both the player and the item side must be duplicated. Report the average. corr(θ⁰,θ¹) gives a reliability estimate. | **Simulation only, one paper.** Converges in the updated-adaptive case, with bias .072 and variance .170 vs .064/.168 for random selection. Costs about half the data per chain, so convergence is slower. Not yet tested in production. | Cheap to add *if* the schema has a chain dimension. Hurts onboarding speed. Use only if offline replay shows inflation. |
| **Fixed or anchored item ratings** | Calibrate offline and freeze, or fix the scale (for example mean item rating = constant). | Strong. Removes inflation in simulation. Standard IRT practice. | Natural fit for buckets: periodic offline recalibration plus slow or no online bucket updates. |
| **Paired item updates** | Update two items only when consecutive responses in the same session have residuals of opposite sign. Move them by ±κ (the average K-weighted residual). The mean item rating stays exactly constant. | **Production evidence** (Prowise, since 2011). Item and learner trajectories stabilised. About 35% of responses trigger an item update. Can use a queue variant at low volume. | Directly addresses deflation. Easy to add later if buckets are updated through a single function. |
| **Small or decaying item K** | Item K → small. | Indirect: explains the mild real-data inflation. | Already in the design via `U(n)`. Needs a floor and a re-open trigger. |
| **Trend-based adaptive K** | `T ← (1−α)T + α·sgn(residual)`, then `K = max(K_min, |T|^λ)` plus a cold-start bump for the first 20 responses. | Production A/B tests in Math Garden. Tracks ability changes better than count-based uncertainty. | Better than pure `U(n)` for *player* ratings. Swappable if K is a strategy. |
| **Lagged ratings for selection** | Select using older ratings. | Rejected by the authors. Autocorrelation means you need a lag of more than 100 responses. | No. |
| **Urnings** | Discrete urn ratings with a Metropolis-Hastings correction for adaptivity. Known binomial distribution, so standard errors are available. | Strong theory and simulation. Hitting time similar to Elo (456 vs 512). | Overkill for a POC. A possible later swap-in if ratings become "high stakes". |
| **Exploration / random items** | Serve some items at random. | Random selection is shown not to inflate. A small exploration fraction is **not directly tested**. | Useful mainly because it makes offline (IPS-weighted) recalibration possible. That is an engineering inference, not from these papers. |
| **Periodic offline recalibration** | Refit IRT/Rasch on logged responses and re-anchor. | Standard psychometric practice (anchoring, Sinharay et al. 2011, cited by Vermeiren). | Requires the full response log. |

The authors' own guidance: for **low-stakes** use, where only matching and ranking matter, the problem matters less. For measurement-grade ratings with online item calibration, use parallel Elo or Urnings.

## 3. Architectural implications (day-one requirements)

1. **An append-only response event log as the source of truth.** Ratings are a derived projection. Each event records:
   - player id, operator, bucket id, generator version, the concrete puzzle params and seed
   - outcome (correct/incorrect) and response time
   - session id and in-session sequence number
   - pre-update θ and δ, the K values used, and the expected P
   - the rating-algorithm version, mode (Zen/Normal), and target p

   With this log, any mitigation can be added by **replaying** history: two chains, paired updates, a new K function, or offline IRT. No data migration is needed.
2. **Selection telemetry per served item.** Record:
   - the candidate set or its summary
   - the **selection probability (propensity)** of the chosen bucket
   - the policy id and version
   - whether the serve was exploratory

   This enables IPS-weighted offline calibration and evaluation of the selection policy. It cannot be reconstructed later.
3. **Keep rating state keyed for multiple chains and versions.**
   - Key rating rows as `(entity_type, entity_id, operator, chain_id, algo_version)`, with chain_id defaulting to 0.
   - Keep player ratings and bucket ratings in **separate stores with separate update policies**: frozen, anchored, paired, or online.
   - Selection reads through a `RatingReader` that can be told which chain or version to use.
   - With this, two chains or a shadow algorithm are a config change rather than a schema change.
4. **Pluggable strategies behind narrow interfaces.**
   - Make `KPolicy` (`U(n)`, trend-based, with floors), `ItemUpdatePolicy` (online, paired, frozen) and `SelectionPolicy` separate injectable components.
   - Allow a K floor, and a "re-open uncertainty" hook on bucket generator-version change and on long player absence.
5. **Support anchoring and recalibration.**
   - Store item ratings with calibration provenance: online vs offline batch id.
   - Support atomic bulk replacement of bucket ratings from an offline job, plus a scale-anchor parameter (for example a fixed bucket-mean).
   - Track drift metrics: the mean and SD of bucket and player ratings over time, and observed vs target success rate per mode.

## Verdict

The planned design is **safe for a POC**. Bucket-level items with fast-decaying K, and success targets of 0.75–0.90, put it close to the low-inflation regime. Two failure modes are real for later: deflation over months, and frozen-K buckets. Both are fixable later *only if* the response log, propensities and chain/version-keyed rating state exist from day one.
