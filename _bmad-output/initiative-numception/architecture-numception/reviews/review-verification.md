---
review: verification
target: ../architecture-numception.md
date: 2026-10-09
lens: "Every committed decision web-researched or reality-checked, not asserted from training data"
verdict: PASS WITH FIXES (1 high, 2 medium, 3 low)
---

# Verification Review: Numception Architecture Spine

Method: re-queried the live npm registry on 2026-10-09 (`npm view` run outside the repo, because the repo's `devEngines` blocks npm). Downloaded and read the published tarballs for `pure-rand@8.4.2`, `@capacitor/filesystem@8.1.4` and `@capacitor/app@8.1.2`. Read the native sources of the Ionic filesystem libraries that `@capacitor/filesystem` 8 delegates to (`ionic-team/ion-ios-filesystem`, `ionic-team/ion-android-filesystem`, main branch). Ran web searches for WebGL 2 on iOS 15, pnpm 11 and TypeScript 6.

## Findings

### F1 (HIGH): AD-10's "atomic write (temp file, then rename)" is not atomic on Capacitor 8. This was asserted without checking the plugin source.
- `@capacitor/filesystem` 8.1.4 on iOS calls `IONFILEManager.renameItem`. It first runs `shouldPerformDualPathOperation`, which **deletes the existing destination file**, and then calls `FileManager.moveItem`. Source: ion-ios-filesystem `IONFilesystemLib/IONFILEManager.swift`, lines ~170–180 and ~297–310.
- Android does the same in `IONFILELocalFilesHelper.renameFile`: `destinationFileObj.delete()`, then `renameTo`. If that fails, it falls back to **copy and then delete**.
- On iOS, `writeFile` for string data also writes with `atomically: false` (line ~130).
- Result: if the app is killed between the delete and the move, no `ProfileSnapshot` exists under the canonical name. NFR-2/NFR-3 data loss is still possible, which is the exact failure AD-10 claims to prevent. The research file only checked that the package exists, its version and its peer dependency. It never checked the rename semantics.
- Fix: AD-10 should specify a pattern that tolerates the gap. For example, write `snapshot.<gen>.json` into two alternating slots (A/B), each carrying a monotonic generation number and a checksum, and have the loader pick the newest valid slot. Alternatively, keep temp-then-rename but make the loader recover from `*.tmp` when the canonical file is missing. A third option is a small custom plugin using `FileManager.replaceItemAt` and `Files.move(ATOMIC_MOVE)`. Add a fault-injection test.

### F2 (MEDIUM): No AD-1 boundary-lint tool is named, and the TS 6 pin depends on a lint fact the spine doesn't record.
- AD-1 and AD-19 require "boundary lint in CI", but neither the Stack table nor the research names a tool. Live options (registry, 2026-10-09):
  - `dependency-cruiser` 18.5.0 (2026-09-30; Node ^22, ^24 or >=26; independent of ESLint and of the TS version).
  - `eslint-plugin-boundaries` 7.2.0 (2026-08-09; peer `eslint >=6`). ESLint latest is 10.12.0.
- If ESLint is used, `typescript-eslint` 8.71.1 has peer `typescript >=4.8.4 <6.1.0`. That confirms the TS 6.0.x choice: TS 7.0.2, the npm `latest`, would break it. The spine should record this as the reason for the pin, so that a pnpm 12 or TS 7 bump doesn't silently break lint.
- Recommendation: add a row for `dependency-cruiser 18.5.x` as the AD-1 enforcer. It works without any type-aware ESLint dependency. Optionally add ESLint 10 + typescript-eslint 8.71.x for code lint, with TS held below 6.1.

### F3 (MEDIUM): AD-3 says "pure" PRNG, but pure-rand 8 mutates generators by default.
- The README and exports for 8.4.2 show `uniformInt(rng, min, max)` **mutating** `rng`. Immutable use requires `purify()` from `pure-rand/utils/purify`, or `rng.clone()`.
- The old `UniformIntDistribution` subpath that the README still mentions is **not exported** in 8.x. Only `distribution/uniformInt`, `uniformBigInt`, `uniformFloat32` and `uniformFloat64` are exported.
- The integer path is confirmed. `uniformFloat32` and `uniformFloat64` also exist and must be banned in `core`.
- Fix: in AD-3, name the allowed imports (`generator/xoroshiro128plus`, `distribution/uniformInt`, `utils/purify` or `clone`). Say whether `core` uses the mutable API scoped inside `generate()`, or `purify`. Lint-ban `uniformFloat*` in `core`. The claim that results match across JS engines is inferred, not documented by the library (the research file says so too). The golden-seed fixtures should therefore also run under WebKit in Playwright, not only under Node.

### F4 (LOW): The TS 6.0 default changes aren't reflected in conventions or the seed.
TS 6.0 (GA March 2026; latest 6.0.3) changed tsconfig defaults. Strict mode is on, an ES-module-oriented setup is the default, ES5 and classic resolution are deprecated or removed, and `dom.iterable` is folded into `dom`. Secondary sources disagree on the exact `types` and `moduleResolution` defaults, so pin a shared `tsconfig.base.json` explicitly: `"types"`, `"moduleResolution": "bundler"` and `"target"`. TS 6.x will receive only critical patches, so the TS 7 deferral should have a trigger.

### F5 (LOW): pnpm 11 workspace configuration changed. pnpm 12 is latest.
pnpm 11 reads pnpm-specific settings only from `pnpm-workspace.yaml`. It no longer reads the `pnpm` field in `package.json` or non-auth `.npmrc` settings, and it uses `packageConfigs` for per-project config. The Structural Seed should say that overrides, `onlyBuiltDependencies` and similar settings go in `pnpm-workspace.yaml`. pnpm 11.28.5 requires Node >=22.13, which Node 24 satisfies. The latest pnpm is 12.10.1. Keeping 11 matches the repo's `devEngines`, which is fine, but note it as deliberate.

### F6 (LOW): The Preact Vite plugin is missing from the Stack.
`ui` uses Preact on Vite 8, so the stack needs `@preact/preset-vite` 2.10.6 (2026-07-18; peer `vite ... || 8.x`, `@babel/core 7.x`) or equivalent esbuild/oxc JSX config. Compatibility is verified, but the dependency should be listed. If property tests use `@fast-check/vitest`, its 0.5.0 release has peer `vitest ^4.1 || ^5`.

## Confirmed (no action)

| Claim | Evidence (2026-10-09) |
| --- | --- |
| Vite 8.3.4, Vitest 5.0.3, Vitest peer `vite ^6.4 \|\| ^7 \|\| ^8` | npm registry |
| Vite/Vitest with TS 6 | Neither has a TypeScript peer (they transpile without tsc); valibot peer `typescript >=5` |
| Node 24 satisfies Vite (`^20.19 \|\| >=22.12`), Vitest (`^22.12 \|\| ^24`), pnpm 11 (`>=22.13`), Capacitor CLI (>=22) | npm registry |
| pure-rand 8.4.2 is latest; integer `uniformInt` exists | registry and tarball |
| valibot 1.5.0, @preact/signals 2.11.3 (peer `preact >=10.25 \|\| >=11.0.0-0`), preact 10.29.8 is the latest 10.x, idb 8.0.4 | npm registry |
| @capacitor/filesystem 8.1.4, @capacitor/app 8.1.2 | npm registry |
| @capacitor/app emits `pause`, `resume`, `appStateChange` | `dist/esm/definitions.d.ts` lines 213–234 |
| WebGL 2 is on by default from iOS/Safari 15 | Khronos WebGL wiki; WebKit bug 229606; early iOS 15.0 builds had WebGL 2 bugs, so test on the floor device |
| fast-check 4.10.2, @playwright/test 1.64.0 | npm registry |

**Caveat on `pause` and AD-16:** iOS gives very little time after `pause`, and an async JS save may be suspended before it finishes. "Save on pause" should be a best-effort supplement, with saving after every command batch as the primary path. AD-10 already says this, so keep it that way.

## Sources
- [ion-ios-filesystem IONFILEManager.swift](https://github.com/ionic-team/ion-ios-filesystem/blob/main/IONFilesystemLib/IONFILEManager.swift)
- [ion-android-filesystem IONFILELocalFilesHelper.kt](https://github.com/ionic-team/ion-android-filesystem/blob/main/src/main/kotlin/io/ionic/libs/ionfilesystemlib/helper/IONFILELocalFilesHelper.kt)
- [Apple: FileManager.moveItem](https://developer.apple.com/documentation/foundation/filemanager/1414750-moveitem)
- [kept PR #134 (Capacitor rename is not an atomic replace)](https://github.com/atz1man/kept/pull/134)
- [Capacitor Filesystem API](https://capacitorjs.com/docs/apis/filesystem)
- [Khronos WebGL wiki: Safari iOS](https://wikis.khronos.org/webgl/Implementations/SafariiOS), [WebKit bug 229606](https://bugs.webkit.org/show_bug.cgi?id=229606)
- [pnpm 11.0 release](https://pnpm.io/blog/releases/11.0)
- [TypeScript 6 breaking changes (secondary)](https://stacknotice.com/blog/typescript-6-breaking-changes-migration-guide)
- npm registry (`npm view`) for every version, peer and engines claim above
