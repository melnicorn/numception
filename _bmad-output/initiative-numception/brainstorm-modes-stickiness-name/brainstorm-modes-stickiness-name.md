---
type: brainstorm-intent
title: Numception: modes, stickiness, name
working_title: Numception
date: 2026-10-08
source: .memlog.md
---

# Numception: Brainstorm Intent

Goal: a fun POC that can grow into an iOS/Android/web game with a calm Zen mode and a neon arcade Normal mode.
Naming: the working title is Numception. Do not call this project Kakooma (that name is trademarked).

## Core
- The defining idea is the **inception zoom plus the solve transition**. Every puzzle has the same shape, built either from numbers or from smaller puzzles of the same shape. When a piece is solved, it becomes one cell of the parent puzzle, and the camera zooms out to show it (Powers of Ten style). The joy is the same at every scale.
- The transition style is open. Do not lock into "fold".
- One idea at every scale: each solve changes the light of a self-similar structure. Combo glow, power circuit, fog reveal, wrong-tap power cut, surprise glitch and climb/pyramid are all this one idea.
- **Design test:** does it express a solve as light moving through the structure?
- Two engines carry everything, and the POC must build both:
  1. A generator plus uniqueness checker. It powers seeds, daily, ghosts, teacher mode, operator mode and top-down play.
  2. A rating model. It powers adaptive difficulty, the Zen and Normal targets, and surprise-at-mastery.
- State is shown as light, so Zen and Normal differ mostly in palette and intensity. That keeps two modes cheap to build.

## Design principles
- The app opens straight into the next unsolved puzzle. There are no menus on launch, and the game saves after every tap.
- It can be picked up for 15 seconds or 15 minutes and put down with no pressure. The smallest unit, a tier-1 puzzle of about 10 seconds, always counts.
- Failure is seamless (Super Meat Boy style). Restart takes under 1 second, there are no loading screens between tiers, and a broken combo never stops play.
- It feels infinite by default. There is no end screen, and the next round assembles at the edge of view.
- **Geometry is the HUD.** There are no persistent score or timer widgets. Time is shown as a line tracing the shape's outline. Points appear only during the transition.
- Palettes are strict:
  - Normal: black, plus one neon colour that shifts with the combo, plus error red.
  - Zen: paper, plus one ink colour.
  - Numbers are the only text, in one geometric typeface.
- Menus are spatial: zoom out past your tree to reach settings, collection and modes as shapes. There must also be a **single-tap shortcut** to the control surface for game-wide settings.
- Aesthetic: a minimal UI driven by lines and shapes. References: Monument Valley, Infinitode 2, Journey. Not Candy Crush or Royal Kingdom.
- Mobile layout uses a flat 3x3 for tier 1 and tier 2, with no cube and no n>9. Tier 2 is an overview of n glowing cells, and the player zooms into one tier-1 puzzle at a time.

## Mode rules
**Normal**
- Points are awarded at the moment of the solve transition. They flow visibly into the session total, then into the lifetime total, and are bigger and brighter for harder pieces.
- Speed points come with a growing combo multiplier (1x, 1.2x … 2x) for consecutive fast solves. The multiplier is shown as glow intensity, not a number: lines thicken, brighten and spark.
- A wrong tap kills the combo entirely but costs no points. It is shown as a power cut: the glow dies, lines flicker dark, a dark red flash and pulse play, the background fades, a bass power-down sounds, and play reboots at a dim 1x.
- Philosophy: slow and steady beats fast and error-prone.

**Zen**
- There are no points and no timer. Each solve drops a light into a lifetime constellation or garden.
- A wrong tap is gentle. It reacts but never dominates or rubs it in. For example, the number sinks like a pebble with a soft low tone. Errors are never counted on screen, and difficulty quietly eases.

## Phase plan (accepted by the user)
**POC:**
- A classic round and a tower round (a 3-tier bounded mini-pyramid; n=3 gives 9+3+1=13 puzzles), with the zoom and transition at the centre.
- Both Zen and Normal modes.
- A generator for + and − with uniqueness checking.
- Rating logs.

Note: the memlog records the v1 / Later / Parked plan as "accepted as proposed" but does not list which item went where. The groupings below are inferred and need confirming.

