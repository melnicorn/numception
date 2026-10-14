---
title: Numception design
name: Numception
description: Nested arithmetic puzzles drawn as light in lines and shapes. A theme system, not a single look; the frontmatter carries two complete named theme sets (kiln-* = default Zen and first run, vector-noir-* = default Normal) and every theme fills the same role grammar (Colors tables).
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
colors:
  # Per-theme structure: <theme>-<role>. Role names are identical in every theme (grammar in Colors).
  # Two complete sets live here; the other four themes are in the Colors tables with the same roles.
  # Default Zen / first-run theme: Kiln.
  kiln-surface: '#ECE3D7'
  kiln-surface-deep: '#DCCDBB'
  kiln-accent: '#A14E36'
  kiln-line: '#AC644E'            # 3.53:1 on surface, 3.96:1 on tile
  kiln-number: '#994A33'          # accent darkened; 4.89:1 on surface, 5.48:1 on tile
  kiln-operator: '#A14E36'        # accent 100%; 5.07:1 on tile
  kiln-control: '#89422E'         # menu button glyph, 5.74:1 on surface
  kiln-focus: '#89422E'
  kiln-cell-unsolved: '#F6F0E8'
  kiln-cell-active: '#F6F0E8'     # marked by lift, not colour
  kiln-cell-solved: '#A14E36'
  kiln-cell-solved-number: '#F6F0E8'
  kiln-cell-locked: '#D6C6B2'
  kiln-number-sunk: '#CBA491'
  kiln-soft-miss: '#AC644E'
  # Default Normal theme: Vector Noir.
  vector-noir-surface: '#000000'
  vector-noir-surface-deep: '#0A1A1F'
  vector-noir-accent: '#4FE0FA'
  vector-noir-line: '#4FE0FA'
  vector-noir-number: '#E8FDFF'
  vector-noir-operator: '#47CAE1'
  vector-noir-control: '#47CAE1'
  vector-noir-focus: '#E8FDFF'
  vector-noir-cell-unsolved: '#000000'   # no fill; = surface
  vector-noir-cell-active: '#00A3FF'     # tracks the current combo-glow step at runtime
  vector-noir-cell-solved: '#071416'
  vector-noir-cell-solved-number: '#E8FDFF'
  vector-noir-cell-locked: '#0A2831'
  vector-noir-soft-miss: '#9FEFFF'
  vector-noir-combo-glow-1x: '#00A3FF'
  vector-noir-combo-glow-1-6x: '#4FE0FA'
  vector-noir-combo-glow-2x: '#7CFFF2'
  vector-noir-timer-line: '#4FE0FA'
  vector-noir-timer-line-dimmed: '#266E7A'
  vector-noir-timer-track: '#091B1E'
  vector-noir-number-dimmed: '#728588'
  vector-noir-error: '#FF1E3C'
  vector-noir-error-fill: '#4A0711'
  vector-noir-error-number: '#FFD5DA'
typography:
  # Default = Kiln. Each theme swaps family, weight, tracking and sizes (see Typography).
  number:
    fontFamily: 'Futura, Century Gothic, sans-serif'
    fontSize: 44px
    fontWeight: '500'
    letterSpacing: 0em
  number-solved:
    fontFamily: 'Futura, Century Gothic, sans-serif'
    fontSize: 58px
    fontWeight: '500'
  operator:
    fontFamily: 'Futura, Century Gothic, sans-serif'
    fontSize: 32px
    fontWeight: '500'
  operator-tier2:
    fontFamily: 'Futura, Century Gothic, sans-serif'
    fontSize: 38px
    fontWeight: '500'
  number-floor:
    fontSize: 20px           # smallest rendered digit at any n
  numeral-min-weight:
    fontWeight: '300'
    note: '300 at >= 32px; 400 below 32px. Applies to numbers and operators in every theme.'
  guide:
    fontFamily: 'Futura, Century Gothic, sans-serif'
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 1.3
    note: 'Onboarding lines only; always on surface or tile (>= 4.5:1), never surface-deep.'
rounded:
  DEFAULT: 0px               # cells are polygons; corner character comes from each theme's line join
  full: 9999px               # menu button
