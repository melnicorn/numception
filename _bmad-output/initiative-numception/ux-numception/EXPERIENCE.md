---
title: Numception experience
name: Numception
description: How Numception behaves — modes, onboarding, states, transitions, profiles and child safety — for a kid-first nested arithmetic puzzle game.
status: final
created: 2026-10-08
updated: 2026-10-09
sources:
  - ../brainstorm-modes-stickiness-name/brainstorm-modes-stickiness-name.md
  - ../brainstorm-modes-stickiness-name/feature-list-by-phase.md
  - ../research-retention-in-math-puzzle-games/research-retention-in-math-puzzle-games.md
  - ../research-game-engine-selection/research-game-engine-selection.md
  - ../research-arithmetic-difficulty-and-adaptive-scori/research-arithmetic-difficulty-and-adaptive-scori.md
  - imports/original-brief.md
  - ../prd-numception/prd-numception.md
  - ../architecture-numception/architecture-numception.md
---

# Numception — Experience Spine

Working title Numception. Game rules, modes-by-phase, scoring formulas and retention evidence live in the sources above and are not restated here; this spine holds the experience decisions. The PRD wins on conflict; FR numbers below cite it. Visual references are in [mockups/](mockups/); key screens are linked where they apply, and precedence over mocks is set in [DESIGN.md](DESIGN.md).

## Foundation

- **Form factor:** phone portrait is the design anchor. Tablet and web adapt from it.
- **Platform:** web-first TypeScript, wrapped with Capacitor for iOS and Android (per engine research). Native touches: haptics, full offline play, mute-switch handling.
- **UI system:** none for play; custom-drawn canvas. Control surface, stats, guide text and a parallel accessible tree are DOM/native over the canvas. [DESIGN.md](DESIGN.md) is the visual reference; tokens are referenced by role, e.g. `{colors.<theme>-accent}`. Original brief: [imports/original-brief.md](imports/original-brief.md).
- **Stakes:** consumer product, kid-first. Default profile is **Kid**; an unverified player is a kid. No in-app messaging or chat.
- **Privacy, app-wide:** no advertising SDKs or ad tracking on any platform or profile. Telemetry is first-party and covers both profiles: on-device in the POC (FR-44), uploaded from v1 (FR-45). Third-party analytics or crash services only as contracted processors, never for ads. Web: strictly necessary cookies only, self-hosted fonts and assets, no third-party CDN calls at runtime. No location, camera, microphone, contacts or ad-tracking permission prompts. No free text leaves the device. Kid safety comes from what the product leaves out (no chat, messaging, usernames or UGC; gated social, purchases and links), not from turning off measurement.
- **Rhythm:** launch straight into the next unsolved puzzle; no menus on launch; save every tap; playable for 15 seconds or 15 minutes.

## Information Architecture

| Surface | Phase | Reached from | Purpose |
|---|---|---|---|
| Play view (any tier) | POC | App open (resume to next unsolved puzzle) | One puzzle on screen at a time |
| Round collapse (`round-collapse`) | POC | Solving the last tier-1 puzzle | The n answers become the cells of the tier-2 puzzle |
| Tower round | POC | Round sequence | 3-tier mini-pyramid at n=3: 9 tier-1 → 3 tier-2 → 1 tier-3 (13 puzzles); collapse repeats per tier |
| Guided onboarding | POC | First run; first encounter with new content | Narrated walkthrough; reusable |
| Normal unlock (`normal-unlock`) | POC | Completing the base tutorials (~10 Zen rounds) | Normal becomes available |
| Control surface (`control-surface`) | POC | `menu-button` (one tap) | Mode, level pin, settings, stats, profile, For grown-ups |
| Level pin (`level-pin`) | POC | Control surface row | Pin n, operator and/or difficulty band (FR-47) |
| Parent gate (`parent-gate`) | POC | Kid → Grown-up switch; For grown-ups; (v1) purchases, links, review prompt | App PIN set by a grown-up (FR-35) |
| Stats (`stats-panel`, kid / adult view) | POC | Control surface | Progress; per profile |
| For grown-ups | POC | Control surface → parent gate | What is stored and sent, delete-all, (v1) purchases, notifications, external links |
| Round-end flash (`round-end-flash`) | POC (Normal) | Round completion | Round time and score, brief |
| Theme transition (`theme-transition`) | POC | Round completion | Next round in a new theme |
| Zen constellation (`zen-constellation`) | POC | Each Zen solve drops a light | Lifetime reward without points |
| Pyramid home tree (`home-tree`) | v1 | Launch glide; zoom out past your tree | Home = your tree; power grid, fog, height count (FR-12, FR-54) |
| Home-tree zoom-out beat | v1 | Launch, opt-in setting | ≤ 3 s scale reveal, skippable with a tap (FR-7) |
| Daily streak (`streak-light`) | v1 | Home tree; stats | Forgiving daily habit shown as light (FR-28) |
| Streak freezes (`streak-freeze`) | v1 | Beside the streak light; stats | Earned-only insurance, used automatically (FR-29) |
| Ripple hint (`ripple-hint`) | v1 | Easy bands, in play | Solved neighbours fade one distractor (FR-30) |
| Dot faces (`dot-face`) | v1 | Kid setting; lowest rating band default | Numbers ≤ ~12 as dice pips (FR-31) |
| Play entry (`play-entry`) | v1 | Control surface row | Choose round type (FR-49) |
| Pack collection | v1 | Control surface | Collected theme packs |
| Rapid Fire | v1 | Play entry | Death animation is the restart; earn-only totem absorbs one error (FR-13) |
| Overdrive | v1 | Full combo into a round's top puzzle | Double points + fireworks transition (FR-50) |
| Daily Seed card | v1 | Play entry; share | Result card; Kid profile: image-only, no identifiers (see Profiles) |
| Leaderboards | v1 | Control surface (Grown-up only) | Game Center / Play Games |
| Notifications settings | v1 | For grown-ups (Grown-up only) | Opt-in push, off by default (FR-55) |
| Challenges (ghost duels) | Later | Control surface → Challenge (Grown-up only) | Send seed via share link |
| Spatial menus | v1 or Later (PRD OQ-17) | Zoom out past the home tree | Settings, collection and modes as shapes |

