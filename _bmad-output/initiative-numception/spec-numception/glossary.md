# Glossary

Fixed vocabulary for every downstream artifact and the code (no synonyms). Phase tag where a term is v1-only.

## Puzzle structure

- **Puzzle:** one shape with `n` cells and one operator. Exactly one triple of cells satisfies `a ∘ b = c`. Solved by tapping `c`.
- **Cell:** one position in a puzzle showing a number. In a higher-tier puzzle, each cell is a lower-tier puzzle's answer.
- **n:** cells per puzzle, 3 ≤ n ≤ 9; also the number of lower-tier puzzles feeding one higher-tier puzzle. Chosen per round by the adaptive engine unless a level pin sets it.
- **Distractor:** a cell outside the valid triple; `n − 3` per puzzle.
- **Operator:** +, −, ×, ÷. Fractions arrive in v1; powers and roots Later.
- **Answer:** the `c` of a solved puzzle.
- **Tier:** nesting level. Tier-1 puzzles hold numbers; a tier-k puzzle (k > 1) holds the answers of `n` tier-(k−1) puzzles.
- **Round:** a bounded set of puzzles ending in one top puzzle.
  - **Classic round:** `n` tier-1 puzzles plus 1 tier-2 puzzle.
  - **Tower round:** three tiers; at n=3, 9 + 3 + 1 = 13 puzzles.
- **Pyramid** [v1]: the player's endless, resumable tree of tiers growing upward, shown as the **home tree** (the v1 home view).
- **Fog of war** [v1]: hides unbuilt Pyramid territory until the player builds toward it.
- **Landmark** [v1]: a height marker (e.g. Eiffel Tower, Everest, edge of space) shown as the Pyramid grows; drawn, not named.
- **Power grid** [v1]: visual wiring carrying power up the Pyramid. Partly powered = soft-lit; full power lights and unlocks the puzzle.
- **Rapid Fire** [v1]: no nesting; puzzles one at a time; the first error ends the run.
- **Totem** [v1]: earn-only Rapid Fire item that absorbs one error in a run.

## Modes and play

- **Mode:** Zen or Normal. Changes scoring, timing, feedback and palette, never puzzle rules. "Fast mode" is player-facing copy for Normal. Kid and Grown-up are profiles, not modes.
- **Zen:** calm mode; no clock, no score; each solve adds a light to the constellation.
- **Normal:** arcade mode with chain window, combo, points and power cuts.
- **Solve transition:** the visual and audio beat as a puzzle collapses to its answer; starts the instant the correct cell is tapped.
- **Round collapse:** solved lower-tier puzzles fuse into the next-tier puzzle's cells as the camera pulls out.
- **Combo:** Normal in-round heat from consecutive fast solves, 1x–2x; shown as line glow and width, never a number.
- **Overdrive** [v1]: a full combo carried into a round's top puzzle; double points on it and full fireworks.
- **Round time:** elapsed time from a round's first tier-1 puzzle to its top-puzzle solve. One of the two Normal timers, with the chain window.
- **Clean round:** a round with no wrong taps; soft misses don't break it.
- **Chain window:** Normal time window, drawn on the shape outline, before the combo cools one step. Standard, Relaxed (1.5×) or Off.
- **Power cut:** Normal feedback for a wrong tap; combo resets to 1x, no points lost.
- **Soft miss:** in a − or ÷ puzzle, tapping the other cell that reads as a valid result (`b` where `a − c = b` also holds). Not a wrong tap.
- **Constellation:** the Zen lifetime visual; each solve adds a light.
- **Ripple hint** [v1]: easy-band assist; each solved neighbouring puzzle fades one distractor in the current puzzle.

## Progression

- **Daily streak** [v1]: consecutive local-calendar days with at least one solved puzzle.
- **Streak freeze** [v1]: earned (never bought) token protecting the streak for one missed day.
- **Theme:** a complete visual look filling a shared role grammar (surface, line, number, accent, …).
- **Theme pack:** the unlock and collection unit: several themes plus their transitions.
- **Theme transition:** animated change between themes between rounds; tagged calm or intense.
- **Seed:** a compact definition of puzzle content (numbers and operators) that reproduces a round. Layout is randomised at play time unless the seed is competitive.
- **Daily Seed** [v1]: one seed per day, shared by all players.

## Profiles and surfaces

- **Profile:** a local player identity, Kid or Grown-up. Kid is the first-launch default; the active profile persists across launches.
- **Parent gate:** the check guarding Kid → Grown-up, purchases, external links, review prompts, platform sign-in and For grown-ups. An app PIN set by a grown-up; device authentication or platform parental controls may be offered where available.
- **Control surface:** the full-frame settings and navigation panel opened by the always-visible menu button.

## Difficulty and measurement

- **Rating:** adaptive skill estimate. A **player rating** is per player per operator; a **bucket rating** is per generator bucket.
- **Generator bucket:** a family of puzzles sharing difficulty features (e.g. "+ | two-digit | one carry | n=5 | 1 near-miss"). Buckets, not single puzzles, carry ratings.
- **Mastery plateau:** a player's rating for an operator has stabilised while they meet the mode's success target (operational definition in FR-22). Triggers new content.
- **Level pin:** player setting fixing `n`, operator and/or difficulty band instead of the adaptive engine.
- **Tuning configuration:** the versioned, data-only parameter set (targets, weights, thresholds, durations, multipliers) driving difficulty, scoring and pacing. Changing it needs no code change.
- **Telemetry:** first-party event data about play, used for difficulty tuning and success measurement.
