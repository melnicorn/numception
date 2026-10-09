---
title: Numception PRD
status: final
created: 2026-10-09
updated: 2026-10-09
---

# PRD: Numception
*Working title. The final name is undecided (see OQ-1).*

## 0. Document Purpose

This PRD defines what Numception must do for its first public release (v1), with the proof of concept (POC) as the first milestone. It is written for the product owner and for the downstream architecture, ticketing and build workflows.

It builds on existing work and does not repeat it:

- **UX:** `../ux-numception/` (DESIGN.md, EXPERIENCE.md, mockups). Those spines own visual and interaction detail. This PRD owns capabilities, scope and rules.
- **Brainstorm:** `../brainstorm-modes-stickiness-name/`, including the feature list by phase.
- **Research:**
  - `../research-arithmetic-difficulty-and-adaptive-scori/`
  - `../research-retention-in-math-puzzle-games/`
  - `../research-name-and-trademark/`
  - `../research-game-engine-selection/`
  - `../citation-check-2026-10-08.md`
- **Original brief:** `imports/original-brief.md`, kept for the record. Where it conflicts with later decisions, the later decisions win.

How to read it:

- Vocabulary is fixed by the §3 Glossary.
- Features are grouped, with globally numbered FRs nested under each one. Every FR carries a phase tag: **[POC]**, **[v1]** or **[Later]**.
- Assumptions are tagged inline and collected in §13.
- Technology choices and model formulas are in `addendum.md`.

## 1. Vision

Numception is a number puzzle where your answer becomes part of a bigger puzzle. Each puzzle is a shape filled with numbers. Find the one `a ∘ b = c` hidden among them and tap `c`. The puzzle collapses to that answer. That answer becomes one cell of a larger puzzle of the same shape, and the camera pulls out to show it. Solve that one and it becomes a cell of something larger still. That zoom, with the solve transition, is the defining moment, and the same joy repeats at every scale, "Powers of Ten" style.

The game can be picked up for 15 seconds or 15 minutes and put down without pressure. It opens straight into the next unsolved puzzle, saves every tap, and has no end screen. Two moods share one mechanic:

- **Zen:** paper and ink. No clock and no score. Each solve adds a light to the player's constellation.
- **Normal:** a neon arcade. Combo heat builds as the line glows brighter. A wrong tap is a "power cut" that kills the combo but never takes points away.

Difficulty adapts quietly to each player, so an 8-year-old and a daily-brain-game adult both stay in their sweet spot.

Numception sets itself apart in a category whose most common complaints are ads, upsells and "math that gates the game." In Numception, **the math is the game.** There are no ads, no pay-to-win, and no math used as a toll booth. The visual language is minimal: geometry is the HUD, and a solve is light moving through the structure. That language is closer to Monument Valley than to Candy Crush.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional (kid, about 6–10):** practise arithmetic in a way that feels like play, at a level that is never boring and never crushing.
- **Functional (adult):** a quick daily mental workout with a clear sense of getting sharper (times, accuracy, personal bests).
- **Emotional:**
  - Feel clever.
  - See something you built grow (the home tree, the constellation, the Pyramid).
  - Never feel stupid for a mistake.
- **Contextual:**
  - Fill 15 seconds in a queue, or 15 minutes at breakfast.
  - Resume exactly where you left off.
  - Play with no connection.
- **Social (adult, v1+):** challenge someone you know (a parent and child, friends) and compare a result.
- **Parental:** hand the device to a child knowing they can't chat with strangers, buy things or follow links out of the app.

### 2.2 Non-Users (v1)

- **Classrooms and teachers.** Teacher and smart-board mode is Later, so v1 is not marketed to schools.
- **Players looking for a curriculum-aligned learning product** with lessons, assessment or reports. Numception practises arithmetic but is a game first.
- **Competitive players who want real-time multiplayer.** Live duels are parked.
- **Pre-readers below roughly age 5.** Dot faces (v1) help, but onboarding assumes the player can read a short line or have it read aloud.

### 2.3 Key User Journeys

The protagonists match the personas in `../ux-numception/EXPERIENCE.md`. UJ-1 to UJ-4 mirror its Flows 1–4.

- **UJ-1. Miles (8) finds the second tier.** [POC]
  - **Persona and context:** Miles can add and subtract and is starting simple multiplication. A parent hands him the phone.
  - **Entry state:** first launch, Kid profile, Zen, Calm motion.
  - **Path:**
    1. The app opens straight into a triangle of numbers with one line: "Find the one that works."
    2. After 8 seconds, a hint appears: "Tap 11", with a ghost finger.
    3. He taps 11. The equation is narrated piece by piece.
    4. A guided wrong tap gets "Try another one", with no penalty.
    5. After a few guided rounds the guide says "Keep going." He plays Zen rounds, each in a new theme.
  - **Climax:** his first round collapse. The answers he found fly together into a bigger triangle with no words, and he realises the answers were the puzzle.
  - **Resolution:** after about 10 Zen rounds, "New: Fast mode" appears. He can try Normal or keep going in Zen.
  - **Edge case:** a wrong tap in Zen makes the number sink like a pebble and come back. Nothing is counted, and the next puzzle is quietly easier.
  - → FR-7, FR-9, FR-14, FR-18, FR-20, FR-23, FR-25, FR-26, FR-34, FR-41.

- **UJ-2. Don challenges his son Chris at breakfast.** [Later]
  - **Persona and context:** Don is an adult who does daily brain games with his coffee.
  - **Entry state:** Grown-up profile.
  - **Path:** Menu → Challenge → he plays a seeded round → he shares the seed link with Chris through the OS share sheet. The link carries puzzle content only. Chris plays it as a solo round and shares his time back by hand.
  - **Climax:** Don sees he won by 4 seconds.
  - **Resolution:** both have the round in their stats.
  - **Edge case:** in a Kid profile the Challenge entry does not exist.
  - → FR-5, FR-36.

- **UJ-3. Don's Normal session.** [POC]
  - **Persona and context:** Don plays one or two rounds before work.
  - **Entry state:** the app resumes mid-round in Normal, still in his Grown-up profile.
  - **Path:**
    1. The chain window drains around the shape's outline and refills on each solve.
    2. Combo heat climbs from 1x to 2x, and the lines glow wider.
    3. One wrong tap causes a power cut: the combo drops to 1x, no points are lost, and play continues.
    4. The round collapses, and the round-end flash shows his time, points and best combo.
  - **Climax:** he beats his best round time.
  - **Resolution:** he closes the app mid-round, and the next launch resumes exactly there.
  - → FR-9, FR-10, FR-15–FR-17, FR-19, FR-34.

- **UJ-4. A Tower round.** [POC]
  - **Persona and context:** Don, with a few spare minutes, n=3.
  - **Path:** 9 tier-1 puzzles collapse into 3 tier-2 puzzles, which collapse into 1 tier-3 puzzle. The camera pulls out further at each collapse.
  - **Climax:** the tier-3 solve, with the whole tower visible for a beat.
  - **Resolution:** a theme transition carries the player into the next round.
  - → FR-2, FR-11.

- **UJ-5. Miles keeps his streak and grows his tree.** [v1]
  - **Persona and context:** it's Miles's fourth day in a row. He has 2 minutes before school.
  - **Entry state:** the app opens to his home tree. It zooms out to show its scale, then glides to his next unsolved puzzle.
  - **Path:** he solves one puzzle. His streak light brightens as part of the structure, not as a number. He solves a few more and pushes a little of the fog back.
  - **Climax:** an operator glyph he has never seen (×) appears in an easy first puzzle (3×3=9), which is then narrated.
  - **Resolution:** he puts the phone down mid-tier. Nothing is lost, and nothing nags him to come back.
  - **Edge case:** if he missed yesterday and has an earned freeze, the streak survives quietly. If he has none, the streak restarts without any loss message.
  - → FR-7, FR-12, FR-24, FR-28, FR-29.