spacing:
  gutter: 16px
  inset-none: 0px            # Vector Noir, Washi Ink
  inset-sm: 6px              # Obsidian Facet
  inset-md: 8px              # Moonwater
  inset-lg: 10px             # Overdrive Bloom, Kiln
  tap-min: 48px              # inscribed circle of a cell, all profiles; menu button touch area, all profiles
  tap-min-kid: 56px          # kid profile, puzzle cells only
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '6': 24px
components:
  # References use the default sets; the active theme's prefix substitutes at runtime.
  puzzle-cell:
    fill: '{colors.kiln-cell-unsolved}'
    stroke: '{colors.kiln-line}'
    text: '{typography.number}'
    inset: '{spacing.inset-lg}'
  puzzle-cell-solved:
    fill: '{colors.kiln-cell-solved}'
    text: '{typography.number-solved}'
    textColor: '{colors.kiln-cell-solved-number}'
  puzzle-cell-locked:
    fill: '{colors.kiln-cell-locked}'
    stroke: '{colors.kiln-line}'
    strokeStyle: dashed
  operator-cell:
    text: '{typography.operator}'
    textColor: '{colors.kiln-operator}'
  timer-line:
    stroke: '{colors.vector-noir-timer-line}'
    dimmed: '{colors.vector-noir-timer-line-dimmed}'
    track: '{colors.vector-noir-timer-track}'
  combo-glow:
    ramp: '{colors.vector-noir-combo-glow-1x} → {colors.vector-noir-combo-glow-1-6x} → {colors.vector-noir-combo-glow-2x}'
    strokeScale: '1.0 → 1.4 → 1.8'   # x theme base width
    bloomScale: '1.0 → 1.5 → 2.0'    # x theme base sigma
  power-cut:
    edge: '{colors.vector-noir-error}'
    fill: '{colors.vector-noir-error-fill}'
    textColor: '{colors.vector-noir-error-number}'
    others: '{colors.vector-noir-number-dimmed}'
    maxDuration: 500ms
  power-cut-kid:
    # Kid profile (FR-16): a power loss, not an alarm. Reuses existing roles; no error-* roles, no red.
    edge: '{colors.vector-noir-line}'          # tapped cell keeps its full-contrast edge
    strike: '{colors.vector-noir-number}'      # the non-colour mark
    textColor: '{colors.vector-noir-number}'
    otherLines: '{colors.vector-noir-timer-line-dimmed}'
    others: '{colors.vector-noir-number-dimmed}'
    maxDuration: 500ms
  sinking-number:
    textColor: '{colors.kiln-number-sunk}'
    drop: 12px
  soft-miss:
    color: '{colors.kiln-soft-miss}'
  menu-button:
    color: '{colors.kiln-control}'
    size: '{spacing.tap-min}'
    rounded: '{rounded.full}'
    position: top-right
    glyph: '≡ closed, × open'
  focus-ring:
    color: '{colors.kiln-focus}'
    width: 2px
    offset: 2px
  guide-text:
    text: '{typography.guide}'
    textColor: '{colors.kiln-number}'
  equation-narration:
    scale: 1.25
  round-end-flash:
    text: '{typography.number}'
    textColor: '{colors.vector-noir-number}'
    position: floor below the board
  point-stream:
    color: '{colors.vector-noir-combo-glow-2x}'
  theme-transition:
    layer: full-frame
  control-surface:
    background: '{colors.kiln-surface}'   # translucent over the blurred board
    text: '{colors.kiln-number}'
    label: '{colors.kiln-control}'
    padding: '{spacing.gutter}'
    layer: full-frame
  segmented-control:
    fill: '{colors.kiln-cell-unsolved}'
    stroke: '{colors.kiln-line}'
    textColor: '{colors.kiln-number}'
    selectedFill: '{colors.kiln-cell-solved}'
    selectedTextColor: '{colors.kiln-cell-solved-number}'
    height: '{spacing.tap-min}'   # kid mock: 56px
  profile-indicator:
    color: '{colors.kiln-control}'
    position: top-left of control-surface
  stats-panel:
    background: '{colors.kiln-surface}'
    text: '{colors.kiln-number}'
  parent-gate:
    background: '{colors.kiln-surface}'
    keyStyle: segmented-control
    keySize: '{spacing.tap-min}'
  streak-light:
    # v1
    color: '{colors.kiln-accent}'
    position: crown of the home tree
    steps: 7
  streak-freeze:
    color: '{colors.kiln-line}'
    max: 2
  ripple-hint:
    # v1; faded distractor stays >= 3:1
    fadedNumber: '{colors.kiln-line}'          # Normal themes: number-dimmed
    fadedScale: 0.85
    duration: 600ms
  dot-face:
    # v1; pips replace numerals up to ~12
    pip: '{colors.kiln-number}'
    pipMin: 6px
    maxPerCluster: 6
---

# Numception — Design Spine

Numception is a theme system, not a single look. This file defines the **grammar** every theme fills, the six themes rendered so far, the per-n shape system, and the rules that hold across all of them. Behaviour, timing and states live in [EXPERIENCE.md](EXPERIENCE.md). Visual references live in [mockups/](mockups/); key screens are linked where they apply. **The spines win on any conflict with a mock** (e.g. the "Round 1 · puzzle 1 of 3 · 0:42" header in [mockups/shape-system-1.html](mockups/shape-system-1.html) is a placeholder; there is no persistent HUD).

