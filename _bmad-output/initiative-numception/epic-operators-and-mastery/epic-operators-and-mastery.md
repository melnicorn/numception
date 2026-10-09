---
type: epic
title: "All four operators, fractions and surprise-at-mastery"
parent: initiative-numception
covers: [CAP-1, CAP-8, CAP-10]
after: []
assignee: ""
risk: high
---

# All four operators, fractions and surprise-at-mastery

## Description

× and ÷ arrive, then negatives and fractions, introduced unannounced at a detected mastery plateau, while full adaptive selection keeps each player near the mode target. v1 scope: FR-3 (v1), FR-48, FR-20 (v1), FR-22, FR-24.

## Outcome

Players keep growing past + and −; the signal is SM-7 and FR-20's ±7-point per-player bound.

## Done when

1. × ÷ and fraction puzzles pass the 100,000-puzzle uniqueness check; ÷ answers are whole unless fractions are enabled.
2. In a playtest of at least 20 players × 50 puzzles, each player's last-50 success stays within ±7 points of the mode target.
3. A plateau introduces new content at most once per session, in the easiest bucket, with no screen listing upcoming content.
4. Plateau detections and outcomes are logged for refitting.
5. Live in production on iOS, Android and web.

## Boundaries

Content and adaptation. Not the Pyramid or progression.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-1, CAP-8, CAP-10
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-5, AD-7, AD-8, AD-9; Deferred (rating chains)

## Notes

- Open question: OQ-15, OQ-19, OQ-22 wait on this epic's inception.
- Waits on epic-poc-playtest because: it needs go/no-go and refit tuning.
