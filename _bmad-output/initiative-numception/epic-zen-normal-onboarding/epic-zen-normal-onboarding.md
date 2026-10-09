---
type: epic
title: "Zen, Normal and guided first rounds"
parent: initiative-numception
covers: [CAP-6, CAP-7, CAP-10]
after: []
assignee: ""
risk: medium
---

# Zen, Normal and guided first rounds

## Description

A first-time player is guided through their first rounds, plays Zen with no clock or score, and after about 10 rounds unlocks Normal with points, combo, chain window, power cut and round-end flash. POC scope: FR-14 to FR-19, FR-23.

## Outcome

Kids aged 7–10 learn the game with no adult help and adults find Normal's arcade loop; the signals are SM-3 and SM-1.

## Done when

1. No time, score, error count or rank appears anywhere in Zen; a Zen wrong tap sinks the number and is never counted.
2. In Normal the score total never goes down, combo shows only as line glow and width, and wrong taps within 700 ms merge into one power cut of at most 500 ms.
3. The round-end flash shows round time, points, best combo and clean-round status with no input; soft-miss-only rounds show as clean.
4. A first-time player gets 2–5 guided rounds with the exact copy, hint timing and narration, also through the accessible layer, and Normal unlocks once with "New: Fast mode".
5. Kid profile gets the soft power-cut cue and the Relaxed chain window by default.
6. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

Mode rules, scoring and guide state. Not difficulty easing (epic-adaptive-difficulty), not surprise-at-mastery (v1, epic-operators-and-mastery), not Overdrive, graded cooling or clean bonus (v1, epic-normal-extras-and-rapid-fire).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-6, CAP-7, CAP-10
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-6, CAP-7, CAP-10
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-7, AD-13, AD-20, AD-23, AD-24
- design — _bmad-output/initiative-numception/ux-numception/EXPERIENCE.md, sections Modes, Voice and Tone, State Patterns, Key Flows 1 and 3
- design — _bmad-output/initiative-numception/ux-numception/mockups/key-onboarding.html, key-round-end.html, key-power-cut-kid.html

## Notes

- Waits on epic-core-play-loop because: it needs the play loop and presentation timeline.