## Brand & Style

A solve is light moving through a structure. Every visual decision answers that test. The puzzle is drawn as lines and shapes; state is shown as light; the geometry is the HUD. There are no persistent score or timer widgets, no mascots, no badges, no coins. Numbers are the only text on the play view. Long-term progress is light too: the v1 daily streak is a light in the home tree that grows brighter, never a flame, counter or calendar.

Two moods share the grammar:

- **Normal** is arcade: black void, one neon that heats with combo, a red that only appears when power is cut. Tron and Infinitode 2, not Candy Crush.
- **Zen** is paper and one ink: low intensity, slow, quiet. Monument Valley and Journey.

Levels must not all look the same. Each round arrives in a new theme, and the change between themes is itself a designed moment. Themes are collected in **packs** (see Colors → Theme packs).

## Colors

### Theme grammar

Every theme supplies a hex for each role of its mode. Token names are `<theme>-<role>` (e.g. `{colors.kiln-number}`); the frontmatter holds the Kiln and Vector Noir sets, the tables below hold all six. Transitions interpolate these roles token by token (see EXPERIENCE.md → Theme & Transition System).

| Role | Mode | Used for | Contrast target |
|---|---|---|---|
| `surface` / `surface-deep` | both | Background; gradient end or vignette core | — |
| `accent` | both | The theme's one ink or neon; parent of derived tones | — |
| `line` | both | Cell outlines, puzzle silhouette, locked dashed edge | ≥ 3:1 vs surface and cell fill |
| `number` | both | Unsolved numerals, guide text | ≥ 4.5:1 vs its cell / surface |
| `operator` | both | Centre glyph; tier-2 operator at 25–45% of it | ≥ 4.5:1 (× vs + is correctness) |
| `control` | both | Menu button glyph, control-surface labels | ≥ 3:1 vs surface |
| `focus` | both | Keyboard focus ring (web) | ≥ 3:1 vs surface |
| `cell-unsolved` | both | Open cell fill (= surface where unfilled) | — |
| `cell-active` | both | Tier-1 puzzle in play (Normal: current combo step) | — |
| `cell-solved` / `-number` | both | Collapsed answer cell and numeral; selected segment | ≥ 4.5:1 pair |
| `cell-locked` | both | Fog over unreachable cells; always with dashed `line` edge + texture | edge ≥ 3:1 |
| `soft-miss` | both | Other valid cell in − / ÷; never red | ≥ 3:1 vs cell |
| `number-sunk` | Zen | Zen wrong tap, transient | — (recovers) |
| `combo-glow-1x` / `-1-6x` / `-2x` | Normal | Combo heat stops; drive line colour, width, bloom | ≥ 3:1 vs surface |
| `timer-line` / `-dimmed` / `timer-track` | Normal | Chain-window outline | both lines ≥ 3:1 vs track |
| `number-dimmed` | Normal | Numerals during power cut (≤ 500 ms); unselected segment text | ≥ 4.5:1 (board stays readable) |
| `error` / `error-fill` / `error-number` | Normal | Normal wrong tap only; red on edge only | `error-number` ≥ 4.5:1 vs fill |

The Kid power cut (`power-cut-kid`) adds no roles: it reuses `line`, `number`, `timer-line-dimmed` and `number-dimmed`, so every Normal theme supports it with no new colours and no colour-vision risk.

Grammar rules: a **highlight** differs by ≥ 3:1 or changes size/shape (never colour alone); every new theme gets a colour-vision (deutan/protan) check of error vs solved and the combo ramp; Zen themes leave Normal-only roles empty, Normal themes leave `number-sunk` empty.

### Normal themes

Source: [mockups/directions-1.html](mockups/directions-1.html). Combo heat steps between the three stops interpolate in OKLCH: 1.0x = 1x stop, 1.2x/1.4x between 1x and 1.6x, 1.8x between 1.6x and 2x.