No visible unlock tree; no end screen. v1/Later placement confirmed per PRD §6.

## Modes

| Rule | Zen | Normal |
|---|---|---|
| Availability | Default for first ~10 rounds | Unlocks after base tutorials |
| Clock | None | Chain window on the outline (`timer-line`); elapsed time felt through points |
| Score | None; each solve adds a light to the constellation | Points only during the transition; round-end flash |
| Combo | None | Consecutive fast solves raise heat 1x → 2x, shown only as glow |
| Wrong tap | `sinking-number`; nothing counted; difficulty quietly eases | `power-cut`: combo to 1x, **no points lost**; Kid profile gets the soft variant (no red, no thud) |
| Transitions | Calm-tagged only | All (intense only at Full motion) |

Both modes in play: [mockups/key-play-n3.html](mockups/key-play-n3.html). Philosophy: slow and steady beats fast and error-prone. Difficulty, not the clock, is the anxiety lever. Success targets per the difficulty research.

**Timing in Normal — two concepts:**

| Concept | What it is | How it shows |
|---|---|---|
| Elapsed solve time | Time on the current puzzle; feeds score | Not a widget: felt via speed points in the point stream; round time shown in the round-end flash |
| Chain window | Time left before the combo bonus lapses | The outline line drains; refills on each solve; when empty, combo cools one step — no points lost, play continues |

**Combo** = in-round consecutive-solve heat (Normal only); the only in-round term. **Daily streak** (v1, FR-28/29) = consecutive local days with at least one solve, in any mode. It is forgiving: one solved tier-1 puzzle extends it, freezes are earn-only, there are no wagers, and a reset is silent. It is shown as light in the home tree (`streak-light`), never in play and never as a loss. In the Kid profile the word "streak" is not used; kid copy says "days in a row" and shows growth only.

**Solve-time fairness** (architecture AD-8): elapsed solve time counts only live play. Paused time (menu, backgrounding), the blurred-board wait and presentation beats (solve beat, narration, collapse, transitions) are excluded, so neither the menu nor the app's own animation costs the player time.

## Voice and Tone

Numbers are the only text in play. Words appear only in onboarding, the control surface and stats. The v1 home view keeps the rule: its "puzzles built" count is a bare number beside the tree, and landmarks are drawn, not named (resolves PRD OQ-20: numbers only). Copy is written for an ~8-year-old reader: short, concrete words, one idea per line; test with 7–9-year-olds. Onboarding copy in context: [mockups/key-onboarding.html](mockups/key-onboarding.html).

