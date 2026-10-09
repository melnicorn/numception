# Numception — UX sources digest
Sources: [1] brainstorm-modes-stickiness-name · [2] feature-list-by-phase · [3] research-retention · [4] research-game-engine (exec+recs) · [5] research-arithmetic-difficulty (exec+recs). Working title Numception; never "Kakooma" (trademarked) [1]. Name undecided (Sumspire, Infinum, Numsummit, Summara, Summalux; tagline "Innumerable") [1][2].

## Decided look & feel
- Core idea: inception zoom + solve transition; a solved piece becomes one cell of its parent, camera zooms out (Powers of Ten) [1][2]
- Design test for every feature: "does it express a solve as light moving through the structure?" [1]
- State is shown as light; Zen vs Normal differ mostly in palette + intensity [1]
- Aesthetic: minimal, lines and shapes. Refs: Monument Valley, Infinitode 2, Journey. Anti-refs: Candy Crush, Royal Kingdom [1]
- Normal palette: black + one neon that shifts with combo + error red [1][2]
- Zen palette: paper + one ink colour [1][2]
- Typography: numbers are the only text, one geometric typeface [1][2]
- Geometry is the HUD: no persistent score/timer widgets; time = line tracing the shape outline; points appear only during the transition [1][2]
- Layout: flat 3x3 for tier 1 and tier 2; no cube; no n>9 [1][2]
- Transition style is OPEN — do not lock to "fold" [1][2]

## Decided behaviour
- Solve transition: piece turns into its answer, becomes parent cell; in Normal points burst and flow into session total then lifetime total, bigger/brighter for harder pieces [1][2]
- Combo (Normal): consecutive fast solves grow multiplier 1x→1.2x…→2x, shown only as glow (lines thicken, brighten, spark), never a number [1][2]
- v1 combo: heat carries into tier-2 puzzle; unbroken round → Overdrive (double final points, full fireworks); slow solve drops one step, wrong pick drains hard [2]
- Wrong tap, Normal: "power cut" — combo dies, no points lost; glow dies, lines flicker dark, dark red flash/pulse, background fades, bass power-down, reboot at dim 1x [1][2]
- Wrong tap, Zen: gentle, never dominates — number sinks like a pebble with soft low tone; errors never counted on screen; difficulty quietly eases [1][2]
- Philosophy: slow and steady beats fast and error-prone [1]
- Zen reward: each solve drops a light into a lifetime constellation/garden; no points, no timer [1][2]
- Zoom/tiers: tier 2 = overview of n glowing cells; player zooms into one tier-1 puzzle at a time (solves mobile screen size) [1][2]
- Audio: pitch steps down one note per tier so depth is audible (POC inferred in [2]; v1/Later in [1]) [1][2]
- Navigation: launch straight into next unsolved puzzle, no menus on launch [1][2]
- Spatial menus: zoom out past your tree to reach settings, collection, modes as shapes; PLUS a single-tap shortcut to the control surface for game-wide settings [1][2]
- Home (v1) = your tree: zoom out to show scale, then glide to next unsolved puzzle [1][2]
- Save every tap; playable for 15 s or 15 min; a ~10 s tier-1 puzzle always counts [1][2]
- Failure seamless (Super Meat Boy): restart <1 s, no loading screens between tiers, broken combo never stops play [1][2]
- Infinite by default: no end screen; next round assembles at the edge of view [1][2]
- Fog of war (v1): only one puzzle visible at start; solve reveals neighbours; Zen = mist lifting [1][2]
- Power-grid wiring (v1): partial power = soft-lit in another colour; full power lights + unlocks [1][2]
- Hints (v1, easy modes only): ripple hint fades one distractor per solved neighbour; cap k=1 easy, k=2 very easy; a, b, c never faded [1][2]; optional hints for stuck players [3]
- Surprises: no visible unlock tree; new content arrives unannounced as a never-seen glyph at mastery plateau; first encounter deliberately easy (3^2=9); Normal = grid glitch then resolve, Zen = new flower blooms [1][2]
- Unlocks framed as new play from demonstrated mastery, not prizes/contingent payment [3]
- Zoom-out puzzle count e.g. "625 puzzles built this" (v1) [2]; collection shows "??? – 4 undiscovered" [1][2]
- Lightning down the tree on top-level completion (Normal); Zen = growing tree/river delta (Later) [1][2]
- Rapid Fire death animation IS the restart (<1 s) (v1) [2]