| Role | Vector Noir | Overdrive Bloom | Obsidian Facet |
|---|---|---|---|
| surface | `#000000` | `#05020A` | `#11171A` |
| surface-deep | `#0A1A1F` (fog core) | `#1D0B33` (radial core) | `#040506` |
| accent / line | `#4FE0FA` | `#D646EC` (tubes) | `#A9FF55` (rim light) |
| number | `#E8FDFF` | `#FFE9FB` | `#F1FFE4` |
| operator / control | `#47CAE1` | `#D646EC` | `#A9FF55` |
| focus | `#E8FDFF` | `#FFE9FB` | `#F1FFE4` |
| cell-unsolved | `#000000` (no fill) | `#05020A` (no fill) | `#20292C` facet |
| cell-active | `{colors.<theme>-combo-glow-*}` | same | same |
| cell-solved | `#071416` (9% wash) | `#D646EC` (solid plate) | `#3D5A20` (lit facets) |
| cell-solved-number | `#E8FDFF` | `#05020A` (knocked out) | `#F1FFE4` |
| cell-locked | `#0A2831` fog + dashed line | `#220C2A` hatch + dashed line | `#1A2023` stone + dashed line |
| soft-miss | `#9FEFFF` | `#F0A6FF` | `#D4FF9F` |
| combo-glow 1x / 1.6x / 2x | `#00A3FF` / `#4FE0FA` / `#7CFFF2` | `#7B4DFF` / `#D646EC` / `#FF3FD0` | `#2BFF88` / `#A9FF55` / `#F2FF3A` |
| timer-line | `#4FE0FA` | `#FFB8F4` (core) | `#A9FF55` |
| timer-line-dimmed | `#266E7A` | `#835883` | `#59813D` |
| timer-track | `#091B1E` | `#1A0921` | `#1F2528` |
| number-dimmed | `#728588` | `#8C7895` | `#869286` |
| error / error-fill / error-number | `#FF1E3C` / `#4A0711` / `#FFD5DA` | `#FF2340` / `#3D0410` / `#FFC9D2` | `#FF3B30` / `#3A0806` / `#FFB4AE` |

Contrast (WCAG, computed; worst background in brackets):

| Pair | Vector Noir | Overdrive Bloom | Obsidian Facet |
|---|---|---|---|
| number | 16.9 [deep] | 15.9 [deep] | 14.3 [facet] |
| operator | 9.2 [deep] | 5.2 [deep] | 12.1 [facet] |
| line (edge) | 11.3 [deep] | 5.2 [deep] | 12.1 [facet] |
| cell-solved-number | 17.8 | 5.8 | 7.5 |
| number-dimmed | 4.6 [deep] | 4.6 [deep] | 4.6 [facet] |
| timer-line / dimmed vs track | 11.3 / 3.0 | 12.1 / 3.3 | 12.7 / 3.4 |
| timer-line-dimmed, worst background | 3.0 [track] | 3.2 [deep] | 3.3 [facet] |
| error-number vs fill | 11.9 | 11.9 | 10.2 |

### Zen themes

One ink per theme; derived roles are that ink at a stated opacity over the surface, flattened to hex.

| Role | Washi Ink | Moonwater | Kiln (first run) |
|---|---|---|---|
| surface | `#F2EDE3` paper + fibre grain | `#16242C` | `#ECE3D7` sand |
| surface-deep | `#F2EDE3` | `#223943` | `#DCCDBB` |
| accent | `#283A6B` indigo | `#BFE3DA` moonlight | `#A14E36` terracotta |
| line | `#3C4C77` (ink 90%, brush) | `#738D8C` (ink 55%) | `#AC644E` (accent 85%) |
| number | `#283A6B` | `#B1D4CC` (ink 92%) | `#994A33` (accent, darkened) |
| operator / control | `#5F6A8B` (ink 73%) | `#87A4A1` (ink 67%) | op `#A14E36` / control `#89422E` |
| focus | `#283A6B` | `#B1D4CC` | `#89422E` |
| cell-unsolved | `#F2EDE3` (no fill) | `#223943` (no fill, moon pool) | `#F6F0E8` tile |
| cell-active | `#283A6B` full-ink edge | `#738D8C` + halo | `#F6F0E8` lifted tile |
| cell-solved | `#D8D6D3` (ink wash 13%) | `#384A4F` (moon pool 20%) | `#A14E36` fired tile |
| cell-solved-number | `#283A6B` | `#BFE3DA` | `#F6F0E8` |
| cell-locked | `#D6D4D2` mist + dashed line | `#2B3C42` fog + dashed line | `#D6C6B2` sunken tile + dashed line |
| number-sunk | `#A5A9B5` (ink 38%) | `#566D6E` (ink 38%) | `#CBA491` (+ tile pressed to `#E4D8C9`) |
| soft-miss | `#79829B` | `#738D8C` | `#AC644E` |

| Pair | Washi Ink | Moonwater | Kiln |
|---|---|---|---|
| number | 9.4 | 7.6 [deep] | 5.5 [tile]; 4.9 [surface] |
| operator | 4.6 | 4.5 [deep] | 5.1 [tile] |
| line (edge) | 7.2 | 3.4 [deep] | 3.5 [surface]; 4.0 [tile] |
| control | 4.6 | 5.9 | 5.7 |
| cell-solved-number | 7.6 | 6.7 | 5.1 |
| soft-miss | 3.3 | 3.4 | 4.0 [tile] |

