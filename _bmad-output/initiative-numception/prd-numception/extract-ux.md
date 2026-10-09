# Extract: UX documents → PRD inputs

Source folder: `../ux-numception/` (DESIGN.md, EXPERIENCE.md, .memlog.md, imports/original-brief.md, reconcile-original-brief.md, review-accessibility.md, review-child-safety.md, review-rubric.md, validation-report.md, .working/sources-digest.md; mockups/key-*.html skimmed). Spines (DESIGN/EXPERIENCE) are `status: final`, updated 2026-10-09, and win over mocks on conflict.

Caveats:
- `imports/original-brief.md` is itself a **summary** of the user's brain dump ("Verbatim intent summary of the UX-relevant parts; the full text is in the session transcript"). Non-UX parts of the original brief are not in this folder.
- The three review files and validation-report.md describe the **pre-fix drafts** (2026-10-08/09). The memlog records that all mechanical fixes and critical/high fixes were then applied; the "Unresolved" section below lists what is still open in the final spines.
- validation-report.md paths point at a `/Repos/kakooma/...` checkout (older repo name). "Kakooma" is trademarked; working title is Numception, final name undecided.

---

## 1. Original brief (imports/original-brief.md, 2026-10-08)

### Vision / core concept
- A nested arithmetic puzzle game. A **round** = n tier-1 puzzles + one final tier-2 puzzle built from the n tier-1 answers. 3 ≤ n ≤ 9.
- Each tier-1 puzzle is a geometric shape with n segments (triangle n=3, pentagon n=5, …). The player finds the unique equation a ∘ b = c among the numbers; there are m = n − 3 distractors; placement is random. **The player selects c.**
- Solving all tier-1 puzzles unlocks tier-2, built from the c values, also with exactly one solution.
- Game UI: shapes chosen per n for 3..9. Example n=3: equilateral triangle split into 4 triangles, values in the outer three, operator in the inner void.
- Each tier-1 puzzle is drawn as if it is one cell of the tier-2 puzzle. As puzzles are solved, their segments are replaced by just the solution.

### Audience
- Zen mode explicitly "for casual players and kids". Normal mode is arcade/competitive (implied: older/competitive players). No further audience definition in the brief.

### Modes / goals
- **Zen mode:** softer colours, less animation and intensity, minimal or no scoring, no time tracking, infinite play, calm music.
- **Normal mode:** arcade. Bright, flashy colours, animation, particles, high contrast, line-based, Tron-like. Scoring, timers or countdowns, competitive.
- Additional mode ideas named: **operator mixing**, **missing operator (operator tiles)**, **fractal/pyramid**.

### Other requirements
- Rich player tracking and stats.
- Continue/resume path for pyramid mode ("thousands of games, never one session").
- Nice animations and graphics.

### Constraints / platforms
- iOS phone + tablet, Android, web/mobile web.

### Scope / deliverable asked of UX
- Mockups / design proposals.

---

## 2. Target users, personas, journeys

- **Stakes (decided):** consumer product, **kid-first**. Default profile is Kid; an unverified player is treated as a kid. No in-app messaging or chat, ever.
- **Persona — Miles, age 8** (hardest case, journey protagonist): can add and subtract, starting simple multiplication.
- **Persona — Don** (adult): does daily brain games at breakfast; has a son, **Chris**, whom he challenges.
- Upstream sources (digest) also put in scope: pre-readers (dot faces ~v1), teachers/smart-board (Later), maths-anxious kids, parents (progress reports, vendor evidence only).

