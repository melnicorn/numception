---
type: epic
title: "POC playtest and go/no-go for v1"
parent: initiative-numception
covers: []
after: []
assignee: ""
risk: medium
---

# POC playtest and go/no-go for v1

## Description

The POC is put in front of at least 5 players, including at least 5 kids aged 7–10, and the POC success metrics are measured from observation, interviews and exported logs. The results decide the POC shape questions and whether v1 work starts as planned.

## Outcome

The team knows whether the core works; the signal is SM-1 to SM-4.

## Done when

1. SM-1 to SM-4 are measured and recorded against their thresholds.
2. OQ-11 shape choices are decided from playtest evidence and recorded back into the spec.
3. Tuning defaults (FR-20 tolerance, collapse durations, chain window) are refit from logs or confirmed.
4. A go/no-go for v1 is recorded, with any re-slice of v1 epics it requires.

## Boundaries

Running and analysing the playtest. Not new features; fixes found become bugs in the owning epic.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- metrics — _bmad-output/initiative-numception/spec-numception/success-metrics.md, section POC
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, Success signal

## Notes

- Assumption: playtesters are recruited by the user; every story here is hitl.
- Waits on epic-core-play-loop because: it needs playable rounds.
- Waits on epic-zen-normal-onboarding because: it needs modes and onboarding.
- Waits on epic-adaptive-difficulty because: it needs log export.
- Waits on epic-themes-and-feedback because: it needs themes and feedback.
- Waits on epic-profiles-and-controls because: it needs profiles and controls.
