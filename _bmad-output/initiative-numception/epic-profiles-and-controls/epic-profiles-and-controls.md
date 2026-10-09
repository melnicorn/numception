---
type: epic
title: "Profiles, parent gate, stats and control surface"
parent: initiative-numception
covers: [CAP-14, CAP-15, CAP-16]
after: []
assignee: ""
risk: high
---

# Profiles, parent gate, stats and control surface

## Description

The device has a default Kid profile and a Grown-up profile with separate progress, a PIN parent gate, a For grown-ups area with delete-all, per-profile stats, and a control surface holding every setting. POC scope: FR-34, FR-35, FR-37 to FR-40.

## Outcome

A parent can hand the device to a child safely and an adult can see their progress; the signal is the parent-gate and Kid-view checks below.

## Done when

1. First launch is always Kid; the active profile persists across launches; a ring on the menu button shows Grown-up is active.
2. Once a PIN exists, Kid → Grown-up and For grown-ups require it; Grown-up → Kid never does and asks for a PIN when none exists.
3. Delete-all returns the app to first-run state, including after a kill mid-wipe.
4. The Kid stats view never shows times, accuracy, errors, ranks, comparisons or declines; the Grown-up view shows the FR-39 set over 7 days, 30 days and all time.
5. The control surface opens in one tap from any play state, pauses timers and blurs the board, and closing it returns to the exact state; DOM surfaces honour OS text size up to 200% and every control has an accessible name (NFR-4).
6. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

Profile partitioning, gate, settings and stats. No communication features in any profile (FR-37). Notifications, Kid social-surface absence and purchases are v1 (epic-native-apps, epic-one-time-unlock).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-14, CAP-15, CAP-16
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-14, CAP-15, CAP-16
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-10, AD-11, AD-13, AD-21
- design — _bmad-output/initiative-numception/ux-numception/EXPERIENCE.md, section Profiles & Child Safety; mockups key-control-surface.html, key-stats.html

## Notes

- Waits on epic-core-play-loop because: it needs state root and persistence.
- Waits on epic-zen-normal-onboarding because: it needs mode settings and round-end data for stats.
- Waits on epic-adaptive-difficulty because: it needs level pin, ratings and response log.
- Waits on epic-themes-and-feedback because: it needs motion, sound and theme settings.