Kiln numbers never sit on bare `surface-deep` (4.0:1).

`timer-line-dimmed` must hold ≥ 3:1 against every background a dimmed line can cross (`surface`, `surface-deep`, `cell-unsolved`, `timer-track`), since a power cut dims every line to it. Overdrive Bloom and Obsidian Facet were raised in lightness (hue and saturation kept) to meet this: `#7A527A` → `#835883`, `#537839` → `#59813D`.

### Theme packs

The unlock and collection unit is a **pack**, not a single theme. A pack is:

- several related themes, each filling the full grammar for its mode;
- pack-specific transitions, each tagged **calm** or **intense** (see EXPERIENCE.md);
- an optional audio slot, reserved, not committed.

Example — **Ocean pack**: themes Caribbean, Deep Ocean, Arctic; transitions wave, ice fracture, rainfall. No further catalog is designed (parked brainstorm).

## Typography

Numbers are the only text on the play view. Each theme uses **one geometric face** for numbers and operators; tabular numerals always. Numerals are **always upright**, never rotated with a wedge or petal; faces must keep 1/7, 3/8 and 6/9 distinct at 20 px. No glow or bloom on numerals (glow belongs to lines). The one sanctioned text exception is the onboarding guide line (`{typography.guide}`, 24 px). DOM surfaces (control surface, stats) use the active theme's face.

**Minimum numeral weight** (`{typography.numeral-min-weight}`): 300 at ≥ 32 px, 400 below 32 px, for numbers and operators in every theme.

| Theme | Face | Weight num / op (hero → < 32 px) | Tracking | number / operator / tier-2 op / solved |
|---|---|---|---|---|
| Vector Noir | Avenir Next | 300 / 300 → 400 | +0.06em | 46 / 34 / 42 / 60 px |
| Overdrive Bloom | Futura Bold | 700 / 700 | −0.03em | 50 / 40 / 46 / 66 px |
| Obsidian Facet | DIN Alternate (tabular) | 700 / 700 | 0 | 48 / 36 / 42 / 62 px |
| Washi Ink | Avenir Next | 400 / 300 → 400 | +0.03em | 42 / 30 / 36 / 54 px |
| Moonwater | SF Pro Rounded / ui-rounded | 300 / 300 → 400 (solved 400) | +0.02em | 44 / 34 / 38 / 56 px |
| Kiln | Futura Medium | 500 / 500 | 0 | 44 / 32 / 38 / 58 px |

**Dot faces** (v1, `dot-face`): standard die pips for 1–6, two clusters for 7–12 (e.g. 8 = 6 + 2), always upright; pips are filled circles in `number`, at least 6 px, sized so the whole face fits the same inscribed circle a numeral would. No glow on pips.

**Home view count** (v1): the "puzzles built" figure is a bare number in the theme's face beside the tree, no label (EXPERIENCE.md Voice and Tone).

Sizes are at the n=3 hero scale in a 375-wide frame. Larger n shrinks numbers to fit, never below `{typography.number-floor}` (20 px). Solved numerals are one step heavier or larger. Several faces are Apple system fonts; web builds use **self-hosted** licensed fonts or fallbacks (no third-party font CDN).

## Layout & Spacing

- **Anchor:** phone portrait, 375×667 reference frame, `{spacing.gutter}` side gutters. Tablet and web adapt (see EXPERIENCE.md → Responsive & Platform).
- **Flat, nested layout:** each tier is a flat shape; the screen holds one puzzle at a time, zoomed to fill the frame; zoom is the layout for depth.
- **Cell inset** is a theme token: `{spacing.inset-none}` for lines-only themes, `{spacing.inset-sm}`–`{spacing.inset-lg}` for tubes, facets, halos, tiles.
- **Tap targets:** the whole cell polygon; its inscribed circle ≥ `{spacing.tap-min}` (48), and ≥ `{spacing.tap-min-kid}` (56) for puzzle cells in the Kid profile. Taps within a few px of a shared edge are no-ops, not wrong taps. Tier-2 miniatures are display-only. Measured at n=6 and n=9 in [mockups/key-play-n6-n9.html](mockups/key-play-n6-n9.html): every cell passes 48 and 56 (n=9 wedge worst case 62).
- **Menu button:** ≥ 44×44 pt visible, `{spacing.tap-min}` (48) touch area in every profile, reachable one-handed.

Play-view zones:

