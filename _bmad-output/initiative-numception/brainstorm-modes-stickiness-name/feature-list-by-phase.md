---
type: feature-list
working_title: Numception
date: 2026-10-08
source: .memlog.md (brainstorm: modes, stickiness, coined name)
phase_plan: POC / v1 / Later / Parked — accepted by user "as proposed"
---

# Numception — Feature List by Phase

The core of the game: **the inception zoom and the solve transition.** Every solve changes the light of a self-similar structure, at every scale.
Items marked *(inferred)* came up in the log but have no explicit phase. They are placed using the plan's logic.

## POC

### Core loop
- **Unsolved→solved transition** — when a piece is solved it visibly turns into its answer, which becomes a cell of the parent puzzle (the transition style is still open, not locked to "fold").
- **Points at transition** — each solved piece adds points to the session and lifetime totals at the moment of transition.
- **Visible point stream** *(inferred)* — the solved piece bursts and its points flow into the session total, then the lifetime total. Harder pieces give a bigger, brighter stream.
- **Speed points + combo multiplier** *(inferred)* — consecutive fast solves grow the multiplier (1x → 2x).
- **Combo glow multiplier** — the multiplier is shown as glow intensity (lines thicken, brighten and spark). No number is shown.
- **Normal wrong tap = power cut** — the combo is lost but no points are lost: the glow dies, lines flicker dark, a red pulse plays with a bass power-down, and play reboots at dim 1x.
- **Zen wrong tap = sinking pebble** — the number sinks with a soft low tone, errors are never counted on screen, and difficulty quietly eases.

### Inception / Pyramid
- **Zoom-as-layout between tiers** — tier-2 is an overview of n glowing cells, and you zoom into one tier-1 puzzle at a time (this solves the mobile screen-size problem).
- **Tower round** — a bounded 3-tier mini-pyramid for one session (n=3: 9+3+1 = 13 puzzles).
- **Classic round** *(inferred)* — the base n tier-1 puzzles feeding one tier-2 puzzle, on a flat 3x3 layout.
- **Audio pitch per tier** *(inferred)* — the pitch steps down one note per tier on each solve, so your ears tell you how deep you are.

### Content & difficulty
- **+ and − operators** — the POC operator set. × and ÷ are added only if cheap.
- **Generator with uniqueness checks** — generates rounds whose answers are unique per puzzle and across the round.
- **Feature-based difficulty prior + rating logs** — difficulty is estimated from puzzle features, and per-puzzle ratings are logged so the model can be tuned later.

### Modes
- **Zen mode** — calm, no points. State is shown in the paper + ink palette.
- **Normal mode** — neon arcade with points, combo and power cut.
- **Zen lifetime constellation/garden** *(inferred)* — in Zen, each solve drops a light into a lifetime garden instead of scoring points.

### Feel / UI
- **Open straight into the puzzle** — the app launches into the next unsolved puzzle with no menus.
- **Save every tap** — progress is saved after every tap, so you can put it down for 15 seconds or 15 minutes with no pressure.
- **Smallest unit always counts** *(inferred)* — a ~10s tier-1 puzzle always powers the structure and extends the streak.
- **Failure never stops play** — a broken combo never interrupts play, and there are no loading screens between tiers.
- **No end screen** — the game is infinite by default, and the next round assembles at the edge of view.
- **Geometry is the HUD** — no persistent score or timer widgets. Time is a line tracing the shape outline, and points appear only during the transition.
- **Strict palettes** — Normal is black + one combo-shifting neon + error red. Zen is paper + one ink colour. Numbers are the only text, in one geometric typeface.
- **Spatial menus + one-tap control surface** — zoom out past the tree to reach settings, collection and modes as shapes. A single tap jumps straight to the control surface.

## v1

### Core loop
- **Combo carry + Overdrive** — combo heat carries into the tier-2 puzzle. An unbroken round triggers Overdrive: double final points and full fireworks.
- **Graded combo cooling** — a slow solve drops the combo one step, and a wrong pick drains it hard.
- **Clean bonus** — a zero-error round earns a separate multiplier or mark, which makes slow-and-steady play visible.

### Inception / Pyramid
- **Fog of war** — only one puzzle is visible at the start, and solving it reveals its neighbours. In Zen this is drawn as mist lifting at dawn *(inferred)*.
- **Ripple hint with hint budget** — an easy-mode assist: each solved neighbour fades one distractor. Fades are capped per puzzle (k=1 easy, 2 very easy), and a/b/c are never faded.
- **Endless resumable Pyramid** — an infinite tree that resumes where you left off. Upward growth picks a new top level that contains the existing top's answer.
- **Power-grid wiring** — solved pieces send power up the connections. A partly powered puzzle is soft-lit in a different colour, and full power lights it up and unlocks it.
- **Home = your tree** — home zooms out to show the whole tree (its scale), then glides to the next unsolved puzzle (your purpose).
- **Climb landmarks** — lifetime solves are converted to altitude, with landmarks such as the Eiffel Tower, Everest, the edge of space and the Moon.
- **Puzzle count on zoom-out** — while zooming out, a count such as "625 puzzles built this" makes the depth feel huge.