| Moment | Use | Don't |
|---|---|---|
| First prompt | "Find the one that works" | "Pick the only solution", "Find the equation a ∘ b = c" |
| Hint (≥ 8 s, with a ghost finger on the cell) | "Tap 11" | "Hint: the answer is 11!" |
| After the correct tap | Narration only: 7 … + … 4 … = … 11 | A paragraph of explanation |
| Guided wrong tap | "Try another one" | "Wrong!", "Incorrect", red text |
| Soft miss (− / ÷) | "Tap the answer" (once) | "That's the wrong cell" |
| End of guided rounds | "Keep going" | "Tutorial complete! 🎉" |
| Normal unlock | "New: Fast mode" | Countdown, pressure |
| Profile labels | "Kid", "Grown-up" | — |
| Kid, outside the parent gate | "Ask a grown-up to open this." | — |
| Kid stats | "You solved 42 puzzles"; "lights in your sky"; "layers found"; "You can do + − ×"; "New: ×" | Error counts, accuracy %, decline, comparisons |
| Adult stats footer | POC: "Saved on this device." v1: "Saved on this device. Play data helps us tune the puzzles. More in For grown-ups." | "Stored on this device only." once telemetry uploads; "anonymous" |
| Kid streak (v1) | "3 days in a row"; a new day adds light | "Streak", "Don't lose it", "You missed a day", lost counts |
| Grown-up streak reminder (v1, opt-in) | "Today's puzzle is ready." | Loss language: "Your streak ends tonight" |
| For grown-ups data line | What is kept on the device, what is sent (v1) and why, in plain words | Legal boilerplate as the only explanation |
| Tone | Short, calm, present tense | Exclamation marks, urgency, loss threats |

Guide lines can also be spoken (optional voice-over).

## Component Patterns

Behaviour only; visual specs are in DESIGN.md → Components.

