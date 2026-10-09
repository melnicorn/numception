---
title: 'domain research: Retention in math puzzle games'
type: 'domain + user-voice'
topic: 'Retention in math puzzle games'
decision: 'Which progression, unlock, and reward mechanics to put in the PRD'
source: 'native run'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-10-08'
updated: '2026-10-08'
claims_verified: 4
claims_unverified: 3
claims_disputed: 1
---

# domain research: Retention in math puzzle games

**Decision this research serves:** Which progression, unlock, and reward mechanics to put in the PRD

## Executive summary

**Build retention on a forgiving daily habit and on the math itself being the game. Don't build it on ads, paywalls, or rewards that kids come to expect.** Split the reward design by mode: Zen gives encouraging feedback and gentle streaks, while Normal gives personal bests first and leaderboards second.

What drives the answer:

1. **Forgiving streaks are the best-evidenced return mechanic.**
   - Duolingo found that letting *any* lesson extend a streak (rather than a harder daily goal) raised D14 retention 3.3% and DAU 1%, both relative [1].
   - Streak protection over a weekend made learners 4% more likely to return a week later and 5% less likely to lose their streak [2].
   - Retention is "most fragile in the first seven days" [3].
2. **Rewards and competition backfire for exactly the audience Zen mode targets.**
   - In a meta-analysis of 128 experiments, *expected* tangible rewards reduced intrinsic motivation (d ≈ −0.28 to −0.40), more so for children. Encouraging feedback increased it overall (d = +0.33), but for children the effect was small and not significant (d = 0.11) [4].
   - In a 1,389-pupil math game, maths-anxious children disliked the leaderboard even after controlling for their rank [5].
   - Losing teams lost motivation [6].
3. **What players hate most in this category is monetization and "math as a toll booth."**
   - Prodigy reviews centre on membership upsells [7]. One count found 16 membership ads against 4 math problems in 19 minutes, plus status visibly tied to paying [8].
   - Prodigy is also faulted because its math gates the game rather than being the game [9].
   - Number Match players complain of ads every round [10].
   - 95% of apps for children aged 0–5 contained ads [11].

**Biggest caveat:** no source measured how level progression, unlocks or achievements affect D1/D7/D30 retention in casual puzzle games [12]. The streak evidence comes from one company, Duolingo, and partly from 2017 [2]. Design those systems from first principles and measure them ourselves with our own analytics.

## Benchmarks: what "good" looks like

| Metric | Median, all mobile games | Top quartile | Source |
|---|---|---|---|
| D1 | 22.9% (Q1 2024) | ≈26.5–27.7% (2024 data) | [12][13] |
| D7 | 3.4–4.2% | 7–8% | [12][13] |
| D28 | 0.85%; 75% of games are below 3% | — | [12][13] |

Puzzle had the highest D7 of any genre in GameAnalytics' data, but the exact puzzle figures were only in chart images [12]. Puzzle figures circulating on vendor blogs (D1 ~32%, D7 ~12%) have unclear origins and probably measure a different population; treat them as low confidence [14].

## Mechanics: what the evidence supports

**Streaks and daily return.**
- The evidence favours a low bar to keep a streak, so one puzzle counts. Coupling the streak to effort hurt [1].
- Streak protection measurably reduced streak loss [2]. Allowing two streak freezes gave a modest +0.38% DAU (unverified excerpt) [15].
- Duolingo's "Streak Wager" (betting currency on keeping a streak) raised D7 retention 14% [2]. But it works by fear of loss, and this report does not recommend it for a kids' mode.

**Gamification in learning overall.**
- Positive but heterogeneous effects: cognitive outcomes g = 0.49, motivation g = 0.36, behaviour g = 0.25 [16].
- The math-specific pool is too small to be sure: g = 0.44, with a confidence interval crossing zero (low confidence) [17].

**Leaderboards.**
- Leaderboards harm anxious and losing players [5][6].
- In adults, a high rank bred complacency and a low rank raised effort [18]. So the harm depends on who the player is, not leaderboards in general.

**Timers.**
- The evidence is contested.
  - Boaler argues timed tests trigger stress that blocks working memory. That is advocacy, inferred from stress research [19].
  - A 2024 study of 113 4th–5th graders found that whether timing was visible or hidden made no anxiety difference. Harder problems did raise anxiety [20].
  - The US Department of Education's What Works Clearinghouse rates timed fluency practice as strongly evidenced, while the National Council of Teachers of Mathematics advises avoiding speed drills [21].
