---
type: epic
title: "Unique, deterministic, tunable puzzle generation"
parent: initiative-numception
covers: [CAP-1, CAP-2, CAP-9]
after: []
assignee: ""
risk: high
---

# Unique, deterministic, tunable puzzle generation

## Description

The pure core generates + and − puzzles for any n from 3 to 9 with exactly one valid triple, plans Classic and Tower rounds whose answers form unique-solution puzzles at every tier, reproduces any puzzle from its recorded inputs, and reads every parameter from a versioned tuning configuration. POC scope: FR-1, FR-2, FR-3 (POC), FR-4, FR-6, FR-53.

## Outcome

Every later epic can ask core for a round and trust it; the signal is the 100,000-puzzle uniqueness check and golden-seed reproduction on every platform.

## Done when

1. The nightly check finds exactly one valid triple in 100,000 puzzles for every n and enabled operator, and every generated round passes at every tier.
2. Golden-seed tests reproduce identical puzzles under Node and WebKit, and any output change fails CI unless the generator version is bumped.
3. Round planning meets the CI benchmark (realisation p95 ≤ 10 ms per node, round plan ≤ 50 ms).
4. Changing any tuning parameter changes generation with no code change, and a POC build cannot serve × or ÷.
5. Soft-miss classification for − puzzles is a core rule result.
6. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

The core generator, rules, layout geometry and tuning schema. Not ratings or selection (epic-adaptive-difficulty), not rendering. × ÷, fractions and seeds are v1 (epic-operators-and-mastery, epic-daily-seed).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-1, CAP-2, CAP-9
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-1, CAP-2, CAP-9
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-3 to AD-7, AD-19
- shapes — _bmad-output/initiative-numception/prd-numception/addendum.md, section A4

## Notes

- Unknown: OQ-4 — the generator interface must allow growing the Pyramid upward later; epic-pyramid-home owns the answer.
- Open question: OQ-11 — POC ships shapes 7A, 9B and the 1:1.25 diamond; epic-poc-playtest decides.
- Waits on epic-platform-baseline because: it needs workspace, core package and CI.