### Content & difficulty
- **All four operators** — × and ÷ join + and −.
- **Surprise-at-mastery unlocks** — new content arrives unannounced as a piece with a never-seen glyph, triggered when the rating model detects a mastery plateau. The first encounter is deliberately easy (3^2=9). This replaces a visible unlock tree.
- **Surprise presentation** *(inferred)* — in Normal, the grid glitches and then resolves. In Zen, a new flower blooms.
- **Undiscovered-secrets count** *(inferred)* — the collection shows "??? – 4 undiscovered" but never what they are.
- **Dot faces to ~12** — dice-style dot faces that can show values up to ~12, with subitizing-friendly layouts for pre-readers.
- **Fractions** — fraction tiles with escalating complexity (up to mixed denominators).

### Modes
- **Rapid Fire** — no inception: puzzles flash one at a time, and the first error loses all progress. The death animation is the restart (<1s).
- **Earn-only totems** — a "totem of undying" saves one error in Rapid Fire. Totems can only be earned, never bought.

### Social / seeds
- **Seeded generation** — puzzle = f(rootSeed, treePath, difficulty, generatorVersion). Competitive play uses a fixed difficulty curve. Personal play is adaptive but replayable, because difficulty is logged per node.
- **Daily Seed + share card** — the same round worldwide each day, with a shared leaderboard and a Wordle-style result card coloured by speed.

### Business
- **One-time $2–5 purchase** — a flat paid app with no ads, no IAP and no pay-to-win.

## Later

### Inception / Pyramid
- **Lightning strike** — when the top level is completed in Normal, lightning strikes down the whole upside-down tree. The Zen equivalent is a real tree or river delta growing *(inferred)*.
- **Crystals / keepsakes** — completed subtrees become keepsakes you can reopen and zoom through.
- **Descent / top-down mode** — start at the answer c, find a and b, then reveal the tier below and work downward. Each known c must have exactly one a,b pair (reverse uniqueness).
- **Pyramid fog map** — the endless tree shown as a map, where lifetime progress is territory pushed out of the fog.

### Content & difficulty
- **Units packs** — unit-conversion tiles, e.g. 2 Tbsp + 1 fl oz = 1/4 cup.
- **Powers / roots** — a², square roots and powers, delivered as surprise content.
- **Operator Sudoku + "No solution" button** — operator tiles must be placed, and tier-2 uniqueness drives sudoku-style elimination. The player judges whether their proposed tier-2 puzzle is valid, and correctly declaring it impossible is a scored move. Pencil marks are to be tested.

### Modes / Social
- **Ghost duels** — race a friend's recorded taps on the same seed, asynchronously.
- **Tunnel race** — two players dig toward each other through the same tree, and the node where they meet is the finish line.
- **Bracket race (vs + co-op)** — different trees converge on one final-final puzzle, sweet-16 style. In co-op, each teammate or classroom half powers one branch.
- **Teacher / smart-board mode** — a class plays the same seeded round, and the teacher sees which skill tripped people up. Includes smart-board team play (half the room vs the other half, alternating taps, big targets) *(inferred)*.
- **Player-built rounds** — the player authors a round (answers + decoys), the game verifies uniqueness, and the round is sent as a seed to a friend or class.
- **Library of Babel specimens + Atlas** — a bounded seed space where code detects rare seeds (all primes, final answer 42, symmetric). The first finder is recorded with "Discovered by…" and some seeds hold earn-only gifts. The Atlas draws the space as a map with discoveries lit.
- **Pokédex greyed slots** — a visible incomplete collection with greyed specimen slots ("7 of 30 rare round types").

## Parked / Rejected

### Parked (not now)
- **Interlocking shapes** — shared crossword-style cells between puzzles. Possibly a separate future game.
- **Mixed representations** — numerals and dot faces in one puzzle.
- **Visual fractions** — pie or bar fraction tiles.
- **Drifting tiles** — tiles drift slowly inside the shape.
- **Live real-time duels** — synchronous head-to-head, possibly split-screen.
- **Shape changes per level** — e.g. a triangle of pentagons of squares.

### Rejected
- **Par** — par time and par taps (would just be n taps).
- **Money / decimals** — not for now.
- **Neighbour-tile / pressure / order-bonus effects** — judged gimmicky.
- **Reverse tap as a mode** — allowed only as a young-kid assist.
- **Cube geometry** — the flat 3x3 layout stays.
- **n > 9** — breaks the geometry and mobile screens. Pyramid is the "extreme" instead.

### Not a feature (tracked)
- **Name** — naming is punted. The working title is Numception, and the shortlist is Sumspire, Infinum, Numsummit, Summara and Summalux.

## Engine dependencies

The POC must build both engines.

- **Generator + uniqueness checker** — Classic/Tower rounds, endless Pyramid (upward-infinite generation), seeded generation, Daily Seed, ghost duels, tunnel/bracket races, teacher mode, player-built rounds (verification), Library of Babel specimens + Atlas (rarity detection over seeds), Operator Sudoku + "No solution" (whole-round uniqueness solver), Descent/top-down (reverse uniqueness).
- **Rating model** (feature-based prior + rating logs) — adaptive difficulty, Zen/Normal difficulty targets, Zen difficulty easing after errors, surprise-at-mastery unlocks (groove detection), per-node difficulty logging for replayable personal seeds.
- **Both** — seeded play couples the two engines. Competitive seeds use a fixed difficulty curve, and personal seeds replay the logged adaptive difficulty.
