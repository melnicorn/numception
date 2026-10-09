// @ts-check
'use strict';

// Boundary lint for AD-1 ("Dependencies point inward; banned dependencies").
// Run by `pnpm lint:deps` over `packages apps/client/src`. The import directions
// mirror the architecture's dependency diagram (§ Design Paradigm):
//
//   apps/client -> app, render, ui, platform-web, platform-native
//   render, ui, platform-web, platform-native -> app -> core
//   render, ui -.type-only.-> core
//
// The banned list lives once in tools/banned-packages.cjs and is shared with the
// lockfile check (tools/check-supply.mjs).

const { bannedNameSource } = require('./tools/banned-packages.cjs');

/**
 * Matches a dependency on one of the given npm packages, whether it resolved into
 * node_modules (pnpm: `node_modules/.pnpm/x@1/node_modules/x/...`) or stayed an
 * unresolved bare specifier.
 * @param {string} names regex source for the package name(s)
 */
const npm = (names) => `(?:^|/node_modules/|^node_modules/)(?:${names})(?:/|$)`;

const RENDERER_LIBS = 'phaser|pixi\\.js|pixi-filters|@pixi/[^/]+';
const PREACT = 'preact|@preact/[^/]+';
const CAPACITOR = '@capacitor/[^/]+';
const CORE_PURE_DEPS = 'pure-rand|valibot';
const TEST_DEPS = 'vitest|@vitest/[^/]+|fast-check';
const TEST_FILE = '\\.test\\.tsx?$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // --- Inward direction (AD-1: "Imports follow the diagram and nothing else") ---
    {
      name: 'core-imports-only-pure-deps',
      comment:
        'AD-1: core imports only itself and its pinned pure dependencies (pure-rand, valibot): ' +
        'no workspace package, Node built-in, platform, renderer or DOM library.',
      severity: 'error',
      from: { path: '^packages/core/', pathNot: TEST_FILE },
      to: { pathNot: [`^packages/core/`, npm(CORE_PURE_DEPS)] },
    },
    {
      name: 'core-tests-import-only-pure-and-test-deps',
      comment: 'AD-1, AD-19: core test files may additionally import vitest and fast-check, nothing else.',
      severity: 'error',
      from: { path: [`^packages/core/.*${TEST_FILE}`] },
      to: { pathNot: [`^packages/core/`, npm(CORE_PURE_DEPS), npm(TEST_DEPS)] },
    },
    {
      name: 'app-imports-only-core',
      comment: 'AD-1: app (the imperative shell) imports core only, plus itself. I/O goes through ports.',
      severity: 'error',
      from: { path: '^packages/app/', pathNot: TEST_FILE },
      to: { pathNot: ['^packages/(app|core)/'] },
    },
    {
      name: 'app-tests-import-only-core-and-test-deps',
      comment: 'AD-1, AD-19: app test files may additionally import vitest and fast-check, nothing else.',
      severity: 'error',
      from: { path: [`^packages/app/.*${TEST_FILE}`] },
      to: { pathNot: ['^packages/(app|core)/', npm(TEST_DEPS)] },
    },
    {
      name: 'render-imports-only-app',
      comment: 'AD-1: render is an adapter; of the workspace packages it imports app only (core as types only).',
      severity: 'error',
      from: { path: '^packages/render/' },
      to: { path: '^packages/', pathNot: '^packages/(render|app|core)/' },
    },
    {
      name: 'ui-imports-only-app',
      comment: 'AD-1: ui is an adapter; of the workspace packages it imports app only (core as types only).',
      severity: 'error',
      from: { path: '^packages/ui/' },
      to: { path: '^packages/', pathNot: '^packages/(ui|app|core)/' },
    },
    {
      name: 'adapters-import-core-types-only',
      comment:
        'AD-1, AD-13: render and ui may use core view-model and layout types, but only via `import type`; ' +
        'game rules never run in an adapter.',
      severity: 'error',
      from: { path: '^packages/(render|ui)/' },
      to: { path: '^packages/core/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'platform-web-imports-only-app',
      comment: 'AD-1, AD-16: platform-web is an adapter; of the workspace packages it imports app only.',
      severity: 'error',
      from: { path: '^packages/platform-web/' },
      to: { path: '^packages/', pathNot: '^packages/(platform-web|app)/' },
    },
    {
      name: 'platform-native-imports-only-app',
      comment: 'AD-1, AD-16: platform-native is an adapter; of the workspace packages it imports app only.',
      severity: 'error',
      from: { path: '^packages/platform-native/' },
      to: { path: '^packages/', pathNot: '^packages/(platform-native|app)/' },
    },
    {
      name: 'packages-not-to-apps-or-prototypes',
      comment: 'AD-1: nothing under packages/ imports apps/ or prototypes/ (prototypes are throwaway).',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^(apps|prototypes)/' },
    },
    {
      name: 'client-not-to-prototypes',
      comment: 'AD-1: the composition root never imports the throwaway renderer prototypes.',
      severity: 'error',
      from: { path: '^apps/client/src/' },
      to: { path: '^prototypes/' },
    },

    // --- Library confinement (AD-1) ---
    {
      name: 'renderer-lib-only-in-render',
      comment: 'AD-1, AD-14: only render may import the renderer library (phaser, pixi.js, pixi-filters).',
      severity: 'error',
      from: { pathNot: '^(packages/render|prototypes)/' },
      to: { path: npm(RENDERER_LIBS) },
    },
    {
      name: 'preact-only-in-ui',
      comment: 'AD-1: only ui may import Preact (preact, @preact/*).',
      severity: 'error',
      from: { pathNot: '^packages/ui/' },
      to: { path: npm(PREACT) },
    },
    {
      name: 'capacitor-only-in-platform-native-and-client',
      comment: 'AD-1, AD-16: only platform-native and apps/client may import @capacitor/*.',
      severity: 'error',
      from: { pathNot: '^(packages/platform-native|apps/client)/' },
      to: { path: npm(CAPACITOR) },
    },

    // --- Banned list (AD-1, AD-12, AD-18; tools/banned-packages.cjs) ---
    {
      name: 'no-banned-packages',
      comment:
        'AD-1: no advertising, attribution, third-party analytics, crash or live-update/OTA SDKs ' +
        '(see tools/banned-packages.cjs).',
      severity: 'error',
      from: {},
      to: { path: npm(bannedNameSource) },
    },
    {
      name: 'no-remote-imports',
      comment: 'AD-1, AD-18: no runtime-loaded remote scripts; every module is bundled.',
      severity: 'error',
      from: {},
      to: { path: '^(?:https:|http:)?//' },
    },

    // --- Hygiene ---
    {
      name: 'no-circular',
      comment: 'AD-1: dependencies point one way; no cycles.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'AD-1: every import resolves, so the path rules above can see where it points.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    // Type-only imports must be visible so `adapters-import-core-types-only` can tell them apart.
    tsPreCompilationDeps: true,
    // Workspace packages resolve through node_modules symlinks to packages/<name>/src real paths.
    preserveSymlinks: false,
    tsConfig: { fileName: 'tsconfig.base.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^packages/[^/]+/(?:\\.tsbuild|dist)/' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