- Experts note that beating your own best time motivates, while comparing times with peers demotivates [20].

**Parents and privacy.**
- Kids' and education apps widely share data with advertisers [22].
- Parent progress reports in the market favour plain language and weekly check-ins, but the only evidence is vendor material [23].

## Cross-dimension insights

- **Zen vs. Normal is supported by the evidence, not just a matter of taste.** The research splits the same way the user's brief does:
  - **Zen:** no expected rewards, encouraging feedback, no leaderboards [4][5].
  - **Normal:** personal-best timers and opt-in competition [20][18].
- **Difficulty, not the timer, is the anxiety lever** [20]. That ties retention to the difficulty-model research: getting the adaptive success rate right protects the anxious player more than removing the clock does.
- **Monetization is the category's biggest reputation risk** [7][8][10][11]. A no-ads design with a one-time unlock stands out.

## Recommendations (feed: PRD → progression, modes, monetization, privacy)

1. **Daily habit (high confidence).**
   - A streak that one solved puzzle extends, in both modes.
   - Built-in streak protection (freezes, earned by playing, not bought).
   - No streak wagers for kids [1][2].
2. **Zen mode rewards (medium-high confidence).**
   - Encouraging feedback, a visual growth or collection metaphor, and no leaderboards.
   - Don't use unlocks as a *contingent* payment for playing. Unlock content because the player has demonstrated mastery, framed as new play, not prizes [4][5].
3. **Normal mode competition (medium confidence).**
   - Personal-best first, then friend or nearby-rank boards.
   - Global leaderboards opt-in, with fractal/pyramid depth as the "bragging rights" board [5][6][18][20].
4. **The math is the game (high confidence).** Never gate play behind problems the way Prodigy does; every interaction is the puzzle [9].
5. **Monetization and privacy (high confidence on the risk, medium on the remedy).**
   - No ads in any mode reachable by children, and no third-party ad or tracking libraries in kid profiles.
   - A one-time unlock or a simple premium tier.
   - Design for COPPA compliance from day one [8][11][22].
6. **Hints (medium confidence).** Optional hints for stuck players [24].
7. **Instrument retention from the first prototype.** Track D1/D7/D28, streak survival, and session length by mode, because published evidence on progression, unlocks and collections is missing [12].

## Open questions

- How progression, unlocks and achievements affect retention in casual puzzle games. No primary data was found; run our own A/B tests.
- Puzzle-genre D1/D7/D28 medians. They are in the GameAnalytics 2025 PDF charts; a Deepen pass could extract them.
- What parents actually want in progress reports. Only vendor material exists; a small parent interview round would answer it.

## Source appendix

