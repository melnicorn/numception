# Quality Bars

Cross-cutting requirements (the PRD's NFR ids). **Default:** a provisional value the user accepted at PRD finalize.

## NFR-1 Performance

- Steady 60 fps for play, transitions and particles on the reference devices. Default: a Samsung Galaxy A35-class Android phone and an iPhone 13.
- Full-round generation ≤ 50 ms on the reference devices (default).
- Tap to first visible response ≤ 100 ms.
- No loading states between tiers or rounds; no visible freeze on launch. A reference PixiJS + Capacitor game showed an 8.5 s load freeze, so cold start is measured in the renderer prototype.
- Initial web download ≤ 5 MB gzipped (default).

## NFR-2 Offline and persistence

- Every POC and v1 play feature works offline, with no offline banner.
- Saves are atomic and survive crashes and updates.
- Save format is versioned with forward migration.

## NFR-3 Reliability

- No crash or save corruption loses Pyramid or streak progress.
- Crash-free sessions ≥ 99.5% at v1 (default).

## NFR-4 Accessibility

Target WCAG 2.2 AA on DOM surfaces and the equivalent rules on the canvas. Detail: `../ux-numception/DESIGN.md`, `../ux-numception/EXPERIENCE.md`.

- **Contrast:** numbers and operators ≥ 4.5:1; lines, controls, focus, timer and combo ≥ 3:1.
- **Colour:** no state by colour alone; every theme gets a deutan and protan check.
- **Flashing:** ≤ 3 flashes per second from all sources combined.
- **Motion:** Full, Calm or Minimal, mapped from OS Reduce Motion.
- **Time:** no time pressure in Zen or onboarding; chain window setting for Normal.
- **Screen readers:** a parallel accessible tree; each cell is a button named by its number; the operator is announced.
- **Keyboard:** full keyboard play on web.
- **Text size:** OS text size honoured up to 200% on DOM surfaces.
- **Tap targets:** ≥ 48 pt for all cells; ≥ 56 pt for Kid-profile puzzle cells.

## NFR-5 Platform parity

- One codebase: iOS (phone and tablet), Android, web including mobile web.
- Phone portrait is the design anchor; tablet and web adapt from it. Phone landscape is OQ-14; web supports landscape.
- Puzzle content, seeds, ratings and scoring identical across platforms.
- POC is tested on web at phone viewport plus real phones (default). v1 releases worldwide.

## NFR-6 Store compliance

- App Store 4.2 (lasting value as an app, not a repackaged website), met through FR-43.
- App Store 2.5.2: no downloaded code that changes features; tuning updates (FR-53) are data only.
- Store titles ≤ 30 characters.
