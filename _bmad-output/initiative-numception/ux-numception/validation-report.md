# Validation Report — Numception

- **DESIGN.md:** `/Users/cmelnick/Development/Repos/kakooma/_bmad-output/initiative-numception/ux-numception/DESIGN.md`
- **EXPERIENCE.md:** `/Users/cmelnick/Development/Repos/kakooma/_bmad-output/initiative-numception/ux-numception/EXPERIENCE.md`
- **Run at:** 2026-10-09T11:50:51Z

## Overall verdict
The pair is a strong, decision-dense contract for the play view: every `{token}` reference resolves, component names line up across both spines, and memlog decisions are carried through with assumptions flagged rather than silently invented. The main risks for downstream consumers are token extraction and coverage gaps. The frontmatter holds one hybrid theme (Kiln + Vector Noir), so the other five themes exist only in prose tables. Normal themes have no `soft-miss` hex. The POC Tower round has no flow, and Normal-mode play has no flow either. Several POC surfaces (Normal unlock moment, Zen constellation, control surface) have no states and no component spec.

The two extra reviewers shift the picture from "coverage gaps" to "not shippable to an 8-year-old as specified". Accessibility finds that the first-run theme (Kiln) breaks the spine's own Accessibility Floor: cell boundaries at 1.12:1, a narration highlight identical to the numbers it highlights, a menu button below 3:1, and an unbounded red power-cut flash in Normal. Child safety finds the play loop itself unusually safe, but the protective layer around it unspecified: no stated default profile, a kid/adult toggle a child can flip, and a third-party SDK rule scoped per profile when store rules apply per app. All of it is fixable at token and spec level before PRD.

## Category verdicts
- Flow coverage — adequate
- Token completeness — thin
- Component coverage — adequate
- State coverage — thin
- Visual reference coverage — adequate
- Bloat & overspecification — adequate
- Inheritance discipline — adequate
- Shape fit — strong

## Findings by severity

### Critical (7)

**[Token completeness]** — `soft-miss` has no hex for any Normal theme (§ DESIGN.md → Colors → Normal themes)  
Soft miss applies to − / ÷ in both modes and must "never be red", yet the Normal table has no `soft-miss` row. The grammar says every theme supplies a hex for each role.  
Fix: Add a `soft-miss` row to the Normal table (and `number-sunk`, or mark it Zen-only in the grammar).

**[Accessibility]** — Power-cut flashing has no frequency limit, and children mash buttons (§ DESIGN.md → Components → Power cut; EXPERIENCE.md → Power cut, State Patterns → Error)  
A wrong tap gives a red `{colors.error}` pulse and "lines flicker dark"; next tap accepted immediately. No flicker rate, pulse count or cooldown. A frustrated 8-year-old tapping 4–6×/s sets off 4–6 red flashes a second over a large share of the screen — exactly what WCAG 2.3.1 treats as a red flash, at its most dangerous.  
Fix: One luminance flip per cut; ≤3 flashes in any 1 s across all sources; coalesce wrong taps within 600–800 ms; replace flicker with a monotonic fade; red on cell edge only; design rule: nothing alternates luminance >3×/s.

**[Accessibility]** — Kiln, the first-run theme, has no visible cell boundaries (§ DESIGN.md → Zen themes, Kiln `line`)  
Tile vs sand is 1.12:1 plus an unvalued "soft warm shadow"; locked vs open 1.47:1. WCAG 1.4.11 needs 3:1 — and for Miles, which shapes are cells is the content. This is the first screen he ever sees.  
Fix: Give Kiln a real `line` ≥3:1 against tile and surface, or darken the surface; tokenise and check the shadow; locked tiles get a non-colour cue.

**[Accessibility]** — Narration highlight is the same colour as the numbers (§ DESIGN.md → `equation-narration.highlight`; EXPERIENCE.md Flow 1 step 3)  
Kiln `accent` = `number` = #A14E36; Washi `accent` = `number` = #283A6B. The only teaching mechanism changes nothing visible on the first-run theme. It fails every player, not just disabled ones.  
Fix: Non-colour highlight (scale 1.25×, lift, fill, underline); add voice-over; grammar rule: a highlight differs by ≥3:1 or changes shape/size.

**[Child safety]** — No default profile is stated, and first run cannot ask (§ EXPERIENCE → Foundation; State Patterns "First run"; Profiles)  
First run opens straight into play, so whatever the toggle defaults to is what every child gets. AADC and COPPA both point to a protective default.  
Fix: App starts in kid profile until an adult switches behind a gate; "unverified" = kid everywhere; add a State Patterns row.

