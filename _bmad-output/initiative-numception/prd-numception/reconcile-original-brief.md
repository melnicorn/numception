---
title: Reconciliation — Original Brief vs Numception PRD
created: 2026-10-09
inputs: imports/original-brief.md, prd-numception.md, addendum.md, .memlog.md
rule: later decisions win; flag only brief items that are neither present nor consciously dropped/deferred/changed
---

# Reconciliation: Original Brief vs PRD

**Input:** `imports/original-brief.md` (63 lines, "Kakooma Game").
**Result:** 7 gaps (1 High, 3 Medium, 3 Low). Nearly all of the brief is covered or deliberately changed. The gaps are mostly about **who controls things** (n and operator choice) and **qualitative intent that only shows up implicitly** (levelling up, negatives, rich stats outside rounds).

## Gaps

| # | Brief source | Brief intent | PRD location | Severity | Suggested fix |
|---|---|---|---|---|---|
| G1 | L10 "Pick number of puzzles `n` and mathematical operator `o`" | The round starts by picking `n` and `o` (the brief implies the player picks them) | **Absent.** FR-1/FR-3 say "the round's operator" and "any n"; §4.5 lists `n` as a difficulty feature. FR-40 (control surface) has no n or operator setting, and no FR says who or what picks `n` per round, per Pyramid, or per Rapid Fire run | High | Add an FR (in §4.5 or §4.3) that says how `n` and the operator are chosen for each round type: adaptive engine only, player choice, or both. State whether `n` is fixed for the lifetime of a Pyramid (FR-12 needs a constant `n` per tree) and whether the player can ever choose. If player choice is rejected, add it to §5 Non-Goals or A6. |
| G2 | L42 "Leveling up"; L38 "how their skill advances as they play games" | A visible sense of levelling up and skill progression | **Partial / implicit.** Ratings (FR-21) are internal. Growth is shown through the constellation, Pyramid altitude, landmarks (FR-12) and the Grown-up trend (FR-39). §10 bans badges and progress bars. No statement on player-facing levels, XP or skill rank | Medium | Either add a line to §4.8 saying "levelling up is expressed as Pyramid altitude, landmarks and surprise content, with no XP or level numbers", and add "no XP or level counter" to §5 or §10. Or add a Grown-up-only skill readout per operator to FR-39. |
| G3 | L43 "Mode unlocking (unlock operators, negative numbers, mixed operators, etc.)" | Negative numbers as unlockable content | **Partial.** FR-1 says "Negative numbers appear only when that content is enabled". A2 lists negatives as a difficulty feature. Negatives have no phase tag, are not in §6.1 POC or v1 lists or §6.2, and have no unlock path (operators use FR-24, mixing has OQ-16) | Medium | Give negatives a phase tag ([v1] or [Later]) in FR-3 or the §4.1 notes. State that they arrive via surprise-at-mastery (FR-24) like operators, and add them to the §6.1 or §6.2 list. |
| G4 | L60 "Rich tracking and stats for player data is a necessity" | Rich stats across all play | **Partial.** FR-39 Grown-up view is round-centric (round time, combo, clean rounds, per-operator accuracy). It doesn't cover Rapid Fire (best run, totems used), Daily Seed history and results, Classic vs Tower split, per-`n` breakdown, or Pyramid tiers and puzzles built beyond height | Medium | Extend FR-39 [v1] with mode-specific stats: Rapid Fire best and average run, Daily Seed history, Pyramid puzzles built, and a per-`n` breakdown. Keep the Kid view growth-only. |
| G5 | L49 Missing operator: "There could be multiple solutions per tier 1 puzzle, but only one solution for the tier 2 puzzle" | The mode deliberately relaxes the unique-solution rule at tier 1 | **Partial.** The mode is Later as "Operator Sudoku" (§6.2, FR-3), but the glossary "Puzzle" and FR-1/FR-2 make "exactly one triple" universal. The brief's planned exception isn't recorded | Low | Add a note to FR-3 or §6.2 saying the missing-operator mode may allow multiple valid tier-1 solutions, with uniqueness enforced at the top tier only, so architecture doesn't hard-code the invariant. |
| G6 | L23 Zen "...no time tracking, and infinity play mode" | Zen is endless and never ends a run | **Partial.** Endless flow is covered (no end screen, FR-11 round chaining, FR-12 Pyramid). Rapid Fire (FR-13) ends on the first error, and the PRD doesn't say whether Rapid Fire is available in Zen, which would contradict Zen's gentle-error, endless intent | Low | State in FR-13 whether Rapid Fire is Normal-only, or define a Zen variant that doesn't end on error. |
| G7 | L60 "We might need a continue mode on the 'pyramid'... playing thousands of games will not be a single-session use case" | A long-lived Pyramid that survives over months | **Partial.** Resume and persistence are covered (FR-10, FR-12, NFR-2/3). No cloud sync in v1 is a conscious non-goal (§5). The PRD is silent on OS-level backup and restore (iCloud/device backup, Android Auto Backup), so a new or replaced device loses a Pyramid built from thousands of puzzles | Low | Add an NFR-2 consequence: the save is included in platform device backup and restore (or explicitly excluded, with the reason). Web storage eviction behaviour should be noted too. |

