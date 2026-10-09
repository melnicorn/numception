# Digest: Retention and engagement mechanics in casual puzzle and educational math games (r1-1)

Decision served: progression, unlock, reward and return mechanics for a math puzzle game with Zen mode (no timer/score), Normal arcade mode (score, timers, leaderboards), and a resumable endless "pyramid" mode.
Run date: 2026-10-08. Method: web search/fetch only (16 tool calls). Classes: primary-data (first-party experiment or dataset), peer-reviewed (meta-analysis/study), vendor (analytics vendor report, marketing context), secondary (blog/aggregator).

## Findings

### Q1. Streaks, daily return mechanics (Duolingo; first-party A/B data)

1. **Claim:** Learners who reach a 7-day streak are 2.4x as likely to use the app the next day as learners without a streak (observational, not causal).
   Source: https://blog.duolingo.com/improving-the-streak | Publisher: Duolingo (Anton Yu) | pub_date: 2020-11-19 | accessed: 2026-10-08 | confidence: high (that it was reported); medium (generalizability, selection effect) | class: primary-data (company blog)

2. **Claim:** A/B test separating the streak from the daily-goal tier (streak extends on any lesson, not on hitting a harder goal) produced +3.3% D14 retention, +1% DAU, +10.5% share of daily learners on a streak within 20 days (+19% for new learners); all relative changes. A year later just over half of daily learners held 7+ day streaks, up from about one third.
   Source: https://blog.duolingo.com/improving-the-streak | Publisher: Duolingo | pub_date: 2020-11-19 | accessed: 2026-10-08 | confidence: high | class: primary-data
   Relevance: low bar to maintain a streak beats coupling streak to effort/difficulty; supports a "one puzzle counts" streak that works in Zen mode.

3. **Claim:** Streak Wager (bet currency on keeping a streak) raised D1, D7, D14 retention significantly, D7 +14%. Weekend Amulet (streak protection over a weekend) made learners 4% more likely to return a week later and 5% less likely to lose their streak.
   Source: https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals | Publisher: Duolingo (Kai Herng Loh) | pub_date: 2017-05-10 | accessed: 2026-10-08 | confidence: high (reported), medium (dated, 2017) | class: primary-data
   Relevance: streak-protection mechanics (freeze/amulet) measurably reduce streak loss; wager is a loss-aversion mechanic likely inappropriate for kids.

4. **Claim:** Allowing users to equip up to two Streak Freezes raised daily active learners by +0.38% (relative), described as modest.
   Source: https://blog.duolingo.com/how-duolingo-streak-builds-habit | Publisher: Duolingo | pub_date: not verified | accessed: 2026-10-08 | confidence: medium (seen via search summary only; page not fetched) | class: primary-data (unverified excerpt)

5. **Claim:** Duolingo has run 600+ streak-related experiments; retention is "most fragile in the first seven days"; an opt-out feature "significantly increased retention" (no numbers given).
   Source: https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks | Publisher: Lenny's Newsletter (interview w/ Jackson Shuttleworth, Duolingo) | pub_date: 2024-12-15 | accessed: 2026-10-08 | confidence: medium (qualitative, page summary only) | class: secondary (practitioner interview)

### Q2. Gamification in learning / math (meta-analyses, harms)

6. **Claim:** Gamification of learning meta-analysis: cognitive outcomes g = 0.49 (95% CI 0.30-0.69, k=19), motivational g = 0.36 (k=16), behavioral g = 0.25 (k=9). Cognitive effect stable under high-rigor subset; motivational and behavioral less stable; substantial heterogeneity.
   Source: https://link.springer.com/article/10.1007/s10648-019-09498-w | Publisher: Educational Psychology Review (Sailer & Homner) | pub_date: 2020 | accessed: 2026-10-08 | confidence: high (figures via search summary; consistent with known abstract) | class: peer-reviewed meta-analysis

7. **Claim:** Math-specific pooled estimate for gamification g = 0.437 with CI crossing zero and I² ≈ 87% (only 5 gamification studies); authors call evidence of benefit uncertain. A separate Indonesia-only meta-analysis reports 1.054 (21 studies) - likely inflated, narrow sample.
   Source: https://journal.uny.ac.id/index.php/jpms/article/view/96112 ; https://ejournal.unesa.ac.id/index.php/mathedunesa/article/view/62149 | Publisher: Jurnal Pendidikan Matematika dan Sains; MATHEdunesa | pub_date: 2026; n.d. | accessed: 2026-10-08 | confidence: low-medium (small regional journals, search summary only) | class: peer-reviewed (low-tier)

8. **Claim:** Extrinsic rewards meta-analysis (128 experiments): expected tangible rewards undermine free-choice intrinsic motivation (engagement-contingent d = -0.40, completion-contingent d = -0.36, performance-contingent d = -0.28); positive verbal feedback enhances it (d = +0.33). Tangible rewards were more detrimental for children than for college students. Contested by Cameron & Pierce camp.
   Source: https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf | Publisher: Psychological Bulletin (Deci, Koestner & Ryan) | pub_date: 1999 | accessed: 2026-10-08 | confidence: high (abstract figures via search); child-subgroup sizes not retrieved | class: peer-reviewed meta-analysis
   Relevance: for Zen/kids mode, prefer informational/verbal feedback over expected contingent rewards for simply playing.

