# Functional Requirements by Capability

Testable consequences for each `CAP-N` in `spec-numception.md`. FR ids are the PRD's and are bound by the architecture spine; never renumber them. Phase: **[POC]**, **[v1]**, **[Later]**. **Default:** a provisional value the user accepted at PRD finalize; it may be refit, usually through the tuning configuration.

## CAP-1 — Puzzle generation and rules

The generator picks a valid `a ∘ b = c` for the round's operator, fills `n − 3` distractors, and confirms no other triple satisfies the operator. It plans rounds top-down so the answers handed to tier 1 also form a unique-solution puzzle above.

- **FR-1 Unique-solution puzzle** [POC]
  - Any `n` 3–9 and any enabled operator; exactly one valid triple.
  - 100,000 generated puzzles per `n` and operator: an independent checker finds exactly one triple in each.
  - Exactly `n − 3` distractors; cell placement randomised.
  - Numbers stay in the target difficulty's range; negatives only when that content is enabled.
  - Full-round generation never causes a loading state between tiers (NFR-1).
- **FR-2 Round-consistent multi-tier generation** [POC]
  - Classic and Tower rounds pass the uniqueness check at every tier.
  - The tier-2 (and tier-3) puzzle is fully determined before the player starts tier 1.
- **FR-3 Operators by phase** [POC → v1]
  - POC: + and − only; a POC build has no code path serving × or ÷.
  - v1: × and ÷, unlocked through surprise-at-mastery (FR-24). ÷ answers are whole numbers unless fraction content is enabled.
  - Default: negatives arrive in v1 through surprise-at-mastery, after all four operators.
  - [Later] within-round operator mixing, missing-operator mode, powers and roots.
- **FR-4 Soft miss for − and ÷** [POC]
  - Player must tap `c`. Tapping the other valid-reading cell gives a pulse, a ghost arrow to `c`, and "Tap the answer" once.
  - Never a wrong tap: no power cut, no rating loss, combo kept every time in a round (OQ-6 resolved).
- **FR-48 Fractions** [v1]
  - Complexity rises with rating; still exactly one triple; same 100,000-puzzle check.
  - Simplest form; equal values never appear as two different cells.
  - Default: + and − first with like denominators, then unlike. × and ÷ fractions are Later.
- Money and decimals are out of scope.

## CAP-2 — Deterministic, versioned, seeded generation

- **FR-6 Deterministic, versioned generator** [POC]
  - Given seed, position in the tree, difficulty and generator version, always the same puzzle.
  - Each puzzle records generator, difficulty-model and tuning-configuration versions; every telemetry puzzle event carries all three.
  - One generator powers Classic, Tower, Pyramid, Daily Seed and later seeded modes.
  - The generator's interface must allow upward Pyramid generation from the POC (OQ-4).
- **FR-5 Seeded generation** [v1]
  - Same seed and generator version → identical numbers and operators on every platform.
  - Seeds carry puzzle content only: no sender, identity, free text or tracking.
  - Competitive seeds (Daily Seed, challenges) also fix the layout; personal replays randomise it (OQ-7 default, confirmed).

## CAP-3 — Launch, input, solve transition, round collapse

- **FR-7 Launch into play** [POC]
  - Cold start's first interactive frame is a puzzle; no menu or splash.
  - [v1] Or the home-tree glide ending on a puzzle; an opt-in "zoom out to see the tree" beat ≤ 3 s, skippable with a tap.
- **FR-8 Tap-to-solve** [POC]
  - Whole cell polygon is the tap target; a tap on a shared edge does nothing.
  - Tapping a locked cell gives a gentle non-error acknowledgement.
  - Web: click = tap; arrow keys move focus between cells; Enter or Space taps; Esc opens the control surface; visible focus ring.
  - Taps during a transition are dropped with no penalty (OQ-9 default, confirmed).
- **FR-9 Solve transition and round collapse** [POC]
  - A correct tap starts the solve transition that frame, from the tap point where supported; first visible response ≤ 100 ms.
  - First-ever round collapse is long and slow; later ones shorter. Default starting values: ≤ 3 s first, ≤ 1.2 s later (tuning).
  - No guide text or narration during the first-ever collapse or on the first-ever tier-2 puzzle; that discovery is wordless.
  - No end screen, interstitial or loading screen between tiers or rounds.
  - **Zoom as layout:** a tier-2+ puzzle is an overview of its `n` cells, unsolved cells glowing; the player zooms into one lower-tier puzzle at a time; a solve zooms back out.
  - Tap-to-enter; after a solve the next unsolved puzzle is entered automatically; the player may tap any unsolved cell in the overview (OQ-8; pinch still open).
  - Zoom velocity is capped and never accelerates, at every Motion level.
  - Where a cell has the whole puzzle's shape, it visibly becomes the next-tier puzzle; otherwise it is shown contained.

