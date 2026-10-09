---
type: epic
title: "Seeded rounds, the Daily Seed and share card"
parent: initiative-numception
covers: [CAP-2, CAP-13]
after: []
assignee: ""
risk: medium
---

# Seeded rounds, the Daily Seed and share card

## Description

Rounds reproduce from a seed, everyone plays the same Daily Seed each day, and a share card goes out through the OS share sheet. v1 scope: FR-5, FR-32, FR-33.

## Outcome

Adults compare results with people they know; the signal is Daily Seed plays and shares in telemetry.

## Done when

1. The same seed and generator version produce identical content on every platform; seeds carry puzzle content only.
2. Two players on different platforms on the same date get identical Daily Seed content, and it counts toward the streak.
3. The Kid share card is image-only; incoming seed links open as solo play.
4. Live in production on iOS, Android and web.

## Boundaries

Seeds and sharing. Not challenges (Later).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-2, CAP-13
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-4, AD-6, AD-11, AD-16; Deferred (seed link format)

## Notes

- Open question: OQ-16 — Daily Seed difficulty curve.
- Waits on epic-poc-playtest because: it needs go/no-go.
- Waits on epic-daily-habit because: it needs streak to count Daily Seed solves.
