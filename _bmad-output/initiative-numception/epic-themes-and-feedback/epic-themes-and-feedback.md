---
type: epic
title: "Themes, transitions, motion levels, sound and haptics"
parent: initiative-numception
covers: [CAP-11, CAP-17]
after: []
assignee: ""
risk: medium
---

# Themes, transitions, motion levels, sound and haptics

## Description

Each round has a new theme from the six spine themes, tagged transitions carry the player between them filtered by mode and Motion, and sound effects and haptics mark every beat. POC scope: FR-25, FR-26, FR-41.

## Outcome

Rounds stop looking the same and every beat has physical feedback without harming accessibility; the signal is SM-1 and SM-4.

## Done when

1. Two consecutive rounds never share a theme while more than one is available; Randomize and Playlist both work.
2. Zen and Calm use calm transitions only; Minimal turns zooms into cuts and transitions into crossfades of at least 400 ms; OS Reduce Motion maps to Minimal.
3. CI checks contrast and colour-vision safety for every theme, and no combination of effects exceeds 3 flashes per second.
4. Solve tones step down a note per tier with haptics; effects, music and haptics toggle independently; the iOS mute switch is respected on a device.
5. Delivered in the playtest PWA, offline, on a phone.

## Boundaries

Theme and transition data, the flash budget and the feedback director. Not theme pack collection (v1, epic-daily-habit), not music design.

## References

- parent — _bmad-output/initiative-numception/initiative-numception.md
- spec — _bmad-output/initiative-numception/spec-numception/spec-numception.md, CAP-11, CAP-17
- requirements — _bmad-output/initiative-numception/spec-numception/functional-requirements.md, sections CAP-11, CAP-17
- architecture — _bmad-output/initiative-numception/architecture-numception/architecture-numception.md, sections AD-15, AD-16, AD-21, AD-23
- design — _bmad-output/initiative-numception/ux-numception/DESIGN.md; _bmad-output/initiative-numception/ux-numception/EXPERIENCE.md, sections Theme & Transition System, Sound & Haptics, Accessibility Floor

## Notes

- Waits on epic-platform-baseline because: it needs the renderer decision.
- Waits on epic-core-play-loop because: it needs solve and collapse events and the presentation timeline.
- Carried over: 2026-10-11 from epic-platform-baseline 1.3. Filter glow doesn't hold 60 fps in either engine, even on an iPhone 16 Pro (PixiJS 46–53 fps at full glow, about 43 sustained at lite). Themes need a cheaper glow technique (e.g. pre-baked glow sprites or one shared low-resolution bloom pass), proven at 60 fps on an older device. See the architecture spine's Deferred (Renderer, Glow technique is open).
- Feedback: 2026-10-14 (user, after playing the first build on iPhone) — the round-to-round crossfade "didn't give a sense of new round; it looked like the values in the triangles were replaced". A theme switch between rounds (FR-11's theme transition) should carry the "new round" signal; design the transition for that.
- Decision: 2026-10-14 — breakdown planned autonomously at the user's request (experience themes, sound and haptics early on the iPhone; least friction); validated by an independent set check before writing.
- Tracer: entry 1 — theme data from content through core selection, save, PlayVM and render to a whole-frame round change on the iPhone.
- Sequencing: per the user (2026-10-14), themes, sound and haptics come first, then settings and transitions; Normal themes and intense transitions are previewed through dev-panel overrides until Normal mode exists.
- Decision: 2026-10-14 — POC fonts are system font stacks (Futura, Avenir Next, DIN Alternate, ui-rounded are on iOS), awaiting `document.fonts.load` before drawing. AD-15's self-hosted, preloaded faces (EXPERIENCE OQ-5) are deferred.
- Decision: 2026-10-14 — sound is procedural Web Audio (no audio files): zero bytes, no licensing, self-hosted by construction.
- Decision: 2026-10-14 — the cheap glow is proven at 60 fps on the user's iPhone 16 Pro only; the older-device proof is in epic-poc-playtest (carried over there).
- Decision: Normal-mode cues (rising combo build, power-down thud with a heavier haptic, the Kid's soft hum) are added to the FeedbackDirector's cue map by epic-zen-normal-onboarding (noted there).