| Zone | Holds |
|---|---|
| Top-right | `menu-button` (≡; × while the control surface is open); Grown-up ring cue |
| Above the puzzle | Guide-line slot (`guide-text`, `equation-narration`); otherwise empty |
| Centre | The puzzle shape, centred, most of the frame |
| Floor below the board | `round-end-flash` (Normal) |

## Elevation & Depth

No drop shadows for hierarchy. Depth comes from light:

| Theme | Depth device | Glow (lines only) |
|---|---|---|
| Vector Noir | 1–1.5 px hairlines over a faint receding Tron floor | Tight double blur (σ 2.4 + 7) |
| Overdrive Bloom | 5 px segmented neon tubes, round joins | Two-stage bloom (σ 5 + 16), swells with combo |
| Obsidian Facet | Shallow faceted pyramids; faint scanlines | Rim light (σ 1.4); solved facets lit inside |
| Washi Ink | Wavering brush hairlines, fibre grain | None; solved wash bleeds inward (σ 6) |
| Moonwater | Soft 2.5 px round strokes | Gentle halo (σ 3.5); moonlight pool |
| Kiln | Clay tiles with `{colors.kiln-line}` edge; shadow `0 2px 3px #C9B7A1` (decorative only); locked tiles sunken | None |

**Combo** (Normal) is depth: lines thicken and brighten along the ramp (`combo-glow.strokeScale`, `bloomScale`) — width and bloom carry heat for colour-blind players. **Fog** (`cell-locked`) is light withheld, always with a dashed edge and texture. The control surface is the one overlay layer: a translucent full-frame panel over the blurred board.

### Transition looks

Every theme change is drawn, never a hard cut. Tag: **calm** (Zen and Calm motion may draw it) or **intense** (Normal at Full motion only).

| Transition | Tag | Look |
|---|---|---|
| Fade / blur | calm | Old theme dissolves while the new resolves out of blur; new layer opaque before the old fades |
| Token interpolation (slow) | calm | Colours tween in OKLCH; widths, glow, inset, fills tween; font, material, texture crossfade near halfway |
| Ripple | calm | Concentric rings from the tap point refract the old scene; 2 px front, no blend band |
| Snow / embers | calm | Flakes in the new colours blanket the old round, then melt outward from the tap point |
| Zoom-hide | intense | Dive into the solved cell / pull out; constant velocity, never accelerating |
| Radiate | intense | New theme spreads from the tap point as a ring; cells re-light as it passes |
| Crystal fracture | intense | Cracks race from the tap point; ≤ 150 shards fall inner-first with parallax |

Nature transitions keep a hard boundary between old and new. Dark↔light changes pass through a mid-luminance frame; nothing alternates luminance more than 3×/s. References: [mockups/theme-transitions-1.html](mockups/theme-transitions-1.html), [mockups/theme-transitions-2-nature.html](mockups/theme-transitions-2-nature.html).

## Shapes

### Per-n shape system

No universal rule; each n has its own shape. Picks are initial, not locked. References: [mockups/shape-system-1.html](mockups/shape-system-1.html), [mockups/shape-n4-diamonds.html](mockups/shape-n4-diamonds.html); n=3 in play in [mockups/key-play-n3.html](mockups/key-play-n3.html), n=6 and n=9 in [mockups/key-play-n6-n9.html](mockups/key-play-n6-n9.html).

| n | Pick | Shape | Operator space | Nesting | Backup / rejected |
|---|---|---|---|---|---|
| 3 | **3A** | Split triangle: three outer triangles, inverted middle | Natural | Becomes | 3B wedges + circle |
| 4 | **4A** | Diamond of diamonds, ~1:1.25 w:h; carved centre diamond | Carved | Becomes (true fractal) | 4B quadrant square |
| 5 | **5B** | Pentagon flower: five petals around a centre pentagon | Natural (peer cell) | Becomes, partial | 5A wedges |
| 6 | **6A** | Honeycomb flower: six hexagons around a centre hexagon | Natural (peer cell) | Becomes | 6B hexagon wedges |
| 7 | **7A** to start | Heptagon wedges, carved void | Carved | Contains | **7B** ring of 7 circles |
| 8 | **8A** | 3×3 grid, operator in the centre square | Natural | Becomes | 8B wedges, 8C ring |
| 9 | **9B** to start | Nonagon wedges, carved void | Carved | Contains | **9C** ring of 9 circles; **9A rejected** |

Rules: **the operator is always in the centre** (carve one where needed); where a cell has the same general shape as the whole it **becomes** the next-tier puzzle, wedges fall back to **contains**; numerals stay upright in every cell; watch busyness at n=7–9.

### Corners