## CAP-4 — Save and resume

- **FR-10 Save every tap, resume exactly** [POC]
  - Killing the app at any moment and relaunching restores the same puzzle, solved cells, tier, mode and active profile.
  - An interrupted transition resumes at its end state.
  - Save failures retry silently; never block play or show an error.
  - Backgrounding pauses the chain window and round time, and blurs the board until the first tap.

## CAP-5 — Round types

- **FR-11 Classic and Tower** [POC]
  - Tower at n=3: 9 tier-1, 3 tier-2, 1 tier-3, with a round collapse after each tier.
  - Finishing a round leads straight into the next through a theme transition.
- **FR-49 Round-type entry points** [v1]
  - Pyramid, Classic, Tower, Rapid Fire and Daily Seed startable from a Play row on the control surface (default; spatial menus are OQ-17).
  - Pyramid is the v1 launch default; starting another type leaves the Pyramid untouched.
- **FR-12 Endless resumable Pyramid / home tree** [v1]
  - To build a tier-k puzzle, the player first finishes `n` tier-(k−1) puzzles.
  - Survives restarts and updates without loss.
  - Zoomed-out home view shows the tree's scale and a "puzzles built" count as a bare number (OQ-20 resolved).
  - Altitude shows landmarks as the tree grows; fog of war hides unbuilt territory; in Zen the fog lifts like mist at dawn.
- **FR-13 Rapid Fire** [v1]
  - One puzzle at a time, no nesting; first error ends the run; death-and-restart animation < 1 s.
  - An earn-only totem absorbs one error per run; totems are never sold. Zen fit is OQ-21.

## CAP-6 — Zen

- **FR-14 Zen** [POC]
  - No time, score, error count or rank shown anywhere in Zen play.
  - Wrong tap: sinking-number response and soft low tone; nothing counts it on screen.
  - After a wrong tap, the next puzzle eases (FR-20).
  - Calm-tagged transitions only. Target success ~85–90%.
  - Every newcomer starts in Zen.

## CAP-7 — Normal

Target success ~75%.

- **FR-15 Scoring and combo** [POC]
  - Points earned at each solve transition, scaled by bucket difficulty, speed against the puzzle's time limit `d`, and combo (formula and `d` derivation in addendum §A2).
  - Points appear only in transitions (point stream) and the round-end flash; no persistent score widget.
  - Combo 1x→2x from consecutive solves inside the chain window; shown only as line glow, width and bloom.
  - Chain window empties → combo cools one step; no points lost.
  - Defaults: 6 s Standard chain window; combo steps 1x, 1.25x, 1.5x, 1.75x, 2x (tuning).
- **FR-16 Power cut** [POC]
  - Wrong tap resets combo to 1x, removes no points, never stops play; the score total never goes down.
  - Wrong taps within 700 ms merge into one power cut; a power cut lasts ≤ 500 ms.
  - Kid profile: softer cue, no red and no bass thud.
- **FR-17 Round-end flash** [POC]
  - Shows round time, points, best combo, clean-round status; fades as the next theme transition arrives; no input needed.
  - A round with only soft misses shows as clean.
- **FR-18 Normal unlock** [POC]
  - After base tutorials, about 10 Zen rounds; announced once as "New: Fast mode". Same for Kid.
  - Before unlock the Mode setting shows only Zen; after, switchable from the control surface any time (takes effect next round, AD-24).
- **FR-19 Chain window setting** [POC]
  - Standard, Relaxed (1.5×) or Off; Kid defaults to Relaxed.
- **FR-50 Overdrive** [v1]
  - Full (2x) combo carried into the top puzzle doubles its points and plays full fireworks (subject to Motion).
  - A power cut before the top puzzle is solved cancels it.
- **FR-51 Graded cooling** [v1] — chain window empty drops one step; only a power cut resets to 1x.
- **FR-52 Clean-round bonus** [v1] — value in tuning; soft misses don't forfeit it.

## CAP-8 — Adaptive difficulty and ratings

Each puzzle gets a prior difficulty from a transparent, versioned feature model (operand size, carries and borrows, operator, ties, multiplier tier, negatives, `n`, near-miss distractors); play outcomes calibrate ratings. Model and formulas: addendum §A2.

- **FR-20 Adaptive selection** [POC: prior + Zen easing; v1: full]
  - Engine chooses `n`, operator and difficulty per round from the player's success, starting at n=3 with +.
  - v1: playtest ≥ 20 players × ≥ 50 puzzles; each player's last-50 success within ±7 points of target (default, refit after POC playtest). Per-player bound; SM-7's ±5 is the fleet median.
  - Switching mode keeps ratings; only the target changes.