**v1 / Later candidates:**
- Pyramid / endless tree mode, with a home view that zooms out to show scale and then glides to the next unsolved puzzle.
- Fog of war: a solve reveals its neighbours. In Zen this looks like mist lifting.
- A power-circuit motif: a puzzle on partial power is soft-lit in another colour; full power lights it up and unlocks it.
- Lightning strike down the tree when the top level is completed (Normal). The Zen equivalent is a growing tree or river delta.
- A climb/altitude motif with real landmarks (Eiffel Tower, Everest, the Moon).
- Audio pitch steps down one note per tier, so the player can hear how deep they are.
- Surprise-at-mastery content.
- Fraction, dot-face and unit packs.
- An easy-mode hint budget.
- Daily Seed: a shared leaderboard and a Wordle-style result card.
- Ghost duels on seeded rounds.
- Rapid Fire mode with earn-only totems.
- Operator-tile mode ("Operator Sudoku").
- Top-down reverse mode.
- Teacher mode and smart-board team play.
- Library of Babel / Atlas seed discovery and rare-seed specimens.
- Completed subtrees kept as crystals or keepsakes.
- A collection that shows a count of undiscovered items ("??? - 4 undiscovered").

## Content & difficulty
- **Operators:** + and − first. Later, ×, ÷, square roots and powers arrive through surprises.
- **Operator-tile mode:** placed operators, with sudoku-style elimination based on tier-2 uniqueness. The game never says "wrong". Instead the player sees the proposed tier-2 puzzle and judges whether it is valid. A "No solution" declaration is a valid scored move.
- **Fractions:** definitely in, with escalating complexity such as mixed denominators. Decimals and money are not wanted for now.
- **Dot faces for pre-readers:** dice-style faces showing values up to about 12, with subitizing-friendly layouts. These are not literal dominoes.
- **Units packs (cooking):** for example, 2 Tbsp + 1 fl oz = 1/4 cup.
- **Surprise-at-mastery replaces any level or unlock tree:**
  - There is no visible tree. New content arrives unannounced as a piece with a never-seen glyph, triggered at a mastery plateau detected from the ratings.
  - The first encounter is deliberately easy (3^2=9).
  - Presentation: Normal shows a grid glitch that then resolves; Zen shows a new flower blooming.
- **Hint budget (easy modes only):**
  - A ripple hint fades one distractor per solved neighbour.
  - The number of fades is capped per puzzle regardless of neighbour count: k=1 for easy, k=2 for very easy.
  - a, b and c are never faded.

## Business
- A flat one-time purchase of $2–5.
- No ads, no IAP and no pay-to-win.
- Totems can only be earned, never bought.

## Open questions
- **How far can seeds go?** The sketch is puzzle = f(rootSeed, treePath, difficulty, generatorVersion).
  - Competitive seeded play uses a fixed difficulty curve.
  - Personal play is adaptive but stays replayable by logging the difficulty at each node.
  - Unresolved: the conflict with adaptive difficulty, and generating the pyramid upward forever (each new top level must contain the existing top level's answer).
- **Pencil marks in operator mode:** showing a count of valid triples for each ghost operator. Unsure; needs testing.
- **Clean bonus:** a separate mark for a zero-error round. It was proposed and not decided.
- **Shapes changing per level** (for example, a triangle of pentagons): does it break inception or enrich it? Not decided.
- **Name:** still to be decided. Shortlist: Sumspire, Infinum, Numsummit, Summara, Summalux. "Innumerable" is a possible tagline. Latin *summa* means both "sum" and "highest point", so these names work for maths and for the climb. The user rejected the "ryse" spelling.

## Rejected / Parked
- **Rejected:**
  - Neighbour effects: solved c becoming a tile in a neighbour, neighbour pressure (shuffle, tick, decoy), and a solve-order pattern bonus.
  - Reverse tap as a mode (at most a young-kid assist).
  - Par time or par taps.
  - A cube or giant n (n>9).
  - Literal dominoes.
  - Money and decimals, for now.
  - Split-screen duel (doubtful).
  - Names: Sumryse.
- **Parked:**
  - Interlocking or shared-cell shapes, crossword style (possibly a separate game).
  - Mixed representations (numerals and dots in one puzzle).
  - Visual pie and bar fractions.
  - Drifting tiles.
  - Reverse authorship (player-built rounds).
  - Bracket, tunnel and co-op races, and the bottom-vs-top competition.