`{rounded.DEFAULT}` is 0. Corner character comes from the line join: miter (Vector Noir, Obsidian Facet), round (the rest).

## Components

Behaviour for each lives in EXPERIENCE.md → Component Patterns. Colour refs below use the role name; the active theme supplies the prefix.

| Component | Visual spec |
|---|---|
| `puzzle-cell` | One number in one polygon: `cell-unsolved` fill, `line` edge, `{typography.number}`. Active edges take `cell-active` (combo colour in Normal). Solved (`puzzle-cell-solved`): collapses to its answer in `{typography.number-solved}`. Locked (`puzzle-cell-locked`): `cell-locked` fill + dashed `line` edge + theme texture. In play: [key-play-n3](mockups/key-play-n3.html). |
| `operator-cell` | Centre glyph in `operator`; tier-2 operator in `{typography.operator-tier2}` at 25–45% until tier 2 opens. Never an answer. |
| `timer-line` (Normal) | The **chain window**: a stroke tracing the outline from the top vertex; length = chain time left. `timer-line` over `timer-track`; `timer-line-dimmed` during a power cut (still ≥ 3:1). Never a number. |
| `combo-glow` (Normal) | Line colour, width and bloom along the three stops; not a widget. 1.6x shown in [key-play-n3](mockups/key-play-n3.html). |
| `power-cut` (Normal) | One monotonic fade, no flicker: tapped cell gets a red `error` edge, `error-fill`, `error-number` and a short diagonal strike (non-colour mark); glow off; other lines and `timer-line` dim to `timer-line-dimmed`; other numerals go to `number-dimmed` (≥ 4.5:1); no red halo, no pulse; ≤ 500 ms total. Shown in [key-play-n3](mockups/key-play-n3.html). |
| `power-cut-kid` (Normal, Kid profile) | Same timing and fade as `power-cut` with no red: glow off; every other line dims to `timer-line-dimmed` and other numerals to `number-dimmed`. The tapped cell keeps its `line` edge and `number` numeral, plus the diagonal strike in `number`, so it stands out by contrast and shape. No `error` roles. The tapped edge keeps the width of the standard error edge (1.75 px at n=3); the operator dims with the other numerals; everything dims in the same single fade. Shown in [key-power-cut-kid](mockups/key-power-cut-kid.html). |
| `sinking-number` (Zen) | Numeral drops 12 px and fades to `number-sunk`, faint ink ripple (Washi, Moonwater) or tile pressed into clay (Kiln); recovers. Shown in [key-play-n3](mockups/key-play-n3.html). |
| `soft-miss` | Tapped cell pulses once in place in `soft-miss` (never red, never dims the board); a ghost arrow points to the result cell. Not mocked; built (core-play-loop ticket 6): the cell's outline swells and fades with a faint `soft-miss` wash over ~600 ms (× Calm), and a faint arrow with a chevron head runs between the two numerals, clear of both. |
| `menu-button` | Only visible control on the play view; top-right; `control` colour; ≡ glyph, × while the control surface is open; ≥ 44 pt visible, 48 pt touch in every profile; the Grown-up profile adds a `control` ring. |
| `focus-ring` (web) | 2 px ring, 2 px offset, `focus` colour, on menu button, DOM controls and keyboard-focused cell. |
| `guide-text` | One short line in the guide-line slot above the puzzle, `{typography.guide}`, `number` colour, on bare `surface` or tile, never over a cell. No box, no bubble. Shown in [key-onboarding](mockups/key-onboarding.html). |
| `equation-narration` | Each part (7 … + … 4 … = … 11) highlights by **scale 1.25× and lift**, not colour (in Kiln and Washi, number and accent are near-identical). Runs on the board cells and builds the full equation in the guide-line slot (`=` has no cell). Shown in [key-onboarding](mockups/key-onboarding.html). |
| `round-end-flash` (Normal) | On the floor below the board, over the completed tier-2 puzzle at full heat. Round time largest (`{typography.number}` in `number`), then points; best combo drawn as a heat line at the stop reached, never a number; a clean round drawn as one unbroken outline of the round's shape (omitted after a wrong tap). Shown in [key-round-end](mockups/key-round-end.html). |
| `point-stream` (Normal) | Points burst from the solved cell into session then lifetime total, in `combo-glow-2x`; transition only. Visual not designed. |
| `round-collapse` | Solved tier-1 tiles fuse into one cell; operands and seams fade; the answer remains one step larger (`number-solved`). The camera pulls out at constant velocity; answers ease back to `{typography.number}`; each tier-1 shape becomes a cell of the tier-2 puzzle, solved fill cools to `cell-unsolved`, and the tier-2 operator rises to full strength. Storyboard: [key-first-collapse](mockups/key-first-collapse.html). |
| `zen-constellation` | Each Zen solve drops a light in a lifetime constellation/garden. Not designed (placeholder in [key-stats](mockups/key-stats.html)). |
| `normal-unlock` | The moment Normal becomes available. Not designed. |
| `streak-light` (v1) | One point of light at the crown of the home tree, in the active theme's `accent`; brightness and halo grow one step per streak day up to 7. The day's first solve gives one slow swell (calm, no flash). Reset is shown only by the lower step on the next view, never animated. Not mocked. |
| `streak-freeze` (v1) | Up to 2 small satellite lights beside `streak-light`, in `line`; a used freeze is simply absent on the next view. |
| `home-tree` (v1) | The Pyramid at zoom-out: lit (fully fed) puzzles in `cell-solved`, soft-lit partly fed ones at reduced `accent`, unbuilt territory as `cell-locked` fog with dashed edges. Power flows up the lines as light. Not mocked. |
| `ripple-hint` (v1) | When a neighbour is solved, the faded distractor's numeral eases over ~600 ms to `number-dimmed` (Normal) or `line` (Zen), and shrinks to 85% (never below `{typography.number-floor}`). Size carries the signal where the colour step is small (Kiln). It stays ≥ 3:1 and readable; the edge is unchanged. Never fades a, b or c. |
| `dot-face` (v1) | Pips in place of the numeral; see Typography. |
| `theme-transition` | Full-frame layer over the play view; looks and tags in Elevation & Depth → Transition looks. |
| `control-surface` | DOM/native; full-frame translucent `surface` panel over the blurred board (not a sheet or modal); `{spacing.gutter}` padding. `profile-indicator` top-left, `menu-button` (×) top-right; then one row per setting: label in `control`, options as a `segmented-control`; gated entries carry a lock glyph. Shown in [key-control-surface](mockups/key-control-surface.html). |
| `segmented-control` | The one settings control: a row of tiles. Unselected: `cell-unsolved` fill (Kiln tile with shadow), `line` edge (`timer-line-dimmed` in Vector Noir), `number` text (`number-dimmed` in Vector Noir). Selected: `cell-solved` treatment (Kiln fired tile; Vector Noir `line` edge + wash + glow). Kid tiles 56 px tall. |
| `parent-gate` | PIN pad over the control surface: four dots, a 3×4 key grid of `segmented-control` tiles at `{spacing.tap-min}`, one adult-readable line. No timer, no arithmetic. Not mocked. |
| `level-pin` | A control-surface row of `segmented-control` groups (n, Operator, Difficulty), Auto first. Operators show their glyph only. Not mocked. |
| `profile-indicator` | Top-left of the control surface. Grown-up: `control` ring + "Grown-up"; Kid: dot + "Kid". The ring matches the menu-button adult cue. |
| `stats-panel` | DOM/native, on `surface`, closes via ×. Kid view: a lead count ("You solved 58 puzzles") large, then growth counts and operators learned (newest filled). Adult view: period selector (`segmented-control`), metric grid, per-operator table, round-time trend line, footer (copy in EXPERIENCE.md Voice and Tone; the mock's "Stored on this device only." holds for the POC only). v1 adds the streak light and Pyramid height to both views; the kid view shows the light without a lost count. Contents in EXPERIENCE.md → Component Patterns. Shown in [key-stats](mockups/key-stats.html). |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Show state as light: glow, wash, fog, dimming of lines | Badges, counters, progress bars on the play view |
| Keep numbers the only text in play | Words or score text during a puzzle (guide line excepted) |
| Express combo as line heat, width and bloom | A multiplier number in play |
| Keep red for Grown-up Normal power cuts, on the cell edge only | Red in Zen, onboarding, a soft miss, or the Kid profile |
| Show the streak as a light that grows | Flames, counters, calendars or a "lost" state |
| Use one luminance change per power cut, ≤ 3 flashes/s | Flicker, strobe, repeated red pulses |
| Highlight by size or shape, or by a ≥ 3:1 colour change | A highlight in the colour it highlights |
| Use one ink (Zen) or one neon family (Normal) per theme | A second unrelated hue inside a theme |
| Put the operator in the centre; keep numerals upright | Operator on an edge; rotated digits |
| Use tabular numerals ≥ 20 px, weight ≥ 300 (≥ 400 under 32 px) | Hairline figures; glow on numerals |
| Draw every theme change; Zen draws calm transitions only | Hard cut; intense transitions in Zen |
| Fill every grammar role in a new theme and run the contrast + CVD check | A theme shipped with an undefined or failing role |
| Draw arcade energy from light and motion | Candy Crush gloss, coins, chests |