| Component | Behavioural rules |
|---|---|
| `puzzle-cell` | Whole polygon is the tap target; edge-ambiguous taps are no-ops. Correct tap: acknowledged next frame, then the puzzle collapses to its answer. Wrong tap: `sinking-number` (Zen) / `power-cut` (Normal). Locked cells give a gentle acknowledgement (slight press, no error sound) and nothing else. |
| `operator-cell` | Display only. Tier-2 operator dimmed until all n tier-1 puzzles are solved. |
| `timer-line` | Normal only; the chain window. Drains around the outline; refills on solve; on empty, combo cools one step. Dims (still ≥ 3:1) during a power cut. Paused by menu and backgrounding. Length set by the Chain window setting. |
| `combo-glow` | Normal only. Fast solve raises one step; chain window lapse cools one step; wrong tap drops to 1x. v1: heat carries into tier 2. |
| `power-cut` | Normal wrong tap. One luminance change, ≤ 500 ms, monotonic fade; wrong taps within 700 ms coalesce into one cut (one sound, one haptic too); ≤ 3 flashes/s from all sources. Kills combo, costs no points, never stops play. **Kid profile → soft variant** (FR-16): a power loss, not an alarm. No red, no thud, softer haptic; same rules otherwise. Visual spec: DESIGN.md `power-cut-kid`; [mockups/key-power-cut-kid.html](mockups/key-power-cut-kid.html). |
| `sinking-number` | Zen wrong tap. Number sinks and recovers; nothing counted. |
| `soft-miss` | Other valid cell in − / ÷. Single in-place pulse + ghost arrow to the result; "Tap the answer" once. Never counted as a wrong tap or a rating loss; keeps the combo every time in a round (FR-4 default; PRD OQ-6). |
| `menu-button` | Always visible, top-right; one tap opens the control surface and the glyph becomes ×; tapping × closes it. Opening **pauses both timers and blurs the board** so the pause can't be used to study. Esc opens it on web. |
| `control-surface` | DOM/native, full-frame over the blurred board. Rows in order: Mode (Zen / Normal; only Zen before the unlock); (v1) Play (round type, FR-49); Level (`level-pin`); Motion (Full / Calm / Minimal); Chain window (Standard / Relaxed / Off — shown only while Normal is selected); Sound (Effects / Music / Haptics); Themes (Randomize / Playlist); Stats; For grown-ups; profile switch. Dismissing returns to the exact puzzle state and resumes timers. [mockups/key-control-surface.html](mockups/key-control-surface.html) (Level row not mocked) |
| `level-pin` | One row with three `segmented-control` groups: n (Auto / 3–9), Operator (Auto / + − × ÷ learned so far), Difficulty (Auto / Easier / Same / Harder) Auto is the default and hands control back to the adaptive engine. A pin applies from the next round; the current round finishes as generated. Available in both profiles (FR-47). In the Kid profile, Operator lists only operators already met, so pinning never reveals content early. |
| `segmented-control` | Every setting uses it. One tap selects an option; one option selected per row (Sound options toggle independently). |
| `profile-indicator` | Shows the active profile; persists across launches (FR-34). Kid → Grown-up and For grown-ups are behind `parent-gate`; Grown-up → Kid ("Switch to kid") is never gated. |
| `parent-gate` | A PIN pad over the control surface, adult-readable copy. First Grown-up → Kid switch with no PIN set: "Set a grown-up PIN" (enter twice); skippable, which leaves Kid → Grown-up ungated until a PIN exists (FR-35). With a PIN: Kid → Grown-up and gated entries ask for it. Forgot PIN → device authentication where available, otherwise delete-all. Device authentication may replace the PIN where the platform offers it. Never an arithmetic or birth-year question. Not mocked. |
| `focus-ring` | Web. Follows keyboard focus across cells, the menu button and DOM controls. |
| `guide-text` | One line at a time in the guide-line slot; replaced only after interaction or ≥ 8 s; tap the line to replay (and re-speak). Never covers a cell. Exposed to screen readers via aria-live. |
| `equation-narration` | After the guided correct tap, highlights each part in order by size, on the board and in the guide-line slot; announced via aria-live. Not skippable in guided rounds; reruns for new content. |
| `round-end-flash` | Normal. Round time, points, best combo and (if earned) the clean-round outline appear briefly; the flash fades as the next theme transition sweeps the frame; no input needed. [mockups/key-round-end.html](mockups/key-round-end.html) |
| `point-stream` | Normal. Rides the solve transition; speed points bigger for faster solves; never blocks input. |
| `round-collapse` | Last tier-1 solve: answers fly into the tier-2 puzzle as the camera pulls out; same at tier 3 in a Tower round. The first-ever collapse is a long, slow pull-out; later ones run the same beats faster. No guide line on the first-ever tier-2 puzzle. Minimal motion: a ≥ 400 ms crossfade cut. [mockups/key-first-collapse.html](mockups/key-first-collapse.html) |
| `zen-constellation` | Each Zen solve adds a light. First show: a single light with no counter. |
| `normal-unlock` | Appears once after the base tutorials ("New: Fast mode"), the same in both profiles (FR-18); play continues in Zen until the player chooses Normal. |
| `stats-panel` | DOM/native, per profile; opened from the control surface, closed via ×. The same data is captured for both profiles; only the display differs. Kid view grows only: puzzles solved, lights in your sky, layers found, operators learned (newest marked "New:"); (v1) days in a row and tree height; no times, accuracy, errors, ranks, comparisons or lost counts. Adult view: period 7 days / 30 days / All; best and average round time, accuracy, best combo, clean rounds, puzzles, rounds, average points; per-operator accuracy and median solve time; round-time trend; (v1) daily streak and freezes held, Pyramid height, breakdown by round type and n. Footer per Voice and Tone. [mockups/key-stats.html](mockups/key-stats.html) |
| `streak-light` | v1. A light in the home tree that brightens one step per streak day, capped at 7 steps; the light sits at the crown of the tree. The day's first solve gives one calm swell (no flash). A freeze used overnight is shown only as one fewer `streak-freeze`. A reset is silent: next launch the light is simply at its first step, with no loss animation, sound or message. Never shown on the play view or as a number in the Kid profile. |
| `streak-freeze` | v1. Up to 2 small lights beside `streak-light` (FR-29 assumption). Earned through play, never bought; one goes out quietly when used. Adult stats show the count; kid stats do not. |
| `home-tree` | v1. On launch the camera glides from the tree to the next unsolved puzzle (part of FR-7's first interactive frame). The opt-in zoom-out beat (≤ 3 s) shows the whole tree first; any tap skips it. Default off (follows FR-7; supersedes PRD UJ-5's automatic zoom-out). Power grid: partly fed puzzles are soft-lit; fully fed ones are lit and enterable. A non-colour cue also marks the difference (dashed vs solid edge). |
| `ripple-hint` | v1, easy bands only. When a neighbouring puzzle is solved, one distractor in the current puzzle fades (calm, ~600 ms); it stays readable (≥ 3:1) and tappable, and a tap on it is still a wrong tap. a, b and c never fade. Never more than the FR-30 band limit. |
| `dot-face` | v1. Numbers up to ~12 drawn as dice pips instead of numerals (FR-31). Upright, same tap target, pip colour `number`. Kid setting (Numbers / Dots), default on for the lowest rating band [PRD assumption]. Narration still says the number. Visual spec: DESIGN.md `dot-face`. |
| `rapid-fire-totem` | v1. One earn-only totem absorbs one error per run: the error shows normally, then the totem visibly breaks instead of the run ending. Never sold. Rapid Fire's mode fit is PRD OQ-21. |
| `theme-transition` | See Theme & Transition System. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| First run | Play view | Kid profile, Zen, Calm motion, Kiln, single guide line, guided round. |
| Cold open / resume | Play view | Straight to the next unsolved puzzle, restored from last tap, in the same theme. Mid-tier-2: reopens the tier-2 puzzle. Mid-transition: lands on the transition's end state, no replay. The active profile persists across launches (FR-34); the Grown-up ring cue shows it. |
| Interrupted / backgrounded | Play view | Same as menu open: both timers stop, board blurred on return until the first tap; a transition in progress completes to its end state. The first tap only unblurs: it is never a cell tap and never a wrong tap. While blurred, the accessible tree hides cell values and announces "Board hidden. Tap to continue.". |
| Input during a transition or collapse | Play view | Dropped silently, no penalty (FR-8 default; PRD OQ-9). The tap still gets the same-frame acknowledgement so it never feels ignored. |
| Save failure | Any | Silent retry; play never blocks. |
| Unsolved / active / solved | Cell | Per DESIGN.md roles; active edges carry combo heat in Normal. |
| Locked / fog | Cells not yet reachable | `puzzle-cell-locked`; Zen = mist lifting on reveal. |
| Power cut (Normal) | Play view | `power-cut`; thud and heavier haptic; reboot at 1x within 500 ms. Kid profile: soft variant, power-down hum instead of thud, light haptic. |
| Wrong tap (Zen) | Play view | `sinking-number`, soft low tone, no haptic or very soft. |
| Wrong tap (guided) | Onboarding | "Try another one", no penalty. |
| Soft miss | − / ÷ puzzles | `soft-miss`; never red; never a wrong tap; keeps the combo every time (FR-4; PRD OQ-6). |
| Chain window empty | Normal | Combo cools one step; `timer-line` refills on next solve; no failure sound. |
| Combo 1x / 1.6x / 2x | Normal | Glow stops with matching stroke width and bloom; sparks at top. |
| Round complete | Play view | `round-collapse` → `round-end-flash` (Normal) → `theme-transition`. |
| Menu open | Play view | ≡ shows ×; timers paused; board blurred under the control surface. |
| Empty stats / constellation | New player | What has grown so far; no zeros or error counts. |
| Streak reset (v1) | Home tree, stats | Silent: the light restarts at its first step; no message, sound or animation. |
| Streak freeze used (v1) | Home tree | One freeze light fewer; nothing else. |
| Offline | All POC surfaces | Full offline play; no banner. |
| Kid profile | Everywhere | Social, challenge, leaderboard, sign-in and notification entries absent (not disabled); no push token; purchases and links only via parent gate. |
| Grown-up profile | Everywhere | Persistent ring cue on the menu button and the profile indicator. |
| Motion: Calm / Minimal | All motion | See Accessibility Floor. |