## Covered or consciously changed (no action)

| Brief item (line) | Disposition | Where |
|---|---|---|
| Round = n tier-1 + 1 final (L10, L16) | Present | Glossary "Classic round", FR-2, FR-11 |
| Shapes per n, 3 ≤ n ≤ 9; cube for n=9 (L11, L20) | Changed: cube dropped, flat 3×3 | A4, §5 Non-Goals, OQ-11 |
| m = n−3 distractors, unique solution, random placement (L12–L14) | Present | FR-1 |
| Select `c` (L15) | Present, plus the − and ÷ soft miss | FR-4, FR-8 |
| Operator in the centre void; tier-1 shown as cells of tier 2; collapse to solution (L20) | Present | A4, FR-9, §1 |
| Zen softer colours, less animation, no scoring, no visible time (L23) | Present | FR-14, FR-26, §10. Hidden response-time logging is a conscious decision (memlog telemetry, OQ-15) |
| Zen calm music (L23) | Deferred | §6.2 Music note |
| Normal: bright, Tron-like, particles, scoring (L26) | Present / refined ("one neon") | §10, FR-15, NFR-1 |
| Normal timers or countdowns (L26) | Changed: the chain window drains around the outline, with round time in the flash; no timer widget | FR-15, FR-17, FR-19, §10 |
| Competitive (L26) | Present | FR-32, FR-33, FR-42 |
| Programmatic levels, auto-scaling difficulty (L32) | Present | §4.5, FR-20–22, §5 (no hand-authored levels) |
| Standard complexity metric question (L35) | Answered: no standard metric, standard *method* used | A2, §4.5 |
| Scoring: speed and skill (L38) | Present | FR-15, FR-21, A2 |
| Mode unlocking: operators (L43) | Present | FR-24 |
| Mixed operators (L43, L48) | Deferred / open | FR-3 [Later], OQ-16 |
| Awards (L44) | Changed: no badges or reward screens; keepsakes Later | §10, §4.8 notes, §6.2 |
| Missing operator mode (L49) | Deferred | FR-3, §6.2 "Operator Sudoku" (see G5 for the uniqueness caveat) |
| Fractal / upside-down tree (L50) | Present as Pyramid | FR-12 |
| Bragging-rights leaderboard (L50) | Present | FR-42 (Pyramid height board) |
| Other modes (L51) | Present | FR-13 Rapid Fire; §6.2 Later list |
| POC first, then iOS phone and tablet, Android, web (L54) | Present | §6.1, §11, NFR-5 |
| Nice-looking animations and graphics (L54) | Present | §1, NFR-1, SM-4, POC goal (memlog), A1 renderer prototype and risk |
| Unity; shared engine; platform guidance (L54) | Changed: Unity rejected, one TS codebase | A1, NFR-5 |
| Name / Kakooma trademark (L57) | Present | OQ-1, §9.2, A6 |
| Continue mode for Pyramid (L60) | Present | FR-10, FR-12 (see G7 for device-loss) |
| Mockups and BMAD docs (L63) | Out of PRD scope; UX spine has mockups | §0 |
