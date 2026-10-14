---
type: epic
title: "Difficulty prior, ratings, level pin and event logging"
parent: initiative-numception
covers: [CAP-8, CAP-19]
after: []
assignee: ""
risk: high
---

# Difficulty prior, ratings, level pin and event logging

## Description

Every puzzle gets a prior difficulty from the feature model, players and buckets carry ratings updated on every answer, Zen eases after an error, the player can pin a level, and every answered puzzle is logged with its versions and selection context for playtest export. POC scope: FR-20 (POC part), FR-21, FR-47, FR-44.

## Outcome

The team can tell from exported logs whether difficulty is landing; the signal is SM-8's model-fit data and the per-player success rates the playtest produces.

## Done when

1. Every served puzzle has a feature-model prior and records its bucket, versions and selection context.
2. Player ratings per operator and bucket ratings update on every answer from correctness only, persist across updates, and are rebuilt from the response log when replayed.
3. After a Zen wrong tap the next puzzle is easier.
4. A level pin for n, operator and difficulty band applies to every new round while ratings keep updating.
5. The playtest build exports the response and event logs through the dev panel.
6. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

Ratings, selection and the response log. Not full adaptation to target success or mastery plateau (v1, epic-operators-and-mastery), not telemetry upload (v1, epic-telemetry-and-remote-tuning).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-8, CAP-19
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-8, CAP-19
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-8, AD-9, AD-12; research-elo-adaptive.md
- model — _bmad-output/initiative-numception/prd-numception/addendum.md, section A2

## Notes

- Open question: OQ-22 — ratings use correctness only by default; speed-informed ratings are a v1 call.
- Waits on epic-puzzle-generator because: it needs bucket features and tuning schema.
- Waits on epic-core-play-loop because: it needs answered-puzzle events from the play loop.
- Carried over: 2026-10-13 from epic-puzzle-generator 2.5 (via 2.12). To make Classic n ≥ 7 and Tower + rounds plannable under the rule that leaf answers fit band 1, POC band 1 widened from 1..20 (no carries) to 1..99 (one carry), so even the easiest tier-1 puzzles in a round can use numbers up to 99. Decide with the user: per-n band ranges in TuningConfig, gating large n behind higher bands, or accepting larger numbers (see the 2.5 plan's deferred item).
- Decision: 2026-10-14 (user) — per-n number ranges are adopted (epic-puzzle-generator entry 13), resolving the band-1 widening note above. Level progression (how players move between n, bands and operators) is tabled until after a bare-minimum playable build has been tested.