9. **Claim:** In a primary-school math game ("Seven Spells", n=1,389, 6 weeks, infinite leaderboard), leaderboard enjoyment depended on leaderboard position and maths anxiety; maths-anxious players disliked the leaderboard more even controlling for position. Authors recommend designing leaderboards around player traits.
   Source: https://journal.seriousgamessociety.org/index.php/IJSG/article/view/794 | Publisher: International Journal of Serious Games (Univ. of Galway authors) | pub_date: 2024-11 | accessed: 2026-10-08 | confidence: medium-high (search summary) | class: peer-reviewed study

10. **Claim:** In a team-based math game competition, leaderboards motivated in general, but players whose team did poorly were less motivated; collaboration did not fully offset negative effects of the infinite leaderboard.
    Source: https://trepo.tuni.fi/handle/10024/130150 | Publisher: GaLA Conf 2020 (Tampere Univ.) | pub_date: 2020 | accessed: 2026-10-08 | confidence: medium | class: peer-reviewed (conference)

11. **Claim:** Manipulated-rank experiment: high leaderboard ranks induced complacency (easy ways to hold position); low ranks increased effort; neither motivation appeared intrinsic.
    Source: https://www.emerald.com/insight/content/doi/10.1108/intr-12-2021-0897/full/html | Publisher: Internet Research (Emerald) | pub_date: 2023 | accessed: 2026-10-08 | confidence: medium (adult sample, non-math task) | class: peer-reviewed study
    Note: counter-evidence to the "leaderboards always demotivate low performers" belief; harms appear moderated by anxiety/traits and team outcome.

### Q3. Retention benchmarks

12. **Claim:** GameAnalytics Q1 2024 medians across all mobile games: D1 22.91%, D7 4.2%, D28 0.85%. Puzzle had the highest D7 of any genre (numeric puzzle value only in chart images, not retrieved).
    Source: https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile | Publisher: GameAnalytics via GameDev Reports | pub_date: 2024-05-27 | accessed: 2026-10-08 | confidence: high (overall), puzzle numeric N/A | class: vendor

13. **Claim:** GameAnalytics 2025 report (2024 data, classic retention): top-25% D1 ≈ 26.5-27.7% (down from 28-29% in 2023), bottom-25% 10-11.5%; median D7 3.42-3.94% (top 25% 7-8%); 75% of projects below 3% D28. Board, card, puzzle, casino best for mid/long-term retention.
    Source: https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks | Publisher: GameAnalytics via GameDev Reports | pub_date: 2025-02-17 | accessed: 2026-10-08 | confidence: high | class: vendor

14. **Claim:** Widely recycled puzzle-genre figures: D1 31.85%, D7 12.18%, D30 5.35%, attributed to AppsFlyer Q3 2022 (also attributed to Mistplay elsewhere). Primary AppsFlyer table not located; provenance unclear. Much higher than GameAnalytics medians - likely different population (marketed/UA-acquired apps) and definitions.
    Source: https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies ; https://nudgenow.com/blogs/mobile-game-retention-benchmarks-industry | Publisher: Segwise; Nudge (vendor blogs) | pub_date: 2025-2026 (n.d. exact) | accessed: 2026-10-08 | confidence: low | class: secondary / vendor marketing

15. **Claim:** Older GameAnalytics guidance: top puzzle titles 15-25% D7, some hits >10% D28; 6% D28 treated as healthy (2019).
    Source: https://gameworldobserver.com/?p=1979 ; https://wnhub.io/news/analytics/item-2261 | Publisher: Game World Observer; WN Hub | pub_date: ~2019 | accessed: 2026-10-08 | confidence: low-medium (dated) | class: secondary reporting vendor data

## Leads
- Read GameAnalytics 2025 PDF directly (https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf) for the puzzle genre D1/D7/D28 table.
- AppsFlyer State of App Marketing / State of Gaming 2025 and Adjust Mobile App Trends 2026 for primary puzzle-category rows.
- Fetch https://blog.duolingo.com/how-duolingo-streak-builds-habit to verify the two-freeze +0.38% figure and any freeze/repair data.
- Deci et al. 1999 full text: child-subgroup effect sizes (relevant to Zen/kids reward design).
- Hamari, Koivisto & Sarsa (2014) "Does gamification work?" review; Hanus & Fox (2015) badges/leaderboards longitudinal classroom study (reported motivation decline) - not retrieved this run.
- Leaderboard design alternatives (relative/nearby-rank, personal-best, team) - claimed in reviews but not shown tested in sources found.
- NYT Company investor filings for Games engagement (daily puzzle habit) data.

## Looked for but not found
- Published streak-freeze retention effect beyond Duolingo's +0.38% DAU excerpt (unverified); no data on streak-repair/earn-back.
- Any NYT Games / Wordle published retention or streak-effect data (only 2022 acquisition/subscriber anecdotes; Times does not appear to publish streak stats).
- Puzzle-specific D1/D7/D28 numbers from a primary vendor page (only chart images / recycled blog figures).
- Evidence on level progression, meta-progression, collections/achievements effects on D1/D7/D30 in casual puzzle games (no primary or peer-reviewed data found within budget).
- Child-specific overjustification evidence in digital/gamified math games (only the 1999 lab meta-analysis' subgroup statement).
- Studies isolating leaderboard effects on low-achieving (vs. anxious or low-ranked) children.
