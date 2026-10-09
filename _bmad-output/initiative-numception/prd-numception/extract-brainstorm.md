---
type: prd-source-extract
source_dir: _bmad-output/initiative-numception/brainstorm-modes-stickiness-name/
sources:
  - brainstorm-modes-stickiness-name.md (intent doc, "Intent")
  - feature-list-by-phase.md ("Feature list")
  - .memlog.md (raw session log, "Memlog") — primary record
  - concept-pitch.html ("Pitch") — also draws on retention + game-engine research exec summaries
  - brainstorm.html ("Keepsake") — visual replay built from the memlog only
session_date: 2026-10-08
working_title: Numception
---

# Extract: Brainstorm (modes, stickiness, name)

Convention: the Memlog is the authoritative record. Where a doc adds something not in the Memlog, that is flagged. "(user)" / "(coach)" = who proposed it in the session.

## 1. Product concept

- **One-liner (Pitch):** "Find the sum hidden in a shape, and your answer becomes one number in a bigger puzzle of the same shape. Then zoom out and keep going."
- **Core mechanic:** numbers sit in a shape; the player taps the three that make `a op b = c`. When solved, the piece transitions unsolved→solved and `c` becomes one cell of the parent puzzle (same shape). The camera zooms out ("Powers of Ten" style) until the finished puzzle is a single cell, and the bigger puzzle builds itself from the player's answers.
- **Defining core (user):** "the inception zoom and the solve transition". Joy is scale-invariant — "the same at every scale".
- **Shape inception (user, "big attraction #2"):** every puzzle is the same shape, made either of numbers or of smaller same-shape puzzles.
- **Transition style is open** — user: "Don't lock into 'fold'."
- **Unifying synthesis (coach, accepted as core):** "Every solve changes the light of a self-similar structure at every scale." Combo glow, power circuit, fog reveal, wrong-tap power cut, surprise glitch, climb/pyramid are all this one idea.
- **Design test (Intent):** "does it express a solve as light moving through the structure?"
- **Two engines carry everything (POC must build both):**
  1. Generator + uniqueness checker — powers seeds, daily, ghosts, teacher mode, Library, Operator Sudoku, top-down.
  2. Rating model (feature-based prior + rating logs) — powers adaptive difficulty, Zen/Normal targets, Zen easing after errors, surprise-at-mastery, per-node difficulty logging.
  - Seeded play couples both: competitive seeds = fixed difficulty curve; personal seeds replay logged adaptive difficulty.
- **State as light:** geometry is the HUD, so Zen vs Normal is "mostly palette and intensity" — two modes are cheap.
- **Structure terms:** tier-1 = puzzle of numbers; tier-2 = puzzle whose cells are tier-1 answers. Layout is flat 3x3 (n=3 example in Pitch). Tower round at n=3 = 9+3+1 = 13 puzzles.

## 2. Target users / audience

Not explicitly defined as a segment in any doc. Audiences implied by ideas:
- General casual players who want a 15-second / 15-minute pick-up game (stickiness traits).
- Pre-readers / young kids — dot faces with subitizing-friendly layouts; reverse tap allowed "at most a young-kid assist".
- Maths-anxious children — Pitch cites retention research: they "disliked a leaderboard whatever their rank", which is why Zen has no points.
- Classrooms / teachers — teacher mode, smart-board team play, co-op bracket by classroom halves.
- Cooking/units pack implies older/adult players (not stated).
- Category players frustrated with monetization (Pitch, retention research).

## 3. Platforms / form factor

- Goal: "a fun POC that can grow into an iOS/Android/web game."
- Mobile-first layout constraints: flat 3x3 for tier 1 and tier 2; no cube; no n>9 (breaks geometry and mobile screens). Zoom-as-layout: tier-2 shown as overview of n glowing cells, zoom into one tier-1 at a time.
- Classroom smart boards (later, teacher mode).
- **Tech (Pitch only, from research — not in Memlog):** "Web-first in TypeScript, wrapped with Capacitor for iOS and Android." Generator, difficulty model and scoring in an engine-agnostic package. Status: "recommended, pending prototype". A 1–2 day glow/particle prototype on a mid-range Android phone and an older iPhone should settle the renderer before architecture is locked.

## 4. Game modes

