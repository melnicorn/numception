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

1. Cold start's first interactive frame is a puzzle, and a tap's first visible response is within 100 ms on the reference devices.
2. A Tower round at n=3 plays 9, 3, then 1 puzzles with a round collapse after each tier and flows into the next round with no end screen.
3. Killing the app at any moment and relaunching restores the same puzzle, solved cells, tier and mode; the kill-mid-write test passes.
4. Play, solve transitions and round collapses hold 60 fps on the reference devices.
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
- Carried over: 2026-10-11 from epic-platform-baseline 1.3 (via 1.7), placed here because it must happen before POC architecture locks, which this epic's render work precedes. The renderer (PixiJS, provisional) still needs measuring on an older iPhone-class device (iPad Air 4, A14) and a mid-range Android (Galaxy A35 class) before POC architecture locks; see the architecture spine's Deferred (Renderer) and prototypes/renderer-bakeoff/measurements.md.