## Interaction Primitives

- **Tap answer.** The only play input; tap the result c. Desktop: click = tap; keyboard arrows move focus between cells, Enter/Space taps, Esc opens the menu; focus shows `focus-ring`.
- **Tap response ≤ 100 ms** to first visible response (NFR-1). Every tap is acknowledged.
- **Player causality.** Transitions start the instant the correct answer is tapped, in one of two start modes (per transition in Theme & Transition System):
  - **on tap** — originates at the tap point;
  - **after tap** — whole-screen; may follow a short solve beat (~380 ms in mocks).
- **Zoom.** Tier 2 is an overview of n cells, unsolved cells glowing; the player zooms into one tier-1 puzzle at a time; solving zooms back out. Zoom velocity is capped and never accelerates, at every Motion level (FR-9). POC default: tap-to-enter; after a solve the next unsolved puzzle is entered automatically, and the player may tap any unsolved cell in the overview instead (PRD OQ-8 default). Pinch is open.
- **Menu.** One visible button → control surface. Spatial menus: v1 or Later, open (PRD OQ-17).
- **Failure is seamless:** restart < 1 s, no loading screens between tiers, broken combo never stops play.
- **Banned:** ads, interstitials, loading screens between tiers, end screens, visible unlock trees, purchase or review prompts in play or transitions, review prompts in the Kid profile, streak wagers, loss-framed reminders.

## Theme & Transition System

- **Selection:** a new theme every round; two consecutive rounds never share a theme while more than one is available (FR-25). Randomize across unlocked themes or a user-built playlist. The chosen theme is part of the saved round, so a resume reopens in the same look. Themes are collectible; the unlock unit is a pack.
- **Packs:** several themes + pack transitions (+ optional future audio). Within a round change, the transition is drawn from the **incoming** theme's pack, filtered by intensity tag.
- **Intensity:** every transition is tagged **calm** or **intense**. Zen draws only calm transitions; Normal draws both at Full motion. Open to revisiting.

