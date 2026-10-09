# Digest: adaptive rating r1-1, Elo/SRT, alternatives, target success rates

Decision served: how a procedurally generated arithmetic puzzle game rates player skill and puzzle difficulty, scores speed and accuracy together, and scales difficulty between puzzles.
Accessed (all sources): 2026-10-08. Class key: PR = peer-reviewed, CP = conference proceedings (peer-reviewed), PP = preprint, SEC = secondary (blog or press).

## Findings

1. **Claim:** Math Garden uses an Elo-based item response model. Each answered item updates both the child's ability and the item's difficulty, so items calibrate themselves during play. The scoring rule uses both accuracy and response time. Items are sampled at a mean success probability of .75. In the initial study, 3,648 children completed more than 3.5M problems in 10 months, and the authors report good precision, validity, reliability and pupil satisfaction.
   - Source: https://dare.uva.nl/id/de65bb65-d198-4dbc-ac7b-bc25ca23e627 (Klinkenberg, Straatemeier & van der Maas, *Computers & Education* 57(2):1813–1824, doi:10.1016/j.compedu.2011.02.003)
   - Publisher: Elsevier, via the UvA repository · pub_date: 2011 · confidence: high (abstract only; I did not read the full text) · class: PR

2. **Claim:** The SRT (signed residual time) rule, also called "high speed high stakes" (HSHS): there is a per-item time limit d. The score is the remaining time (d − RT) multiplied by (2·acc − 1), with acc = 1 for correct and 0 for incorrect. A correct answer gains the remaining time, a wrong answer loses it, and a skip or timeout scores 0. A fast wrong answer therefore costs a lot, which discourages guessing.
   - Published wording (Klinkenberg 2014): "The same formula (d - RT) multiplied by acc*2 - 1 now makes fast guessing extremely risky."
   - Standard notation: **S_ij = (2·x_ij − 1)·(d − t_ij)**, where x_ij ∈ {0,1} is accuracy and t_ij is response time. This is reconstructed from the wording above and from Brinkhuis et al. 2018, which says the sign comes from accuracy and the magnitude from the remaining time. The equation glyphs in that PDF did not extract.
   - The Fig. 1 caption in Klinkenberg 2014 also mentions "a scaling factor" a. Its exact placement is unverified.
   - Source: https://www.surf.nl/files/2019-04/Artikel%20High%20Speed%20High%20Stakes%20Scoring%20Rule.pdf (Klinkenberg, CAA 2014, CCIS 439, doi:10.1007/978-3-319-08657-6_11)
   - Publisher: Springer CCIS / SURF · pub_date: 2014 · confidence: high · class: CP

3. **Claim:** Maris & van der Maas take this scoring rule as a sufficient statistic and derive a response model from it. The model is in the exponential family, its accuracy part is the 2PL IRT model, and the item time limit sets item discrimination. Klinkenberg 2014 restates this as "discrimination = d".
   - Source: https://ideas.repec.org/a/spr/psycho/v77y2012i4p615-633.html (*Psychometrika* 77(4):615–633, doi:10.1007/s11336-012-9288-y)
   - Publisher: Springer / Psychometric Society · pub_date: 2012 · confidence: high (abstract) · class: PR

4. **Claim:** Later work on the HSHS rule:
   - In chess, an adaptive HSHS rating correlated .808 with FIDE rating, against .575 for sum-correct.
   - Math Garden ratings correlated .78–.84 with national CITO math scores.
   - In a non-adaptive statistics test, reliability was about the same as sum-correct (.60 vs .57).
   - No differential functioning was found for risk-taking, performance anxiety or gender.
   - Source: same as Finding 2 · pub_date: 2014 · confidence: medium (summary paper that points to Dutch-language reports) · class: CP

5. **Claim:** Production Math Garden settings:
   - Time limit generally 20 s, with 15 items per session.
   - Coins are shown counting down, so the score is visible to the child.
   - Children choose their own difficulty level: easy (about 90% correct), medium (about 75%) or hard (about 60%).
   - Items are sampled at the chosen level while avoiding recently seen items. The authors state that "no optimal item selection is currently attempted".
   - A question-mark skip scores 0, and its use is limited to stop children farming easy items.
   - Known misfit: a cluster of fast errors (typing slips, fast guessing) on easy items gives large negative residuals.
   - Anxious high-ability children may answer too slowly under the high stakes.
   - The system had recorded over 1 billion responses.
   - Source: https://learning-analytics.info/index.php/JLA/article/view/5796 (Brinkhuis, Savi, Hofman, Coomans, van der Maas & Maris, "Learning As It Happens", *J. Learning Analytics* 5(2):29–46)
   - Publisher: SoLAR · pub_date: 2018 · confidence: high · class: PR