- **UJ-6. Don's daily seed.** [v1]
  - **Persona and context:** Don plays the Daily Seed at breakfast and posts his share card in a family chat.
  - **Path:** open the Daily Seed → play the fixed round → a share card shows his result coloured by speed → share it through the OS share sheet.
  - **Climax:** his card beats his sister's.
  - **Resolution:** tomorrow brings a new seed.
  - **Edge case:** in a Kid profile, the share card is image-only.
  - → FR-32, FR-33.

## 3. Glossary

- **Puzzle:** one shape containing `n` cells and one operator. Exactly one triple of cells satisfies `a ∘ b = c`. Solved by tapping `c`.
- **Cell:** one position in a puzzle that shows a number. In a higher-tier puzzle, each cell is the answer of a lower-tier puzzle.
- **n:** the number of cells per puzzle, 3 ≤ n ≤ 9. It is also the number of lower-tier puzzles that feed one higher-tier puzzle. Chosen per round by the adaptive engine unless the player sets a level pin.
- **Distractor:** a cell that is not part of the valid triple. There are `n − 3` per puzzle.
- **Operator:** +, −, ×, ÷. Further content arrives over time: fractions in v1, powers and roots Later.
- **Answer:** the `c` of a solved puzzle.
- **Tier:** the nesting level. Tier-1 puzzles contain numbers. A tier-k puzzle (k > 1) contains the answers of `n` tier-(k−1) puzzles.
- **Round:** a bounded set of puzzles that ends in one top puzzle.
  - **Classic round:** `n` tier-1 puzzles plus 1 tier-2 puzzle.
  - **Tower round:** a three-tier round. At n=3 it has 9 + 3 + 1 = 13 puzzles.
- **Pyramid:** the player's endless, resumable tree of tiers that keeps growing upward. Shown as the **home tree**, which is also the v1 home view. [v1]
- **Fog of war:** a visual that hides unbuilt Pyramid territory until the player builds toward it. [v1]
- **Landmark:** a named height marker (for example Eiffel Tower, Everest, edge of space) shown as the Pyramid grows. [v1]
- **Power grid:** the v1 visual wiring that carries power up the Pyramid. A partly powered puzzle is soft-lit, and full power lights it up and unlocks it.
- **Rapid Fire:** a mode with no nesting. Puzzles appear one at a time, and the first error ends the run. [v1]
- **Mode:** Zen or Normal. Modes change scoring, timing, feedback and palette, not the puzzle rules. "Fast mode" is player-facing copy for Normal. Kid and Grown-up are profiles, not modes.
- **Zen:** the calm mode. No clock and no score. Each solve adds a light to the constellation.
- **Normal:** the arcade mode. It has a chain window, combo, points and power cuts.
- **Solve transition:** the visual and audio beat when a puzzle collapses to its answer. It starts the instant the correct cell is tapped.
- **Round collapse:** the beat when solved lower-tier puzzles fuse into the cells of the next-tier puzzle, as the camera pulls out.
- **Combo:** in-round heat from consecutive fast solves in Normal (1x–2x). Shown as line glow and width, never as a number.
- **Overdrive:** the v1 Normal bonus when a full combo carries into the top puzzle of a round: double points on that puzzle and full fireworks.
- **Round time:** elapsed time from a round's first tier-1 puzzle to its top-puzzle solve. With the chain window, it is one of the two Normal timers.
- **Clean round:** a round with no wrong taps. Soft misses do not break it.
- **Chain window:** the Normal-mode time window, drawn on the shape outline, before the combo cools one step. Length setting: Standard, Relaxed (1.5×) or Off.
- **Power cut:** Normal-mode feedback for a wrong tap. The combo resets to 1x, and no points are lost.
- **Totem:** an earn-only Rapid Fire item that absorbs one error in a run.
- **Soft miss:** tapping the other valid cell in a − or ÷ puzzle, for example `b` where `a − c = b` also holds. Not counted as a wrong tap.
- **Daily streak:** the count of consecutive days on which the player solved at least one puzzle. [v1]
- **Streak freeze:** an earned (never bought) token that protects the daily streak for one missed day. [v1]
- **Constellation:** the Zen lifetime visual. Each solve adds a light.
- **Theme:** a complete visual look, filling a shared role grammar of surface, line, number, accent and so on.
- **Theme pack:** the unlock and collection unit: several themes plus their transitions.
- **Theme transition:** an animated change from one theme to the next between rounds. Tagged calm or intense.
- **Profile:** a local player identity, either Kid or Grown-up. Kid is the default on first launch. The active profile persists across launches.
- **Parent gate:** the check that must be passed to switch to the Grown-up profile, make purchases, follow external links, or open For grown-ups. It is an app PIN set by a grown-up. Where available, device authentication or platform parental controls can also be used.
- **Control surface:** the settings and navigation panel, opened by the always-visible menu button.
- **Seed:** a compact definition of puzzle content (numbers and operators) that reproduces a round. Layout is randomised at play time unless the seed is competitive.
- **Daily Seed:** one seed per day, shared by all players. [v1]
- **Rating:** an adaptive skill estimate. A **player rating** is per player and per operator. A **bucket rating** is per generator bucket.
- **Generator bucket:** a family of puzzles with the same difficulty features, for example "+ | two-digit | one carry | n=5 | 1 near-miss". Buckets, not single puzzles, carry ratings.
- **Mastery plateau:** the point where a player's rating for an operator has stabilised while they meet the mode's success target. Defined operationally in FR-22. It triggers new content.
- **Level pin:** a player setting that fixes `n`, the operator and/or the difficulty band instead of letting the adaptive engine choose.
- **Tuning configuration:** the versioned, data-only set of parameters (targets, weights, thresholds, durations, multipliers) that drive difficulty, scoring and pacing. Changing it needs no code change.
- **Ripple hint:** an easy-band assist. Each solved neighbouring puzzle fades one distractor in the current puzzle.
- **Telemetry:** first-party event data about play, used for difficulty tuning and success measurement.

## 4. Features

### 4.1 Puzzle Generation and Rules

**Description:** Every puzzle is generated, never hand-made. The generator picks a valid `a ∘ b = c` for the round's operator and fills `n − 3` distractors. It then confirms that no other triple of cells satisfies the operator. Because higher-tier puzzles are built from the player's lower-tier answers, the generator must plan the round top-down: the answers it hands to tier 1 must also form a puzzle with exactly one solution at the tier above. Difficulty comes from the adaptive engine (§4.5).

**Functional Requirements:**

#### FR-1: Unique-solution puzzle generation [POC]
The system can generate a puzzle for any `n` from 3 to 9 and any enabled operator, with exactly one triple satisfying `a ∘ b = c`.

**Consequences (testable):**
- For 100,000 generated puzzles of each `n` and operator, an independent checker finds exactly one valid triple in each.
- Every puzzle has exactly `n − 3` distractors, and cell placement is randomised.
- Numbers stay within the range set by the target difficulty. Negative numbers appear only when that content is enabled.
- Generation of a full round finishes fast enough that no loading state is ever shown between tiers. See NFR-1.

#### FR-2: Round-consistent multi-tier generation [POC]
The system can generate a Classic or Tower round in which the answers of each tier's puzzles form the cells of the next tier's puzzle, and that puzzle also has exactly one valid triple.

**Consequences (testable):**
- Every generated round passes the uniqueness check at every tier.
- The tier-2 (and tier-3) puzzle is fully determined before the player starts tier 1.

#### FR-3: Operators by phase [POC → v1]
The POC supports + and −. v1 adds × and ÷, unlocked through surprise-at-mastery (FR-24). [Later]: within-round operator mixing, a missing-operator mode, and powers and roots as surprise content.

**Consequences (testable):**
- A POC build has no code path that serves × or ÷ puzzles to players.
- In v1, ÷ puzzles always have whole-number answers unless fraction content is enabled.

#### FR-4: − and ÷ ambiguity handled as a soft miss [POC]
In − and ÷ puzzles, the player must tap the result `c`. Tapping the other cell that also reads as a valid result (`a − c = b`) is a soft miss: a pulse, a ghost arrow to `c`, and the line "Tap the answer" once. It is not counted as a wrong tap.