| Transition | Tag | Start mode | Technique (mock) |
|---|---|---|---|
| Fade / blur | calm | after tap | Opacity + blur; new layer opaque before old fades |
| Token interpolation (slow) | calm | after tap | OKLCH colour + numeric token tween; font/material crossfade near halfway |
| Ripple | calm | on tap | WebGL radial displacement, 2D fallback |
| Snow / embers | calm | after tap; melt from tap point | Canvas 2D overlay |
| Zoom-hide | intense | after tap | Camera dive into solved cell / pull out |
| Radiate | intense | on tap | Circular clip from tap point |
| Crystal fracture | intense | on tap | Canvas 2D shards, ≤ 150 |

- Mock durations: 1000 ms (approaches 1–4), 1200 ms (nature), slider 300–2500 ms. Not decided.
- Shader / particle transitions need a mobile performance budget (owned by architecture; Open Question 1).
- References: [mockups/theme-transitions-1.html](mockups/theme-transitions-1.html), [mockups/theme-transitions-2-nature.html](mockups/theme-transitions-2-nature.html); Radiate at round end in [mockups/key-round-end.html](mockups/key-round-end.html).

## Sound & Haptics

| Event | Sound | Haptic |
|---|---|---|
| Solve | Solve tone (pitch steps down one note per tier) | Light |
| Normal combo build | Rising build | — |
| Normal wrong tap | Power-down thud | Heavier |
| Normal wrong tap, Kid profile | Soft power-down hum, no bass thud | Light |
| Soft miss | Soft click | None |
| Locked cell | None | Very light |
| Zen wrong tap | Soft low tone | None or very soft |
| Theme transition | Whoosh | — |

Defaults: effects on, music off. Respect the iPhone mute switch. No information carried by sound alone. Packs may carry audio later (slot only).

## Profiles & Child Safety

Both profiles' control surfaces: [mockups/key-control-surface.html](mockups/key-control-surface.html).

| Rule | Kid (default; unverified = kid) | Grown-up (past the parent gate) |
|---|---|---|
| Parent gate | — | App PIN set by a grown-up (`parent-gate`); device authentication or platform parental controls where available; never an arithmetic or birth-year gate. Guards Kid → Grown-up, For grown-ups and (v1) purchases, external links and review prompts. Grown-up → Kid is never gated. |
| Social: challenges, messaging | Absent | Challenges by share link (Later); no messaging ever |
| Leaderboards, platform sign-in | Absent; never prompted | Available; classed as social |
| Daily Seed share card | Image-only: no link, name, identifier or attribution token | Full card |
| Incoming seed / challenge links | Open as solo play; no reply affordance | Same content; result shared back manually |
| Notifications (FR-55) | None; never requests a push token; no streak reminders | Opt-in, off by default; streak reminders never use loss language; result share-back stays manual |
| Review prompt | Never | Behind the gate; never in play or transitions |
| Motion default | Calm | Full |
| Chain window default | Relaxed | Standard |
| Power cut | Soft variant: no red, no thud | Standard |
| Stats | Kid view; same data captured as for Grown-up (telemetry per Foundation) | Adult view |