**Moods (both in POC):**
- **Normal** — neon arcade. Black + one combo-shifting neon + error red. Points awarded at the solve transition, flowing into session then lifetime totals, bigger/brighter for harder pieces. Speed points with combo multiplier (1x, 1.2x … 2x) for consecutive fast solves, shown as glow intensity (no number). Wrong tap = "power cut": kills combo entirely, **no point loss**; glow dies, lines flicker dark, dark red flash/pulse, background fade, bass power-down, reboot at dim 1x. Philosophy: "slow and steady beats fast and error-prone."
- **Zen** — paper + one ink colour. No points, no timer. Each solve drops a light into a lifetime constellation/garden. Wrong tap gentle: "react but don't dominate, never rub their face in it" — number "sinks like a pebble", soft low tone, errors never counted on screen, difficulty quietly eases.

**Round / play structures:**
- Classic round (POC) — n tier-1 puzzles feeding one tier-2 puzzle (feature list marks "inferred").
- Tower round (POC) — bounded 3-tier mini-pyramid for one session (n=3: 13 puzzles).
- Endless resumable Pyramid / tree (v1) — infinite tree; home = your tree.
- Rapid Fire (v1) — no inception; puzzles flash one at a time; first error loses all progress; death animation is the restart (<1 s); earn-only "totem of undying" saves one error.
- Daily Seed (v1), Ghost duels (Later), Tunnel race, Bracket race vs/co-op (Later).
- Operator Sudoku (Later) — operator tiles placed, sudoku-style elimination via tier-2 uniqueness, "No solution" is a scored move.
- Descent / top-down (Later) — start at c, find a and b, reveal tier below, work downward; reverse uniqueness.
- Teacher / smart-board mode (Later).
- Player-built rounds (Later in Feature list; **Parked** in Intent — see conflicts).

## 5. Features by phase

Phase plan was proposed by the coach (POC / v1 / Later / Parked) and "accepted as proposed" by the user. **Important conflict:** the Intent doc says the Memlog "does not list which item went where. The groupings below are inferred and need confirming." The Feature list gives explicit v1/Later placements, with only some items marked *(inferred)*. Only the POC scope is explicitly confirmed in the Memlog's final decision.

### POC — confirmed (Memlog final decision, Intent, Pitch, Keepsake all agree)
"POC = classic round + tower round with zoom/transition at the centre, Zen+Normal, +/− generator with uniqueness, rating logs."
- Classic round + tower round, zoom + solve transition at the centre
- Zen and Normal modes
- +/− generator with uniqueness checking
- Rating logs (Pitch: "will drive adaptive difficulty and surprise-at-mastery")

### POC — additional items per Feature list (not in the Memlog's POC decision)
- Core loop: unsolved→solved transition; points at transition; visible point stream *(inferred)*; speed points + combo multiplier *(inferred)*; combo glow; Normal power cut; Zen sinking pebble
- Inception: zoom-as-layout between tiers; tower round; classic round *(inferred)*; audio pitch steps down one note per tier *(inferred)*
- Content: + and − ("× and ÷ added only if cheap" — not found in Memlog); generator with uniqueness "per puzzle and across the round"; "feature-based difficulty prior + rating logs" (the "prior" is not in Memlog)
- Modes: Zen, Normal, Zen lifetime constellation/garden *(inferred)*
- Feel/UI: open straight into puzzle; save every tap; smallest unit always counts *(inferred)*; failure never stops play / no loading screens between tiers; no end screen; geometry is the HUD; strict palettes; spatial menus + one-tap control surface

### v1 (Feature list)
- Core loop: combo carry into tier-2 + Overdrive (double final points, full fireworks); graded combo cooling; clean bonus
- Inception/Pyramid: fog of war (Zen = mist lifting *(inferred)*); ripple hint + hint budget; endless resumable Pyramid; power-grid wiring; home = your tree; climb landmarks; puzzle count on zoom-out ("625 puzzles built this")
- Content: all four operators; surprise-at-mastery unlocks; surprise presentation *(inferred)*; undiscovered-secrets count *(inferred)*; dot faces to ~12; fractions
- Modes: Rapid Fire; earn-only totems
- Social/seeds: seeded generation; Daily Seed + share card
- Business: one-time $2–5 purchase

