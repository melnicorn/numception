---
title: Numception PRD — Addendum
created: 2026-10-09
updated: 2026-10-09
---

# Addendum: Numception PRD

Detail for downstream documents (architecture, solution design, UX spec) that doesn't belong in the PRD body. Sources: `../research-*`, `../brainstorm-modes-stickiness-name/` and `../ux-numception/`.

## A1. Technology Direction (for architecture)

- **Recommended:** web-first TypeScript, with Capacitor 8 wrapping it for iOS and Android.
  - Renderer: **Phaser 4** (scored 54/60) or **PixiJS v8** (53/60). Effectively tied; the renderer prototype decides.
- **Engine-agnostic `core` package** in pure TypeScript with no rendering dependency. It holds:
  - the generator and uniqueness checker
  - the difficulty model and ratings
  - scoring
  - the save format

  It can also run on a server to validate leaderboard and Daily Seed results.
- **Renderer prototype (gates the architecture):** build the same neon scene (lines, glow, 200 particles, **and the tier zoom with a round collapse**) in Phaser 4 and in PixiJS v8 inside Capacitor. Measure fps and gzipped size on a mid-range Android phone and an iPhone at least 3 years old. Plan 1–2 days.
- **Tie-break rules if the prototype is close:** prefer full control of the render loop (it matters most for a continuous fractal zoom), then the smaller gzipped bundle, then the faster cold start.
- **Risk:** if the game's appeal rests on heavy effects, the WebView performance ceiling is the main argument against the pick. No source measured glow or particle fps on mid-range phones. The citation check also found an 8.5 s load freeze in the reference PixiJS + Capacitor game. Measure cold start in the prototype, because FR-7 and NFR-1 forbid loading states.
- **Rejected or deprioritised:**
  - Unity 6: multi-MB web builds, Safari blocking saves inside iframes, and C#.
  - Godot 4.7: weak web performance and no C# web export.
  - Defold: Lua.
  - Flutter + Flame: a 2–2.7 MB renderer, and Dart.
  - Cocos Creator: no release in 2026.
- **Known technical items:**
  - iOS mute switch: Web Audio is silenced unless an `<audio>` element is kept active.
  - PixiJS filters default to resolution 1, which looks soft on high-DPI screens.
  - Avoid over-the-air JS feature updates (App Store guideline 2.5.2).
- **Staleness:** re-check version numbers by 2026-11-01. The Unity pricing claim is already stale.

## A2. Difficulty and Rating Model (for architecture and the core package)

- **There is no standard metric** for the difficulty of a single `a ∘ b = c`. The standard *method* is a feature-based prior plus empirical calibration, as used by Math Garden (Rekentuin): over 1B answers, with ratings correlating .78–.84 with national math scores.
- **Equation features:**
  - log magnitude and digit count
  - carries and borrows
  - operator (− and ÷ are harder than + and × at the same size)
  - ties (easier)
  - multiplier tier (×1/2/5/10 easy, ×7/8 hard)
  - negatives (count and position)
- **Puzzle features:** `n` (candidate pairs grow with roughly n²), near-miss distractors, mixed operators, missing operator. **No published weights exist for the search component.** Playtest data must supply them.
- **Model:** start with hand-set, versioned weights. Refit them with LLTM or regression on difficulties calibrated by the rating system.
- **Ratings:** Elo with uncertainty-based K: `U(n) = a/(1 + b·n)`, starting at a=1, b=0.05.
  - `P = 1/(1 + e^−(θ−d))`
  - Update: `θ += K(correct − P)` and `d += K(P − correct)`.
  - K values are set separately for players and for buckets (tuning configuration).
  - When a generator or difficulty-model version changes a bucket's definition, reset that bucket to its prior.
  - Players are rated per operator. Generator buckets are rated, not individual puzzles, and new puzzles inherit their bucket's rating.
  - Glicko-2 and TrueSkill were rejected: no significant gain, and they need 10–15 games per rating period or are built for multiplayer.
- **Normal scoring** (from research): `S = (2·correct − 1)·(d − t)` × puzzle difficulty, where `t` is solve time and `d` is the puzzle's time limit.
  - **Time limit `d`:** derived per bucket as the bucket's expected solve time × a multiplier in the tuning configuration. [ASSUMPTION: starting multiplier 2.]
  - **Displayed points (PRD FR-15):** only correct solves score, as `max(0, d − t)` × bucket difficulty × combo multiplier, plus a floor so that a slow correct solve still earns something. A wrong tap never removes points (a user decision).
  - **Ratings (PRD FR-21):** correctness only for now. Using the speed-aware score for ratings needs the expected-score model of Maris & van der Maas (2012); see OQ-22.