6. **Claim:** Experiment on target success rate:
   - 207 children in grades 3–6 were split into a control group and three conditions, each with a different pre-set success rate.
   - The higher the success rate, the more problems the children attempted and the more their math performance improved.
   - Math anxiety improved equally in all conditions.
   - Perceived competence improved only modestly.
   - Exact success rates per condition: not verified (abstract only).
   - Source: https://dare.uva.nl/id/789fc422-4935-49ca-bcba-803239522951 (Jansen et al., *Learning and Individual Differences* 24:190–197, doi:10.1016/j.lindif.2012.12.014)
   - Publisher: Elsevier · pub_date: 2013 · confidence: medium-high · class: PR

7. **Claim:** The "Eighty Five Percent Rule": for learners trained by stochastic gradient descent on binary classification, learning is fastest at about 15.87% error, i.e. about 85% accuracy. The derivation covers two-choice tasks. In press coverage the lead author warns against reading it as a rule for schooling.
   - Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579 (Wilson, Shenhav, Straccia & Cohen, *Nature Communications* 10:4646, doi:10.1038/s41467-019-12552-4; preprint at bioRxiv 255182)
   - Publisher: Springer Nature · pub_date: 2019 · confidence: high on the result; low that it transfers to arithmetic games · class: PR

8. **Claim:** Pelánek argues that Elo is simple, robust and effective for adaptive educational systems when each answer is treated as a match between student and item. A secondary source reports that educational Elo variants replace the fixed K with an uncertainty function, U(n) = a/(1 + b·n), where n is the number of past answers. I have not verified that this formula appears in Pelánek 2016.
   - Source: https://www.muni.cz/en/research/publications/1376317 (Pelánek, *Computers & Education*, doi:10.1016/j.compedu.2016.03.017); U(n) from https://arxiv.org/pdf/2403.07908
   - Publisher: Elsevier / arXiv · pub_date: 2016 / 2024 · confidence: medium (Pelánek abstract), low (U(n) attribution) · class: PR / PP

9. **Claim:** Duolingo's half-life regression (HLR) models how memory strength decays across spaced practice. It cut recall-prediction error by 45% or more against baselines. Duolingo's blog reports a 9.5% lift in daily retention in A/B tests. HLR targets spacing and forgetting, not per-puzzle difficulty matching or response-time scoring.
   - Source: https://aclanthology.org/P16-1174/ (Settles & Meeder, ACL 2016); https://blog.duolingo.com/how-we-learn-how-you-learn
   - Publisher: ACL / Duolingo · pub_date: 2016 · confidence: high (paper), medium (blog) · class: PR / SEC

## Synthesis (inference, not separately evidenced)
- The evidence points toward the Math Garden design for short, timed arithmetic items:
  - Elo-style simultaneous updates of player and item ratings.
  - The SRT score as the outcome.
  - A selectable target success rate between about 60% and 90%, defaulting to 75%.
- Jansen 2013 shows that higher success rates drive more practice in children.
- The 85% rule supports targets in the 75–85% range, but only by analogy.

## Leads
- Pelánek 2016 accepted manuscript: https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf. I downloaded it but could not extract the text. It should give the K/uncertainty function and a comparison of Elo with IRT and BKT.
- Full text of Brinkhuis et al. 2018: https://learning-analytics.info/index.php/JLA/article/view/5796/6478. It contains the exact equations for the SRT expected score and the Elo update, but they are in a Cambria Math font that did not extract.
- "Psychometrics of an Elo-based large-scale online learning system" (2025): https://www.sciencedirect.com/science/article/pii/S2666920X25000165. Fetching it returned HTTP 403.
- Maris & van der Maas 2012 full text: has the expected score E(S | θ − β) and the conditional distributions.
- Van Rijn & Ali 2018, generalized SARM, *Psychometrika* 83(1).
- Vermeiren et al. 2026, *UMUAI*, on dynamic K for educational Elo.
- Hofman et al., "How to Continue?" adaptive math programs study (Math Garden, fifth graders): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10299571/
- Straatemeier 2014, PhD thesis "Math Garden: a new educational and scientific instrument": https://dare.uva.nl/id/67ab8977-5e36-4f9f-962d-be294f2b8c09

## Looked for but not found (this run)
- The exact published equation for the SRT expected score and the Elo update with K values. I believe it is E(S) = d·(e^{2d(θ−β)}+1)/(e^{2d(θ−β)}−1) − 1/(θ−β), but this is an **unverified belief** from training data and was not retrieved.
- Original sources for Glicko/Glicko-2, TrueSkill, BKT and IRT/CAT, and how they apply to short timed items. Not searched, because the tool-call budget ran out.
- Primary game-DDA evidence: flow-channel studies, game-engagement success rates, and children vs adults. Not retrieved.
- The exact success-rate levels used in the Jansen 2013 conditions.
