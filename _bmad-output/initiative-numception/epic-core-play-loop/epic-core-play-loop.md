---
type: epic
title: "Tap, solve, collapse and resume: Classic and Tower rounds"
parent: initiative-numception
covers: [CAP-3, CAP-4, CAP-5]
after: []
assignee: ""
risk: high
---

# Tap, solve, collapse and resume: Classic and Tower rounds

## Description

The player launches straight into a puzzle, solves by tapping, sees the solve transition start that frame, zooms between tiers, watches each tier collapse into the next, and resumes exactly after any kill. POC scope: FR-7 to FR-11. It creates the AD-21 state root with a default Kid profile and its profileKind, so later epics can apply Kid variants before profile switching exists (epic-profiles-and-controls). It also presents the FR-4 soft miss (pulse, ghost arrow, "Tap the answer"). This is the tracer epic and holds the defining moment.

## Outcome

A playtester plays Classic and Tower rounds end to end on a phone with no loading state; the signal is SM-2 (the core moment lands) and SM-4 (60 fps).

## Done when

1. Cold start's first interactive frame is a puzzle, and a tap's first visible response is within 100 ms on the user's iPhone 16 Pro (reference-device re-measure deferred; see Notes).
2. A Tower round at n=3 plays 9, 3, then 1 puzzles with a round collapse after each tier and flows into the next round with no end screen.
3. Killing the app at any moment and relaunching restores the same puzzle, solved cells, tier and mode; the kill-mid-write test passes.
4. Play, solve transitions and round collapses hold 60 fps on the user's iPhone 16 Pro (reference-device re-measure deferred; see Notes).
5. Web keyboard play works: arrow keys, Enter or Space, Esc (opens the control surface once epic-profiles-and-controls lands), visible focus ring; every cell has an accessible-tree button named by its number; cells are at least 48 pt, Kid cells at least 56 pt (NFR-4).
6. Saves carry a saveFormatVersion with a forward migration path, tested (NFR-2).
7. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

The play loop, navigation, presentation timeline and persistence. Not mode scoring (epic-zen-normal-onboarding), not theme variety (epic-themes-and-feedback). Pyramid and Rapid Fire are v1.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-3, CAP-4, CAP-5
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-3, CAP-4, CAP-5
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-2, AD-10, AD-13, AD-14, AD-17, AD-20 to AD-22, AD-24, AD-25
- design — _bmad-output/initiative-numception/ux-numception/EXPERIENCE.md, sections Interaction Primitives, Key Flows 1 and 4
- design — _bmad-output/initiative-numception/ux-numception/mockups/key-first-collapse.html

## Notes

- Open question: OQ-8 — pinch in addition to tap-to-enter is open; POC ships tap-to-enter.
- Waits on epic-platform-baseline because: it needs the renderer decision.
- Waits on epic-puzzle-generator because: it needs round planning and realisation API.
- Decision: 2026-10-14 — breakdown planned autonomously at the user's request (priority: bare-minimum playable on the iPhone and in the browser with least friction); validated by an independent set check before writing.
- Tracer: entry 1 — one tappable Classic n=3 + puzzle from core state through app into a fresh PixiJS render package; it deliberately has no persistence. Entries 1–3 are the playable path; 4 onwards complete the Done-when.
- Sequencing: 1 → 2 → 3 (playable) → 4 → 5 → 6 (one lane: they share render, ui, PlayVM, GameState and main.ts) → 7 (on-device measurement) → 8 Refactor sweep. No closing end-to-end suite.
- Decision: 2026-10-14 (user) — level progression is tabled. Stand-in: `nextRoundRequest` alternates Classic and Tower at n=3 + (entry 6 adds Classic − and Tower −), seeded by `deriveSeed(rootSeed, roundOrdinal)`; epic-adaptive-difficulty's selection and FR-47's level pin replace it later.
- Decision: Tower is played breadth-first (9, then 3, then 1, per Done-when 2), and each group of three collapses into its tier-2 cell as it finishes (EXPERIENCE Flow 4 "collapse in threes"). After a solve the camera auto-advances to the next unsolved sibling (AD-25); tapping any unsolved overview cell enters it (FR-9).
- Decision: unsolved cells in an overview show no numeral; solved cells show their answer.
- Decision: render's `hitTest` returns null while `inputLocked`, and core keeps its idle guard as a backstop (AD-14 vs AD-20). The press acknowledgement comes from the pointer position, independent of `hitTest`.
- Decision: presentation durations go in a new TuningConfig `presentation` section: solve 380 ms, advance 400 ms, first collapse 3000 ms, later collapses 1200 ms, round crossfade 400 ms (EXPERIENCE OQ-6 left them open).
- Decision: between rounds the theme stays Kiln with a crossfade; theme variety and theme transitions are epic-themes-and-feedback's.
- Decision: a wrong tap at POC baseline gives the press acknowledgement only and changes no state (emits `WrongTap`); Zen and Normal consequences are epic-zen-normal-onboarding's.
- Decision: `render` is written fresh on pixi.js 8.22 from core/layout geometry, with no pixi-filters (Kiln has no glow), so the open glow-cost question doesn't block this epic. The bake-off prototype is not reused.
- Decision: `firstCollapseSeen` and `softMissLineSeen` are per-profile flags in `GameState`.
- Decision: `RoundCore.mode` is `'zen'` with no scoring in this epic; epic-zen-normal-onboarding adds mode behaviour.
- Decision: 2026-10-14 — the iPhone gets the build through the playtest PWA (Add to Home Screen, offline) and the Capacitor playtest shell.
- Decision: 2026-10-14 (least-friction priority) — for the POC, saves use IndexedDB in both the PWA and the Capacitor iOS shell's WebView. AD-10's `@capacitor/filesystem` adapter (WebView eviction safety) is deferred to epic-native-apps (note there; spine Deferred updated).
- Decision: 2026-10-14 — the older-device renderer re-measure (iPad Air 4 / A14, Galaxy A35-class) moves to epic-poc-playtest (note there); this epic measures on the user's iPhone 16 Pro only (Done-when 1 and 4).
- Feedback: 2026-10-14 (user, iPhone playtest of entries 1–3) — taps responsive, beats good, fonts and animation look great. The collapse doesn't make it obvious you're solving a super puzzle; the user suggested drawing the parent (super-shape) outline around the zoomed-in puzzle. Added as entry 9, built next. The round-change signal was carried to epic-themes-and-feedback.
- Decision: 2026-10-14 (user, iPhone) — the super-shape outline (entry 9) reads "much better visually", but the collapse into the large puzzle was too slow: "can be a little slower than the small puzzles, but not *this* slow". Collapse durations are now 1200 ms first and 800 ms later (were 3000 and 1200; FR-9 sets ceilings only), against about 1 s for a small puzzle's solve plus advance under Calm.
