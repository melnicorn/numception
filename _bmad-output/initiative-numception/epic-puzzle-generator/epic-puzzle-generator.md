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
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-1, AD-3 to AD-7, AD-9, AD-13, AD-18, AD-19, AD-22, AD-24
- shapes — _bmad-output/initiative-numception/prd-numception/addendum.md, section A4
- difficulty — _bmad-output/initiative-numception/prd-numception/addendum.md, section A2
- constraint — _bmad-output/initiative-numception/spec-numception/quality-bars.md, NFR-1

## Notes

- Unknown: OQ-4 — the generator interface must allow growing the Pyramid upward later; epic-pyramid-home owns the answer.
- Open question: OQ-11 — POC ships shapes 7A, 9B and the 1:1.25 diamond; epic-poc-playtest decides.
- Waits on epic-platform-baseline because: it needs workspace, core package, CI, dev panel shell (1.5) and offline playtest PWA (1.6).
- Decision: 2026-10-11 — breakdown planned autonomously at the user's request (as for epic-platform-baseline); validated by an independent set check before writing.
- Decision: 2026-10-11 (user) — every cell in a puzzle shows a distinct number (no ties; the A2 "ties" feature stays at zero in the POC), and there is no zero: numbers start at 1. This also removes the − case b = c.
- Definition: a valid triple is a set of three distinct cells where one equals the sum of the other two. A − puzzle's two readings (a − b = c and a − c = b) are one triple; c is the designated answer and b the soft-miss cell.
- Assumption: PRNG is xoroshiro128plus from pure-rand 8.4.2 in pure style. Round seeds and per-node streams come from a fixed, documented integer mix of (seed, tier, index), versioned with generatorVersion.
- Assumption: bands are integer levels in TuningConfig (value ranges, carry/borrow allowance) with hand-set POC values; choosing between them is epic-adaptive-difficulty's selector.
- Assumption: upper-tier puzzle content is chosen at plan time from the round's starting band; the selector varies only tier-1 puzzles. Answer contracts are limited to values realisable in the lowest band.
- Assumption: cell placement is seeded inside realise (AD-4); FR-5's personal-replay layout randomisation is v1.
- Assumption: golden fixtures pin seed, NodeId, spec and a fixture tuning file, so tuning edits change generation without tripping the guard unless generator logic changes.
- Assumption: generatorVersion 1 and tuningVersion 1 count as unshipped until epic-poc-playtest's first release. Until then entries may regenerate v1 fixtures and edit 1.json; the guard only forbids changing fixtures of a version marked shipped.
- Assumption: bucketId is computed from the realised puzzle (bucketOf) and copied into the AD-9 selection record after realise. Digits = digit count of the largest cell; carries = column carries or borrows of the triple; a near-miss is a distractor within tuning.nearMissDelta of some cell pair's sum or difference.
- Assumption: core/layout owns the hit-test (runtime flow: "TapCell via core/layout hit-test").
- Assumption: the CI benchmark is measured on the GitHub runner baseline; NFR-1's on-device generation time is checked in epic-poc-playtest.
- Assumption: Done when 6 is met by the dev panel round inspector (entry 11), which can also pick among bundled tuning files. The full dev-panel tuning switcher (SetActiveTuning through the store) belongs to epic-core-play-loop, and the non-generation TuningConfig sections (K values, combo, chain window, durations) belong to the epics that consume them.
- Source conflict: epic Boundaries say seeds are v1 vs AD-4/AD-22 need rootSeed and deriveSeed in the POC. Read as: internal seeding is POC; shareable seeds and the Daily Seed are v1.
- Source conflict: spec marks soft miss (OQ-6) resolved vs prd-numception.md FR-4 still carries it as an assumption. The spec wins.
- Tracer: entry 1 — one seeded n=3 + puzzle from core through app to the dev panel in the deployed offline PWA.
- Sequencing: the golden guard (2) lands before tuning (3) and the generator grows (4); 5, 6 and 7 follow 4; 8 (layout) is independent; 9, 10 and 11 need full rounds (5); the Refactor sweep is last. No closing end-to-end suite: golden seeds, property tests and the nightly check cover it.
- Decision: 2026-10-14 (user) — number ranges depend on puzzle size n: small n (3–5) keeps easy numbers like 1..20 and larger n gets wider ranges. This resolves the 2.5 band-1 widening; added as entry 13 (re-slice after the epic's planned work was built).
