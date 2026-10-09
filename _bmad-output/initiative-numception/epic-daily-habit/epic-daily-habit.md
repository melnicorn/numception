---
type: epic
title: "Forgiving streaks, assists and theme pack collection"
parent: initiative-numception
covers: [CAP-11, CAP-12]
after: []
assignee: ""
risk: medium
---

# Forgiving streaks, assists and theme pack collection

## Description

A forgiving daily streak with earned freezes, easy-band ripple hints, dot faces for young players, and theme packs earned through play. v1 scope: FR-27 to FR-31, FR-39 (v1 daily streak in both stats views).

## Outcome

Players form a daily habit without pressure; the signal is SM-6, watched against SM-C1 and SM-C2.

## Done when

1. One solved puzzle in a local day extends the streak; a missed day with no freeze resets it with no loss message, sound or animation.
2. Freezes are earned only, at most 2 held and 1 per 7 streak days.
3. Ripple hints and dot faces follow their band limits and meet the tap-target and contrast rules.
4. Theme packs are earned through play milestones.
5. Live in production on iOS, Android and web.

## Boundaries

Progression and assists. Not monetization.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-11 (FR-27), CAP-12
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-5, AD-15, AD-17

## Notes

- Open question: OQ-10 (pack catalog and unlock path), OQ-12 (kid nudges).
- Waits on epic-pyramid-home because: it needs home tree to show the streak light.
