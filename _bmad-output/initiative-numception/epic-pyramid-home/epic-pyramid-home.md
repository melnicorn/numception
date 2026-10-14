---
type: epic
title: "Endless Pyramid as the home tree"
parent: initiative-numception
covers: [CAP-5]
after: []
assignee: ""
risk: high
---

# Endless Pyramid as the home tree

## Description

The endless, resumable Pyramid becomes the v1 home view, with fog of war, landmarks, the power grid, and a Play entry for every round type. v1 scope: FR-12, FR-49, FR-54, FR-7 (v1 home-tree glide), FR-26 (v1 Minimal mini-map), FR-39 (v1 Pyramid height and round-type breakdown).

## Outcome

Players see something they built grow; the signal is SM-5 retention and Pyramid height in stats.

## Done when

1. The Pyramid survives restarts and updates without loss, and growing it never renumbers existing puzzles.
2. The home view shows scale, a bare-number puzzles-built count and drawn landmarks; launch glides to the next unsolved puzzle.
3. A higher-tier puzzle opens only when all n feeders are solved and fully powered, and power is never the only unlocked signal.
4. Every available round type starts from the control surface without touching the Pyramid; epics 12 and 13 register their round types in the Play row.
5. Stats show Pyramid height, and the Grown-up view breaks down by round type and n; Minimal motion shows a static mini-map.
6. Live in production on iOS, Android and web.

## Boundaries

The Pyramid round type and home view. Not streaks or packs (epic-daily-habit).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-5, CAP-12 (FR-54)
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-4, AD-10, AD-24, AD-25; Deferred (upward generation)

## Notes

- Unknown: OQ-4 — how the Pyramid generates upward forever; this epic owns the answer.
- Open question: OQ-17 (spatial menus), OQ-18 (backup across devices).
- Waits on epic-poc-playtest because: it needs go/no-go.
- Waits on epic-puzzle-generator because: it needs generator interface open for upward growth.
- Idea: 2026-10-14 (user, for later) — the infinite/Pyramid mode could unlock once enough operators exist, so − (and later negatives) can pull growing number ranges back down as the pyramid rises; that could also give levels that raise difficulty automatically. Not decided; revisit with level progression.
