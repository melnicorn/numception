# Digest: rating systems and DDA, round 2 batch 1 (rating-dda-r2-1)

Accessed: 2026-10-08. Equations below are transcribed from extracted PDF text, so watch for PDF-extraction artefacts such as lost sub- and superscripts. Confidence levels: H = read in the primary text; M = primary abstract or summary page only; L = secondary or search-snippet only.

## Q1. Pelánek (2016), Elo in adaptive educational systems

The copy used is the author's accepted manuscript, https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf. Final version: Computers & Education (Elsevier), DOI 10.1016/j.compedu.2016.03.017, accepted 2016-03-29. It is peer-reviewed. Class: primary/peer-reviewed for all F1.x findings.

- **F1.1. Expected score.**
  - Claim: the expected score is P(correct_si = 1) = 1/(1 + e^−(θs − di)). For multiple choice with k options there is a guessing variant: P(correct_si = 1) = 1/k + (1 − 1/k)/(1 + e^−(θs − di)).
  - Initial θs and di are 0.
  - Confidence: H.
- **F1.2. Update rule.**
  - θs := θs + K·(correct_si − P(correct_si = 1))
  - di := di + K·(P(correct_si = 1) − correct_si)
  - Elo shares the Rasch (1PL) functional form and differs only in how it estimates parameters.
  - Confidence: H.
- **F1.3. Constant K.**
  - Prior student-modelling work used K = 0.4 (Antal 2013; Wauters et al. 2012).
  - Small K converges too slowly. Large K is unstable.
  - Confidence: H.
- **F1.4. Uncertainty function in place of K.** Three published forms:
  - U(n) = a/(1 + b·n), where n is the number of answers. Fitted values: a = 1, b = 0.05 (Papoušek et al. 2014; Nižnan et al. 2015).
  - U(n) = w0/(1 + a·e^(b·n)). Values: w0 = 0.2, b = 50, a between 0.01 and 0.15 (Wauters et al. 2011).
  - Math Garden (Klinkenberg et al. 2011): U starts at 1 and after each answer U := U − 1/40 + (1/30)·D, where D is days since the previous attempt.
  - In the simulation study a = 4, b = 0.5 was optimal by grid search, but the paper says the results were stable across parameter values.
  - Confidence: H.
- **F1.5. Recommendation.**
  - The paper recommends basic Elo plus U(n) = a/(1 + b·n), with a = 1 and b = 0.05 as a starting point, refit later by grid search.
  - It recommends adding extensions only when they suit the domain, and names incorporating response times for mathematics as an example.
  - Elo is suited to adaptive practice and low-stakes testing. It gives no statistical guarantees, unlike calibrated IRT for computerized adaptive testing (CAT).
  - Confidence: H.
- **F1.6. Item vs learner ratings.**
  - Items usually get many more answers than students, often by orders of magnitude, so the paper suggests a different uncertainty function for items and for students.
  - Item difficulty should be roughly constant. Student skill is expected to change, so K should stay larger for students when skill changes quickly.
  - A new or changed item is simply reset to difficulty 0 and relearned from answers.
  - Confidence: H.
- **F1.7. Adaptive item selection.**
  - With random item selection, proportion-correct, JMLE and Elo give similar difficulty estimates.
  - The paper reports the results differ under adaptive selection. That is the regime of a DDA game. Simulation used 150 items and 10 to 100 answers per student.
  - I did not extract the exact magnitudes from Fig. 3.
  - Confidence: M.
- **F1.8. Response-time extensions, exactly as printed.**
  - Time-only version, with t as log solving time:
    - θs := θs + K(E(t|s,p) − tsp)
    - dp := θp + K(tsp − E(t|s,p)) [sic: "θp" is printed in the manuscript and is presumably a typo for dp]
    - E(t|s,p) = dp − θs
  - Combined correctness and time ("high speed, high stakes", Klinkenberg 2011): Ssi = (2·correct_si − 1)(ai·di − ai·tsi), with di a time limit and ai a discrimination parameter.
  - That rule fits UIs that show the deadline. When timing is hidden from users, a different scoring rule is advised (Řihák 2015).
  - Confidence: H.
