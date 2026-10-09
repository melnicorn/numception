# PRD Polish Log — 2026-10-09

Review: `bmad-review lenses=structure,prose` on `prd-numception.md`. Content, IDs, phase tags, numbers and assumptions unchanged (verified by ID and [ASSUMPTION] counts before and after).

## Structural (6)

1. §4.5: reordered FR blocks to FR-20, FR-21, FR-22, FR-47, FR-53, so ratings and plateau detection follow selection directly. Matching reorder in §13 for the §4.5 entries.
2. §4.16: added the missing **Functional Requirements:** label before FR-46, as in every other feature section.
3. §7: turned the bold run-in labels into `###` subheadings (7.1 POC, 7.2 v1 Primary, 7.3 v1 Secondary, 7.4 Counter-Metrics) to match the heading hierarchy in §2, §6 and §9.
4. FR-26: removed the standalone "Minimal: crossfade of at least 400 ms" consequence, which repeated the Minimal motion-level bullet in the same FR.
5. §6.1 POC list: moved the "+ and − operators / uniqueness" bullet up next to the generator bullet so generation items sit together.
6. §6.2: moved "Platform age signals" from a loose bullet into the **Later** list.

## Prose (11)

1. §1: merged "The defining moment is that zoom…" and the next sentence into one clear sentence.
2. UJ-2: "shares the seed link to Chris" → "with Chris".
3. UJ-5: untangled the glyph sentence ("an operator glyph he has never seen (×) appears in an easy first puzzle…, which is then narrated").
4. §4.1 Description: joined "…lower-tier answers. So the generator…" into one "Because…" sentence.
5. "Realizes UJ-…" → "Realises UJ-…" throughout, matching the document's British spelling (UI labels such as "Randomize" left as-is).
6. §4.6 Description: "and then they are explained" → "and are explained afterwards".
7. §4.14 Description: split the trailing appositive ("…, a risk because…") into its own sentence.
8. §6.2 Music note: tightened to "…; revisit it for v1 if playtests say Zen feels empty."
9. OQ-3: "Revisit condition: … Otherwise…" → "Revisit only if the review finds a blocker; otherwise the decision stays closed."
10. §4.12 Description: removed the repeated pause/blur detail and pointed to FR-40, keeping the rationale.
11. FR-43: "works with no network connection" → "works offline (NFR-2)".

## Deliberately not changed

- FR-19, FR-27, FR-36 and FR-37 have no "Consequences (testable)" block. Adding one would mean writing new requirements content.
- Section placement of FR-30 (Ripple hint) and FR-31 (Dot faces) under §4.8. Moving them would regroup FRs across features.
- The redundant inline `[v1]` inside FR-12 and the hand-off line starting with a numeral ("13 items"). Phase tags and numbers are locked.