- **Incoming links** carry puzzle content only (numbers + operators): no sender, free text, return address or tracking.
- **Shared device:** stats are per profile (a kid's stats never include adult solves). The active profile persists across launches, so a grown-up who hands the phone to a kid switches to Kid first (never gated); the menu button and profile indicator show a persistent Grown-up cue. v1: multiple local Kid profiles on one device (FR-34 assumption).
- **Verified adult** = passed the parent gate on this device. Platform age inference is Later (research pending).
- **For grown-ups** (behind the gate): what is stored and where, delete-all, purchases, external links; one kid-readable line outside the gate ("Ask a grown-up to open this.").
- No ads, no pay-to-win; a flat one-time purchase in v1 (design deferred), no paywall in the POC.

## Game-rule Notes for UX

- **− / ÷ ambiguity:** a − b = c also reads a − c = b. No rule inversion. The player taps the result c. Tapping the other valid cell is a **soft miss** (FR-4): never a wrong tap, keeps the combo; guided text "Tap the answer" runs when − / ÷ are introduced.
- **Seeds** are puzzle content only (numbers + operators), not positions; placement is randomized at play time and saved, so a resume shows the same layout. Competitive seeds (Daily Seed, challenges) also fix the layout so results are comparable (FR-5 default; PRD OQ-7).
- New content arrives unannounced at a mastery plateau (first encounter deliberately easy); the guided narration then explains it.

## Accessibility Floor

Contrast targets live in DESIGN.md → Colors.

- **Colour-blind safety:** no state is colour-only. Power cut = red edge **plus** strike mark, dimmed lines, thud, haptic; the Kid variant carries no colour signal at all (strike + dimming + hum). Power grid (v1) = soft-lit **plus** dashed edge until enterable. Combo = colour **plus** width and bloom. Solved = collapse to one heavier numeral. Soft miss = pulse + ghost arrow. Locked = dashed edge + texture.
- **Flashing:** nothing alternates luminance > 3×/s; power cuts coalesce; dark↔light changes pass a mid-luminance frame.
- **Motion setting** (control surface; OS Reduce Motion maps to Minimal):

| Level | Behaviour |
|---|---|
| Full | All transitions for the mode; capped, non-accelerating zoom |
| Calm (kid default) | Calm-tagged transitions only in both modes; slower zoom |
| Minimal | Every transition a ≥ 400 ms crossfade; zooms become cuts with crossfade; looping animations stop; (v1) static mini-map shows position in the tree |

The effective level is the lower of the player's setting and the OS (OS Reduce Motion on → Minimal). It applies to DOM surfaces too (control surface, stats, constellation).

- **Time:** no time pressure in Zen or onboarding. Normal chain window setting: Standard / Relaxed (1.5×) / Off; kid default Relaxed. Menu and backgrounding pause.
- **Screen readers & keyboard:** control surface, stats and guide text are DOM/native; cells have a parallel accessible tree (each cell a button named by its number, operator announced); narration via aria-live; full keyboard play on web; DOM surfaces honour OS text size up to 200%.
- **Sound / haptics:** independently toggleable; never the only feedback.
- **Tap targets:** inscribed circle ≥ `{spacing.tap-min}` everywhere; kid puzzle cells ≥ `{spacing.tap-min-kid}`; menu button 48 pt touch in every profile. n=6 and n=9 measured and passing; verify n=7 on small phones.
- **Kid readability:** numerals ≥ `{typography.number-floor}`, upright, minimum weights per DESIGN.md; guide text 24 px, one short line, replayable.

## Key Flows

### Flow 1 — First run to second layer (Miles, age 8, can add and subtract, starting simple multiplication)

Steps 1–4: [mockups/key-onboarding.html](mockups/key-onboarding.html). Steps 6–7: [mockups/key-first-collapse.html](mockups/key-first-collapse.html).

1. Miles opens the app. No menu, no splash: Kid profile, Kiln, one tier-1 triangle, and "Find the one that works".
2. He hesitates; after ~8 s "Tap 11" appears and a ghost finger rests on 11.
3. He taps 11. The equation narrates piece by piece: 7 … + … 4 … = … 11, each part growing as it's named.
4. He taps a wrong number in the next guided round; "Try another one" appears, no penalty.
5. After 2–5 guided rounds: "Keep going". He plays on in Zen, a new theme each round, calm transitions drawn from his tap.
6. He solves the last tier-1 puzzle of a round.
7. **Climax:** the round collapses — his answers become the cells of a new puzzle and he discovers a second layer. No words; he solves it.
8. After ~10 Zen rounds and the base tutorials, "New: Fast mode" appears. He can try Normal (Kid profile: soft power cut, Relaxed chain window) or keep going in Zen.
9. (v1) At a mastery plateau, a never-seen × appears in an easy puzzle; the guided narration explains it.

Failure path: Miles taps a wrong number mid-round in Zen → the number sinks and comes back; nothing is counted; the next puzzle eases slightly.

### Flow 2 — Breakfast challenge (Don, daily brain games) — Later phase

1. Don opens the app (Grown-up profile, past the parent gate); a puzzle is already visible.
2. He taps the menu button → Challenge and sends a seed link to his son Chris via the OS share sheet (puzzle content only; no chat).
3. He plays immediately and sees his time in the round-end flash.
4. Later Chris shares his result back manually; Don opens stats. **Climax:** Don won.

Failure path: in the Kid profile, the Challenge entry is absent.

### Flow 3 — Breakfast Normal session (Don) — may evolve

1. Don opens the app; it resumes straight into a Normal puzzle, still in his Grown-up profile. No menu.
2. He solves fast; the chain window refills each solve and the lines heat 1x → 1.6x → 2x; speed points stream through each transition.
3. Failure path: a wrong tap → power cut: red edge, lines dim, combo to 1x, no points lost. (Or he hesitates and the chain window empties: combo cools one step.)
4. He recovers and rebuilds heat within a few puzzles.
5. Round end: the round collapses; the round-end flash shows his round time and score ([mockups/key-round-end.html](mockups/key-round-end.html)).
6. **Climax:** he beats his best time.
7. He closes the app mid-next-round; next open resumes there.

Kid variant: if Miles makes the same wrong tap in Normal, the board loses power with a strike and a hum. There is no red and no thud.

### Flow 4 — Tower round (POC)

1. Nine tier-1 puzzles collapse in threes into three tier-2 puzzles.
2. The three tier-2 answers collapse into one tier-3 puzzle; the camera pulls out each time.
3. Solving tier 3 ends the round with the round's theme transition.

### Flow 5 — Miles keeps his streak and grows his tree (v1; PRD UJ-5)

1. It's Miles's fourth day in a row; he has 2 minutes before school. He opens the app: the camera glides from his home tree to his next unsolved puzzle (no zoom-out beat unless a grown-up turned it on).
2. He solves one puzzle. On the way back out, the `streak-light` at the crown of his tree swells one step brighter. No number, no word.
3. He solves a few more; the power grid feeds the next tier and a little fog lifts.
4. **Climax:** a never-seen × appears in an easy puzzle (3 × 3 = 9); he taps 9 and the narration explains it.
5. He puts the phone down mid-tier. Nothing is lost and nothing nags him: the Kid profile has no notifications.

Failure path: he missed yesterday. With an earned freeze, one `streak-freeze` light is quietly gone and the streak holds. Without one, the light is back at its first step, with no message.

### Flow 6 — Don's Daily Seed (v1; PRD UJ-6)

1. Don opens the control surface → Play → Daily Seed.
2. He plays the fixed round (same content and layout as everyone else's today).
3. The share card shows his result coloured by speed; he shares it to the family chat through the OS share sheet.
4. **Climax:** his card beats his sister's.
5. Tomorrow brings a new seed; today's play also counts toward his streak.

Failure path: in a Kid profile the card is image-only, with no link, name or identifier.

## Responsive & Platform

- Phone portrait is the anchor. Tablet and web: same single-puzzle composition, larger shape, wider gutters; no extra panels in play. Breakpoints not decided.
- Landscape: not decided on phone; supported on web.
- Teacher / smart-board mode (Later): big targets; offline and accountless until reviewed.
- Capacitor builds: haptics, offline, mute switch, Game Center / Play Games leaderboards (v1, Grown-up only) to clear App Store 4.2.

## Inspiration & Anti-patterns

- **Lifted from Monument Valley:** calm geometry, depth from planes and light (Obsidian Facet, Kiln).
- **Lifted from Infinitode 2:** line-based neon arcade energy (Normal).
- **Lifted from Journey:** wordless, emotional transitions; discovery as reward.
- **Rejected — Candy Crush, Royal Kingdom:** gloss, coins, chests, interruptive reward screens.
- **Rejected — ads, ad tracking and third-party ad SDKs, IAP beyond a flat one-time purchase, pay-to-win, streak wagers.**
- **Rejected — gating play behind problems (Prodigy):** the maths is the game.

## Open Questions

Resolved by the PRD (2026-10-09) and removed from this list: POC test platform (§11), second soft miss (FR-4), tap response (NFR-1), competitive seed layout (FR-5), Normal for kids (FR-16, FR-18, FR-19), input during transitions (FR-8), clean bonus (FR-52, v1), age inference (parked; PIN gate in FR-35), daily streak (FR-28). Accepted as decisions on 2026-10-09: incoming-pack transitions, Vector Noir as default Normal theme, chain window and combo scale starting values, the Kid power cut look. Where the PRD keeps a default open, its OQ number is cited.

1. Mobile performance budget for shader/particle transitions (architecture).
2. n=4 diamond ratio, n=7 (7A vs 7B) and n=9 (9B vs 9C) finals, n=7 kid targets on small phones, three-digit numerals at n=9 (~32 px). POC ships 7A, 9B and 1:1.25 and decides in playtest (PRD OQ-11).
3. Pack catalog, starter pack, unlock path; whether themes are mode-bound (PRD OQ-10).
4. Music and the pack audio slot (reserved, not committed).
5. Typefaces: licensed self-hosted webfonts / Android fallbacks for the Apple faces.
6. Transition and solve-beat durations (collapse defaults in FR-9: ≤ 3 s first, ≤ 1.2 s later).
7. Visuals not designed: `zen-constellation`, `point-stream`, `normal-unlock`, `soft-miss`, `parent-gate`, `level-pin`, and v1 `streak-light`, `streak-freeze`, `home-tree`, `ripple-hint`, `dot-face`, `rapid-fire-totem`.
8. Zoom gesture: pinch in addition to tap-to-enter? (PRD OQ-8)
9. Operator mixing within a round.
10. Landscape on phone; tablet/web breakpoints (PRD OQ-14).
11. Hidden-timer scoring in Zen (PRD OQ-15); score-formula tension with "no points lost"; shapes changing per level; name (PRD OQ-1).
12. Kid nudges: a "nice place to stop" beat; undiscovered counts and greyed slots in the Kid profile (PRD OQ-12).
13. Visible skill growth: any level or rank shown, or only indirect growth (PRD OQ-19)? Affects stats and the home tree.
