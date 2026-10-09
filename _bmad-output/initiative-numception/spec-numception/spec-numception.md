---
id: SPEC-numception
companions:
  - glossary.md
  - functional-requirements.md
  - quality-bars.md
  - success-metrics.md
  - user-journeys.md
  - ../prd-numception/addendum.md
  - ../ux-numception/DESIGN.md
  - ../ux-numception/EXPERIENCE.md
  - ../architecture-numception/architecture-numception.md
sources:
  - ../prd-numception/prd-numception.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Numception

*Working title; final name open (OQ-1). Vocabulary is fixed by `glossary.md`. Each capability's testable detail, keyed by the PRD's FR ids, is in `functional-requirements.md`.*

## Why

A vision plus an opportunity. The vision: a number puzzle where your answer becomes one cell of a bigger puzzle of the same shape. Find the one `a ∘ b = c` among the cells, tap `c`, the puzzle collapses to that answer, and the camera pulls out to the next tier, "Powers of Ten" style. That zoom and solve transition is the defining moment. The opportunity: the category's most common complaints are ads, upsells and math used as a toll booth. In Numception the math *is* the game, with no ads and no pay-to-win. Players are kids about 6–10 practising arithmetic and adults wanting a quick daily mental workout. Both pick it up for 15 seconds or 15 minutes, resume exactly, play offline, and stay in their sweet spot through quiet adaptive difficulty. Parents must be able to hand over the device knowing the child can't chat, buy or follow links out. The first milestone is a quality-gated POC in front of a few people; then v1 public launch on iOS, Android and web.

## Capabilities

Phase tags: **[POC]** first milestone, **[v1]** public launch.

- **CAP-1** [POC; × ÷ and fractions v1]
  - **intent:** The system generates every puzzle (never hand-made) for any `n` from 3 to 9, with exactly one valid triple, and plans multi-tier rounds so each tier's answers form a next-tier puzzle that also has exactly one solution.
  - **success:** An independent checker finds exactly one valid triple in each of 100,000 generated puzzles per `n` and operator, and every generated round passes at every tier.
- **CAP-2** [POC; seeds v1]
  - **intent:** The generator is deterministic and versioned, so any puzzle or round can be reproduced from its seed, position, difficulty and versions.
  - **success:** Regenerating any logged puzzle from its recorded inputs reproduces it exactly on every platform.
- **CAP-3** [POC]
  - **intent:** The player lands straight in the next unsolved puzzle and solves by tapping the answer cell; the solve transition starts that frame, and a completed tier collapses into the next tier's cells as the camera pulls out.
  - **success:** Cold start's first interactive frame is a puzzle; the first visible response to a tap is within 100 ms; no end screen, interstitial or loading screen appears between tiers or rounds.
- **CAP-4** [POC]
  - **intent:** Every tap is saved and the game resumes at the exact state, mid-tier and mid-round.
  - **success:** Killing the app at any moment and relaunching restores the same puzzle, solved cells, tier, mode and profile.
- **CAP-5** [Classic/Tower POC; Pyramid, Rapid Fire, entry points v1]
  - **intent:** The player can play Classic and Tower rounds; in v1, an endless resumable Pyramid as the home tree and Rapid Fire, each startable from the control surface.
  - **success:** A Tower round at n=3 presents 9, then 3, then 1 puzzle with a collapse after each tier and flows into the next round; in v1 the Pyramid survives restarts and updates without loss.
- **CAP-6** [POC]
  - **intent:** The player can play Zen: no clock, no score, gentle errors, and each solve adds a light to a lifetime constellation.
  - **success:** No time, score, error count or rank appears anywhere in Zen play, and a wrong tap is never counted on screen.
- **CAP-7** [POC; Overdrive, graded cooling, clean bonus v1]
  - **intent:** After about 10 Zen rounds the player can play Normal: points by difficulty and speed, combo heat inside a chain window, and a power cut on a wrong tap that kills the combo but never takes points.
  - **success:** The score total never goes down; combo is shown only as line glow and width; the round-end flash shows time, points, best combo and clean-round status without input.