Journeys (EXPERIENCE.md → Key Flows):
1. **Flow 1 — First run to second layer (Miles, POC).** Opens straight into a Kiln tier-1 triangle with "Find the one that works"; ~8 s hint "Tap 11" + ghost finger; equation narrated piece by piece; guided wrong tap → "Try another one"; after 2–5 guided rounds "Keep going"; Zen play with a new theme each round; **climax** = first round collapse revealing a second layer (no words); after ~10 Zen rounds "New: Fast mode"; (v1) a never-seen × appears at a mastery plateau and is narrated. Failure path: Zen wrong tap → number sinks and recovers, nothing counted, next puzzle eases.
2. **Flow 2 — Breakfast challenge (Don, Later phase).** Adult profile → menu → Challenge → send seed link to Chris via OS share sheet (puzzle content only) → plays, sees time in round-end flash → Chris manually shares result back → climax: Don won. Kid profile: Challenge entry absent.
3. **Flow 3 — Breakfast Normal session (Don, may evolve).** Resume into Normal; chain window refills per solve; heat 1x → 1.6x → 2x; speed points in transitions; wrong tap → power cut (combo to 1x, no points lost) or chain window empties (combo cools one step); round collapse + round-end flash; climax: beats best time; closes mid-round, resumes there next open.
4. **Flow 4 — Tower round (POC).** 9 tier-1 → 3 tier-2 → 1 tier-3 (13 puzzles at n=3); camera pulls out at each collapse; tier-3 solve ends the round with a theme transition.

---

## 3. Platforms / form factor

- **Design anchor:** phone portrait (375×667 reference frame, 16 px gutters). Tablet and web adapt: same single-puzzle composition, larger shape, wider gutters, no extra panels in play. Breakpoints undecided.
- **Tech (from engine research):** web-first TypeScript (Phaser 4 or PixiJS v8), wrapped with Capacitor 8 for iOS and Android.
- **Native touches** (also to clear App Store guideline 4.2 "repackaged website" risk): haptics, full offline play, mute-switch handling, Game Center / Play Games leaderboards (v1, adult only).
- Rendering: custom-drawn canvas for play; control surface, stats, guide text and a parallel accessible tree are DOM/native over the canvas.
- Landscape: undecided on phone; supported on web.
- POC test platform: likely desktop browser at phone viewport + real-phone checks [ASSUMPTION].
- Teacher / smart-board mode: Later; big targets; offline and accountless until reviewed.
- **Brief conflict:** brief lists iOS phone + tablet, Android, web as equals; UX makes phone portrait the anchor and the others adaptations.

---

## 4. Core gameplay loop, screens and flows

### Loop
Open app → straight into next unsolved puzzle (no splash, no menu) → tap the result c → solve acknowledged next frame, puzzle collapses to its answer → next tier-1 puzzle → after the last tier-1, **round collapse**: answers become cells of the tier-2 puzzle as the camera pulls out → solve tier-2 → (Normal) round-end flash → **theme transition** into the next round in a new theme. Infinite; no end screen; save every tap; playable for 15 s or 15 min.

- One puzzle on screen at a time, zoomed to fill the frame; tier 2 is an overview of n cells; the player zooms into one tier-1 puzzle at a time; solving zooms back out. Zoom velocity capped, never accelerating.
- **Shapes per n** (initial picks, not locked): 3A split triangle; 4A diamond of diamonds (~1:1.25 w:h); 5B pentagon flower; 6A honeycomb flower; 7A heptagon wedges (7B ring of circles backup); 8A 3×3 grid; 9B nonagon wedges (9C backup; 9A rejected). Operator always in the centre. Where a cell has the same shape as the whole, the cell **becomes** the next-tier puzzle (zoom/dive); wedges fall back to **contains**.
- **Round types (POC):** Classic round (n tier-1 → one tier-2); **Tower round** (3-tier mini-pyramid at n=3, 13 puzzles).
- **− / ÷ ambiguity rule:** a − b = c also reads a − c = b. No rule inversion; the player taps the result c. Tapping the other valid cell = **soft miss** (pulse + ghost arrow to the result, "Tap the answer" once; first occurrence keeps the combo). Flagged for PRD.
- **Seeds** = puzzle content only (numbers + operators), not positions; placement randomized at play time. Competitive seeded play may derive layout from the seed [ASSUMPTION].
- New content (e.g. new operator) arrives unannounced at a mastery plateau with a deliberately easy first encounter, then guided narration explains it.