### Later (Feature list)
- Lightning strike (Zen: tree/river delta *(inferred)*); crystals/keepsakes; descent/top-down mode; pyramid fog map
- Units packs; powers/roots as surprise content; Operator Sudoku + "No solution" (pencil marks to be tested)
- Ghost duels; tunnel race; bracket race (vs + co-op); teacher/smart-board mode; player-built rounds; Library of Babel specimens + Atlas; Pokédex greyed slots

### Parked (Feature list)
Interlocking shapes; mixed representations; visual fractions; drifting tiles; live real-time duels; shape changes per level.

## 6. Stickiness / retention mechanics

From Trait Transfer (user traits, coach mechanics):
- "Pick up for 15 seconds or 15 minutes and put down with no pressure" (user). Smallest unit ~10 s tier-1 puzzle always counts — powers grid, extends streak.
- Opens straight into next unsolved puzzle; no menus on launch; save after every tap.
- Super Meat Boy-style seamless failure: instant restart (<1 s), broken combo never stops play, no loading screens between tiers.
- "Infinite by default": no end screen; next round assembles at the edge of view.
- **Surprise at mastery** replaces levels/unlock tree: new operators/packs arrive unannounced as a piece with a never-seen glyph at a mastery plateau (groove detection from ratings); first encounter deliberately easy (3²=9); "discovery is the unlock". Normal: grid glitch then resolve; Zen: new flower blooms.
- Collection: "??? – 4 undiscovered" count, never what they are; Pokédex greyed slots ("7 of 30 rare round types").
- Long-game progression: endless tree as home; fog of war / territory pushed out of fog; climb as altitude with landmarks (Eiffel Tower, Everest, edge of space, Moon; user's "Mt Algonquin"); puzzle count on zoom-out; crystals/keepsakes; lightning strike on top-level completion.
- Zen lifetime constellation/garden.
- Combo, Overdrive, clean bonus (Normal).
- Social hooks: Daily Seed with Wordle-style share card coloured by speed; ghost duels; Library of Babel discovery ("Discovered by…", seeds holding earn-only gifts); Atlas map.
- Audio depth cue: pitch drops one note per tier.
- Retention research (Pitch): leaderboards/expected rewards backfire for anxious kids → Zen has no points.

## 7. Monetization

- User "hates pay-to-win"; prefers "flat one-time $2-5 purchase over ads or IAP".
- No ads, no IAP, no pay-to-win. Totems (and Library gifts) are earn-only, never bought.
- Pitch rationale (retention research): category's biggest complaints are monetization — membership upsells, ads every round, "math that gates the game instead of being the game". "Numception's math is the game."

## 8. Name decision

- **Naming punted — "too early."** Working title: **Numception**.
- **Do not call the project Kakooma** — trademarked; old GitHub repo deleted; remove all references.
- Shortlist kept: **Sumspire, Infinum, Numsummit, Summara, Summalux**.
- "Innumerable" suggested as a tagline (coach).
- Rationale: Latin *summa* = "sum" and "highest point" (root of summit) — covers maths + climb.
- Rejected/not landing: Sumryse (user dislikes "ryse" spelling). Other coinages floated, not kept: Trinode, Numbolt, Glyfra, Fractl, Numer8, Digxpanse, Summit, Numberless, Voltsum, Lumen8, Numbral, Nestum, Enfold, Zenith, Zenumb, Summa, Numsumma. Coach favourites were Sumspire + Infinum.

## 9. Explicit decisions (with reasons)

| Decision | By | Reason |
|---|---|---|
| Transition style left open, not "fold" | user | The real thing is the unsolved→solved transition |
| Ripple hint kept as easy/simple-mode assist only | user | — (neighbour effects otherwise gimmicky) |
| Hint budget k=1 easy, k=2 very easy; never fade a/b/c | coach (adopted) | Many-neighbour layouts could eliminate too much (user caveat) |
| Normal wrong tap: kill combo, no point loss, painful feel | user | "slow and steady beats fast and error-prone" |
| Zen wrong tap: gentle | user | "never rub their face in it" |
| Fractions in, escalating complexity | user | — |
| Dot faces (dice-style, up to ~12), not dominoes | user | Subitizing-friendly for young kids |
| Operator mode: never say "wrong"; player judges proposed tier-2 | user | — |
| Flat 3x3, no cube, n≤9; Pyramid is the "extreme" | user | n>9 breaks geometry and mobile screens |
| One-time $2–5, no ads/IAP, totems earn-only | user | Hates pay-to-win |
| Single-tap shortcut to control surface | user | Spatial nav OK "in theory" but needs fast access to settings |
| Minimal line/shape UI (Monument Valley, Infinitode 2, Journey) | user | "beats busy every time" vs Candy Crush, Royal Kingdom |
| Naming punted; working title Numception; drop Kakooma | user | Too early; Kakooma is TM |
| Phase plan accepted as proposed | user | — |
| POC scope (see §5) | session | Builds the core moment + both engines |

## 10. Rejected ideas (with reasons)

- Neighbour effects #2 (solved c becomes tile in neighbour), #4 (pressure: shuffle/tick/decoy), #5 (solve-order bonus) — "gimmicky".
- Reverse tap as a mode — killed; at most a young-kid assist.
- Par time / par taps — "would just be n taps until operator swapping (late-game)".
- Cube / giant n (n>9) — breaks geometry and mobile screens.
- Literal dominoes — corrected to dice-style dot faces.
- Money / decimals — not for now (money "doubtful vs decimals"; decimals not wanted yet).
- Split-screen duel — "doubtful" (Intent lists as rejected; Feature list parks "live real-time duels").
- Purchasable totems — user first said "won or purchased", later decided earn-only.
- Name Sumryse.

**Parked (not rejected):** interlocking/shared-cell shapes (maybe a separate future game); mixed representations; visual pie/bar fractions; drifting tiles; reverse authorship / player-built rounds (Intent); bracket, tunnel, co-op races and bottom-vs-top (Intent only — see conflicts).

## 11. Open questions

- **How far can seeds go?** (user flag) Sketch: `puzzle = f(rootSeed, treePath, difficulty, generatorVersion)`. Unresolved: conflict with adaptive difficulty; upward-infinite pyramid generation (each new top must contain existing top's answer).
- **Pencil marks in Operator Sudoku** (count of valid triples per ghost operator) — unsure, test.
- **Clean bonus** — Intent: "proposed and not decided"; Feature list: v1.
- **Shapes changing per level** (triangle of pentagons of squares) — breaks or enriches inception? Undecided.
- **Name** — punted.
- **Phase assignments for v1/Later** — Intent says inferred and need confirming.
- **Renderer/tech stack** — pending 1–2 day glow/particle prototype (Pitch).
- Wrong-tap question was parked then resolved in-session (Keepsake marks it resolved).

## 12. Tone / voice / feel

- Calm Zen vs neon arcade Normal; "Closer to Monument Valley than to Candy Crush."
- "Geometry is the HUD." No persistent score/timer widgets; time = line tracing the shape outline; points appear only during the transition.
- "Numbers are the only text, in one geometric typeface." Minimal lines and shapes.
- Strict palettes (Normal: black + one neon + error red; Zen: paper + one ink).
- Light as language: glow, sparks, power, mist lifting at dawn, constellation, flower blooming, lightning, river delta.
- Spatial menus (zoom out past your tree to settings/collection/modes as shapes).
- Audio: soft low tone (Zen error), bass power-down (Normal error), pitch dropping per tier.
- No pressure, infinite, seamless; failure is instant and never punishing in Zen; errors "hurt" in Normal but cost no points.
- Home view: zoom out to show the tree's scale, then glide to the next unsolved puzzle ("scale" then "purpose").

## 13. Conflicts between docs

1. **Phase certainty:** Intent says v1/Later groupings are inferred and unconfirmed; Feature list presents them as the accepted plan with only some items marked *(inferred)*.
2. **Audio pitch per tier:** Feature list = POC *(inferred)*; Intent = v1/Later candidate.
3. **Player-built rounds (reverse authorship):** Feature list = Later; Intent = Parked.
4. **Bracket/tunnel/co-op races:** Feature list = Later; Intent = Parked.
5. **Clean bonus:** Feature list = v1; Intent = open question.
6. **Shape changes per level:** Feature list = Parked; Intent/Keepsake = open question.
7. **Duels:** Intent rejects split-screen duel; Feature list parks live real-time duels and puts async ghost duels in Later.
8. **× and ÷ in POC "if cheap"** and **"feature-based difficulty prior"** appear in Feature list only; Memlog/Pitch say +/− generator and rating logs.
9. **Tech stack** (TypeScript + Capacitor) appears only in Pitch, sourced from research outside this brainstorm.
10. **Totems:** Memlog user idea "won or purchased"; later decision earn-only (resolved — earn-only wins).