| # | Claim/finding it supports | Publisher | Pub date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | Decoupled streak: +3.3% D14, +1% DAU; 7-day streak 2.4× next-day return | [Duolingo blog](https://blog.duolingo.com/improving-the-streak) | 2020-11-19 | 2026-10-08 | high |
| [2] | Streak Wager +14% D7; Weekend Amulet +4% return, −5% streak loss | [Duolingo blog](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals) | 2017-05-10 | 2026-10-08 | medium (dated) |
| [3] | 600+ streak experiments; retention most fragile in first 7 days | [Lenny's Newsletter](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks) | 2024-12-15 | 2026-10-08 | medium |
| [4] | Expected tangible rewards undermine intrinsic motivation, more for children | [Deci, Koestner & Ryan, Psychological Bulletin](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf) | 1999 | 2026-10-08 | high |
| [5] | Maths-anxious pupils disliked leaderboard (n=1,389) | [Int. J. Serious Games](https://journal.seriousgamessociety.org/index.php/IJSG/article/view/794) | 2024-11 | 2026-10-08 | medium-high |
| [6] | Losing-team players less motivated by leaderboard | [GaLA 2020 / Tampere Univ.](https://trepo.tuni.fi/handle/10024/130150) | 2020 | 2026-10-08 | medium |
| [7] | Prodigy parent complaints centre on membership upsells | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/prodigy-kids-math-game/user-reviews/adult) | rolling | 2026-10-08 | medium-high |
| [8] | 16 membership ads vs 4 math problems; FTC complaint | [NBC News](https://www.nbcnews.com/news/amp/ncna1258294) | 2021-02-19 | 2026-10-08 | high |
| [9] | "Math as toll booth" critique | [kottke.org](https://kottke.org/26/05/0049015-my-sons-math-homework-is-) | 2026-05 | 2026-10-08 | medium |
| [10] | Number Match ad-load complaints | [SplitMetrics](https://splitmetrics.com/apps/number-match-numbers-game/id1545567989) | undated | 2026-10-08 | medium |
| [11] | 95% of apps for ages 0–5 contain ads | [Michigan Medicine](https://michiganmedicine.org/health-lab/advertising-kids-apps-more-prevalent-parents-may-realize) | 2018-10 | 2026-10-08 | high |
| [12] | GameAnalytics Q1 2024 medians; puzzle highest D7 | [GameDev Reports / GameAnalytics](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile) | 2024-05-27 | 2026-10-08 | high |
| [13] | GameAnalytics 2025 report top/bottom quartiles | [GameDev Reports / GameAnalytics](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks) | 2025-02-17 | 2026-10-08 | high |
| [14] | Recycled puzzle benchmarks D1 31.85% / D7 12.18% | [Segwise](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies) | 2025–26 | 2026-10-08 | low |
| [15] | Two streak freezes +0.38% DAU | [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit) | unverified | 2026-10-08 | medium (unverified) |
| [16] | Gamification meta-analysis g = 0.49 / 0.36 / 0.25 | [Sailer & Homner, Educ. Psych. Review](https://link.springer.com/article/10.1007/s10648-019-09498-w) | 2020 | 2026-10-08 | high |
| [17] | Math gamification g = 0.44, CI crosses zero | [J. Pendidikan Matematika dan Sains](https://journal.uny.ac.id/index.php/jpms/article/view/96112) | 2026 | 2026-10-08 | low-medium |
| [18] | High rank → complacency; low rank → effort | [Internet Research (Emerald)](https://www.emerald.com/insight/content/doi/10.1108/intr-12-2021-0897/full/html) | 2023 | 2026-10-08 | medium |
| [19] | Boaler: timed tests damaging | [Stanford GSE](https://ed.stanford.edu/news/learning-math-without-fear) | 2015-01 | 2026-10-08 | medium |
| [20] | Timing visibility no anxiety effect; harder problems raise anxiety; self-best motivates | [Education Week](https://www.edweek.org/teaching-learning/do-timed-tasks-really-worsen-math-anxiety/2024/08) | 2024-08-07 | 2026-10-08 | medium-high |
| [21] | WWC rates timed practice strong; NCTM opposes drills | [Hechinger Report](https://hechingerreport.org/proof-points-do-math-drills-help-children-learn/) | c.2023 | 2026-10-08 | medium |
| [22] | Ed apps share student data with marketers | [Stars and Stripes / WaPo](https://www.stripes.com/theaters/us/2022-05-24/school-apps-shared-childrens-data-6119771.html) | 2022-05-24 | 2026-10-08 | medium-high |
| [23] | Parent dashboards: plain language, weekly check-ins (vendor) | [Brilliant help](https://brilliant.org/help/features/parent-progress-dashboards-on-brilliant/) | undated | 2026-10-08 | low |
| [24] | DragonBox reviews flag missing hints | [Common Sense Media](https://www.commonsensemedia.org/app-reviews/dragonbox-numbers) | undated | 2026-10-08 | medium |

## Staleness map

Windows: first-party experiments 36 mo · benchmarks 18 mo · market/landscape 18 mo · peer-reviewed research 60 mo. Computed with `recon_kit.py staleness`.

| Claim | Class | Published | Re-check by |
|---|---|---|---|
| Duolingo streak experiments [1][2] | experiment | 2017–2020 | **stale**: directionally useful, re-check for newer Duolingo data |
| GameAnalytics benchmarks [12][13] | benchmark | 2024–2025 | **stale since 2026-08**: pull the 2026 report |
| Kids-app ad prevalence [11], Prodigy monetization [8] | landscape | 2018–2021 | **stale**: the pattern persists in [7][10], but the specific figures are dated |
| Leaderboard/anxiety research [5] | research | 2024-11 | 2029-11 |

The earliest overdue re-check is the retention benchmarks. A Deepen pass on the 2026 GameAnalytics report would bring them current.