**Consequences (testable):**
- A soft miss does not trigger a power cut, does not lower the player rating, and keeps the combo the first time it happens in a round.
- [ASSUMPTION: a second soft miss in the same round also keeps the combo; see OQ-6.]

#### FR-5: Seeded generation [v1]
The system can reproduce a round's puzzle content (numbers and operators) from a seed and generator version.

**Consequences (testable):**
- The same seed and generator version produce identical numbers and operators on every platform.
- Seeds carry puzzle content only: no sender, identity, free text or tracking.
- [ASSUMPTION: competitive seeds (Daily Seed, challenges) also fix the layout so results are comparable; personal replays randomise it. See OQ-7.]

#### FR-6: Deterministic, versioned generator [POC]
Each generated puzzle records the generator version, difficulty-model version and tuning-configuration version that produced it. From the POC onward, the generator is deterministic: given a seed, a position in the tree, a difficulty and a generator version, it always produces the same puzzle. That one generator powers Classic and Tower rounds, the Pyramid, the Daily Seed and later seeded modes.

**Consequences (testable):**
- Every telemetry puzzle event includes all three versions.
- Regenerating any logged puzzle from its recorded inputs reproduces it exactly, on every platform.

#### FR-48: Fractions [v1]
The system can generate puzzles whose numbers include fractions, with complexity rising as the player's rating grows, still with exactly one valid triple.

**Consequences (testable):**
- Fraction puzzles pass the same 100,000-puzzle uniqueness check as FR-1.
- Fractions are shown in simplest form, and equal values never appear as two different cells.
- [ASSUMPTION: v1 fractions are limited to + and − with like denominators first, then unlike denominators. Fractions with × and ÷ are Later.]

**Notes:** dot faces (dice-style pips up to about 12) are a v1 representation option for young players (FR-31). Money and decimals are out of scope. Negative numbers are content the adaptive engine can enable. [ASSUMPTION: negatives arrive in v1 through surprise-at-mastery, after all four operators.]

### 4.2 Core Play Loop and Input

**Description:** The app opens straight into the next unsolved puzzle. There is no splash screen and no menu. One puzzle fills the frame. The player taps the answer cell, and the solve transition starts that frame. The puzzle collapses to its answer, and play moves to the next puzzle. When a tier is complete, a round collapse pulls the camera out and the answers become the next tier's cells. Every tap is saved, and the game resumes exactly where the player left off. Realises UJ-1, UJ-3, UJ-4.

**Functional Requirements:**

#### FR-7: Launch into play [POC]
The player lands in the next unsolved puzzle on every launch, with no menu or splash screen in between.

**Consequences (testable):**
- On a cold start, the first interactive frame is a puzzle (or, in v1, the home-tree glide that ends on a puzzle, per UJ-5).
- [v1] An opt-in "zoom out to see the tree" beat lasts no more than 3 s and can be skipped with a tap.

#### FR-8: Tap-to-solve input [POC]
The player solves a puzzle by tapping the answer cell. The whole cell polygon is the tap target.

**Consequences (testable):**
- A tap on an edge shared by two cells does nothing.
- Tapping a locked cell gives a gentle non-error acknowledgement.
- On web: click works as a tap; the arrow keys move focus between cells; Enter or Space taps; Esc opens the control surface; a focus ring is visible.
- Input during a transition: [ASSUMPTION: dropped, with no penalty; see OQ-9.]

#### FR-9: Solve transition and round collapse [POC]
A correct tap starts the solve transition that same frame, from the tap point where the transition supports it. When the last puzzle of a tier is solved, a round collapse turns the answers into the next tier's cells as the camera pulls out.

**Consequences (testable):**
- The first visible response to a tap appears within 100 ms (NFR-1).
- The first round collapse a player ever sees is long and slow, and later ones are shorter. [ASSUMPTION: starting values in the tuning configuration are at most 3 s for the first collapse and at most 1.2 s for later ones.]
- No guide text or narration appears during the first-ever round collapse or on the first-ever tier-2 puzzle. That discovery is wordless.
- There is no end screen, interstitial or loading screen between tiers or rounds.
- **Zoom as layout:** a tier-2 or higher puzzle is shown as an overview of its `n` cells, with unsolved cells glowing. The player zooms into one lower-tier puzzle at a time, and a solve zooms back out.
- Zoom velocity is capped and never accelerates, at every Motion setting.
- Where a cell has the same shape as the whole puzzle, the cell visibly becomes the next-tier puzzle. Otherwise it is shown contained in it.

#### FR-10: Save every tap and resume exactly [POC]
The system persists game state after every tap and resumes at the exact state on the next launch, including mid-tier and mid-round.

**Consequences (testable):**
- Killing the app at any moment and relaunching it restores the same puzzle, solved cells, tier and mode.
- An interrupted transition resumes at its end state.
- Save failures retry silently and never block play or show an error.
- Relaunching also restores the active profile (FR-34).
- Backgrounding pauses the chain window and round time, and blurs the board until the first tap.

### 4.3 Round Types

**Description:** The POC proves the core with two bounded round types. v1 adds the endless Pyramid, the original "fractal" idea from the brief, as the player's home, plus Rapid Fire as a short, intense alternative.

**Functional Requirements:**

#### FR-11: Classic and Tower rounds [POC]
The player can play Classic rounds (`n` tier-1 puzzles, then 1 tier-2 puzzle) and Tower rounds (three tiers; 13 puzzles at n=3). Realises UJ-4.

**Consequences (testable):**
- A Tower round at n=3 presents 9 tier-1, then 3 tier-2, then 1 tier-3 puzzle, with a round collapse after each tier.
- Finishing a round leads straight into the next round through a theme transition.

#### FR-49: Round-type entry points [v1]
The player can start any available round type (Pyramid, Classic, Tower, Rapid Fire, Daily Seed) from a Play entry on the control surface.

**Consequences (testable):**
- The Pyramid is the default on launch in v1. Classic and Tower stay selectable.
- Starting a different round type keeps the Pyramid's state untouched.
- [ASSUMPTION: the Play entry is a row on the control surface. Spatial menus are OQ-17.]

#### FR-12: Endless resumable Pyramid with home tree [v1]
The player can grow an endless Pyramid that keeps rising: to build each tier-k puzzle, they must first finish `n` tier-(k−1) puzzles. The Pyramid persists across sessions as the player's home tree. Realises UJ-5.

**Consequences (testable):**
- The Pyramid survives app restarts and updates without loss.
- The home view shows the tree's scale and a "puzzles built" count when zoomed out (for example "625 puzzles built this").
- Progress altitude shows landmarks as the tree grows.
- [v1] Fog of war hides unbuilt territory. In Zen, the fog lifts like mist at dawn.

#### FR-13: Rapid Fire [v1]
The player can play Rapid Fire: puzzles one at a time with no nesting, where the first error ends the run and a restart takes under 1 s.

**Consequences (testable):**
- The death-and-restart animation finishes in under 1 s.
- An earn-only "totem" can absorb one error per run. Totems are never sold.

### 4.4 Modes: Zen and Normal

**Description:** Both modes use the same rules and generator. **Zen** has no clock, no score and gentle errors, and aims at roughly 85–90% success. **Normal** adds the chain window, combo, points shown during transitions, and the power cut. It aims at roughly 75% success. Philosophy: slow and steady beats fast and error-prone, so a wrong tap never removes points. Every newcomer starts in Zen. Normal unlocks after the base tutorials. Realises UJ-1, UJ-3.

**Functional Requirements:**

#### FR-14: Zen mode [POC]
The player can play in Zen: no visible timer, no score, and each solve adds a light to their lifetime constellation.

**Consequences (testable):**
- No time, score, error count or rank is shown anywhere in Zen play.
- A wrong tap triggers the sinking-number response and a soft low tone. Nothing on screen counts it.
- After a wrong tap, the next puzzle's difficulty eases (FR-20).
- Zen draws only calm-tagged transitions.

