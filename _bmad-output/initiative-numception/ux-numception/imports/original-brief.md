# Original game brief (user, 2026-10-08)

Pasted by the user as their UX brain dump. Verbatim intent summary of the UX-relevant parts; the full text is in the session transcript.

## Rules
- A round = n tier-1 puzzles + one final (tier-2) puzzle made from the n tier-1 answers. 3 <= n <= 9.
- Each tier-1 puzzle is a geometric shape with n segments (triangle n=3, pentagon n=5 ...). Find the unique a o b = c; m = n-3 distractors; random placement. The player selects c.
- Solving all tier-1 unlocks tier-2, built from the c values, also with exactly one solution.

## Game UI
- Shapes chosen per n for 3..9. Example n=3: an equilateral triangle split into 4 triangles, values in the outer three, the operator in the inner void.
- Each tier-1 puzzle is drawn as if it is one cell of the tier-2 puzzle. As puzzles are solved, their segments are replaced by just the solution.
- Zen mode: softer colours, less animation and intensity, minimal or no scoring, no time tracking, infinite play, calm music. For casual players and kids.
- Normal mode: arcade. Bright, flashy colours, animation, particles, high contrast, line-based, Tron-like. Scoring, timers or countdowns, competitive.

## Other UX-relevant needs
- Rich player tracking and stats.
- A continue/resume path for pyramid mode (thousands of games, never one session).
- Platforms: iOS phone + tablet, Android, web/mobile web; nice animations and graphics.
- Output wanted: mockups / design proposals.
- Modes from the brief: operator mixing, missing operator (operator tiles), fractal/pyramid.