- **F1.9. Multivariate extension.**
  - θsj := θsj + cij·K(correct − P(correct = 1)), where cij is the correlation between knowledge components i and j.
  - In the geography case this gave only small gains, as did hierarchical skills.
  - Confidence: H.
- **F1.10. Learning extension (PFAE).**
  - PFAE uses different update constants for correct and for incorrect answers.
  - It adds a short-term memory effect f(t) = w/t with w = 80.
  - It beat BKT and PFA on predictive accuracy, and timing information improved it further.
  - Confidence: H, for what the paper reports.

## Q2. Glicko-2, TrueSkill and OpenSkill

- **F2.1. Glicko-2 state and parameters.**
  - Each player has a rating r, a rating deviation RD and a volatility σ.
  - Glickman's own example document (glicko2.pdf) gives defaults for an unrated player: r = 1500, RD = 350, σ = 0.06.
  - τ (tau) between 0.3 and 1.2 is "reasonable". Use a smaller τ, as low as 0.2, if improbable outcomes are expected.
  - Scale conversion: μ = (r − 1500)/173.7178 and φ = RD/173.7178.
  - Source: http://www.glicko.net/glicko/glicko2.pdf, M. Glickman (Boston University), dated 2022-03-22. Technical note.
  - Confidence: H. Class: primary/author technical note (not peer-reviewed).
- **F2.2. Glicko-2 equations.**
  - g(φ) = 1/√(1 + 3φ²/π²)
  - E(μ, μj, φj) = 1/(1 + exp(−g(φj)(μ − μj)))
  - v = [Σj g(φj)² E(1 − E)]⁻¹
  - Δ = v Σj g(φj)(sj − E)
  - The new volatility σ′ comes from an iterative Illinois / regula-falsi step on f(x) = e^x(Δ² − φ² − v − e^x)/(2(φ² + v + e^x)²) − (x − a)/τ², with a = ln σ² and ε = 1e−6.
  - φ* = √(φ² + σ′²)
  - φ′ = 1/√(1/φ*² + 1/v)
  - μ′ = μ + φ′² Σj g(φj)(sj − E)
  - If there are no games in a period, only φ* = √(φ² + σ²) applies.
  - Same source as F2.1. Confidence: H.
- **F2.3. Rating periods.**
  - Glicko-2 "works best" when a rating period averages at least 10 to 15 games per player. That conflicts with per-answer updates in a puzzle game unless the system is adapted.
  - Same source as F2.1. Confidence: H.
- **F2.4. Glicko-2 used for learners (Park 2021).**
  - Park adapted Glicko-2 for K-12 math (Knowre): 5,179,493 attempts by 10,194 users on 7,513 knowledge units.
  - Discrete rating periods were replaced with a continuous-time process. Skill drift is θs(t+Δt) ~ N(θs(t), Δt·σs²), with Δt in days.
  - Units (item families whose problems are "instantiations") get no volatility, because their difficulty is assumed constant.
  - Prediction is P = E(μs, μi, φs² + φi²); both uncertainties enter through g().
  - Ratings were initialized from a prerequisite graph. RMSE fell over time.
  - There was **no head-to-head comparison with Elo** and **no response-time use**.
  - Source: J. Park, "Online Estimation of Student Ability and Item Difficulty with Glicko-2 Rating System on Stratified Data", EDM 2021, https://educationaldatamining.org/EDM2021/virtual/static/pdf/EDM21_paper_8.pdf.
  - Confidence: H. Class: primary/peer-reviewed conference (short paper).
- **F2.5. Principled uncertainty adds little (Pelánek).**
  - Pelánek reports that in student modelling, principled uncertainty methods (Glicko-style Bayesian) "do not bring significant advantages" over a simple U(n), citing Nižnan et al. 2015.
  - In geography, Elo with U(n) gave estimates very similar to a Bayesian approach.
  - Source: Pelánek 2016 (above). Confidence: H. Class: primary/peer-reviewed.