- **CAP-8** [prior and ratings POC; full adaptation and mastery plateau v1]
  - **intent:** The system chooses `n`, operator and difficulty to keep each player near the mode's target success rate (Zen about 85–90%, Normal about 75%), with ratings per player per operator and per generator bucket; the player can pin a level instead.
  - **success:** In a v1 playtest of at least 20 players with at least 50 puzzles each, each player's success rate over their last 50 puzzles stays within ±7 points of the mode target.
- **CAP-9** [POC]
  - **intent:** All difficulty, scoring and pacing parameters live in a versioned, data-only tuning configuration the team can retune often.
  - **success:** Changing any listed parameter needs no code change, and the configuration version is recorded on every puzzle event.
- **CAP-10** [onboarding POC; surprise-at-mastery v1]
  - **intent:** The game teaches through play: guided first rounds, then new content introduced unannounced at a mastery plateau with an easy first puzzle and narration afterwards.
  - **success:** At least 80% of first-time players aged 7–10 solve their first non-guided round without adult help; no screen lists upcoming content.
- **CAP-11** [POC; pack collection v1]
  - **intent:** Each round has a new theme, and a tagged library of transitions carries the player between themes, filtered by mode and Motion setting.
  - **success:** Two consecutive rounds never share a theme while more than one is available; Zen uses only calm transitions; no transition flashes more than 3 times per second.
- **CAP-12** [v1]
  - **intent:** Retention comes from a forgiving daily habit and visible growth: one solved puzzle extends the streak, earned freezes protect it, and easy-band assists (ripple hint, dot faces) and the power grid support young players and show progress.
  - **success:** A single solved tier-1 puzzle extends the streak; a missed day without a freeze resets it with no loss message, sound or animation; freezes cannot be bought.
- **CAP-13** [v1]
  - **intent:** Every player can play the same Daily Seed round each day and share a result card through the OS share sheet.
  - **success:** Two players on different platforms on the same date get identical puzzle content; the Kid-profile card is image-only.
- **CAP-14** [POC; notifications and absent social surface v1]
  - **intent:** The device has a default Kid profile and a Grown-up profile with separate progress, a PIN parent gate on every gated surface, and no communication features in any profile.
  - **success:** First launch is always Kid; once a PIN exists, Kid → Grown-up requires it; Kid-profile social entries do not exist; delete-all returns the app to first-run state.
- **CAP-15** [POC]
  - **intent:** The player can open per-profile stats: a growth-only Kid view and a rich Grown-up view.
  - **success:** The Kid view never shows times, accuracy, errors, ranks, comparisons or declines.
- **CAP-16** [POC]
  - **intent:** One always-visible menu button opens a full-frame control surface holding every setting, which pauses play and blurs the board.
  - **success:** Opening it pauses the chain window and round time and blurs the board; closing it returns to the exact puzzle state.
- **CAP-17** [POC]
  - **intent:** Sound effects and haptics give every beat physical feedback, each toggleable, never the only signal.
  - **success:** Effects default on, music off; on iOS the app respects the mute switch exactly as native games do.
- **CAP-18** [v1]
  - **intent:** The native apps feel like real games: haptics, full offline play, correct mute behaviour, and opt-in Grown-up leaderboards (Game Center, Play Games).
  - **success:** Leaderboards are never prompted, shown or reachable in a Kid profile; every play feature works offline.
- **CAP-19** [logging POC; upload v1]
  - **intent:** The team can measure whether Numception works: every answered puzzle is recorded with its features, versions and outcome, and v1 uploads play and retention events to a first-party endpoint.
  - **success:** POC event logs can be exported for playtest analysis; telemetry failures never affect play; events carry no name, contact, free text or precise location.