#### FR-15: Normal mode scoring and combo [POC]
The player can play in Normal. Points are earned at each solve transition, scaled by puzzle difficulty and speed. Combo heat rises from 1x to 2x with consecutive solves inside the chain window.

**Consequences (testable):**
- Points appear only during transitions (the point stream) and in the round-end flash. There is no persistent score widget.
- Combo is shown only as line glow, width and bloom, never as a number.
- When the chain window empties, the combo cools one step and no points are lost.
- Points come from a formula in the tuning configuration that uses bucket difficulty, solve time against the puzzle's time limit `d`, and combo. `d` is derived from the bucket's expected solve time. The formula and the derivation of `d` are in addendum §A2.
- [ASSUMPTION: starting values are a 6 s Standard chain window and combo steps of 1x, 1.25x, 1.5x, 1.75x and 2x, all in the tuning configuration.]

#### FR-16: Power cut [POC]
A wrong tap in Normal resets the combo to 1x, removes no points, and never stops play.

**Consequences (testable):**
- The score total never goes down.
- Wrong taps within 700 ms of each other merge into one power cut.
- A power cut lasts no more than 500 ms.
- In the Kid profile, the power cut uses a softer cue: no red and no bass thud.

#### FR-17: Round-end flash [POC]
At the end of a Normal round, the player sees round time, points, best combo and whether it was a clean round. It fades as the next theme transition arrives and needs no input.

**Consequences (testable):**
- A round with only soft misses still shows as a clean round.

#### FR-18: Normal unlock [POC]
Normal becomes available after the base tutorials, about 10 Zen rounds, announced once as "New: Fast mode." The same unlock applies to the Kid profile.

**Consequences (testable):**
- Before the unlock, the Mode setting shows only Zen.
- After the unlock, the player can switch modes from the control surface at any time.

#### FR-19: Chain window setting [POC]
The player can set the chain window to Standard, Relaxed (1.5×) or Off. The Kid profile defaults to Relaxed.

#### FR-50: Overdrive [v1]
When a full (2x) combo carries into a round's top puzzle, Normal triggers Overdrive.

**Consequences (testable):**
- Overdrive doubles the points for the top puzzle and plays the full-fireworks transition (subject to the Motion setting).
- A power cut before the top puzzle is solved cancels Overdrive.

#### FR-51: Graded combo cooling [v1]
When the chain window empties, the combo drops one step instead of resetting.

**Consequences (testable):**
- Only a power cut resets the combo to 1x.

#### FR-52: Clean-round bonus [v1]
A clean round in Normal earns a bonus. [ASSUMPTION: in v1. The brainstorm left it undecided.]

**Consequences (testable):**
- The bonus value lives in the tuning configuration.
- Soft misses do not forfeit it.

### 4.5 Adaptive Difficulty and Ratings

**Description:** No levels are hand-made. Each generated puzzle gets a prior difficulty from a transparent, versioned feature model. The features include operand size, carries and borrows, operator, ties, multiplier tier, negatives, `n` and near-miss distractors. Play outcomes then calibrate ratings for players (per operator) and for generator buckets. Selection aims each player at the current mode's target success rate. The model and formulas are in `addendum.md` §A2.

**Functional Requirements:**

#### FR-20: Adaptive puzzle selection [POC: logging and prior; v1: full adaptation]
The system selects each next puzzle's difficulty to keep the player near the mode's target success rate (Zen about 85–90%, Normal about 75%).

**Consequences (testable):**
- POC: every puzzle has a prior difficulty from the feature model, and difficulty eases after a Zen error.
- v1: in a playtest of at least 20 players and at least 50 puzzles each, each player's success rate over their last 50 puzzles stays within ±7 points of the mode target. [ASSUMPTION: the tolerance is provisional and will be refit after the POC playtest.]
- A player who switches mode keeps their ratings. Only the target changes.
- The adaptive engine chooses `n`, the operator and the difficulty for each round from the player's success, starting at n=3 with +. A level pin (FR-47) overrides it.
- FR-20's ±7-point bound is a per-player acceptance bound. SM-7's ±5 points is a fleet-level health metric for the median player.

#### FR-21: Player and bucket ratings [POC]
The system maintains a rating per player per operator and a rating per generator bucket, updated after every answered puzzle.

**Consequences (testable):**
- Ratings persist on the device and survive app updates.
- A new bucket starts from its feature-model prior.
- Ratings update on correctness only. Whether speed should inform ratings is OQ-22.
- Players and buckets use separate K values from the tuning configuration.
- When the generator or difficulty-model version changes a bucket's definition, that bucket's rating resets to its prior.

#### FR-22: Mastery plateau detection [v1]
The system detects when a player has reached a mastery plateau on their current content, and uses that as the trigger for new content (FR-24).