- **FR-21 Player and bucket ratings** [POC]
  - Per player per operator and per generator bucket, updated after every answered puzzle.
  - Persist on device; survive updates. New bucket starts from its feature-model prior.
  - Correctness only (OQ-22). Separate K values for players and buckets (tuning).
  - A generator or difficulty-model version change to a bucket's definition resets it to its prior.
- **FR-22 Mastery plateau** [v1]
  - Default: rating change < δ over the last 30 puzzles of an operator while success ≥ mode target; N and δ in tuning.
  - New content at most once per session.
  - Plateau detections and the player's outcome on new content are logged for refitting.
- **FR-47 Level pin** [POC]
  - Pin `n`, operator and/or difficulty band from the control surface; unpinning hands back to the engine.
  - Every new round uses pinned values; ratings keep updating. Available in both profiles (default).

## CAP-9 — Tuning configuration

- **FR-53** [POC]
  - Covers success targets, feature weights, rating K values, mastery thresholds, combo steps, chain window lengths, transition durations.
  - Changing any of them needs no code change; version recorded on every puzzle event.
  - Default: developers can switch configurations in POC playtest builds.
  - [v1] New configurations ship without an app-store release, as data only; never changes features (NFR-6).

## CAP-10 — Onboarding and content introduction

- **FR-23 Guided first rounds** [POC]
  - 2–5 guided rounds: guide line "Find the one that works"; after ≥ 8 s without progress, hint ("Tap 11") with a ghost finger; equation narrated on a correct tap; "Try another one" on a wrong tap, no penalty; "Keep going" on exit.
  - No time pressure. Copy ~8-year-old reading level, one short line at a time, replayable with a tap.
  - Narration also through the accessible layer (aria-live or platform equivalent).
- **FR-24 Surprise-at-mastery** [v1]
  - On a plateau, the next content item appears as one puzzle with a never-seen glyph and an easy problem (easiest bucket for that operator), then guided narration.
  - Normal: grid glitch, then resolve. Zen: a new flower blooms.
  - No screen lists upcoming content; no visible unlock tree.

## CAP-11 — Themes and transitions

Six themes exist in the UX spine: three Normal, three Zen.

- **FR-25 Theme per round** [POC]
  - Different theme each round from the available set; Randomize or Playlist.
  - Every theme meets NFR-4 contrast and colour-independence rules.
- **FR-26 Transitions** [POC]
  - Tagged library (calm/intense; on-tap/after-tap), filtered by mode and Motion.
  - ≤ 3 flashes per second; dark↔light passes through a mid-luminance frame.
  - **Full** (Grown-up default): all the mode allows; intense only at Full and only in Normal.
  - **Calm** (Kid default): calm only, both modes; slower zooms.
  - **Minimal:** zooms become cuts; transitions become crossfades ≥ 400 ms; looping animation stops; [v1] static mini-map of position in the tree.
- **FR-27 Theme pack collection** [v1]
  - Default: packs earned through play milestones; the paid unlock may include packs. Catalog and path: OQ-10.

## CAP-12 — Progression and retention

- **FR-28 Forgiving daily streak** [v1]
  - One solved puzzle (any mode, round type, incl. a single tier-1) in a local calendar day extends it.
  - Missed day with no freeze: reset with no loss message, sound or animation.
  - Shown in the structure (light or glow) and in stats, never as a loss threat.
- **FR-29 Streak freezes** [v1]
  - Earned through play; used automatically on a missed day; cannot be bought.
  - Default: hold at most 2; earn at most 1 per 7 streak days.
- **FR-30 Ripple hint** [v1]
  - Easy band: ≤ 1 distractor faded per puzzle; very easy: ≤ 2; none above easy. `a`, `b`, `c` never faded. Limits in tuning.
- **FR-31 Dot faces** [v1]
  - Dice-style pips for numbers up to ~12. Default: a Kid-profile setting, on by default for the lowest rating band.
  - Same tap-target and contrast rules as numerals.
- **FR-54 Power grid** [v1]
  - Power visibly flows up the Pyramid as puzzles are solved; partly powered = soft-lit.
  - A higher-tier puzzle is enterable only once all `n` feeders are solved and it is fully powered.
  - Never the only unlocked signal (NFR-4).
- Zen constellation is POC (FR-14). [Later] crystals and keepsakes, lightning strike, "??? – N undiscovered" count, greyed collection slots (need a kid-nudge review, OQ-12).

## CAP-13 — Daily Seed and sharing

- **FR-32 Daily Seed** [v1]
  - Identical puzzle content across platforms on the same date; counts toward the streak. Difficulty curve: OQ-16.
- **FR-33 Share card** [v1]
  - Shared through the OS share sheet; result coloured by speed.
  - Grown-up card may include a link opening the same Daily Seed.
  - Kid card is image-only: no link, name, identifier or attribution token.
  - Incoming seed links open as solo play, no reply option.

