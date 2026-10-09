---
type: epic
title: "One-time unlock"
parent: initiative-numception
covers: [CAP-20]
after: []
assignee: ""
risk: medium
---

# One-time unlock

## Description

A Grown-up can buy one unlock, behind the parent gate, for extra content. v1 scope: FR-46.

## Outcome

The game earns money without ads or pay-to-win; the signal is purchases with no change to SM-C metrics.

## Done when

1. The purchase is reachable only through the parent gate and never prompted during play or transitions.
2. Nothing affecting difficulty, score, rating or earn-only items can be bought.
3. Live in production on iOS, Android and web.

## Boundaries

One purchase. No currencies, consumables or subscriptions.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, section CAP-20
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-11, AD-16

## Notes

- Open question: OQ-13 — what is free and what is paid; this epic cannot be incepted before it is answered.
- Open question: is the unlock offered on web, and can paid content bundle theme packs (FR-27)? The initiative says every capability is live on web.
- Waits on epic-native-apps because: it needs native store builds and purchase port.
- Decision: 2026-10-09 — web availability and pack bundling are deferred as too early to decide; settle with OQ-13 at this epic's inception (user).