- **Zen:** the rating updates on correctness only, targeting about 85–90% success. Hidden-timer scoring (Řihák 2015) is an option (OQ-15).
- **Risk:** 2025 papers report Elo becoming noisy under adaptive selection; one proposes two parallel rating chains. Read them before the architecture is final.
- **Provenance:** the arithmetic report was not citation-checked. Treat its unverified items as provisional: success rate driving practice, the 77% figure, the ~20% LLTM figure, and Elo variance inflation.

## A3. Seeds (sketch)

- `puzzle = f(rootSeed, treePath, difficulty, generatorVersion)`
- **Competitive seeds:** a fixed difficulty curve. Curve assignment for the Daily Seed is OQ-16.
- **Personal seeds:** replay the logged adaptive difficulty.
- **Unresolved:** generating the Pyramid upward forever, since each new top must contain the existing top's answer (OQ-4).

## A4. Shapes per `n` (from the UX spine, not locked)

| `n` | Shape |
|---|---|
| 3 | 3A split triangle |
| 4 | 4A diamond of diamonds (width:height about 1:1.25) |
| 5 | 5B pentagon flower |
| 6 | 6A honeycomb flower |
| 7 | 7A heptagon wedges (7B is the backup) |
| 8 | 8A 3×3 grid |
| 9 | 9B nonagon wedges (9C is the backup) |

The operator always sits in the centre. Where a cell has the same shape as the whole puzzle, the cell becomes the next-tier puzzle. Otherwise it is shown as contained. The layout is a flat 3×3: no cube, and nothing above n=9.

## A5. Retention Evidence and Benchmarks

- **Forgiving streaks** (Duolingo): letting any lesson extend the streak gave +3.3% D14 retention and +1% DAU. Weekend protection gave +4% return a week later and −5% streak loss. The Streak Wager gave +14% D7 but works through loss aversion, so it's rejected for kids. Retention is most fragile in the first 7 days.
- **Rewards and competition:** expected tangible rewards reduce intrinsic motivation, more so in children. Math-anxious children disliked leaderboards whatever their rank. The citation check found that encouraging feedback had **no significant effect for children** (d = 0.11), which weakens the evidence for Zen's encouragement.
- **Timers:** in one study, visible and hidden timing made no difference to anxiety, while harder problems did raise it. **Difficulty, not the clock, is the anxiety lever.**
- **Benchmarks (all-mobile GameAnalytics medians):**
  - All mobile games: D1 22.9%, D7 3.4–4.2%, D28 0.85%.
  - Top quartile: D1 about 27%, D7 7–8%.
  - Puzzle games had the highest D7 of any genre.
  - A vendor's puzzle figures (D1 32%, D7 12%) are **disputed**.
  - Pull the 2026 report before fixing the SM-5 targets.

## A6. Rejected Alternatives and Rationale

- **Neighbour effects** (a solved answer becoming a tile in a neighbouring puzzle, pressure shuffles, solve-order bonuses): rejected as "gimmicky".
- **Reverse tap as a mode:** rejected. At most it's a young-kid assist.
- **Par time and par taps:** rejected, because it would always be just n taps.
- **Player choice of `n` and operator as the only control** (from the original brief): replaced by adaptive selection plus an optional level pin.
- **Arithmetic or birth-year parent gate:** rejected. A math gate is useless in a math game.
- **Apple Kids Category:** leaning no. It would narrow the audience, because adults would read it as a kids' game.
- **Purchasable totems or freezes:** rejected. Earn-only.
- **Name "Sumryse":** rejected.
- **Name "Kakooma":** trademarked by Tang Math.
- **Hardline "no telemetry from kids":** relaxed 2026-10-09. Kid safety comes from product design instead. See PRD §9.1.
- **Kid-stats data minimisation:** overridden 2026-10-09. The same data is captured for both profiles.
- **Cold-start revert to the Kid profile** (from the UX spine): dropped 2026-10-09. It forced the parent gate on every adult launch. The active profile is now a persistent setting, and a PIN is set when switching Grown-up → Kid.