- **F2.6. OpenSkill.**
  - OpenSkill (openskill.py) is MIT-licensed. It implements Weng-Lin Bayesian models (the README says "5 separate models", including Plackett-Luce).
  - The README claims it is "150% faster than TrueSkill" and that accuracy matches TrueSkill. This is a vendor claim and unverified.
  - The paper is Joshy, "OpenSkill: A faster asymmetric multi-team, multiplayer rating system", arXiv 2401.05451 (2024-01-09).
  - Sources: https://github.com/vivekjoshy/openskill.py ; https://arxiv.org/abs/2401.05451.
  - Confidence: M. Class: repo plus preprint (not peer-reviewed).
- **F2.7. Synthesis: which system suits this game (my inference, not a sourced finding).**
  - TrueSkill and OpenSkill target multiplayer and team ranking. Neither has a native response-time score, and I found no educational use of either.
  - For one player against generated items with response times, the evidence favours Elo with an uncertainty function and a time-aware score (Pelánek F1.5, F1.8). Glicko-2 is worth considering only if you need explicit per-player confidence intervals, and it needs the continuous-time adaptation (F2.4).

## Q3. Dynamic difficulty adjustment (DDA)

- **F3.1. Large math-game experiments (Lomas et al., CHI 2013).**
  - Two online experiments on a math game (number-line estimation) with 10K and 70K subjects, using 2x3 and 2x9x8x4x25 factorial designs.
  - "In almost all cases, subjects were more engaged and played longer when the game was easier". This contradicts the generality of the inverted-U (flow) hypothesis.
  - "The most engaging design conditions produced the slowest rates of learning."
  - Source: Lomas, Patel, Forlizzi, Koedinger, "Optimizing Challenge in an Educational Game Using Large-Scale Design Experiments", CHI 2013 (ACM). Copy read: https://www.stat.cmu.edu/~brian/463-663/project-part-one/Optimizing%20Challenge.pdf.
  - Confidence: H for the abstract-level claims. Class: primary/peer-reviewed.
  - This is directly relevant to the tension between a 75% target and engagement.