- **CAP-20** [v1; design deferred]
  - **intent:** A Grown-up can make one purchase, behind the parent gate, that unlocks extra content.
  - **success:** The purchase is never prompted during play or transitions, and nothing affecting difficulty, score, rating or earn-only items can be bought.

## Constraints

- **No ads, no pay-to-win.** No currencies, loot boxes, consumable purchases, subscriptions, or paid status or cosmetics. Earn-only items (streak freezes, totems) are never sold. Monetization is one ~$2–5 one-time unlock; the POC has no paywall code.
- **Wrong taps never remove points.** Slow and steady beats fast and error-prone. Difficulty, not the clock, is the anxiety lever.
- **Kid safety by design.** No chat, messaging, usernames, free text or user-generated content, ever. Kid is the default profile. Social features, purchases, external links and review prompts sit behind the parent gate. The gate is a grown-up-set PIN, never an arithmetic or birth-year question.
- **Telemetry covers both profiles; Kid and Grown-up capture the same data.** User decision 2026-10-09, closed unless pre-launch legal review finds a blocker (OQ-3). No personal contact data, free text or precise location; no camera, microphone, contacts or ad-tracking prompts; no third-party advertising SDKs.
- **Legal privacy review (COPPA, GDPR-K, UK Children's Code, Play Families) before public launch, not before the POC.** Fallback mitigations in order: aggregate-only Kid telemetry, consent via the parent gate, Zen in the Kid profile as the strictly protected surface.
- **General store listing, not the Apple Kids Category** (leaning; OQ-2), so adults don't read it as a kids-only game.
- **No accounts and no cloud sync in v1.** Progress lives on the device.
- **Offline first.** Every POC and v1 play feature works offline with no offline banner.
- **One codebase for iOS (phone and tablet), Android and web.** Phone portrait is the design anchor; puzzle content, seeds, ratings and scoring are identical across platforms.
- **Store compliance shapes delivery.** No downloaded code that changes features (App Store 2.5.2); tuning updates are data only. Native integration must answer guideline 4.2. Store titles ≤ 30 characters.
- **The renderer prototype gates POC architecture.** It must include the tier zoom with a round collapse. If it misses 60 fps, cut effect density first; if the zoom itself can't hold 60 fps, reopen the engine choice.
- **Geometry is the HUD; numbers are the only text in play.** No persistent score or timer widgets, mascots, badges, coins or progress bars. Words appear only in onboarding, the control surface and stats. Copy is calm, present tense, ~8-year-old reading level, with no exclamation marks, urgency or loss threats; never "Wrong!".
- **Design test:** does it express a solve as light moving through the structure? Normal is a black void with one neon that heats with combo, red only on a power cut (Tron, Infinitode 2). Zen is paper and one ink (Monument Valley, Journey). Anti-references: Candy Crush and Royal Kingdom gloss, Prodigy's math-as-toll-booth, coins, chests and reward screens.
- **Shapes stay flat, 3 ≤ n ≤ 9**, with the operator in the centre (shape per `n` in addendum §A4).
- **Intellectual property.** No "Kakooma" or confusingly similar names anywhere; all art, text and presentation original. The final name passes the clearance checklist (`../research-name-and-trademark/`) before launch and before branding spend. Check for a Tang patent on the puzzle format before launch.
- **Web: strictly necessary cookies only**; self-hosted fonts and assets, no third-party CDN calls at runtime; any web analytics follows FR-45.
- **Zero licensing cost** for the rendering stack; v1 telemetry backend at hobby-scale cost.
- Performance, accessibility, persistence and reliability bars are in `quality-bars.md`.

## Non-goals

- Ads of any kind, in any mode or profile.
- Hand-authored level packs.
- A curriculum, assessment or classroom product in v1; v1 is not marketed to schools.
- Real-time multiplayer and live duels.
- `n > 9`, cube or 3D shapes, money or decimals.
- Math used as a gate; every interaction is the puzzle itself.
- End screens, interstitials or loading screens between tiers.
- Pre-readers below about age 5 as a design target.
- Streak wagers or any mechanic where the player risks something to win more.
- Raising kid session length (SM-C1) or streak survival by pressure or threats.
- **Later (not v1):** ghost-duel challenges (UJ-2), tunnel and bracket races, Operator Sudoku (missing operator), within-round operator mixing, Descent mode, teacher and smart-board mode, player-built rounds, Library of Babel / Atlas, unit packs, powers and roots, × and ÷ fractions, crystals and keepsakes, the lightning strike, "??? – N undiscovered" counts, collection slots (pending OQ-12), platform age signals.
- **Parked:** interlocking shapes, mixed representations, visual fractions, drifting tiles, shapes that change per level.
- **Music:** reserved slot only. The brief's "calm music" in Zen is deferred; revisit for v1 if playtests say Zen feels empty.

## Success signal

- **POC:** in front of a few playtesters, at least 80% keep playing past 10 minutes unprompted, react visibly at their first round collapse and can explain that answers become the next puzzle, and kids aged 7–10 solve their first non-guided round alone, all at a steady 60 fps on the reference devices.
- **v1:** retention by mode and profile reaches D1 ≥ 30%, D7 ≥ 12%, D28 ≥ 5% without any counter-metric worsening. Full metric set in `success-metrics.md`.

## Open Questions

Owner and earliest blocked milestone in brackets. None blocks the POC.

- **OQ-1** Final name? Shortlist: Sumspire, Infinum, Numsummit, Summara, Summalux; "Numception" itself is uncleared. [PO; v1]
- **OQ-2** Confirm the general store listing and the Google Play target-audience declaration (default: mixed, including under-13). [PO; v1]
- **OQ-3** Does the pre-launch privacy legal review find a blocker for Kid telemetry and platform IDs? [PO; v1]
- **OQ-4** How is the endless Pyramid generated upward forever, when each new top must contain the existing top's answer? Bottom-anchored addressing is in place (AD-4). [Arch; v1]
- **OQ-8** Pinch in addition to tap-to-enter? [UX; v1]
- **OQ-10** Theme pack catalog, starter pack, unlock path (earned or paid), and whether themes are mode-bound? [PO + UX; v1]
- **OQ-11** Final shapes for n=7 (7A or 7B) and n=9 (9B or 9C), the n=4 diamond ratio, three-digit numerals at n=9 on small phones? POC ships 7A, 9B, 1:1.25 and decides in playtest. [UX; POC playtest]
- **OQ-12** A "nice place to stop" beat for kids; are undiscovered counts and greyed slots acceptable in the Kid profile? [PO + UX; v1]
- **OQ-13** What is free and what is paid? Deferred until after the POC. [PO; v1]
- **OQ-14** Phone landscape; tablet and web breakpoints? [UX; v1]
- **OQ-15** Should speed count silently toward the Zen rating (hidden-timer scoring)? [Arch; v1]
- **OQ-16** Daily Seed difficulty: one curve for everyone, per-band seeds, or the same seed scaled by difficulty? [PO; v1]
- **OQ-17** Spatial menus (zoom out past the home tree to settings, collection, modes) in v1 or Later? [UX; v1]
- **OQ-18** With no accounts, how do players keep Pyramid and streak progress across a device change? [PO + Arch; v1]
- **OQ-19** Do players see any level, rank or rating, or only indirect growth? [PO; v1]
- **OQ-21** Is Rapid Fire Normal-only, since "first error ends the run" doesn't fit Zen? [PO; v1]
- **OQ-22** Should ratings use speed as well as correctness? Default: correctness only. [Arch; v1]
- **OQ-23** SM-5 retention targets lean on a disputed vendor benchmark; what are they after the 2026 GameAnalytics puzzle report is pulled? [PO; v1]
