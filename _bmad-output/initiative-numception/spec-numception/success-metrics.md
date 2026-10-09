# Success Metrics

Ids are the PRD's. **Default:** a provisional value the user accepted at PRD finalize. Benchmarks and evidence: `../prd-numception/addendum.md` §A5.

## POC (small playtest)

Measured by observation, short interviews and exported event logs (FR-44).

- **SM-1 "I want to keep playing."** ≥ 80% of playtesters (minimum 5) keep playing past 10 minutes unprompted, or ask to play again. Validates FR-9, FR-11, FR-14, FR-15.
- **SM-2 The core moment lands.** ≥ 80% show a visible reaction (comment, smile, "oh!") at their first round collapse and can explain unprompted that answers become the next puzzle. Validates FR-9, UJ-1.
- **SM-3 Onboarding without help.** ≥ 80% of first-time players aged 7–10 (minimum 5) solve their first non-guided round without adult help. Validates FR-23.
- **SM-4 Smooth.** Steady 60 fps during play and transitions on the reference devices (NFR-1). Validates FR-9, FR-26.

## v1 primary

- **SM-5 D1, D7, D28 retention**, by mode and profile. Default targets: D1 ≥ 30%, D7 ≥ 12%, D28 ≥ 5%. Ambitious: D7 leans on a disputed vendor benchmark, and 75% of mobile games sit below 3% D28. Refit from the 2026 GameAnalytics puzzle report (OQ-23). Validates FR-12, FR-28.
- **SM-6 Streak survival:** share of players with a streak ≥ 7 days on day 14. Default: baseline from the first 4 weeks after launch; target set then. Validates FR-28, FR-29.

## v1 secondary

- **SM-7 Success rate vs target:** median per-player success rate within ±5 points of each mode's target (fleet view; FR-20's ±7 is per player). Validates FR-20.
- **SM-8 Difficulty model fit:** share of variance in bucket ratings explained by the feature prior, tracked over time. Default: no target until POC data exists. Validates FR-20, FR-21.
- **SM-9 Normal adoption:** share of players who try Normal within 7 days of unlocking it. Default: baseline from the first 4 weeks; no target before. Validates FR-18.

## Counter-metrics (do not optimise)

- **SM-C1 Kid session length.** Don't push it up; any mechanic raising it by pressure is out. Counterbalances SM-5.
- **SM-C2 Streak-loss distress.** Watch reviews and playtest comments for players feeling punished; never raise streak survival with threats. Counterbalances SM-6.
- **SM-C3 Zen error-driven churn.** Quitting right after Zen errors means difficulty is too high. Never improve SM-7 by making Normal harder for players already in a groove. Counterbalances SM-7.
- **SM-C4 Easy-mode stagnation.** Easier play is played longer but teaches slower; watch for flat ratings while sessions climb. Counterbalances SM-5, SM-7.