**[Child safety]** — A child can flip the kid/adult toggle (§ EXPERIENCE → `control-surface`; Profiles)  
It sits one tap from play beside effects and theme settings. An 8-year-old will find it. "Verified adult" means nothing more than this toggle.  
Fix: Parent gate on kid → adult (not birth year, not arithmetic — maths is literally this child's skill); never gate adult → kid; define "verified adult".

**[Child safety]** — Third-party SDK rule scoped per profile (§ EXPERIENCE → Profiles)  
Kids Category / Families restrictions apply to the app, not a runtime profile. One analytics or crash SDK sending adult-session data exposes the whole app; same for web scripts.  
Fix: "No third-party analytics, advertising or tracking SDKs in the app, all platforms"; first-party, on-device, aggregate telemetry only; record listing decision.

### High (21)

**[Flow coverage]** — Tower round absent from both spines (§ EXPERIENCE.md → IA, Key Flows)  
The POC Tower round (3-tier mini-pyramid, n=3 → 13 puzzles; brainstorm l.51, feature-list l.27) has no IA row, no flow, and no zoom/depth behaviour beyond tier 2.  
Fix: Add an IA row and a short flow, or record in Open Questions that it is descoped.

**[Flow coverage]** — No flow covers Normal-mode play (§ EXPERIENCE.md → Key Flows)  
Power cut, combo heat, timer line, point stream and round-end flash are core POC, but Flow 2 mentions Normal only in passing and is phased Later.  
Fix: Add Flow 3 (Miles or an adult after the Normal unlock): unlock moment, combo build, power cut as failure path, round-end flash, transition.

**[Token completeness]** — Only one, hybrid, theme is machine-readable (§ DESIGN.md frontmatter l.15–65; Colors; Typography)  
The frontmatter mixes Kiln (Zen roles) and Vector Noir (Normal-only roles) — not a shippable theme. The other five themes live only in prose tables, so code mirroring the frontmatter gets one hybrid palette.  
Fix: Emit per-theme token sets (prefixed tokens or one block/file per theme); keep the grammar table as the role contract.

**[Token completeness]** — Menu button fails 3:1 on Kiln (§ DESIGN.md frontmatter `menu-button`)  
`{colors.operator}` on Kiln is ~2.6:1 on `surface` and 2.9:1 on tile — below the spine's own operator floor and WCAG non-text 3:1. It is the only visible control.  
Fix: Give the menu button its own `control` role at ≥ 3:1, or base it on `number`.

**[Component coverage]** — Surfaces with no component in either spine (§ EXPERIENCE.md → IA)  
Zen constellation / garden (POC), Normal unlock moment (POC, Flow 1 step 8), and round overview / tier-2 collapse (Flow 1 climax) — only the cell's solved state is specified; collapse animation and zoom are not.  
Fix: Add rows to both spines, even if marked "not designed".

**[State coverage]** — Normal timer expiry has no state (§ EXPERIENCE.md → Component Patterns "Timer line"; OQ21)  
A core POC Normal outcome is deferred to an open question.  
Fix: Decide the expiry rule and add a state row.

**[State coverage]** — Backgrounding / interruption not covered (§ EXPERIENCE.md → State Patterns)  
Phone call, app switch, lock: does the Normal timer pause, what does resume show mid-transition?  
Fix: Add an "Interrupted / backgrounded" row.

**[Accessibility]** — Power cut makes the board unreadable while play continues (§ DESIGN.md → Normal themes `number-dimmed`)  
Numerals drop to 2.91:1 (Overdrive) or 2.38:1 (Obsidian on facet — the spine's 2.9:1 is measured against bare surface and understates the miss). "Play never stops", so the player chooses the next answer from numbers they can't read; reboot has no duration.  
Fix: Dim glow and lines, not numerals — or `number-dimmed` ≥4.5:1 everywhere; cap dim at ≤500 ms; correct the contrast table.

**[Accessibility]** — Normal timer vanishes on power cut, has no expiry rule, isn't adjustable (§ DESIGN.md `timer-line-dimmed`; EXPERIENCE.md OQ21, Menu button [ASSUMPTION])  
Dimmed timer 1.52 / 1.50 / 2.93:1 against track — time information disappears exactly under maximum stress. Pause is an assumption; no extend option, so WCAG 2.2.1 rests on "Zen exists" — arguable for adults, not for an 8-year-old Normal auto-unlocks for.  
Fix: `timer-line-dimmed` ≥3:1; non-punitive expiry; menu pause as decision; relaxed-timer setting (1.5×, 2×, off), default relaxed for kids.

**[Accessibility]** — Soft miss is colour-only and looks like a wrong tap (§ DESIGN.md `soft-miss`; EXPERIENCE.md → State Patterns)  
Kiln soft-miss vs number 1.74:1, vs `number-sunk` ~1.4:1. The cue meant to teach "valid relation, tap the result" can't be told from "wrong". Breaks 1.4.1, and the pedagogy goes with it.  
Fix: Own non-colour behaviour: single in-place pulse plus a ghost arrow to the result; say "Tap the answer" once; mock it before PRD.

**[Accessibility]** — Vestibular risk rests on one OS switch (§ EXPERIENCE.md → Accessibility Floor, Zoom; DESIGN.md → Zoom-hide, Ripple, Crystal fracture)  
Zoom is navigation, firing every 10–30 s; accelerating dive-ins and full-screen displacement are textbook vestibular triggers. Almost no child's device has Reduce Motion on.  
Fix: In-app motion setting (Full / Calm / Minimal), shown at onboarding, kid default Calm; cap zoom velocity, never accelerate; static mini-map under reduced motion.

**[Accessibility]** — Canvas-only UI shuts out screen readers, Switch Control and keyboard (§ EXPERIENCE.md → Foundation; OQ22; DESIGN.md → control surface)  
VoiceOver/TalkBack users can't reach the mode switch, motion toggle or kid/adult toggle — the settings that fix the other problems. Web build fails 2.1.1 and 4.1.2.  
Fix: Control surface, stats, onboarding as DOM/native over canvas; parallel accessible tree for cells; aria-live narration; arrow keys + Enter on web.

**[Accessibility]** — Onboarding copy doesn't explain the game to an 8-year-old (§ EXPERIENCE.md → Voice and Tone; Flow 1; OQ16)  
"Pick the only solution" assumes he knows an equation is hidden; "solution" and "only" are abstract. The mechanic is explained only after the fact — via a narration invisible in Kiln.  
Fix: Year 3 reading level ("Two numbers make another. Tap the answer."); test with 7–9-year-olds; optional spoken lines; ghost-finger demo on round 1.

**[Accessibility]** — The one visible control fails non-text contrast (§ DESIGN.md → `menu-button.color`)  
Kiln operator on sand is 2.60:1; glyph and position undesigned, so no shape compensates.  
Fix: Draw it in `{colors.number}` (4.52:1); ≥44×44pt visible hit area; conventional ≡ or ⋯ glyph.

**[Accessibility]** — Hairline numerals in Vector Noir (§ DESIGN.md → Typography)  
Avenir Next Ultra Light 200 under bloom: the 19.9:1 figure is meaningless at ~1 px strokes; at the 20 px floor 1/7 and 3/8 blur together.  
Fix: Min numeral weight ≥400 below 32 px, ≥300 at hero; no glow on numerals; legibility-check 1/7, 3/8, 6/9 at 20 px.

**[Child safety]** — Leaderboards not covered by the kid-profile rule (§ EXPERIENCE → Responsive & Platform; State Patterns)  
Aliases, avatars and platform friend links: a contact vector the app doesn't control, and a comparison surface contradicting "no comparisons for kids".  
Fix: Leaderboards and platform sign-in adult-only; never prompt sign-in for kids; classify as social.

**[Child safety]** — Daily Seed share card not profile-gated (§ EXPERIENCE → IA "Daily Seed card")  
Share sheet to Messages/WhatsApp is app-originated outbound contact, possibly carrying time, score or identity.  
Fix: Kid profile: no share, or image-only card with no link, name, identifier or attribution token; add a State Patterns row.

**[Child safety]** — Receiving a challenge or seed link unspecified (§ EXPERIENCE → Flow 2; Seeds; OQ7)  
Rules cover only sending. Anyone can send a child a link; what they see and whether a result goes back decides whether it's a contact channel.  
Fix: Links carry puzzle content only — no sender, free text, return address or tracking; kid profile opens as solo play with no reply affordance.

**[Child safety]** — Result notification implies accounts and a contact graph (§ EXPERIENCE → OQ7b; memlog)  
Telling Don "Chris played" means storing a relationship between two people's devices, plus a push token.  
Fix: Default to manual share-back; push adult-only, off by default, no push token in kid profile.

**[Child safety]** — No parent gate before purchase (§ EXPERIENCE → Inspiration & Anti-patterns; DESIGN → Theme packs)  
Purchase entry point unplaced. Kids Category requires a parental gate before purchases and external links, including rate-this-app and support.  
Fix: Every purchase, external link and review prompt behind the parent gate in kid profile; never in play or transitions.

**[Child safety]** — Shared family device (§ EXPERIENCE → Foundation; Profiles)  
One device, one global toggle. Don leaves it in adult mode; Miles gets challenges, leaderboards and share with no cue. Stats merge — Miles's "You solved 42" includes Dad's solves.  
Fix: Multiple local profiles behind the menu, or adult auto-reverts to kid after backgrounding; persistent adult-mode cue; per-profile stats.

### Medium (28)

**[Flow coverage]** — No returning-player / resume flow (§ EXPERIENCE.md → Foundation)  
"Launch straight into next unsolved puzzle; save every tap" is a stated rhythm with no flow behind it.  
Fix: Add a short flow covering cold open mid-round, including mid-tier-2 and mid-transition resume.

**[Token completeness]** — Kiln `line` contradicts itself (§ DESIGN.md l.20 vs l.202)  
Frontmatter gives `#A14E36`; the Zen table says "none (gaps between tiles)".  
Fix: Pick one value and state what transitions interpolate from when the role is "none".

**[Token completeness]** — `typography.guide` has no size (§ DESIGN.md frontmatter l.62–65)  
The only word-bearing text for an 8-year-old is "not yet specified".  
Fix: Commit a size (≥ `number-floor`) per theme or shared.

**[Token completeness]** — No contrast targets for load-bearing non-number pairs (§ DESIGN.md → Colors)  
`timer-line`/`timer-track`, `error-number`/`error-fill`, locked vs unsolved (Kiln ~1.3:1). Power-cut `number-dimmed` listed as 2.9:1 for Obsidian Facet actually computes ~2.4:1 on facet.  
Fix: State targets for these pairs; decide whether dimmed numerals must stay ≥ 3:1.

**[Token completeness]** — Non-hex values in the Normal table (§ DESIGN.md → Normal themes)  
"cell-unsolved: none" and "cell-active: current combo-glow step" are not hex or `{colors.…}` refs.  
Fix: Write `cell-active: {colors.combo-glow-*}` and `cell-unsolved: transparent`.

**[Component coverage]** — Three components lack kebab-case IDs (§ DESIGN.md → Components)  
`Power cut`, `Sinking number`, `Theme transition` have no IDs or frontmatter entries.  
Fix: Add `power-cut`, `sinking-number`, `theme-transition` and use them in EXPERIENCE.md.

**[Component coverage]** — Soft-miss acknowledgement has no component (§ EXPERIENCE.md → State Patterns)  
A state with a colour but no visual or behavioural spec: what moves, how long, whether it sounds.  
Fix: Add a `soft-miss` row to both spines.

**[State coverage]** — Input during theme transition ambiguous (§ EXPERIENCE.md → Component Patterns "Theme transition")  
"Never blocks the next tap longer than the transition itself" implies taps can be blocked.  
Fix: State whether taps queue, drop, or skip the transition.

**[State coverage]** — No desktop input or focus state (§ EXPERIENCE.md → Interaction Primitives, Accessibility Floor)  
Web is the platform and the POC bed is a desktop browser, yet there is no keyboard/mouse/hover input and no focus treatment.  
Fix: Add a desktop input row (click = tap) and a focus treatment for the menu button.

**[State coverage]** — Control surface, unlock moment, constellation have no states (§ EXPERIENCE.md → State Patterns)  
Open, dismiss mid-Normal, first unlock, empty constellation.  
Fix: Add at least empty and first-show states.

**[Visual reference coverage]** — Visual links point into scratch `.working/` (§ DESIGN.md intro; EXPERIENCE.md intro)  
Links break or go stale once `.working/` is promoted or cleaned.  
Fix: Promote renders to `mockups/` and update links before handoff.

**[Bloat & overspecification]** — Modes table restates source game rules (§ EXPERIENCE.md → Modes)  
Intro says rules are "not restated here" but target success %, combo mechanics and wrong-tap economics are.  
Fix: Keep experience-facing rows only; link the rest.

**[Inheritance discipline]** — Reconcile-pass items dropped without reaching Open Questions (§ reconcile-original-brief.md → Dropped qualitative ideas)  
Zen intensity cap on transitions, kid profile defaulting to Zen, Normal countdown replaced by outline line, operator mixing, Tower round.  
Fix: Add these to Open Questions.

**[Inheritance discipline]** — "Streak" is never defined (§ EXPERIENCE.md l.111, l.181, l.210)  
"Streak", "streak/combo" and "combo" used interchangeably; sources also have a daily streak.  
Fix: Say "combo" if that is meant, or define streak.

**[Inheritance discipline]** — Combo steps drift from sources (§ DESIGN.md → Colors; EXPERIENCE.md → Modes)  
Sources: 1x → 1.2x … → 2x in steps; spines: three glow stops (1x / 1.6x / 2x) with no mapping.  
Fix: State how intermediate steps interpolate between the stops.

**[Accessibility]** — Operator contrast treated as decorative-plus (§ DESIGN.md → Number contrast floor)  
Kiln 2.92:1 on tile, 2.60:1 on sand; Washi 3.28, Moonwater 3.41. Mixing up × and + is a correctness failure, not cosmetic.  
Fix: Hold operators to 4.5:1; derive Kiln operator from accent at ≥90%.

**[Accessibility]** — Colour-vision collisions in Normal (§ DESIGN.md → Normal themes; combo ramps)  
Overdrive error vs magenta solved: 1.05:1 deutan. Obsidian error and lime both read yellow. Combo ramps collapse under protan (1.05–1.06:1); "width and bloom" have no values.  
Fix: Persistent non-colour error mark; combo widths/bloom as tokens; CVD check as grammar requirement.

**[Accessibility]** — Solved and locked rely on low-contrast fills (§ State Patterns; DESIGN.md theme tables)  
Solved 1.12–1.90; locked 1.10–1.47 everywhere; locked has no fallback in Kiln or Moonwater, and tapping it does nothing.  
Fix: Locked = texture + ≥3:1 edge; gentle acknowledgement on locked tap.

**[Accessibility]** — Large-area luminance swings and busy transitions (§ DESIGN.md → Transition looks; EXPERIENCE.md → Reduced motion)  
Reduced motion turns dark→light theme changes into a 200 ms full-screen switch — harsher than full motion. Crystal fracture spins 100–150 high-contrast edges.  
Fix: Crossfade ≥400 ms or via mid-luminance frame; avoid dark/light back-to-back; cap shards; run a flash analyser.

**[Accessibility]** — Tap-target spec under-defined and too small (§ DESIGN.md `tap-min: 44px [ASSUMPTION]`)  
44 is iOS; Android wants 48dp, kids research ~57pt. Zero-inset themes have no dead zone — a fat-finger boundary tap triggers a power cut. Tier-2 miniatures shrink to ~25pt.  
Fix: Inscribed circle ≥48pt (≥56pt kid); edge-ambiguous taps are no-ops; miniatures display-only.

**[Accessibility]** — Normal's punishment and timer placement fight the anti-anxiety stance (§ EXPERIENCE.md → Modes; State Patterns → Error; Sound & Haptics)  
Red, a bass thud, heavy haptic, every light dying, the words "power cut" — and the timer is the outline. Normal "arrives" for Miles after ~10 rounds with no opt-in.  
Fix: Normal opt-in only; softer non-red kid cue, no thud; optional separate timer ring; flashes for personal bests only.

**[Accessibility]** — Guide text has no size, may sit on failing backgrounds, leaves on a timer (§ DESIGN.md `typography.guide`; EXPERIENCE.md → Guide text)  
Kiln passes by 0.02; on `surface-deep` 3.69:1. A slow reader loses the line before finishing (2.2.1).  
Fix: ≥20pt (≥24pt kid) on guaranteed 4.5:1; replace only after interaction or ≥8 s; tap to replay.

**[Accessibility]** — Numeral orientation in radial shapes unspecified (§ DESIGN.md → Shapes)  
Rotated numerals swap 6 and 9 for a child.  
Fix: Always upright; faces where 6/9/1/7 are distinct, or underline 6 and 9.

**[Child safety]** — Stats captured identically for kids and adults (§ memlog; EXPERIENCE → `stats-panel`)  
Errors, accuracy, response times and difficulty state form a learning profile of a child; storage location unstated.  
Fix: Stats stay on-device; keep only what views and difficulty need; adaptive difficulty on-device, never exported.

**[Child safety]** — Engagement mechanics read as streak pressure for kids (§ EXPERIENCE → `combo-glow`; Soft miss; IA Daily Seed; Pack collection)  
Daily seeds, visible empty paid slots and infinite play with no stopping point are AADC nudge patterns — stronger at age 8.  
Fix: No missed-seed state, no daily streaks, no teasing locked slots for kids; a non-blocking "nice place to stop" beat; streak = in-round combo only.

**[Child safety]** — Normal unlock for kids (§ EXPERIENCE → IA; Modes)  
After ~10 rounds a timed mode with red and a thud becomes available; automatic switch unstated.  
Fix: Unlock is an offer; Zen stays kid default; consider softening `error` and the thud.

**[Child safety]** — Web build has no consent or storage story (§ EXPERIENCE → Foundation)  
No OS age signals, shared local storage, CDN logs capture IPs.  
Fix: Strictly necessary cookies only, no analytics scripts, self-hosted fonts; kid-first default.

**[Child safety]** — No transparency or controls surface for parents (§ EXPERIENCE → Control surface)  
AADC and COPPA expect clear privacy info and a way to delete data.  
Fix: "For grown-ups" entry behind the parent gate with storage info and delete-all; kid-readable one-liner.

### Low (23)

**[Flow coverage]** — Flow 1 step 9 mixes POC and v1 (§ EXPERIENCE.md → Flow 1)  
Step 9 introduces × (v1 per feature-list) without a phase label.  
Fix: Tag step 9 "v1".

**[Flow coverage]** — Flow 1 failure path rests on an unconfirmed assumption (§ EXPERIENCE.md → Flow 1)  
The failure path depends entirely on the soft-miss assumption (Open Question 2).  
Fix: Use the guided wrong tap (step 4) as the confirmed failure path; keep soft miss secondary.

**[Token completeness]** — Tier-2 operator opacity is a range (§ DESIGN.md → Colors grammar; Components)  
"25–45%" rather than a committed value.  
Fix: Commit a value per theme.

**[Component coverage]** — Several components are "not designed" (§ Open Question 18)  
`control-surface`, `stats-panel`, `menu-button`, `point-stream` cannot be built yet.  
Fix: None now; keep tracked.

**[State coverage]** — Save failure / storage loss not covered (§ EXPERIENCE.md → Foundation)  
"Save every tap" is a promise with no failure state.  
Fix: Add one row (silent retry; never block play).

**[Visual reference coverage]** — Reconcile file not referenced (§ `.working/sources-digest.md`, `reconcile-original-brief.md`)  
The reconcile file lists dropped ideas a consumer should see.  
Fix: Fold relevant items into Open Questions; leave the files unlinked.

**[Visual reference coverage]** — No screen-level references for menu, control surface, stats, round end (§ Open Question 18)  
Acknowledged.  
Fix: None now.

**[Bloat & overspecification]** — Soft miss described in four places (§ State Patterns, Game-rule Notes, Flow 1, OQ2)  
Four copies of one rule.  
Fix: Keep Game-rule Notes canonical and reference it.

**[Bloat & overspecification]** — Open Questions repeats inline [ASSUMPTION] tags (§ EXPERIENCE.md → Open Questions)  
Items 1, 4, 5, 9 add nothing beyond the inline tag.  
Fix: Optional trim.

**[Bloat & overspecification]** — Spacing scale defined but unused (§ DESIGN.md frontmatter)  
`'1'`–`'6'` never referenced.  
Fix: Drop it or use it in control-surface / stats specs.

**[Inheritance discipline]** — Round-end flash name drifts (§ IA; Components; OQ10)  
End-of-round flash / Round-end flash / Normal end-of-round flash.  
Fix: Use "Round-end flash" everywhere.

**[Inheritance discipline]** — Spine-introduced assumptions to confirm (§ Open Questions)  
Default Normal theme, 4.5:1 floor, menu pauses timer, unskippable narration, `rounded.full` menu, incoming-pack transitions — all tagged.  
Fix: Confirm with the user.

**[Inheritance discipline]** — EXPERIENCE.md frontmatter has no `description` (§ EXPERIENCE.md frontmatter)  
DESIGN.md has one.  
Fix: Add one line.

**[Shape fit]** — Seeds section is thin (§ EXPERIENCE.md → Seeds)  
Mostly Later-phase and repeats an assumption.  
Fix: Fold into Game-rule Notes.

**[Shape fit]** — Theme-pack unlock behaviour sits in DESIGN (§ DESIGN.md → Colors → Theme packs)  
Collection/unlock is behaviour.  
Fix: Keep visual pack anatomy in DESIGN; move unlock to EXPERIENCE → Theme & Transition System.

**[Accessibility]** — Tier-2 operator near-invisible before unlock (§ DESIGN.md → Operator cell)  
~1.2:1 at 25% — foreshadowing the player is meant to notice.  
Fix: ≥2:1 with fog texture, or hide and reveal as an event.

**[Accessibility]** — One-handed reach and orientation (§ Layout; OQ22)  
Menu at top is out of thumb reach; web must not lock orientation (1.3.4).  
Fix: Menu at bottom or mirrored; support landscape on web.

**[Accessibility]** — No text scaling for words (§ Voice and Tone; control surface, stats)  
Custom-drawn UI ignores Dynamic Type / font scale (1.4.4).  
Fix: DOM/native surfaces respect OS text size to 200%.

**[Accessibility]** — Speed signals leak into calm modes (§ EXPERIENCE.md OQ23; IA → Daily Seed)  
Speed-coloured result card is colour-only and invites comparison; hidden Zen timing contradicts "no time pressure".  
Fix: No Zen speed scoring ever; shape/label plus colour; no kid speed comparisons.

**[Child safety]** — Location, camera, mic, contacts not stated as off (§ all docs)  
Unstated.  
Fix: One line: no location, contacts, camera, mic or ATT permission; Daily Seed uses device clock only.

**[Child safety]** — No rule against free text or usernames (§ EXPERIENCE → Profiles)  
Nothing prevents a later name field reaching share cards.  
Fix: No free text that can leave the device; local profile names never in shares, links or leaderboards.

**[Child safety]** — Teacher / smart-board mode (§ EXPERIENCE → Responsive & Platform)  
School use brings school-consent and FERPA-style obligations.  
Fix: Offline, accountless, no rosters until reviewed.

**[Child safety]** — Kid stats guard negatives but not decline-over-time (§ EXPERIENCE → Voice and Tone)  
"Slower than last week" could discourage.  
Fix: "Growth only, never decline", including speed.

## Reviewer files
- `review-rubric.md`
- `review-accessibility.md`
- `review-child-safety.md`

## Deduplicated fix list

Overlapping findings merged into one line each; severity = max of merged findings; sources tagged `[R]` rubric, `[A]` accessibility, `[C]` child safety. 79 raw findings → 62 fixes (7 critical, 17 high, 20 medium, 18 low).

### Critical (7)
1. **Power-cut flash rate** — one luminance flip per cut, ≤3 flashes/s across all sources, coalesce wrong taps in 600–800 ms, fade not flicker, red on edge only. `[A]`
2. **Kiln cell boundaries & `line`** — resolve the `#A14E36` vs "none" conflict by giving Kiln a real ≥3:1 edge (or darker surface), tokenise the shadow, add a non-colour locked cue. `[R][A]`
3. **Narration highlight = number colour** — make highlight a non-colour change (scale/lift/fill), add voice-over, grammar rule "highlight differs ≥3:1 or changes shape". `[A]`
4. **Soft miss** — add `soft-miss` hex to every Normal theme, give it its own non-colour behaviour and a component row in both spines, keep one canonical rule (Game-rule Notes), and stop Flow 1's failure path depending on it. `[R][A]`
5. **Default profile** — app starts in kid profile; "unverified" = kid everywhere; State Patterns row. `[C]`
6. **Parent / profile gate** — gate kid → adult (no arithmetic or birth-year gate), never adult → kid; same gate fronts purchases, external links and review prompts; define "verified adult". `[C]`
7. **Third-party SDKs & web tracking** — no third-party analytics/ads/tracking in the app on any platform; web: strictly necessary cookies, no analytics scripts, self-hosted fonts. `[C]`

### High (17)
1. **Per-theme tokens** — emit machine-readable token sets for all six themes, not one Kiln/Vector Noir hybrid. `[R]`
2. **Menu button contrast** — own `control` role (or `{colors.number}`) ≥3:1, ≥44pt hit area, conventional glyph. `[R][A]`
3. **Power-cut dimmed numerals** — dim glow/lines not numerals, or `number-dimmed` ≥4.5:1; cap ≤500 ms; state contrast targets for timer/error/locked pairs; correct Obsidian 2.9 → 2.4. `[R][A]`
4. **Normal timer** — define non-punitive expiry state, `timer-line-dimmed` ≥3:1, menu pause as decision, relaxed-timer setting (kid default). `[R][A]`
5. **Backgrounding / interruption state** — timer pause, mid-transition resume. `[R]`
6. **Accessible DOM layer & keyboard** — control surface/stats/onboarding as DOM over canvas, parallel accessible tree for cells, keyboard + focus treatment on web. `[R][A]`
7. **In-app motion setting** — Full/Calm/Minimal, kid default Calm, no accelerating zoom, mini-map under reduced motion. `[A]`
8. **Onboarding copy** — Year 3 reading level, tested with kids, spoken lines, ghost-finger demo. `[A]`
9. **Hairline numerals** — minimum numeral weight per size; no glow on numerals. `[A]`
10. **Tower round** — add IA row + flow, or record as descoped. `[R]`
11. **Normal-mode flow** — add Flow 3: unlock, combo build, power cut failure, round-end flash. `[R]`
12. **Missing POC components** — Zen constellation, Normal unlock moment, round overview / tier-2 collapse in both spines. `[R]`
13. **Leaderboards** — adult-only, no platform sign-in prompt for kids, classed as social. `[C]`
14. **Daily Seed share card** — removed or image-only/identifier-free in kid profile. `[C]`
15. **Incoming challenge links** — puzzle content only, no sender/return path; solo play in kid profile. `[C]`
16. **Result notification** — default manual share-back; push adult-only and off; no kid push token. `[C]`
17. **Shared family device** — local profiles or auto-revert to kid; persistent adult cue; per-profile stats. `[C]`

### Medium (20)
1. **Normal opt-in & punishment** — unlock is an offer, Zen stays kid default; softer non-red cue and no thud for kids; optional separate timer ring. `[A][C]`
2. **Streak vs combo** — define "streak" as in-round combo only; no daily streaks, missed-seed states or teasing locked slots for kids; non-blocking stop beat. `[R][C]`
3. **Guide text** — commit `typography.guide` size (≥20pt, ≥24pt kid) on a guaranteed 4.5:1 region; no timed removal; replayable. `[R][A]`
4. **Operator contrast** — hold operators to 4.5:1. `[A]`
5. **Colour-vision collisions** — persistent non-colour error mark; combo width/bloom tokens; CVD check in grammar. `[A]`
6. **Combo step mapping** — map source multipliers onto the three glow stops. `[R]`
7. **Solved/locked fills** — texture + ≥3:1 edge for locked in all themes; acknowledge locked taps. `[A]`
8. **Transition luminance swings** — ≥400 ms or mid-luminance crossfade; avoid dark/light adjacency; cap shards; flash-analyse. `[A]`
9. **Tap targets** — inscribed circle ≥48pt (≥56pt kid); edge-ambiguous taps are no-ops; miniatures display-only. `[A]`
10. **Numeral orientation** — always upright; distinguish 6/9/1/7. `[A]`
11. **Resume flow** — cold open mid-round, mid-tier-2, mid-transition. `[R]`
12. **Normal table non-hex values** — `{colors.combo-glow-*}`, `transparent`. `[R]`
13. **Component IDs** — `power-cut`, `sinking-number`, `theme-transition`. `[R]`
14. **Input during transition** — queue, drop, or skip. `[R]`
15. **Undesigned-surface states** — empty/first-show for control surface, unlock, constellation. `[R]`
16. **Promote `.working/` renders** to `mockups/` and relink. `[R]`
17. **Modes table restates rules** — trim to experience-facing rows. `[R]`
18. **Dropped reconcile items** → Open Questions. `[R]`
19. **Kid stats on-device** — minimal fields, never exported. `[C]`
20. **"For grown-ups" surface** — storage info + delete-all behind parent gate. `[C]`

### Low (18)
1. **Tier-2 operator** — commit one opacity per theme at ≥2:1, or hide and reveal. `[R][A]`
2. **Speed signals / decline wording** — no Zen speed scoring, non-colour speed encoding, kid stats "growth only, never decline". `[A][C]`
3. Flow 1 step 9 — tag "v1". `[R]`
4. Undesigned control-surface / stats / menu / point-stream and their screen refs — keep tracked (OQ18). `[R]`
5. Save-failure state — silent retry. `[R]`
6. Fold reconcile/digest items into Open Questions. `[R]`
7. Trim redundant Open Questions (1, 4, 5, 9). `[R]`
8. Drop or use spacing scale. `[R]`
9. "Round-end flash" naming everywhere. `[R]`
10. Confirm spine-introduced assumptions with the user. `[R]`
11. EXPERIENCE.md frontmatter `description`. `[R]`
12. Fold Seeds into Game-rule Notes. `[R]`
13. Move theme-pack unlock behaviour to EXPERIENCE. `[R]`
14. Menu reachable one-handed; landscape on web. `[A]`
15. OS text scaling to 200% on DOM surfaces. `[A]`
16. State no location/camera/mic/contacts/ATT permissions. `[C]`
17. No free text that leaves the device. `[C]`
18. Teacher mode offline and accountless until reviewed. `[C]`