### Modes
| Rule | Zen | Normal |
|---|---|---|
| Availability | Default for first ~10 rounds | Unlocks after base tutorials ("New: Fast mode") |
| Clock | None | Chain window drawn on the shape outline (`timer-line`) |
| Score | None; each solve adds a light to a lifetime constellation | Points only during transitions (point stream) + round-end flash |
| Combo | None | Consecutive fast solves raise heat 1x → 2x, shown only as line glow/width/bloom |
| Wrong tap | `sinking-number`; nothing counted; difficulty quietly eases | `power-cut`: combo → 1x, **no points lost**, play never stops |
| Transitions | Calm-tagged only | All (intense only at Full motion) |

- Normal timing has two concepts: **elapsed solve time** (feeds score; felt via speed points; round time shown at round end — not a widget) and **chain window** (time before combo bonus lapses; drains around the outline, refills per solve; empty → combo cools one step, no points lost [ASSUMPTION]).
- "Streak" is not used anywhere; **combo** = in-round consecutive-solve heat. No daily streak.
- Difficulty targets (upstream research): Zen ~85–90% success, correctness-only; Normal ~75%, speed+accuracy score.

### Onboarding
- First run: Kid profile, Zen, Calm motion, Kiln theme, single guide line, guided round.
- Copy: "Find the one that works" → after ≥ 8 s "Tap 11" + ghost finger → on correct tap, equation narration (each part scales 1.25× and lifts, also in the guide slot, aria-live) → guided wrong tap "Try another one" (no penalty) → after 2–5 guided rounds "Keep going".
- Onboarding is the one sanctioned exception to "numbers are the only text". Reusable for new content (e.g. new operators). Narration unskippable in guided rounds [ASSUMPTION]. Optional spoken voice-over [ASSUMPTION].

### Round end
- `round-collapse`: solved tier-1 tiles fuse to the answer; camera pulls out; each tier-1 shape becomes a cell of tier 2; tier-2 operator rises to full strength. First-ever collapse is long and slow; later ones faster. No guide line on the first-ever tier-2. Minimal motion: ≥ 400 ms crossfade cut.
- `round-end-flash` (Normal): on the floor below the board — round time (largest), points, best combo as a heat line, clean round as an unbroken outline; fades as the next theme transition sweeps in; no input needed.
- No end screens, interstitials, or loading screens between tiers.

### Stats
- Reached via control surface; DOM/native; per profile; **on-device only**.
- **Kid view (grows only):** "You solved N puzzles", lights in your sky, layers found, operators learned (newest "New:"). No times, accuracy, errors, ranks, comparisons or decline.
- **Adult view:** period 7 / 30 days / All; best and average round time, accuracy, best combo, clean rounds, puzzles, rounds, average points; per-operator accuracy and median solve time; round-time trend; footer "Stored on this device only."
- Mock note: "Same data captured for both profiles, on this device only" (memlog decision) — see conflict in §9.