**Consequences (testable):**
- [ASSUMPTION: a plateau is when the player's rating for an operator has changed by less than a threshold δ over their last 30 puzzles with that operator, while their success rate over those puzzles is at or above the mode target. Both N=30 and δ live in the tuning configuration.]
- New content is introduced at most once per session.
- Plateau detections, and whether the player then succeeds or struggles on the new content, are logged so the thresholds can be refit.

#### FR-47: Level pin [POC]
The player can pin `n`, the operator and/or the difficulty band from the control surface. Unpinning hands control back to the adaptive engine.

**Consequences (testable):**
- With a pin set, every new round uses the pinned values.
- Ratings keep updating while pinned.
- [ASSUMPTION: the level pin is available in both profiles.]

#### FR-53: Tuning configuration [POC]
All difficulty, scoring and pacing parameters live in a versioned tuning configuration, not in code. This covers success targets, feature weights, rating K values, mastery thresholds, combo steps, chain window lengths and transition durations. The team expects to retune often.

**Consequences (testable):**
- Changing any listed parameter needs no code change.
- The configuration version is recorded on every puzzle event (FR-6).
- [v1] A new configuration can ship without an app-store release, as data only (it never changes features; see NFR-6).
- [ASSUMPTION: in the POC a developer can switch configurations in a playtest build to compare tunings.]

### 4.6 Onboarding and Content Introduction

**Description:** The game teaches through play, never through menus. The first rounds are guided: a single guide line, a hint after 8 s, a ghost finger, the equation narrated after each solve, and a gentle wrong-tap line. The same pattern introduces new content later. New operators and packs arrive unannounced at a mastery plateau with a deliberately easy first puzzle and are explained afterwards ("discovery is the unlock"). There is no visible unlock tree. Realises UJ-1, UJ-5.

**Functional Requirements:**

#### FR-23: Guided first rounds [POC]
A first-time player gets 2–5 guided rounds: the guide line "Find the one that works", a hint ("Tap 11") with a ghost finger after 8 s or more without progress, equation narration on a correct tap, "Try another one" on a wrong tap with no penalty, and "Keep going" on exit.

**Consequences (testable):**
- No time pressure exists during guided rounds.
- Guide copy is at roughly an 8-year-old's reading level, one short line at a time, and can be replayed with a tap.
- Narration is also delivered through the accessible layer (aria-live or the platform equivalent).

#### FR-24: Surprise-at-mastery content introduction [v1]
When FR-22 detects a plateau, the system introduces the next content item (for example ×) as one puzzle with a never-seen glyph and a deliberately easy problem, followed by guided narration. Normal shows a grid glitch, then the resolve. Zen shows a new flower blooming.

**Consequences (testable):**
- No screen lists upcoming content, and no unlock tree is visible.
- The first puzzle using a new operator is in the easiest bucket for that operator.

### 4.7 Themes and Transitions

**Description:** "Levels should not all look the same." A theme system gives every round a new look, and a library of transitions carries the player between themes. Transitions start at the instant of the tap: "you shattered it, you caused the ripple." Themes are grouped into packs, which are the unit of collection and unlock. Six themes exist in the UX spine: three for Normal and three for Zen.

**Functional Requirements:**

#### FR-25: Theme per round [POC]
Each new round uses a different theme from the player's available set. Theme selection can be set to Randomize or Playlist.

**Consequences (testable):**
- Two consecutive rounds never share a theme while more than one theme is available.
- Every theme meets the contrast and colour-independence rules in NFR-4.

#### FR-26: Theme transitions [POC]
Each theme change plays a transition from a tagged library (calm or intense; starting on tap or after tap), filtered by mode and Motion setting.

**Consequences (testable):**
- Zen uses only calm transitions.
- No transition flashes more than 3 times per second, and a dark↔light change passes through a mid-luminance frame.
- **Motion levels:**
  - **Full** (the Grown-up default): every transition the mode allows. Intense transitions appear only at Full, and only in Normal.
  - **Calm** (the Kid default): calm transitions only in both modes, and slower zooms.
  - **Minimal:** zooms become cuts, transitions become crossfades of at least 400 ms, looping animation stops, and [v1] a static mini-map shows the player's position in the tree.

#### FR-27: Theme pack collection [v1]
The player collects theme packs through play. [ASSUMPTION: packs are earned through play milestones in v1; the paid unlock (FR-46) may include packs. The catalog and unlock path are open, see OQ-10.]

### 4.8 Progression and Retention

**Description:** Retention rests on a forgiving daily habit and on visible growth, not on pressure. Solving one puzzle extends the daily streak. Freezes are earned, never bought. The streak is shown as light in the structure, never as a loss threat. Growth is visible in the constellation (Zen), the home tree and its altitude (v1), and the "puzzles built" count. Realises UJ-5, UJ-6.

**Functional Requirements:**

#### FR-28: Forgiving daily streak [v1]
The daily streak extends when the player solves at least one puzzle in a calendar day (local time), in any mode or round type.

**Consequences (testable):**
- A single solved tier-1 puzzle is enough.
- A missed day with no freeze available resets the streak with no loss message, sound or animation.
- The streak is shown in the structure (for example as a light or glow) and is visible in stats.
- There are no streak wagers or similar mechanics where the player puts something at risk to win more.

#### FR-29: Streak freezes [v1]
The player earns streak freezes through play, and a freeze is used automatically on a missed day.

**Consequences (testable):**
- Freezes cannot be bought.
- [ASSUMPTION: a player can hold at most 2 freezes, earned at most 1 per 7 streak days.]

#### FR-30: Ripple hint [v1]
In easy difficulty bands, each solved neighbouring puzzle fades one distractor in the current puzzle.

**Consequences (testable):**
- At most 1 distractor is faded per puzzle in the easy band, and at most 2 in the very easy band. There are no ripple hints above easy.
- `a`, `b` and `c` are never faded.
- Band limits live in the tuning configuration.

#### FR-31: Dot faces [v1]
Young players can see numbers up to about 12 as dice-style dot faces. [ASSUMPTION: available as a Kid-profile setting and on by default for players whose rating is in the lowest band.]

**Consequences (testable):**
- Dot faces meet the same tap-target and contrast rules as numerals (NFR-4).

#### FR-54: Power grid [v1]
In the Pyramid, power visibly flows up the structure as puzzles are solved. A partly powered puzzle is soft-lit, and full power lights it up and unlocks it.

**Consequences (testable):**
- A higher-tier puzzle can only be entered once all `n` of its feeding puzzles are solved and it is fully powered.
- The power grid is never the only signal that a puzzle is unlocked (NFR-4).

**Notes:** the Zen constellation (FR-14) is POC. Landmarks, the "puzzles built" count (FR-12) and the power grid (FR-54) are v1. Crystals and keepsakes, the lightning strike, the "??? – N undiscovered" collection count, and greyed collection slots are Later. Greyed slots need a review for nudging kids before they are adopted (OQ-12).

### 4.9 Daily Seed and Sharing

**Description:** One seeded round per day for everyone, with a Wordle-style share card. Challenges between people the player knows are Later.

**Functional Requirements:**

#### FR-32: Daily Seed [v1]
Every player can play the same Daily Seed round each day. Realises UJ-6.

**Consequences (testable):**
- Two players on different platforms on the same date get identical puzzle content.
- The Daily Seed counts toward the daily streak.

#### FR-33: Share card [v1]
After the Daily Seed, the player can share a result card through the OS share sheet.

**Consequences (testable):**
- The Grown-up card can include a link that opens the same Daily Seed.
- The Kid-profile card is image-only: no link, name, identifier or attribution token.
- Incoming seed links open as solo play, with no reply option.

### 4.10 Profiles, Parent Gate and Child Safety

**Description:** Kids will play Numception, so it is safe by design without being a "kids' game." It ships with a general store listing, not the Apple Kids Category, so that adults don't mistake it for a children's app (see §9). Safety comes from what the product leaves out: no chat, no messaging, no usernames, no free text, no user-generated content, and no ads. Social features, purchases and outbound links are gated. The default profile is Kid. Switching to the Grown-up profile needs the parent gate. Realises UJ-1, UJ-2.

**Functional Requirements:**

#### FR-34: Kid and Grown-up profiles [POC]
The device has a Kid profile (the default) and a Grown-up profile, each with its own progress, ratings and stats.

**Consequences (testable):**
- First launch is always the Kid profile.
- The active profile is a persistent setting. A relaunch restores whichever profile was active and does not revert to Kid.
- A persistent cue (a ring on the menu button and the profile indicator) shows that the Grown-up profile is active.
- [ASSUMPTION: v1 supports multiple local Kid profiles on one device.]

#### FR-35: Parent gate [POC]
Switching Kid → Grown-up, opening For grown-ups, and (v1) purchases, external links and review prompts all require the parent gate. The gate is an app PIN that a grown-up sets, never an arithmetic or birth-year question. Device authentication or platform parental controls may be offered where available.

**Consequences (testable):**
- Switching Grown-up → Kid never requires the gate. On that switch, if no PIN exists yet, the grown-up is asked to set one.
- Once a PIN exists, Kid → Grown-up requires it.
- Before any PIN has been set, Kid → Grown-up is not gated. [ASSUMPTION: this is accepted for the POC.]
- [ASSUMPTION: a forgotten PIN can be reset through device authentication where available, and otherwise only through delete-all.]
- In the Kid profile, gated entries show "Ask a grown-up to open this."
- A review prompt never appears during play or transitions, and never in the Kid profile.

#### FR-55: Notifications [v1]
Push notifications exist only in the Grown-up profile, are opt-in and are off by default.

**Consequences (testable):**
- The Kid profile never requests a push token and never receives push, including streak reminders.
- Grown-up streak reminders, if enabled, never use loss language.

#### FR-36: Kid-profile social surface absent [v1]
In the Kid profile, the entries for challenges, leaderboards, platform sign-in and links do not exist (they are not merely disabled).

#### FR-37: No communication features [POC, permanent]
The product has no chat, messaging, usernames, free-text entry or user-generated content in any profile.

#### FR-38: For grown-ups [POC]
Behind the parent gate, a grown-up can see what data the app stores and where, delete all local data, and (v1) manage purchases.

**Consequences (testable):**
- Delete-all removes every profile, rating, stat and save from the device and returns the app to first-run state.

### 4.11 Stats

**Description:** Stats are per profile and reached from the control surface. The same data is captured for Kid and Grown-up profiles. Only the display differs: the Kid view only grows and stays positive, while the Grown-up view is rich.

**Functional Requirements:**

#### FR-39: Stats views [POC]
The player can open stats for their profile.

**Consequences (testable):**
- The Kid view shows only growth counts: puzzles solved, lights in the constellation, tiers reached, operators learned. It never shows times, accuracy, errors, ranks, comparisons or declines.
- The Grown-up view shows, over 7 days, 30 days and all time: best and average round time, accuracy, best combo, clean rounds, puzzles, rounds, average points, per-operator accuracy and median solve time, and the round-time trend.
- [v1] Both views show the daily streak and the Pyramid height.
- [v1] The Grown-up view adds a breakdown by round type (Classic, Tower, Pyramid, Rapid Fire best run, Daily Seed history) and by `n`.

### 4.12 Control Surface and Settings

**Description:** A menu button is always visible and opens a full-frame panel in one tap. Every setting uses one segmented-control pattern. The panel pauses play and blurs the board (FR-40) so the pause can't be used to study the puzzle.

**Functional Requirements:**

#### FR-40: Control surface [POC]
The player can open the control surface in one tap from any play state. It offers Mode, Level pin (FR-47), [v1] Play (FR-49), Motion (Full, Calm or Minimal), Chain window, Sound (Effects, Music and Haptics, each toggled separately), Themes (Randomize or Playlist), Stats, For grown-ups, and profile switching.

**Consequences (testable):**
- Opening the panel pauses the chain window and round time and blurs the board. Closing it returns to the exact puzzle state.
- The Kid profile defaults to Calm motion and the Relaxed chain window.
- The OS Reduce Motion setting maps to Minimal.

### 4.13 Sound and Haptics

**Description:** Sound effects and haptics give every beat physical feedback. Music is off by default, and its design is deferred. Sound and haptics are never the only feedback.

**Functional Requirements:**

#### FR-41: Sound and haptic feedback [POC]
The system plays a solve tone whose pitch steps down one note per tier, with a light haptic. Normal adds a rising combo build and a power-down on a power cut. Zen plays a soft low tone on a wrong tap. Transitions get a whoosh.

**Consequences (testable):**
- Effects default to on, and music defaults to off.
- On iOS, the app respects the mute switch exactly as native games do.
- Effects, music and haptics can each be toggled independently.

### 4.14 Platform Integration and Leaderboards

**Description:** Native integration makes the app feel like a real game on each platform. It also addresses App Store guideline 4.2, which can reject apps that look like repackaged websites. That is a risk because the app is built with web technology.

**Functional Requirements:**

#### FR-42: Leaderboards [v1, Grown-up only]
A Grown-up player can opt in to Game Center (iOS) or Play Games (Android) leaderboards. Personal bests come first. Pyramid height is the "bragging rights" board.

**Consequences (testable):**
- Leaderboards are never prompted, shown or reachable in the Kid profile.
- Global boards are opt-in.

#### FR-43: Native app behaviours [v1]
The iOS and Android apps provide haptics, full offline play, correct mute-switch behaviour, and platform leaderboards.

**Consequences (testable):**
- Every POC and v1 play feature works offline (NFR-2).

### 4.15 Telemetry and Success Measurement

**Description:** The team must be able to measure whether Numception works: whether players come back, whether difficulty hits its targets, and whether the feature model predicts real difficulty. Telemetry is first-party and covers both profiles. Kid safety comes from product design (§4.10), not from turning off measurement. [NOTE FOR PM: the user decided this on 2026-10-09 and does not want it reopened for a while. It is revisited only if legal review before public launch finds a blocker (§9, OQ-3).]

**Functional Requirements:**

#### FR-44: Puzzle event logging [POC]
The system records, for every answered puzzle: the puzzle's features, generator and model versions, bucket, mode, profile type, the cell tapped, correctness (including soft miss), and response time.

**Consequences (testable):**
- POC: events are stored on the device and can be exported by the team for playtest analysis. [ASSUMPTION: export happens through a developer-only path, not a player-facing feature.]

#### FR-45: Telemetry upload [v1]
The system sends play and retention events to a first-party telemetry endpoint so the team can measure the §7 success metrics.

**Consequences (testable):**
- Events carry no name, contact, free text or precise location.
- Telemetry failures never affect play.
- Third-party advertising SDKs are never included. [ASSUMPTION: third-party analytics or crash-reporting services may be used if they are contracted as processors and not for advertising; see OQ-3.]

### 4.16 Monetization [v1, design deferred]

**Description:** The eventual model is a single one-time purchase (about $2–5) that unlocks extra content. There are no ads, no subscriptions, no consumable purchases, no currencies and no loot boxes. The POC contains no paywall code. What is free versus paid is undecided and is not a current focus.

**Functional Requirements:**

#### FR-46: One-time unlock [v1]
A Grown-up can make one purchase, behind the parent gate, that unlocks extra content.

**Consequences (testable):**
- The purchase is never prompted during play or transitions.
- Nothing that affects puzzle difficulty, score or rating can be bought.
- Earn-only items (streak freezes, totems) can never be bought.

## 5. Non-Goals (Explicit)

- No ads of any kind, in any mode or profile.
- No pay-to-win: no currencies, loot boxes, consumable purchases, or paid status or cosmetics.
- No chat, messaging, usernames, free text or user-generated content, ever.
- No hand-authored level packs. All puzzles are generated.
- Not a curriculum, assessment or classroom product in v1.
- No accounts and no cloud sync in v1. Progress lives on the device.
- No real-time multiplayer.
- No `n > 9`, no cube or 3D shapes, and no money or decimals.
- No math used as a gate: every interaction is the puzzle itself.
- No end screens, interstitials or loading screens between tiers.

## 6. MVP Scope

### 6.1 Milestones

**POC: a nice-looking, nice-playing core, in front of a few people.** No dates; it is gated on quality, not time.

- Classic and Tower rounds with the zoom, solve transition and round collapse (FR-1, FR-2, FR-7 to FR-11)
- The + and − operators, the generator with uniqueness checking, and the soft miss (FR-3, FR-4)
- Deterministic, versioned generator, level pin and tuning configuration (FR-6, FR-47, FR-53)
- Zen and Normal, with the power cut, round-end flash and Normal unlock (FR-14 to FR-19)
- Difficulty prior, ratings, Zen easing, and puzzle event logging (FR-20 POC part, FR-21, FR-44)
- Guided onboarding (FR-23)
- Theme per round and transitions, using the six spine themes (FR-25, FR-26)
- Kid and Grown-up profiles, the parent gate, For grown-ups, and stats (FR-34, FR-35, FR-37 to FR-39)
- Control surface, sound and haptics (FR-40, FR-41)
- Offline play and save-every-tap (FR-10)
- The renderer prototype runs **before** POC architecture is locked (addendum §A1). [NOTE FOR PM: the prototype must include the tier zoom, not just glow and particles. If it misses NFR-1, first cut effect density to hold 60 fps. If the zoom itself can't hold 60 fps, reopen the engine choice.]

**v1: public launch on iOS, Android and web.**

- All four operators, with surprise-at-mastery (FR-3, FR-22, FR-24)
- Seeded generation (FR-5)
- Full adaptive selection (FR-20)
- Endless Pyramid and home tree, with fog of war, landmarks and the power grid (FR-12, FR-54)
- Round-type entry points (FR-49)
- Rapid Fire and totems (FR-13)
- Daily streak, freezes and ripple hints (FR-28 to FR-30)
- Dot faces and fractions (FR-31, FR-48)
- Daily Seed and share card (FR-32, FR-33)
- Theme pack collection (FR-27)
- Grown-up leaderboards and native behaviours (FR-42, FR-43)
- Kid-profile social surface absent, and notification rules (FR-36, FR-55)
- Telemetry upload (FR-45)
- One-time unlock (FR-46)
- Overdrive, graded cooling and the clean bonus (FR-50 to FR-52)

### 6.2 Out of Scope for v1 (Later or Parked)

- **Later:**
  - ghost-duel challenges (UJ-2)
  - tunnel and bracket races
  - Operator Sudoku (the missing-operator mode)
  - Descent (top-down) mode
  - teacher and smart-board mode
  - player-built rounds
  - the Library of Babel / Atlas
  - unit packs
  - powers and roots
  - crystals and keepsakes
  - the lightning strike
  - collection slots (pending OQ-12)
  - platform age signals (Declared Age Range, Play Age Signals)
- **Parked:**
  - interlocking shapes
  - mixed representations
  - visual fractions
  - drifting tiles
  - live real-time duels
  - shapes that change per level
- **Music:** the reserved slot only. [NOTE FOR PM: the original brief asked for "calm music" in Zen. It is deferred because "music is the hard part"; revisit it for v1 if playtests say Zen feels empty.]

## 7. Success Metrics

### 7.1 POC (playtest, small group)

Measured by observation, short interviews and the exported event logs (FR-44).

- **SM-1: "I want to keep playing."** At least 80% of playtesters (minimum 5) keep playing past 10 minutes unprompted, or ask to play again. Validates FR-9, FR-11, FR-14, FR-15.
- **SM-2: The core moment lands.** At least 80% of playtesters show a visible reaction (comment, smile, "oh!") at their first round collapse, and can explain unprompted that answers become the next puzzle. Validates FR-9, UJ-1.
- **SM-3: Onboarding without help.** At least 80% of first-time players aged 7–10 (minimum 5) solve their first non-guided round without adult help. Validates FR-23.
- **SM-4: Smooth.** A steady 60 fps during play and transitions on the reference devices (NFR-1). Validates FR-9, FR-26.

### 7.2 v1 Primary

- **SM-5: Day-1, day-7 and day-28 retention**, by mode and profile. [ASSUMPTION: targets are D1 ≥ 30%, D7 ≥ 12%, D28 ≥ 5%, set above the all-mobile median and around the low-confidence puzzle-genre benchmarks. They will be refit once the 2026 GameAnalytics puzzle data is pulled. The D7 figure leans on a disputed vendor benchmark, and 75% of mobile games sit below 3% D28, so these are ambitious.] Validates FR-12, FR-28.
- **SM-6: Streak survival:** the share of players with a daily streak of 7 or more days on day 14. [ASSUMPTION: baseline set from the first 4 weeks after launch; the target is set then.] Validates FR-28, FR-29.

### 7.3 v1 Secondary

- **SM-7: Success rate versus target:** median per-player success rate within ±5 points of each mode's target. This is the fleet-level view; FR-20's ±7 points is the per-player bound. Validates FR-20.
- **SM-8: Difficulty model fit:** the share of variance in bucket ratings explained by the feature prior, tracked over time. [ASSUMPTION: no target until POC data exists.] Validates FR-20, FR-21.
- **SM-9: Normal adoption:** the share of players who try Normal within 7 days of unlocking it. [ASSUMPTION: baseline from the first 4 weeks after launch; no target before then.] Validates FR-18.

### 7.4 Counter-Metrics (Do Not Optimise)

- **SM-C1: Kid session length.** Do not push it up. Longer kid sessions are not a goal, and any mechanic that raises them by pressure is out. Counterbalances SM-5.
- **SM-C2: Streak-loss distress.** Watch for signs that players feel punished by losing a streak, such as reviews or playtest comments. Streak survival must not be raised by adding threats. Counterbalances SM-6.
- **SM-C3: Zen error-driven churn.** A player who quits right after Zen errors means difficulty is too high. Never improve SM-7 by making Normal harder for players already in a groove. Counterbalances SM-7.
- **SM-C4: Easy-mode stagnation.** Easier play is played longer but teaches slower. Watch for player ratings that stay flat while sessions climb. Counterbalances SM-5 and SM-7.

## 8. Cross-Cutting NFRs

- **NFR-1 Performance:**
  - A steady 60 fps for play, transitions and particles on the reference devices. [ASSUMPTION: the reference devices are a Samsung Galaxy A35-class Android phone and an iPhone 13.]
  - Generating a full round takes no more than 50 ms on the reference devices. [ASSUMPTION]
  - Tap to first visible response within 100 ms.
  - No loading states between tiers or rounds, and no visible freeze on launch. (A reference PixiJS + Capacitor game showed an 8.5 s load freeze; see addendum §A1.)
  - [ASSUMPTION: an initial web download of no more than 5 MB gzipped. No target was set upstream.]
- **NFR-2 Offline and persistence:**
  - Every POC and v1 play feature works offline, with no offline banner.
  - Saves are atomic and survive crashes and updates.
  - The save format is versioned with forward migration.
- **NFR-3 Reliability:** no crash or save corruption loses Pyramid or streak progress. [ASSUMPTION: crash-free sessions of at least 99.5% at v1.]
- **NFR-4 Accessibility.** Target: WCAG 2.2 AA on the DOM surfaces, and the equivalent rules on the canvas.
  - **Contrast:** numbers and operators at least 4.5:1; lines, controls, focus, timer and combo at least 3:1.
  - **Colour:** no state shown by colour alone. Every theme gets a deutan and protan check.
  - **Flashing:** no more than 3 flashes per second from all sources combined.
  - **Motion:** a Full, Calm or Minimal setting, mapped from OS Reduce Motion.
  - **Time:** no time pressure in Zen or onboarding, and a chain window setting for Normal.
  - **Screen readers:** a parallel accessible tree, so each cell is a button named by its number and the operator is announced.
  - **Keyboard:** full keyboard play on web.
  - **Text size:** OS text size honoured up to 200% on the DOM surfaces.
  - **Tap targets:** at least 48 pt for all cells, at least 56 pt for Kid-profile puzzle cells.
  - Detail lives in `../ux-numception/DESIGN.md` and `EXPERIENCE.md`.
- **NFR-5 Platform parity:** one codebase serves iOS (phone and tablet), Android and web, including mobile web. Phone portrait is the design anchor, and tablet and web adapt from it. Puzzle content, seeds, ratings and scoring are identical across platforms.
- **NFR-6 Store compliance:**
  - Meets App Store guideline 4.2 (minimum functionality: the app must offer lasting value as an app, not a repackaged website) through FR-43.
  - Meets App Store guideline 2.5.2: no downloaded code that changes features. Tuning-configuration updates (FR-53) are data only.
  - Store titles are no longer than 30 characters.

## 9. Constraints and Guardrails

### 9.1 Child Safety and Privacy

- **Listing:** a general store listing, not the Apple Kids Category, so adults don't mistake it for a kids-only game. [ASSUMPTION: Google Play target audience declared as mixed, including under-13.] Not final: see OQ-2.
- **Posture:** kids are expected players. The product is safe by design through the absence of communication features, gated social features, gated purchases and links, a Kid default profile, and no ads.
- **Data:** first-party telemetry covers both profiles (FR-44, FR-45). Kid and Grown-up stats capture the same data. No personal contact data, free text or precise location is collected. No camera, microphone, contacts or ad-tracking permission prompts.
- **Web:** strictly necessary cookies only, and self-hosted fonts and assets with no third-party CDN calls at runtime. Any web analytics follows FR-45.
- **Risk:** COPPA, GDPR-K, the UK Children's Code (AADC) and Google Play Families rules may treat persistent identifiers and telemetry from under-13 users as personal data that needs parental consent. **Legal review is required before public launch (not before the POC).** [NOTE FOR PM: the user has accepted this risk deliberately (memlog, 2026-10-09). If the review finds a blocker, the likeliest mitigations, in order, are: aggregate-only telemetry for Kid profiles, consent through the parent gate, or treating Zen in the Kid profile as the strictly protected surface.]

### 9.2 Intellectual Property and Naming

- No use of "Kakooma" or confusingly similar names in the product, store metadata, code or assets. All art, text and presentation is original.
- The final name must pass the clearance checklist before launch and before money is spent on branding. The checklist is in `../research-name-and-trademark/`: USPTO classes 9, 28 and 41; WIPO; store searches; domains; social handles; an attorney knockout search.
- Check for a Tang patent on the puzzle format before launch.

### 9.3 Cost

- The free, open-source rendering stack recommended upstream keeps licensing cost at zero. [ASSUMPTION: the v1 telemetry backend runs at hobby-scale cost.]

## 10. Aesthetic and Tone

- **Design test:** does it express a solve as light moving through the structure?
- **Geometry is the HUD:** no persistent score or timer widgets, mascots, badges, coins or progress bars. Time is a line tracing the shape.
- **Numbers are the only text in play.** Words appear only in onboarding, the control surface and stats. Copy is short, calm, present tense and about an 8-year-old's reading level. No exclamation marks, urgency or loss threats. Never "Wrong!"
- **Normal:** a black void, one neon that heats with combo, red only on a power cut. In the spirit of Tron and Infinitode 2.
- **Zen:** paper and one ink; slow and quiet. In the spirit of Monument Valley and Journey.
- **Anti-references:** Candy Crush and Royal Kingdom gloss; Prodigy's math-as-toll-booth; coins, chests and reward screens.

## 11. Platform

- **POC:** web build at phone viewport plus real-phone checks. [ASSUMPTION, carried from the UX spine.]
- **v1:** iOS (phone and tablet), Android, and web/mobile web, from one codebase, released worldwide.
- **Orientation:** portrait-first on phone. Phone landscape is undecided (OQ-14). Web supports landscape.
- The technology choice (web-first TypeScript, Phaser 4 or PixiJS v8, wrapped with Capacitor) is in `addendum.md` §A1, pending the renderer prototype.

## 12. Open Questions

Owners: **PO** = product owner, **UX** = UX workflow, **Arch** = architecture workflow. "Blocks" is the earliest milestone that can't finish without an answer.

1. **OQ-1 Name:** final name. Shortlist: Sumspire, Infinum, Numsummit, Summara, Summalux. "Numception" itself has had no clearance check. *Owner: PO. Blocks: v1.*
2. **OQ-2 Store listing:** general listing is the current lean, but it is not final. Confirm the Play target-audience declaration. *Owner: PO. Blocks: v1.*
3. **OQ-3 Privacy legal review** (before public launch): COPPA, GDPR-K, the UK Children's Code and Play Families, given kid telemetry and platform IDs. Revisit only if the review finds a blocker; otherwise the decision stays closed. *Owner: PO. Blocks: v1.*
4. **OQ-4 Seeds and the endless Pyramid:** how to generate the Pyramid upward forever (each new top must contain the existing top's answer) on the deterministic generator (FR-6). *Owner: Arch. Blocks: v1, but the generator's interface must allow it from the POC.*
5. **OQ-5 Elo noise under adaptive selection:** read the 2025 papers before architecture is final. They could change the rating design. *Owner: Arch. Blocks: POC architecture.*
6. **OQ-6 Second soft miss** in a round: does it still keep the combo? Default: yes (FR-4). *Owner: UX. Blocks: v1.*
7. **OQ-7 Competitive seed layout:** is the layout fixed by the seed for the Daily Seed and challenges? Default: yes (FR-5). *Owner: PO. Blocks: v1.*
8. **OQ-8 Zoom gesture:** tap-to-enter or pinch? Does the player choose which tier-1 puzzle to enter? [ASSUMPTION: POC default is tap-to-enter, with the next unsolved puzzle entered automatically after a solve. The player may tap any unsolved cell in the overview.] *Owner: UX. Blocks: POC (default set).*
9. **OQ-9 Input during transitions:** queue, drop or skip? Default: drop (FR-8). *Owner: UX. Blocks: POC (default set).*
10. **OQ-10 Theme packs:** catalog, starter pack, unlock path (earned or paid), and whether themes are tied to a mode. *Owner: PO + UX. Blocks: v1.*
11. **OQ-11 Shapes:** final shapes for n=7 (7A or 7B) and n=9 (9B or 9C); the n=4 diamond ratio; three-digit numerals at n=9 on small phones. [ASSUMPTION: POC ships the primary candidates (7A, 9B, 1:1.25) and decides in the POC playtest.] *Owner: UX. Blocks: POC (default set).*
12. **OQ-12 Nudges for kids:** a "nice place to stop" beat; whether undiscovered-content counts and greyed slots are acceptable in the Kid profile. *Owner: PO + UX. Blocks: v1.*
13. **OQ-13 Monetization split:** what is free and what is paid. Deferred until after the POC. *Owner: PO. Blocks: v1.*
14. **OQ-14 Layout:** phone landscape; tablet and web breakpoints. *Owner: UX. Blocks: v1.*
15. **OQ-15 Hidden-timer scoring in Zen:** should speed count silently toward the Zen rating? *Owner: Arch. Blocks: v1.*
16. **OQ-16 Daily Seed difficulty:** one difficulty curve for everyone (comparable, but not adaptive), per-band seeds (for example Kid and Grown-up), or the same seed scaled by difficulty? *Owner: PO. Blocks: v1.*
17. **OQ-17 Spatial menus:** zoom out past the home tree to reach settings, collection and modes as shapes, in addition to the control surface. v1 or Later? *Owner: UX. Blocks: v1.*
18. **OQ-18 Backup and restore:** with no accounts, how do players keep Pyramid and streak progress across a device change (platform backup, export code, or nothing)? *Owner: PO + Arch. Blocks: v1.*
19. **OQ-19 Visible skill growth:** should players see any level, rank or rating ("leveling up" from the brief), or only indirect growth (Pyramid height, landmarks, stats)? *Owner: PO. Blocks: v1.*
20. **OQ-20 Home-view text:** "625 puzzles built" and landmark names conflict with "numbers are the only text in play". Make an exception, as onboarding has, or go numbers only? *Owner: UX. Blocks: v1.*
21. **OQ-21 Rapid Fire in Zen:** "first error ends the run" doesn't fit Zen. Is Rapid Fire Normal-only? *Owner: PO. Blocks: v1.*
22. **OQ-22 Speed-informed ratings:** should ratings use speed as well as correctness (Maris & van der Maas 2012)? Default: correctness only (FR-21). *Owner: Arch. Blocks: v1.*

**Hand-off:** 13 items in the UX spine now contradict PRD decisions. Examples: "no daily streak", "Stored on this device only", no Kid variant of the power cut, and the cold-start revert. They are listed in `reconcile-ux.md` under "UX docs to update". *Owner: PO, through a `bmad-ux` update. Blocks: v1 UX work.*

## 13. Assumptions Index

- §4.1 FR-4: a second soft miss keeps the combo.
- §4.1 FR-5: competitive seeds fix the layout; personal replays randomise it.
- §4.1 FR-48: v1 fractions start with + and − (like, then unlike denominators); × and ÷ fractions are Later.
- §4.1 Notes: negatives arrive in v1 through surprise-at-mastery, after all four operators.
- §4.2 FR-8: taps during transitions are dropped.
- §4.2 FR-9: first collapse at most 3 s, later ones at most 1.2 s (starting values).
- §4.3 FR-49: the Play entry is a control-surface row.
- §4.4 FR-15: 6 s Standard chain window; combo steps 1x/1.25x/1.5x/1.75x/2x.
- §4.4 FR-52: the clean bonus is in v1.
- §4.5 FR-20: a ±7-point per-player success-rate tolerance (provisional).
- §4.5 FR-22: plateau = rating change below δ over the last 30 puzzles while at or above target.
- §4.5 FR-47: the level pin is available in both profiles.
- §4.5 FR-53: developers can switch tuning configurations in POC playtest builds.
- §4.7 FR-27: packs are earned through play milestones; the paid unlock may include packs.
- §4.8 FR-29: at most 2 freezes, earned at most 1 per 7 streak days.
- §4.8 FR-31: dot faces on by default for the lowest rating band.
- §4.10 FR-34: multiple local Kid profiles in v1.
- §4.10 FR-35: Kid → Grown-up is ungated until a PIN is set (accepted for the POC); a forgotten PIN is reset through device authentication or delete-all.
- §4.15 FR-44: POC event export is developer-only.
- §4.15 FR-45: third-party analytics or crash services are allowed if contracted as processors, never for ads.
- §7 SM-5: retention targets D1 ≥ 30%, D7 ≥ 12%, D28 ≥ 5%.
- §7 SM-6, SM-9: targets set from a 4-week post-launch baseline.
- §7 SM-8: no model-fit target until POC data exists.
- §8 NFR-1: reference devices are a Galaxy A35-class phone and an iPhone 13; round generation within 50 ms; web initial download of no more than 5 MB gzipped.
- §8 NFR-3: crash-free sessions of at least 99.5%.
- §9.1: Google Play target audience declared as mixed.
- §9.3: hobby-scale telemetry backend cost.
- §11: POC tested on web at phone viewport plus real phones.
- §12 OQ-8: POC is tap-to-enter, with automatic advance to the next unsolved puzzle.
- §12 OQ-11: POC ships shapes 7A and 9B and the 1:1.25 diamond, decided at playtest.