- **F3.2. DDA in an open-ended learning task (Schütt et al.).**
  - DDA is "generally beneficial for learning in close-ended tasks" (the authors' framing of prior work). In open-ended tasks, practice behaviour matters, not just performance.
  - The study had N = 86.
  - Source: Schütt, Huber, Nasir, Conati, André, "Does Difficulty even Matter?", arXiv 2311.01934 (2023-11-03). The DOI 10.1145/3636555.3636876 suggests LAK 2024 (ACM).
  - Confidence: M. Class: preprint, likely also peer-reviewed at LAK.
- **F3.3. Systematic review of DDA solutions (Souza et al.).**
  - The review covers 34 studies. AI techniques account for about 50% of approaches and heuristic or parameter manipulation for about 47%.
  - Source: Souza et al., "Solutions for dynamic difficulty adjustment in digital games: a systematic literature review", Entertainment Computing 2025, https://repositorio.bc.ufg.br/items/36654b2c-0c40-4a08-8d21-8ff7f53765c4.
  - Confidence: L (search snippet only). Class: secondary/peer-reviewed.
- **F3.4. Mixed effects of DDA (Guo, Thawonmas, Ren).**
  - Evidence that DDA enhances player experience is "mixed".
  - Source: Guo, Thawonmas, Ren, "Rethinking dynamic difficulty adjustment for video game design", Entertainment Computing 2024.
  - Confidence: L (snippet). Class: secondary.
- **F3.5. Adaptive vs non-adaptive language game (Computers & Education, 2013).**
  - 234 secondary students: an adaptive game gave higher learning than an identical non-adaptive game, with no difference in motivation.
  - This is a quasi-experiment on language (cognates), not math.
  - Source: search snippet only; I did not fetch the paper or confirm its authors.
  - Confidence: L. Class: unverified secondary.
- **F3.6. Adaptive third-grade arithmetic game (Mackenzie master's thesis, 2019).**
  - The adaptive version showed 17.9% longer average interaction time than the non-adaptive version.
  - Source: https://dspace.mackenzie.br/items/041d02d4-aaa3-4749-8f67-0090e2679443 (snippet).
  - Confidence: L. Class: grey literature (thesis).

## Q4. Predicting difficulty for generated items

- **F4.1. Math Garden: difficulty from problem features (Straatemeier).**
  - "Large proportions of variance" in the difficulty of addition, subtraction and multiplication items were explained by a limited set of problem characteristics, and the estimates were robust over time.
  - The page gives no percentage.
  - Source: Straatemeier, "Math Garden: A new educational and scientific instrument", PhD thesis, University of Amsterdam, 2014 (summary page https://www.iops.nl/concluded-iops-projects/straatemeier-marthe/ ; thesis https://dare.uva.nl/id/67ab8977-5e36-4f9f-962d-be294f2b8c09).
  - Confidence: M. Class: primary thesis summary.
- **F4.2. Item families as rated units (Park).**
  - Park rates knowledge *units* whose problems are instantiations. Item difficulty is effectively an Elo/Glicko rating per generator family, initialized from prerequisite depth.
  - Source: Park, EDM 2021 (F2.4). Confidence: H. Class: primary.
- **F4.3. LLTM with generated arithmetic items.**
  - Difficulty-generating features: operation, crossing 10, and number of second-term digits. All were significant under the LLTM but explained about 20% of Rasch difficulty variance.
  - Source: JERO (Waxmann) article, "Developing learning-progress monitoring tests using difficulty-generating item characteristics: basic arithmetic operations in primary schools". The page returned 404, so authors and year are unconfirmed.
  - Confidence: L. Class: unverified.
- **F4.4. Generated number-series items (Sun, Liu, Luo 2019).**
  - The generator's stimulus features explained 77% of difficulty variance. Two-operation items were especially hard.
  - Source: Sun, Liu, Luo, "Automatic Generation of Number Series Reasoning Items of High Difficulty", Frontiers in Psychology 2019, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6491774/.
  - Confidence: L (snippet; the full text is open access). Class: primary/peer-reviewed.
- **F4.5. Pelánek's own approach to new items.**
  - Within the 2016 paper, Pelánek's approach is to reset a new item to 0 and learn its difficulty from answers. There is no feature model.
  - The multivariate cij extension could share information across knowledge components.
  - Source: Pelánek 2016. Confidence: H.

## Leads

- Nižnan, Pelánek, Řihák 2015, on the Elo vs Bayesian uncertainty comparison.
- Řihák 2015, a scoring rule for response time when the timer is hidden.
- Papoušek et al. 2014 (EDM), on PFAE equations.
- Klinkenberg, Straatemeier, van der Maas 2011 (Computers & Education). Its U update with time decay is relevant for returning players.
- Pelánek, Papoušek et al. 2017 (UMUAI), "Elo-based learner modeling for the adaptive practice of facts": https://www.fi.muni.cz/~xpelanek/publications/umuai-adaptive-practice.pdf
- The EDM 2025 paper (https://educationaldatamining.org/edm2025/proceedings/2025.EDM.long-papers.99/2025.EDM.long-papers.99.pdf) and the Tilburg paper "Keeping Elo alive". Both report that under adaptive selection, Elo rating variance inflates and fails to converge, and they propose two parallel rating chains. Snippet only and important for a DDA game, so read these next.
- Lomas et al., the full results in the CHI 2013 paper (item sequencing and feedforward). Lomas has later papers on the same game.
- The Straatemeier thesis chapters, for the variance-explained numbers.
- The Sun et al. 2019 full text (open access).
- Glickman 1999 (JRSS-C), for Glicko-1 with per-game updates.

## Looked for but not found

- I could not retrieve Zohaib 2018 (Advances in HCI, Hindawi). Both Wiley and Hindawi returned 403, so none of its content is verified.
- I found no empirical head-to-head of Glicko or Glicko-2 against Elo for learners. Park 2021 has no Elo baseline.
- I found no educational or learner use of TrueSkill or OpenSkill.
- I did not find "Elo per feature" or "Elo for item types" for generated items in Pelánek 2016.
- I found no peer-reviewed RCT of DDA in a math game that measured both engagement and learning, apart from Lomas 2013 (which manipulated difficulty conditions, not DDA as such).