### Control surface
- `menu-button` always visible top-right (≡ → × when open), 48 pt touch, Esc on web. Opening **pauses both timers and blurs the board** (so pause can't be used to study). Dismiss returns to exact puzzle state.
- Full-frame translucent panel; rows in order: Mode (Zen/Normal); Motion (Full/Calm/Minimal); Chain window (Standard/Relaxed/Off — Normal only); Sound (Effects/Music/Haptics, independent toggles); Themes (Randomize/Playlist); Stats; For grown-ups; profile switch. One `segmented-control` pattern for every setting.
- Profile indicator top-left ("Kid" dot / "Grown-up" ring). Kid → Grown-up and For grown-ups behind parent gate; "Switch to kid" never gated. Kid sees "Ask a grown-up to open this."

### Themes and transitions
- Theme **system**, not a single look. Six themes rendered: Normal — Vector Noir (default Normal [ASSUMPTION]), Overdrive Bloom, Obsidian Facet; Zen — Washi Ink, Moonwater, Kiln (first run / default Zen). Each fills a shared role grammar (surface, accent, line, number, operator, control, focus, cell states, soft-miss, combo-glow, timer, error…).
- New theme every round by default; Randomize across unlocked themes or user-built Playlist.
- Unlock/collection unit = **theme pack** (several themes + pack transitions + optional future audio slot). Example: Ocean pack (Caribbean, Deep Ocean, Arctic; wave, ice fracture, rainfall). Catalog parked.
- Transition library, each tagged calm/intense and with a start mode (on tap = originates at tap point; after tap = whole-screen): Fade/blur (calm), Token interpolation (calm), Ripple (calm, on tap), Snow/embers (calm), Zoom-hide (intense), Radiate (intense, on tap), Crystal fracture (intense, on tap, ≤150 shards). Transition drawn from the incoming theme's pack [ASSUMPTION].
- **Player causality principle:** transitions start the instant the correct answer is tapped.

### Sound & haptics
- Solve tone (pitch steps down one note per tier) + light haptic; Normal combo rising build; Normal wrong tap power-down thud + heavier haptic; Zen wrong tap soft low tone, none/very soft haptic; transition whoosh.
- Defaults: effects on, music off. Respect iPhone mute switch. No information by sound alone. Pack audio = reserved slot only.

### Phasing of surfaces (EXPERIENCE IA; v1/Later placement "still to confirm")
- **POC:** play view, round collapse, Tower round, guided onboarding, Normal unlock, control surface, stats (kid/adult), For grown-ups, round-end flash, theme transition, Zen constellation. POC operators: + and − only.
- **v1:** pyramid home tree (zoom out past your tree), pack collection, Rapid Fire, Daily Seed card, leaderboards (adult only); also ×/÷, fog of war, power grid, dot faces, fractions, clean bonus, $2–5 purchase (sources).
- **Later:** challenges (ghost duels), Operator Sudoku (missing-operator mode), teacher mode, Descent, etc.

---

## 5. Behavioural requirements implied (capabilities)

Launch, persistence, resilience
- Launch directly into the next unsolved puzzle with no splash or menu.
- Persist state on every tap; resume exactly (including mid-tier-2; mid-transition resumes at the transition's end state).
- Save failures retry silently and never block play.
- Full offline play on all POC surfaces, no offline banner.
- Backgrounding/interruption pauses both Normal timers and blurs the board until first tap; an in-progress transition completes to its end state.
- Adult mode reverts to Kid on cold start.

Puzzle generation and rules
- Generate puzzles with exactly one valid a ∘ b = c among n cells (n = 3..9), with m = n − 3 distractors, randomized placement.
- Build tier-2 (and tier-3 in Tower rounds) from the answers of the lower tier, again with exactly one solution.
- Support seeds containing numbers + operators only; randomize layout at play time.
- Detect the "other valid cell" in − / ÷ puzzles and treat it as a soft miss, not a wrong tap.
- Adapt difficulty from on-device ratings; ease difficulty after Zen errors; detect mastery plateaus to introduce new content.

Input
- Single input: tap the answer cell. Whole polygon is the tap target; edge-ambiguous taps are no-ops; locked cells give a gentle non-error acknowledgement.
- Web: click = tap; arrow keys move focus between cells; Enter/Space taps; Esc opens menu; visible focus ring.
- First visible response to a tap within ≤ 100 ms [ASSUMPTION; architecture].

Modes, scoring, feedback
- Provide Zen (no timer/score, constellation reward) and Normal (chain window, combo heat, speed points, power cut with no point loss, round-end flash).
- Gate Normal behind completion of base tutorials (~10 Zen rounds).
- Rate-limit visual feedback: ≤ 3 flashes/s from all sources; coalesce wrong taps within 700 ms into one power cut; power cut ≤ 500 ms, monotonic.
- Chain window length setting Standard / Relaxed (1.5×) / Off.

Onboarding
- Run guided rounds with timed hint (≥ 8 s), ghost finger, equation narration, gentle wrong-tap copy; reuse the pattern for any new content.

Themes, motion, audio
- Change theme every round; support Randomize and Playlist; collect/unlock themes by pack.
- Draw every theme change with a tagged transition; filter by mode (Zen = calm only) and Motion setting.
- Motion setting Full / Calm / Minimal; map OS Reduce Motion to Minimal; Minimal turns all transitions into ≥ 400 ms crossfades, zooms into cuts, stops looping animation, and shows a static mini-map of position in the tree.
- Independent Effects / Music / Haptics toggles; respect the mute switch.

Profiles, stats, safety
- Two profiles (Kid default, Grown-up) with per-profile stats; multiple local profiles = v1 option.
- Parent gate (PIN or platform parental controls) in front of kid → adult, purchases, external links, review prompts, For grown-ups.
- Kid and adult stats views as in §4; all stats on-device.
- For grown-ups: what is stored and where, delete-all, purchases, external links.
- Kid profile: social, challenge, leaderboard and sign-in entries **absent** (not disabled).
- (v1) Daily Seed share card: image-only in kid profile; incoming seed/challenge links open as solo play.
- Flat one-time purchase only (source: $2–5); never prompted in play or transitions.

---

## 6. Accessibility requirements (final spines)

- **No colour-only state:** power cut = red edge + diagonal strike + dimmed lines + thud + haptic; combo = colour + stroke width + bloom (scale 1.0/1.4/1.8 and 1.0/1.5/2.0 [ASSUMPTION]); solved = collapse to one heavier numeral; soft miss = pulse + ghost arrow; locked = dashed edge + texture. Highlights differ ≥ 3:1 or change size/shape. Every new theme needs a deutan/protan check.
- **Contrast targets:** numbers and operators ≥ 4.5:1 (× vs + is correctness); lines, controls, focus, combo glow, timer lines ≥ 3:1; power-cut dimmed numerals stay ≥ 4.5:1; guide text on ≥ 4.5:1 region. Contrast tables computed for all six themes.
- **Flashing:** nothing alternates luminance > 3×/s; dark↔light theme changes pass a mid-luminance frame.
- **Motion:** in-app Full / Calm / Minimal; **Calm is the kid default**; OS Reduce Motion → Minimal; zoom velocity capped, never accelerating; static mini-map under Minimal.
- **Time:** no time pressure in Zen or onboarding; chain window Standard / Relaxed (1.5×) / Off, **kid default Relaxed**; menu and backgrounding pause.
- **Screen readers & keyboard:** DOM/native control surface, stats, guide text; parallel accessible tree (each cell a button named by its number, operator announced); narration via aria-live; full keyboard play on web; DOM surfaces honour OS text size up to 200%.
- **Sound/haptics:** independently toggleable; never the only feedback.
- **Tap targets:** cell inscribed circle ≥ 48 pt all profiles, ≥ 56 pt for kid puzzle cells; menu button 48 pt touch (≥ 44 pt visible) in every profile. n=6 and n=9 measured passing; n=7 on small phones still to verify.
- **Kid readability:** numerals ≥ 20 px floor, always upright, tabular; min weight 300 at ≥ 32 px, 400 below; no glow on numerals; 1/7, 3/8, 6/9 distinct at 20 px. Guide text 24 px, one short line, replaced only after interaction or ≥ 8 s, tap to replay (and re-speak).
- **Copy:** ~8-year-old reading level; test with 7–9-year-olds.
- Transitions should be checked with a flash analyser (review recommendation; not stated in spines).

---

## 7. Child safety, privacy, compliance

Decided (final spines):
- **Default profile Kid; unverified = kid.** Kid → adult only via parent gate (PIN or platform parental controls; **never** arithmetic or birth-year gate). Adult → kid never gated. "Verified adult" = passed the parent gate on this device.
- **App-wide (not per profile):** no third-party analytics, advertising or tracking SDKs on any platform; first-party, on-device telemetry only. Web: strictly necessary cookies only, no analytics scripts, self-hosted fonts (no third-party font CDN).
- No location, camera, microphone, contacts or ATT/tracking-permission prompts. No free text leaves the device. No in-app messaging, ever. No usernames.
- Leaderboards and platform sign-in: adult only, classed as social; never prompted in kid profile.
- Daily Seed share card (kid): image-only — no link, name, identifier or attribution token.
- Incoming seed/challenge links carry puzzle content only (no sender, free text, return address, tracking); open as solo play with no reply affordance.
- Result notifications: none for kids, no push token; adults default to manual share-back; push opt-in, off by default.
- Stats per profile, on-device, never exported; kid stats minimal fields.
- Parent gate also fronts purchases, external links, review prompts, For grown-ups (delete-all, storage info).
- Persistent adult-mode cue (ring on menu button and profile indicator).
- No ads, no pay-to-win, no currencies/loot boxes; flat one-time purchase only.
- Teacher mode (Later): offline and accountless until reviewed.

Open / needs legal-policy research (review-child-safety "Needs legal/policy research"; EXPERIENCE OQ7):
- **COPPA:** directed-to-children vs mixed-audience; actual knowledge given a kid toggle; whether any persistent identifier (push token, Game Center ID, crash-report ID) is collected for kids; verifiable parental consent if any data leaves the device.
- **GDPR / GDPR-K, UK AADC:** age of digital consent per member state; whether on-device adaptive difficulty is profiling; DPIA; AADC 15 standards (defaults, nudges, parental controls, geolocation).
- **Apple:** Kids Category (guidelines 1.3, 5.1.4) vs general 4+ listing — **listing decision not recorded**; Game Center for kid audience; parental-gate requirements; Declared Age Range API reliability.
- **Google Play:** Families policy, self-certified SDK list, target-audience declaration, Play Age Signals API, Play Games Services for under-13s.
- Share/deep links as "disclosure"; attribution parameters; push to minors; web ePrivacy/cookie rules and US state minor-privacy laws (e.g. California AADC); schools (COPPA school exception, FERPA) for teacher mode; acceptable parent-gate patterns for a maths game.
- Platform age inference: Later; candidate bmad-deep-recon run before PRD.
- Crash reporting: limited to what stores permit (review fix; not explicitly specified in spines).

---

## 8. Decisions logged in memlog (with reasons where stated)

| Decision | Reason / note |
|---|---|
| Normal wrong tap costs no points (kills combo only); research's negative SRT score not used for display points | Prior user decision; resolves conflict with difficulty research formula |
| Stakes: consumer, kid-friendly; no in-app messaging/chat | Children in audience |
| Phone portrait is the design anchor | Keystone form factor; tablet/web adapt |
| Shapes decided per n, no universal rule; operator always in centre | UX choice; carve centre where shape lacks one |
| n=4 diamond preferred over square | "Cooler", distinct from n=9 |
| n=6 honeycomb over hexagon | Preference |
| Nesting: cell **becomes** next-tier puzzle where shapes match | Enables zoom/dive-in animations |
| − / ÷: no rule inversion; tap c; other valid cell = soft miss, first occurrence keeps combo; tutorial on introduction | Don't ask kids to tap the whole |
| Theme system with six themes; new theme each round; collectible | "Levels should not all look the same"; like snake skins in snake.io |
| Randomize or playlist theme selection | Player choice |
| Theme transitions are first-class; library of four, plus nature (ripple, snow, crystal fracture) | Variety, like themes |
| Unlock unit = theme pack | Groups themes + transitions |
| Pack catalog parked; pack audio optional slot only | Low priority; "music is the hard part" |
| Sound floor: effects not music; haptics part of sound; effects on, music off; respect mute switch | POC scope |
| Player causality: transitions start the instant of tap, from tap point (refined to on-tap vs after-tap start modes) | "YOU shattered it, YOU caused the ripple" |
| First run straight into game, clean short text, Kiln-like theme | No interruption |
| Guided first rounds (2–5) with hint and narration; reusable for new features | Teach without menus; surprise-then-explain at mastery |
| Onboarding is the one exception to "numbers are the only text" | Needed for instruction |
| Zen default for ~first 10 rounds; Normal unlocks after base tutorials | Gentle start |
| Social restrictions profile-based; challenges (ghost duels) stay Later | Kid safety |
| Visible menu button = one-tap entry to control surface | Don's journey |
| Profiles for beta: kid/adult toggle; later age inference + layered protection | Simplicity now |
| Stats captured identically for kid and adult; kid display simpler, positive | (stated decision) |
| Stats reached via menu, not spatial mechanic | Simplicity |
| Seed = numbers + operators, not positions | Layout randomized |
| Run three review lenses (rubric, accessibility, child safety) | Quality gate |
| Zen draws only calm transitions; open to revisiting | Zen intensity |
| Accepted all mechanical review fixes (flash rate-limit, Kiln contrast, narration by size, soft-miss cue, full theme tokens, numeral weight, DOM accessible layer, interruption states, constellation/unlock/collapse components, combo vs streak, Tower round) | Review outcomes |
| Default profile = Kid; unverified = kid | AADC/COPPA protective default |
| Kid→adult, purchases, external links behind parent gate (not arithmetic) | Child can't flip it; maths gate useless in a maths game |
| No third-party analytics/ads/tracking app-wide | Store Kids/Families rules apply per app |
| Motion setting Full/Calm/Minimal; Calm kid default | Vestibular safety |
| Onboarding copy rewritten for ≈8-year-old | Reading level |
| Two timing concepts in Normal (elapsed solve time; chain window) | Clarify timer |
| Key-screen mocks approved (play n=3, first collapse, onboarding, control surface, stats, round-end flash, n=6/n=9) | — |
| 56 pt kid tap target applies to puzzle cells; menu button stays 48 pt for now | May increase later |
| Adult auto-revert after inactivity: not needed now | Removed from scope (cold-start revert remains) |
| Confirmed: Relaxed chain window kid default; ≡ top-right → ×; "New: Fast mode"; darken Kiln numbers; all mock layout assumptions | — |

Memlog assumptions still flagged: POC test platform; menu pause blurs board; transition from incoming pack; ≤ 100 ms latency; shader/particle mobile budget; n=4 ratio reading; competitive layout from seed; round-end shows time/score.

---

## 9. Open questions and unresolved review findings

From EXPERIENCE.md → Open Questions (final):
1. POC test platform (desktop browser at phone viewport + real phones?).
2. Soft miss on second occurrence; soft miss not yet mocked.
3. Mobile performance budget for shader/particle transitions.
4. Transitions drawn from incoming theme's pack?
5. n=4 diamond ratio (1:1.25 vs 1:1.4).
6. Tap-to-first-response ≤ 100 ms.
7. Age inference from platform signals; COPPA review.
8. Competitive seeded play: fixed layout from seed?
9. Pack catalog, membership of six themes, unlock path, starter pack.
10. Music and pack audio slot.
11. Default Normal theme; are themes mode-bound?
12. Licensed self-hosted webfonts / Android fallbacks for Apple faces.
13. Durations for transitions, round collapse, solve beat.
14. Undesigned visuals: Zen constellation, point stream, Normal unlock (also parent gate, theme/transition settings, all v1/Later surfaces).
15. n=7 (7A vs 7B), n=9 (9B vs 9C) finals; busyness and kid targets on small phones; three-digit numerals at n=9 need ~32 px.
16. Zoom gesture (tap-to-enter vs pinch); does the player choose which tier-1 puzzle to enter?
17. Chain window length; combo width/bloom values.
18. Normal for kids: offer vs automatic; softer non-red cue and no thud in kid profile; kid profile defaulting to Zen.
19. Input during a transition: queue, drop, or skip.
20. Operator mixing within a round.
21. Landscape on phone; tablet/web breakpoints.
22. Upstream: clean bonus, hidden-timer scoring in Zen, score-formula tension with "no points lost", shapes changing per level, product name.

Review findings not (or only partly) resolved in the final spines:
- **Normal opt-in / softer kid punishment** (A + C medium) — still OQ18.
- **Nudge patterns for kids** (C medium): no "nice place to stop" beat specified; no rule against showing undiscovered/locked pack slots (sources describe "??? – 4 undiscovered").
- **Store listing decision** (Kids Category vs general) not recorded (C critical fix, part).
- **Tier-2 operator opacity** still a 25–45% range (R/A low).
- **One-handed reach** (A low): menu kept top-right, not moved/mirrored to bottom.
- **Optional separate timer ring** outside the shape (A medium) not adopted.
- **Avoid dark/light theme adjacency in Zen playlists; flash-analyser testing** (A medium) — only the mid-luminance-frame rule adopted.
- **Ghost-finger demo before asking** (A high) — partly: ghost finger appears with the ≥ 8 s hint, not as a pre-demo.
- **Voice-over for narration** — still [ASSUMPTION].
- **Kid stats data minimisation vs "captured identically"** — see conflicts.
- **Menu button 48 pt vs 56 pt kid** — decided 48 for now, flagged in mocks.
- Kiln number contrast margin was thin (4.52:1); memlog says darkened (now 4.89:1).
- v1/Later phase placement "still to confirm".

---

## 10. Tone, voice, feel

- **Design test:** "Does it express a solve as light moving through the structure?" State is shown as light; **the geometry is the HUD** — no persistent score/timer widgets, no mascots, badges, coins, progress bars.
- **Numbers are the only text in play**; words only in onboarding, control surface and stats.
- Copy for ~8-year-olds: short, calm, present tense, one idea per line; no exclamation marks, urgency or loss threats. Examples: "Find the one that works", "Tap 11", "Try another one", "Tap the answer", "Keep going", "New: Fast mode", "Ask a grown-up to open this.", "Stored on this device only." Never "Wrong!", "Incorrect", red text, "Tutorial complete! 🎉".
- **Normal** = arcade: black void, one neon that heats with combo, red only on a power cut (cell edge only). Tron / Infinitode 2.
- **Zen** = paper and one ink; low intensity, slow, quiet. Monument Valley / Journey.
- Philosophy: slow and steady beats fast and error-prone; difficulty, not the clock, is the anxiety lever; failure is seamless (restart < 1 s); "the maths is the game" (anti-Prodigy).
- Rejected: Candy Crush / Royal Kingdom gloss, coins, chests, interruptive reward screens; ads; tracking; IAP beyond one flat purchase; pay-to-win; visible unlock trees; end screens; loading screens between tiers.

---

## 11. Conflicts / changes vs the original brief

| Brief | UX outcome |
|---|---|
| Tier-1 shape has n segments (triangle, pentagon…) | Per-n shapes with no universal rule; e.g. n=6 honeycomb, n=8 3×3 grid, wedges at 7/9 |
| Player selects c | Kept, but − / ÷ ambiguity adds soft-miss rule |
| Zen: calm music | Deferred — POC effects only, music off by default; pack audio slot reserved |
| Zen: less animation/intensity | Implemented as calm-only transitions + Calm motion default for kids |
| Zen: minimal/no scoring, no time tracking | No visible score/time in Zen; but stats "captured identically" across profiles and hidden-timer Zen scoring is still an open upstream question |
| Zen for casual players and kids | Zen is default for **every** newcomer (~10 rounds); kid/adult is a separate profile axis; whether kids stay in Zen is open |
| Normal: timers or countdowns | No countdown; replaced by chain-window outline line; elapsed time felt via points and round-end flash |
| Normal: competitive | Leaderboards v1 adult-only; challenges/ghost duels Later; Daily Seed v1 |
| Normal: bright, Tron-like (one look) | Theme system: three Normal themes, new theme every round, collectible packs |
| Rich player tracking and stats | Adult stats rich (trend, per-operator); kid stats deliberately minimal/positive; on-device only (tension with "rich tracking" and any cross-device sync) |
| Continue/resume for pyramid | Resume-every-tap captured for POC; endless Pyramid + home tree is v1, not designed |
| Operator mixing mode | Not designed; within-round mixing is OQ20 |
| Missing operator (operator tiles) | Not designed; "Operator Sudoku" is Later |
| Fractal/pyramid | POC Tower round only; full pyramid v1 |
| iOS phone + tablet, Android, web equal | Phone portrait anchor; others adapt |
| Segments replaced by just the solution | Captured in `round-collapse` |

Internal conflict to resolve in PRD: memlog "stats captured identically for kid and adult" (and stats mock "Same data captured for both profiles") vs child-safety requirement "kid stats minimal fields, keep only what views and difficulty engine need".