## CAP-14 — Profiles, parent gate, child safety

- **FR-34 Kid and Grown-up profiles** [POC]
  - Each has its own progress, ratings and stats. First launch is always Kid.
  - Active profile is persistent; relaunch never reverts to Kid.
  - Persistent cue (ring on the menu button and profile indicator) when Grown-up is active.
  - Default: v1 supports multiple local Kid profiles.
- **FR-35 Parent gate** [POC]
  - Guards Kid → Grown-up, For grown-ups, and (v1) purchases, external links, review prompts, platform sign-in.
  - Grown-up → Kid never gated; on that switch, if no PIN exists, the grown-up is asked to set one.
  - Once a PIN exists, Kid → Grown-up requires it. Before any PIN, not gated (default, accepted for POC).
  - Default: forgotten PIN resets via device authentication where available, else only delete-all.
  - Kid-profile gated entries read "Ask a grown-up to open this."
  - Review prompts never during play or transitions, never in Kid.
- **FR-55 Notifications** [v1]
  - Grown-up only, opt-in, off by default. Kid never requests a push token or receives push, including streak reminders.
  - Grown-up streak reminders never use loss language.
- **FR-36 Kid social surface absent** [v1] — challenges, leaderboards, platform sign-in and links do not exist in Kid (not merely disabled).
- **FR-37 No communication features** [POC, permanent] — no chat, messaging, usernames, free-text entry or UGC in any profile.
- **FR-38 For grown-ups** [POC]
  - Behind the gate: what data the app stores and where; delete all local data; (v1) manage purchases.
  - Delete-all removes every profile, rating, stat and save and returns to first-run state.

## CAP-15 — Stats

- **FR-39 Stats views** [POC]
  - Same data captured for both profiles; only the display differs.
  - Kid: growth counts only (puzzles solved, constellation lights, tiers reached, operators learned); never times, accuracy, errors, ranks, comparisons or declines.
  - Grown-up, over 7 days, 30 days and all time: best and average round time, accuracy, best combo, clean rounds, puzzles, rounds, average points, per-operator accuracy and median solve time, round-time trend.
  - [v1] Both: daily streak and Pyramid height. Grown-up adds breakdown by round type (Classic, Tower, Pyramid, Rapid Fire best run, Daily Seed history) and by `n`.

## CAP-16 — Control surface

- **FR-40** [POC]
  - One tap from any play state. Offers Mode, Level pin, [v1] Play, Motion (Full/Calm/Minimal), Chain window, Sound (Effects, Music, Haptics separately), Themes (Randomize/Playlist), Stats, For grown-ups, profile switching.
  - Every setting uses one segmented-control pattern.
  - Opening pauses chain window and round time and blurs the board, so the pause can't be used to study the puzzle; closing returns to the exact state.
  - Kid defaults: Calm motion, Relaxed chain window. OS Reduce Motion maps to Minimal.

## CAP-17 — Sound and haptics

- **FR-41** [POC]
  - Solve tone stepping down one note per tier, with a light haptic. Normal: rising combo build; power-down on a power cut. Zen: soft low tone on a wrong tap. Transitions: a whoosh.
  - Effects default on; music off (design deferred). Effects, music, haptics toggle independently.
  - iOS mute switch respected exactly as native games do. Sound and haptics are never the only feedback.

## CAP-18 — Platform integration and leaderboards

- **FR-42 Leaderboards** [v1, Grown-up only]
  - Opt-in Game Center / Play Games; personal bests first; Pyramid height is the bragging-rights board; global boards opt-in.
  - Never prompted, shown or reachable in Kid.
- **FR-43 Native behaviours** [v1]
  - Haptics, full offline play, correct mute behaviour, platform leaderboards; answers App Store guideline 4.2.

## CAP-19 — Telemetry

Covers both profiles. Kid safety comes from product design, not from disabling measurement (user decision 2026-10-09).

- **FR-44 Puzzle event logging** [POC]
  - Every answered puzzle: features, generator and model versions, bucket, mode, profile type, cell tapped, correctness (incl. soft miss), response time.
  - POC: stored on device, exportable by the team through a developer-only path (default).
- **FR-45 Telemetry upload** [v1]
  - Play and retention events to a first-party endpoint, enough to measure `success-metrics.md`.
  - No name, contact, free text or precise location. Failures never affect play.
  - Never third-party advertising SDKs. Default: third-party analytics or crash services allowed only if contracted as processors and never for ads (OQ-3).

## CAP-20 — Monetization

- **FR-46 One-time unlock** [v1, design deferred]
  - One Grown-up purchase behind the parent gate unlocks extra content; never prompted during play or transitions.
  - Nothing affecting difficulty, score or rating can be bought; earn-only items never.
  - Free/paid split: OQ-13.
