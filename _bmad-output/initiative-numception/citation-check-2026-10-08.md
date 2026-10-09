# Citation check: executive summaries (2026-10-08)

Scope: only the Executive summary claims that carry an inline [n] marker, judged against the appendix source for [n]. I used about 30 fetches. I checked the claims the recommendations rest on first. Rows marked "not checked" ran past the budget. No report files were edited.

## research-game-engine-selection.md

| claim (short) | [n] | verdict | note |
|---|---|---|---|
| Unity supports only iOS Safari 15+ / Android Chrome 58+, no hardware guidance | [1] | supported | Unity 6.6 manual matches; no hardware minimum listed. |
| Unity build sizes several MB to >12 MB, figures conflict | [3][4] | partly | FRVR: ~5 / ~7 / ~12 MB. CrazyGames: 14.7 to 12.5 MB Brotli. The range holds, but the "conflicting ~3.3 MiB forum figure" in appendix [4] is not on the CrazyGames page. |
| Safari blocks IndexedDB in iframes | [1] | supported | "Apple Safari doesn't support IndexedDB for content running in an iFrame." |
| Godot: native beats web "by a significant margin"; Safari WebGL 2 issues | [8] | supported | Both phrases are in the 4.7 docs. |
| Godot C# projects can't export to web | [8] | supported | Quoted directly. |
| PixiJS 8.22.0 released 2026-10-01 | [10] | supported | |
| Phaser 4.2.1 (2026-07-09), v4 stable since April 2026 | [11] | supported | v4.0.0 released 10 Apr 2026. |
| Capacitor 8.5.3 released 2026-10-07 | [12] | supported | Tagged Latest; 9.0 alphas also present. |
| Web bundles in the hundreds of KB | [15][16] | unreachable | Both DepScope URLs return HTTP 410 Gone. |
| Apple 4.2 rejects "a repackaged website" | [17] | supported | Wording is "elevate it beyond a repackaged website". |
| One Capacitor app was rejected on that basis | [18] | not supported | The Capgo page never cites 4.2 and describes no specific Capacitor rejection. It only discusses wrapper-style risks in general terms. |
| 4.2 asks for "lasting entertainment value" | [17] | supported | |
| 2026 PixiJS v8 + Capacitor iPhone game hit WebKit audio/media quirks, not frame-rate limits | [19] | supported | AURADUEL (21 Sep 2026): camera/video black frames, mute-switch audio. It also had an 8.5 s main-thread freeze while loading, which is a stall but not a frame-rate limit. |

## research-name-and-trademark.md

| claim (short) | [n] | verdict | note |
|---|---|---|---|
| Greg Tang created Kakooma; existed by 2011 | [1] | supported | Article dated 2011-12-09. |
| Tang Math still sells Kakooma® online variants, card games (Amazon, TpT) and an iOS app | [2][3][4] | partly | [3] confirms the ® online variants (Plus/Negatives/Times/Fractions). [4] is a physical card game marked ®, but it is listed "Sold out", names no platform for its app link, and shows an ASIN without naming Amazon. Teachers Pay Teachers does not appear in any source. [2] (the iOS listing) is a 404, which the appendix admits. |
| Owner uses ® throughout | [3][4] | supported | Inferring a federal registration from ® is reasoning, not something the sources state; the report labels it as such. |
| Copyright doesn't cover a game's idea, name or method of play | [5] | supported | FL-108 says this almost word for word. |
| §102(b) excludes rules/mechanics; protection covers art/text/AV | [6] | unreachable | ABA page returned 403. |
| Third-party "Kakooma: Math Brain Puzzles" iOS app in 2025 | [7] | unreachable | AppsHunter returned 403. |
| Nextoy holds KenKen/KenDoku marks; rivals use Calcudoku/Mathdoku | [8][9] | supported | Wikipedia says this. [9] not fetched. |
| Descriptive names (Mathdoku, "-le") end up crowded and weak | [8][10] | partly | Nerdle HQ only lists Mathler and Numberle as followers and says nothing about being crowded or weak. Wikipedia only shows the alternate names exist. "Weak" is the report's own inference. |
| Protectable names are invented coinages (KenKen; Sudoku in Japan) | [8][11] | partly | [8] supports KenKen; [11] not checked. The report already labels this as inferred. |
| Clearance needs a USPTO search in Nice classes 9/28/41 plus common-law use | [12][13] | partly | USPTO [12] supports the common-law and state-registry search but names no Nice classes. [13] (GleanMark) not checked. |
| App Store / Play name checks | [14][15] | supported (14) | Apple 2.3.7 sets the 30-character limit and unique name; 4.1(a)/(c) cover minor name changes and other developers' brands. [15] not checked. |

## research-retention-in-math-puzzle-games.md

| claim (short) | [n] | verdict | note |
|---|---|---|---|
| Any lesson extends the streak: +3.3% D14, +1% DAU, relative, vs a harder daily goal | [1] | supported | Both changes are relative. The control was the existing daily goal (a set number of lessons), so "harder" is a fair paraphrase. |
| Weekend protection: +4% return a week later, −5% streak loss | [2] | supported | 2017 post. |
| Retention "most fragile in the first seven days" | [3] | supported | Exact phrase is in the takeaways. |
| Meta-analysis of 128 experiments: expected tangible rewards d ≈ −0.28 to −0.40, worse for children; encouraging feedback +0.33 | [4] | partly | 128 experiments, the d range and "worse for children" all hold. But d = +0.33 for positive feedback is the overall figure: for children it was non-significant (d = 0.11), and the paper says verbal rewards "do not enhance free-choice behavior for children". This weakens the Zen-mode (kids) inference that rests on it. |
| 1,389-pupil game: maths-anxious children disliked the leaderboard after controlling for rank | [5] | supported | |
| Losing teams lost motivation | [6] | unreachable | Tampere repository showed an Anubis access-denied page. |
| Prodigy reviews centre on membership upsells | [7] | not checked | |
| 16 membership ads vs 4 math problems in 19 min; status tied to paying | [8] | supported | NBC News / CCFC count; avatar and pet perks for members. |
| Prodigy math gates the game | [9] | not checked | |
| Number Match ads every round | [10] | not checked | |
| 95% of apps for ages 0–5 contained ads | [11] | unreachable | Michigan Medicine returned 403. |
| No source measured progression/unlock effects on D1/D7/D30 | [12] | not checked | This claims a gap in the evidence, so a source can't really confirm it. |
