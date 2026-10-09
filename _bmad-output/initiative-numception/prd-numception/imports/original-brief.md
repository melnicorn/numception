# Original Brief (verbatim, supplied by user 2026-10-09)

> For posterity. Significant drift has occurred since; later decisions in brainstorm/research/UX docs and the PRD memlog take precedence.

# Kakooma Game

I want you to do some research and design for a Kakooma math puzzle style game. If you’re not familiar with that, the basic game is pretty simple:

## Rules
- Pick number of puzzles `n` and mathematical operator `o`. A round of Kakooma is `n` tier 1 puzzles plus one final puzzle made from the answers from the `n` tier 1 puzzles
- Each tier 1 puzzle is drawn as a geometric shape with `n` segments...for example, use a triangle for `n=3`, pentagon for `n=5`, cube for `n=9`. `n>9` is probably not practical.
- For each puzzle, select a solution in the form `a o b = c` for the selected math operator `o`.
- Pick `m` appropriate random numbers in a reasonable range where `m = n - 3`. Pick `m[...]` such that `a o b = c` is the *only* solution in the puzzle
- Randomly assign locations in the puzzle for `a`, `b`, `c`, and `m[...]`
- The user has to select `c` to select the solution for that puzzle
- Once the user has selected `c` for each tier 1 puzzle, this unlocks the tier 2 puzzle using `c` values. Obviously it follows that the tier 1 puzzle `c` answers must provide a valid `a`,`b`,`c` for the final puzzle, and there should only be one solution for the final puzzle

# Game UI Design
## General design
Geometric shapes should be selected for each `n` where `n` is `3 <= n <= 9`. For example, `n=3` would be an equilateral triangle divided into three segments (could be that we split the big triangle into 4 equilateral triangles, with the values on the outside triangles, and the inner void displaying the operator). Each of the tier 1 puzzles would themselves be displayed as if each is one cell of the tier 2 final puzzle. As puzzles are solved, the segments are replaced with just the solution instead

### Zen mode
Zen mode would provide an experience for casual players or kids. Softer colors, less animation and intensity, minimal or no scoring, no time tracking, and infinity play mode. Calm music.

### Normal mode
Normal mode is a much more arcade-like experience. Bright, flashy colors, animations, particles, etc. High contrast, line-based, Tron-like. Scoring, timers or countdowns, etc. More competitive based.

# Complexities
The basic game is pretty simple, but there are some areas which could be genuinely complex.

## Difficulty tuning
I do not want to generate hundreds of pre-made levels. This should be something we can easily programmatically generate levels for once we figure out how to determine difficulty, assess how the player is doing, and automatically scale up or down the difficulty on subsequent levels.

### Standard mathematical complexity scoring?
-[ ] Open Question: Are there standard complexity scoring techniques for mathematical operations? For example, `1+1` has a very low complexity, `7+5` is slightly higher, `13+58` is higher, `-71+95` is higher, etc. Subtraction might in general be more complex than addition, but `2-1` might be simpler than `13+109`. I would much prefer using a standard metric rather than rolling our own

## Scoring
How to effectively score a game, a player's skill, how their skill advances as they play games, how *quickly* they completed the puzzle, etc. etc.

# Stickiness to game
We need to consider how to keep ones attention when in-game, and make it compelling to come back to to play again. A few ideas
- Leveling up
- Mode unlocking (unlock operators, negative numbers, mixed operators, etc.)
- Awards, etc.

# Game types
As described so far is the bare minimum for a playable game. But I think we can ideate on other game modes that would make sense within this framework. Here are a few ideas from simplest to most complex. Some of these might not be entirely new game modes, but modifications to increase complexity
- Operator mixing -- instead of all `n` puzzles using the same math operator, each puzzle can use one of the set of unlocked.
- Missing operator -- player has to select an operator, then select an answer. This is a case where we might break our "only one solution" problem. The operator itself becomes one of the puzzle pieces. For example, one ore more of the puzzles (or all) might have operator missing, and we have that many operator "tiles" that the user can place in a puzzle. There could be mutliple solutions per tier 1 puzzle, but only one solution for the tier 2 puzzle, which requires you selected the correct solutions for tier 1, not just "a" solution per tier 1 puzzle.
- Fractal mode -- or maybe upside-down-tree mode where puzzles just continuously build off each other instead of ending after tier 1/tier 2. Each branch of the tree would have `n` branches. For example, for `n=3` puzzles, we start with level 1. We'd have to complete 3 puzzles at level 1 to unlock level 2. Then we could complete that one level 2 puzzle, but to get to level 3 we'd need 3 level 2 puzzles, so we'd need to go back and complete 6 more level 1 puzzles to feed those level 2 puzzles. And on and on, forever. This would be an interesting "bragging rights" leaderboard or awards. It would be pretty impressive to reach level 5 on an `n=5`
- Other modes -- to ideate on!

# Supported platforms
I'm not locked into supported platforms yet. Want to start with proof of concept, but would imagine if it's fun and gets good playability that we'd support iOS (phone and tablet), Android, and web/mobile web. I do want nice looking animations and graphics so something like Unity might be a good choice. Would want to share the engine as much as possible and realize that Unity might work great for all the mobile devices, but not the web (not sure on this one). Need some guidance and planning on this one.

# Name of the game
I'm not sure if Kakooma is a registered or protected name, but we probably want to distinguish ourselves from that anyway. Any ideas?

# Player tracking
Rich tracking and stats for player data is a necessity. We might need a continue mode on the "pyramid" game mode since playing thousands of games will not be a single-session use case

# Output
I will want some mockups or proposals for game design along with the standard bmad documentation