## Modes & phases → implied surfaces
- POC: Classic round (n tier-1 → one tier-2, flat 3x3); Tower round (3-tier mini-pyramid, n=3 → 13 puzzles); Zen + Normal; + and − only; rating logs [1][2]
  - Surfaces: puzzle grid (tier 1), tier-2 overview, zoom/solve transition, point stream (Normal), Zen garden/constellation, wrong-tap states ×2, spatial menu + one-tap control surface, round-assembly edge [2]
- v1: endless resumable Pyramid + home-as-tree; fog; power grid; climb landmarks (altitude: Eiffel, Everest, edge of space, Moon); ×/÷; surprises; dot faces to ~12 (dice-style, pre-readers); fractions; Rapid Fire + earn-only totems; Daily Seed + leaderboard + Wordle-style share card coloured by speed; clean bonus; $2–5 purchase [2]
  - Surfaces: home/tree zoom, fog map, collection, Rapid Fire screen, totem, daily seed result/share card, leaderboard, paywall/purchase [2]
- Later: crystals/keepsakes, Descent mode, pyramid fog map, units packs, powers/roots, Operator Sudoku + "No solution" button, ghost duels, tunnel/bracket races, teacher/smart-board (big targets), player-built rounds, Library of Babel + Atlas, greyed specimen slots [2]
- Phase placement of v1/Later is inferred and needs confirming [1]
- Parked: interlocking shapes, mixed representations, pie/bar fractions, drifting tiles, live duels, shape-per-level. Rejected: par, money/decimals, neighbour effects, reverse tap mode (kid assist only), cube, n>9, literal dominoes [1][2]

## Audience / stakes constraints
- Kids in scope (dot faces for pre-readers, teacher mode) [1][2]; expected tangible rewards undermine intrinsic motivation, more for children [3]
- Zen: encouraging feedback, growth/collection metaphor, no leaderboards; no streak wagers for kids [3]
- Maths-anxious kids dislike leaderboards; losing players demotivated → Normal: personal-best first, then friend/nearby-rank boards; global boards opt-in; pyramid depth as bragging board [3]
- Difficulty, not the timer, is the anxiety lever [3][5]
- Daily habit: streak extended by one solved puzzle, both modes; streak freezes earned not bought [3]
- No ads, no IAP, no pay-to-win; flat one-time $2–5; totems earn-only [1][2]; no third-party ad/tracking libs in kid profiles; COPPA from day one [3]
- The math is the game — never gate play behind problems (anti-Prodigy) [3]
- Parent progress reports: plain language, weekly check-ins (vendor evidence only) [3]
- Accessibility: not addressed explicitly in sources beyond big targets for smart-board [2] and dot-face subitizing layouts [1]

## Platform constraints affecting UX
- Web-first TypeScript (Phaser 4 or PixiJS v8), wrapped with Capacitor 8 for iOS/Android [4]
- App Store 4.2 risk ("repackaged website"): plan native touches — haptics, Game Center / Play Games leaderboards, full offline play [4]
- iOS audio: WebKit audio quirks; need audio requirement covering the mute switch [4]
- Glow/particle performance on mid-range phones unmeasured; prototype neon lines + glow + 200 particles first [4]
- Phone screen size drives flat 3x3 + zoom-as-layout, no n>9 [1][2]

## Difficulty targets that affect feel
- Zen: ~85–90% success, correctness-only rating, no visible timer [5]
- Normal: ~75% success, visible clock (outline-tracing line per [1]), speed+accuracy score S=(2·correct−1)·(d−t)×difficulty, soften fast-slip penalty [5]
- Selectable target (Math Garden ~90/75/60); easier play = longer sessions but slower learning [5]
- Zen difficulty eases after errors; surprises triggered by mastery plateau from ratings [1][2]
- Puzzle-level difficulty (n, near-miss distractors) unmodelled — calibrate from play [5]

## Open UX questions (explicitly left open)
- Solve transition style (not "fold" by default) [1][2]
- Clean bonus for zero-error round — proposed, undecided in [1]; listed v1 in [2]
- Shapes changing per level — breaks or enriches inception? [1]
- Pencil marks (valid-triple counts) in Operator mode — test [1][2]
- Seeds vs adaptive difficulty; upward-infinite pyramid generation [1]
- Name [1][2]
- Tension: [5] score formula penalises fast wrong answers; [1][2] say wrong tap costs no points
- Hidden-timer scoring for Zen if speed should count silently [5]
- Progression/unlock/achievement effect on retention unknown — instrument D1/D7/D28, streak survival, session length by mode [3]
- What parents want in progress reports [3]
