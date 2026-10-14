---
type: epic
title: "Native iOS and Android apps, leaderboards and notifications"
parent: initiative-numception
covers: [CAP-14, CAP-18]
after: []
assignee: ""
risk: high
---

# Native iOS and Android apps, leaderboards and notifications

## Description

Store builds for iOS and Android with haptics, offline play, correct mute behaviour, opt-in Grown-up leaderboards, Grown-up-only opt-in notifications, and no Kid social surface. v1 scope: FR-36, FR-42, FR-43, FR-55, FR-35 (v1: external links, review prompts and platform sign-in behind the gate), FR-34 (v1: multiple local Kid profiles). It also delivers the PurchasePort epic-one-time-unlock uses.

## Outcome

The app passes store review as a real game; the signal is App Store guideline 4.2 and 2.5.2 compliance.

## Done when

1. iOS (phone and tablet) and Android builds pass store review.
2. Leaderboards, platform sign-in and links do not exist in a Kid profile; game services never initialise there.
3. A Kid profile never requests a push token; Grown-up notifications are opt-in and off by default.
4. Every play feature works offline on both platforms.
5. Live in production on iOS, Android and web.

## Boundaries

Native shells and platform services. Not the purchase (epic-one-time-unlock).

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-14 (FR-36, FR-55), CAP-18
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-11, AD-16, AD-18; Deferred (Game Center plugin, push provider)

## Notes

- Open question: OQ-14 — phone landscape and tablet layouts.
- Waits on epic-poc-playtest because: it needs go/no-go.
- Waits on epic-pyramid-home because: it needs Pyramid height for the bragging-rights board.
- Waits on epic-daily-habit because: it needs streak for Grown-up reminders.
- Carried over: 2026-10-11 from epic-platform-baseline 1.5 (via 1.7). The iOS shell is not compiled in CI (macOS runner cost). Add a macOS build, or rely on store/TestFlight builds, when this epic starts.
- Carried over: 2026-10-11 from epic-platform-baseline 1.2 (via 1.7). Neither shell has run the real client on a phone. Android now compiles in CI (playtest flavour, package and label checked) but has never been installed on a device (the user has no Android device for now). The iOS client shell was only run in the simulator; the 16 Pro ran the bake-off scenes, not the tracer client. Install both shells with the client on real phones when this epic starts.
- Carried over: 2026-10-11 from epic-platform-baseline 1.6 (via 1.7). Service-worker registration is skipped inside the Capacitor shells by design (they load bundled assets). Confirm the client runs offline in both shells on a device.
- Carried over: 2026-10-14 from epic-core-play-loop entry 4. For the POC, saves use IndexedDB inside the Capacitor WebView. Before store builds, add AD-10's `@capacitor/filesystem` StoragePort adapter (and `@capacitor/preferences` for DeviceSettings) in platform-native, with a migration from the IndexedDB saves.
