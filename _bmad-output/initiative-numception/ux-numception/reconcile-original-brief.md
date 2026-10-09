# Reconcile: original brief vs UX memlog

Sources: `imports/original-brief.md`, `.memlog.md` (canonical; later overrides earlier), upstream `brainstorm-modes-stickiness-name.md` (BS). DESIGN.md / EXPERIENCE.md are still empty stubs.

| # | Brief idea / requirement | Status | Where / how |
|---|---|---|---|
| 1 | Round = n tier-1 + one tier-2 built from their answers; 3 <= n <= 9 | Captured | BS (no n>9); memlog shape system n=3..9; Miles climax "collapses into the final puzzle" |
| 2 | Tier-1 shape has n segments (triangle n=3, pentagon n=5 ...) | Changed | Memlog "no hard universal rule; shapes decided per n". Picks: 3A split triangle, 4A diamond (~1:1.25), 5B pentagon flower, 6A honeycomb (not hexagon), 7A/9B wedges (ring of circles backup), 8A 3x3 grid |
| 3 | Unique a o b = c, m = n-3 distractors, random placement | Captured (partly) | Memlog: seed = numbers + operators; placement randomized at play time (fairness option for competitive). Distractor count not a UX decision |
| 4 | Player selects c | Changed | Memlog −/÷ ambiguity: still tap c; tapping the other valid cell is a soft miss, first time doesn't break streak; tutorial when −/÷ arrive |
| 5 | Solving all tier-1 unlocks tier-2 (one solution) | Captured | Memlog nesting principle + Miles journey climax |
| 6 | n=3: triangle split into 4, values outer, operator in inner void | Captured | Memlog "operator always in the centre" + 3A split triangle |
| 7 | Tier-1 drawn as if one cell of tier-2 | Captured | Memlog nesting principle: cell BECOMES the next-tier puzzle (zoom/dive); wedges fall back to "contains" |
| 8 | Solved puzzle's segments replaced by just the solution | Not addressed | BS "solved piece becomes one cell of the parent"; memlog transitions cover theme change, not the collapse-to-c visual state |
| 9 | Zen: softer colours | Changed | Memlog theme system: Zen themes Washi Ink, Moonwater, Kiln (overrides BS strict paper + one ink) |
| 10 | Zen: less animation / intensity | Partial | Memlog: soft low tone, none/very soft haptics. Transition library not scaled per mode |
| 11 | Zen: minimal/no scoring, no time tracking | Captured (upstream) | BS: no points, no timer, lifetime constellation/garden. Not restated in memlog |
| 12 | Zen: infinite play | Captured (upstream) | BS "feels infinite by default, no end screen" |
| 13 | Zen: calm music | Changed / deferred | Memlog sound floor: POC effects only, music off by default; pack audio optional slot, "music is the hard part" |
| 14 | Zen for casual players and kids | Changed | Memlog: Zen is the default for every new player (~first 10 rounds); kid/adult profile toggle is separate |
| 15 | Normal: bright, flashy, high contrast, line-based, Tron-like | Captured / changed | Memlog Normal themes Vector Noir, Overdrive Bloom, Obsidian Facet; theme packs, per-round change (overrides BS one-neon palette) |
| 16 | Normal: animation, particles | Captured | Memlog transition library (fracture shards, embers, ripple), causality from tap point; BS combo glow |
| 17 | Normal: scoring | Captured | BS points at solve + glow multiplier; memlog wrong tap costs no points; round-end time/score shown briefly (assumption) |
| 18 | Normal: timers or countdowns | Changed | BS "geometry is the HUD": no timer widget, time as a line tracing the outline; par time rejected; countdowns not addressed |
| 19 | Normal: competitive | Changed / deferred | Memlog: challenges/ghost duels "Later"; social only for verified adults; Daily Seed Later (BS) |
| 20 | Rich player tracking and stats | Partial | Memlog: stats captured identically for kid/adult, kid display simpler and positive, reached via menu. No stat set or views defined |
| 21 | Continue/resume path for pyramid | Partial (upstream) | BS: opens into next unsolved puzzle, saves every tap; pyramid home view Later. No memlog decision |
| 22 | iOS phone + tablet, Android, web/mobile web | Changed | Memlog: phone portrait is design anchor; tablet/web adapt; POC test platform likely desktop browser (assumption) |
| 23 | Nice animations and graphics | Captured | Memlog theme + transition libraries, nature transitions, pack unlocks |
| 24 | Mockups / design proposals | Partial | Memlog: .working renders (shape-system-1, shape-n4-diamonds, directions-1, theme-transitions-1/2). No full-screen mockups (play view HUD, menu, stats, round end) |
| 25 | Mode: operator mixing | Not addressed | BS: + − first, × ÷ etc. via surprise-at-mastery; memlog onboarding reused for new operators. Mixed operators within one round undecided |
| 26 | Mode: missing operator (operator tiles) | Not addressed | BS "Operator Sudoku" Later; no UX in memlog |
| 27 | Mode: fractal / pyramid | Partial | BS: POC tower round (3 tiers), pyramid Later; memlog nesting principle enables it. No pyramid UX (home view, navigation, depth cues) |

## Dropped qualitative ideas worth surfacing

- **Segments collapse to just the solution** (#8): the "solved puzzle becomes its answer" state, which drives the tier-2 build-up, has no decision. Transitions cover the theme change, not this collapse.
- **Calm music in Zen** (#13): deferred to "effects only, music off" for the POC. Zen's calm comes only from the palette and soft sounds.
- **Zen = less animation and intensity** (#10): the transition library is shared across modes. Nothing caps intensity in Zen (a shattering crystal in Zen?).
- **Timers/countdowns in Normal** (#18): replaced by the outline-trace line. The countdown pressure the brief wanted is gone; confirm that is intended.
- **Rich player tracking** (#20): reduced to "stats exist, via menu". The brief's "rich" (trends, history, per-operator) has no shape yet.
- **Continue mode for pyramid** (#21): the "thousands of games, never one session" resume flow and the sense of progress through it are not designed.
- **Operator mixing and operator-tile modes** (#25, #26): absent from UX. The UX of Operator Sudoku is non-trivial (placing tiles, "No solution" move).
- **Mockups wanted** (#24): only exploration renders exist. No screen-level mockups or proposals for play, menu, stats or round end.
- **Kids as a Zen audience** (#14): changed to "Zen for every newcomer". Still need to check that the kid profile defaults to Zen permanently.
- Not dropped: the **n=3 operator in the inner void** is captured (3A split triangle plus operator always in the centre).
