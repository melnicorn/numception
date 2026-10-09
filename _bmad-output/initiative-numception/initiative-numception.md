---
type: initiative
title: "Numception: a nested number puzzle kids and adults come back to"
parent: none
covers: [CAP-1, CAP-2, CAP-3, CAP-4, CAP-5, CAP-6, CAP-7, CAP-8, CAP-9, CAP-10, CAP-11, CAP-12, CAP-13, CAP-14, CAP-15, CAP-16, CAP-17, CAP-18, CAP-19, CAP-20]
after: []
assignee: ""
risk: high
---

# Numception: a nested number puzzle kids and adults come back to

## Description

Numception is a number puzzle where each answer becomes a cell of a bigger puzzle, with adaptive difficulty, no ads and no pay-to-win. The spec owns the capabilities, constraints and non-goals. This initiative delivers them in two milestones: a quality-gated POC in front of a few playtesters, then v1 public launch on iOS, Android and web.

## Outcome

Kids about 6–10 and adults playing daily get a math game they return to; the POC signal is the spec's POC success signal (SM-1 to SM-4), and the v1 signal is its retention targets (SM-5) with no counter-metric worsening.

## Done when

1. POC: SM-1 to SM-4 met in a playtest of at least 5 players, including at least 5 kids aged 7–10.
2. v1: every capability CAP-1 to CAP-20 is live on iOS, Android and web from one codebase.
3. v1: D1, D7 and D28 retention by mode and profile is measured through first-party telemetry against the SM-5 targets, with SM-C1 to SM-C4 tracked.
4. v1: privacy legal review, name clearance and store listing are complete before public launch, with no open blocker.
5. No crash or save corruption loses Pyramid or streak progress (NFR-3) during the first month after launch.

## Boundaries

Capability boundary: each epic delivers one capability or a tightly coupled pair from the spec, for one owner. Not a classroom, curriculum or multiplayer product; see the spec's Non-goals and its Later and Parked lists. Tracer path across epics: the scaffold (epic 1) runs a generated n=3 + Classic round (epic 2) that the player solves by tapping and watches collapse into tier 2 in the playtest web build (epic 3).

- Touch point: static web host for the playtest PWA — deploy configuration only; owner: epic-platform-baseline
- Touch point: App Store Connect and Google Play Console — listings, bundle ids, age declarations; owner: epic-native-apps
- Touch point: Game Center and Play Games — leaderboard configuration; owner: epic-native-apps

## References

- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md (cross-epic contracts: AD-1 to AD-25)
- constraint — _bmad-output/initiative-numception/spec-numception/spec-numception.md, section Constraints (kid safety, telemetry, offline, store compliance, renderer gate)
- constraint — _bmad-output/initiative-numception/spec-numception/quality-bars.md (NFR-1 to NFR-6)
- prd — _bmad-output/initiative-numception/prd-numception/prd-numception.md, for history only

## Notes

- Decision: 2026-10-09 — the spec folder from `bmad-spec` is the requirement source; `covers` cites its CAP ids (user accepted the hand-off).
- Assumption: epics are cut one capability or coupled pair per epic, POC epics first in build order, v1 epics after the POC playtest (agent's call; user asked to run autonomously).
- Assumption: a capability split by phase is owned by two epics, the POC epic for its POC FRs and a v1 epic for the rest; each epic's Requirements names its FR ids.
- Assumption: the renderer choice (Phaser 4 or PixiJS v8) is the one decision several epics adopt that the spine leaves open; it is a hitl entry in epic-platform-baseline, and epic-core-play-loop and epic-themes-and-feedback wait on it.
- Assumption: no POC epic waits on any v1 epic; v1 epics wait on epic-poc-playtest so playtest learning can reshape them.
- Open question: the spec's open questions OQ-1 to OQ-23 stay with their owners; each v1 epic's Notes names the ones it waits on.
- Unknown: OQ-4 (upward Pyramid generation) — epic-puzzle-generator must keep the generator interface open for it; epic-pyramid-home owns the answer.
- Decision: 2026-10-09 — user approved the 17-epic set and build order as presented, including the assumptions above.
- Decision: 2026-10-09 — whether the one-time unlock is on web, and whether it bundles packs, is deferred (too early); see epic-one-time-unlock.
