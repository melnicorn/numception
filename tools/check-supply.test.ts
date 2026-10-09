// Tests for the supply check: banned packages in the lockfile and remote loads in
// scoped sources. Fixtures are inline text or temp dirs outside the repo.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { bannedGroups, matchBanned } from './banned-packages.cjs';
import { checkSupply, findBannedInLockfile, findRemoteLoads, lockfilePackageNames } from './check-supply.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'tools/check-supply.mjs');

/** A minimal pnpm v9 lockfile; `extra` is spliced into each section. */
function lockfile(extra: { importer?: string; packages?: string; snapshots?: string } = {}): string {
  return [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  packages/ui:',
    '    dependencies:',
    "      '@numception/app':",
    '        specifier: workspace:*',
    '        version: link:../app',
    '      preact:',
    '        specifier: ~10.29.8',
    '        version: 10.29.8',
    extra.importer ?? '',
    '',
    'packages:',
    '',
    '  preact@10.29.8:',
    "    resolution: {integrity: sha512-x}",
    '    peerDependencies:',
    "      preact-render-to-string: '>=5'",
    '',
    extra.packages ?? '',
    'snapshots:',
    '',
    '  preact@10.29.8: {}',
    '',
    extra.snapshots ?? '',
  ].join('\n');
}

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

function fixtureRepo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'numception-supply-'));
  tempDirs.push(root);
  for (const [file, text] of Object.entries({ 'pnpm-lock.yaml': lockfile(), ...files })) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
  return root;
}

function runCli(root: string) {
  return spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
}

describe('banned list', () => {
  it('has a comment and at least one package per group', () => {
    expect(bannedGroups.map((g) => g.group)).toEqual([
      'advertising',
      'attribution',
      'third-party-analytics',
      'crash-reporting',
      'live-update',
    ]);
    for (const g of bannedGroups) {
      expect(g.comment).not.toBe('');
      expect(g.packages.length).toBeGreaterThan(0);
    }
  });

  it.each([
    ['@capacitor-community/admob', 'advertising'],
    ['react-native-google-mobile-ads', 'advertising'],
    ['applovin-sdk', 'advertising'],
    ['appsflyer-capacitor-plugin', 'attribution'],
    ['@adjustcom/adjust-web-sdk', 'attribution'],
    ['branch-sdk', 'attribution'],
    ['@firebase/analytics', 'third-party-analytics'],
    ['mixpanel-browser', 'third-party-analytics'],
    ['@amplitude/analytics-browser', 'third-party-analytics'],
    ['@segment/analytics-next', 'third-party-analytics'],
    ['posthog-js', 'third-party-analytics'],
    ['@sentry/browser', 'crash-reporting'],
    ['@sentry/capacitor', 'crash-reporting'],
    ['sentry-cordova', 'crash-reporting'],
    ['raven-js', 'crash-reporting'],
    ['@bugsnag/js', 'crash-reporting'],
    ['@capacitor-firebase/crashlytics', 'crash-reporting'],
    ['@capgo/capacitor-updater', 'live-update'],
    ['@capacitor/live-updates', 'live-update'],
    ['@capawesome/capacitor-live-update', 'live-update'],
    ['react-native-code-push', 'live-update'],
    ['capacitor-codepush', 'live-update'],
    ['@capacitor-community/codepush', 'live-update'],
  ])('bans %s (%s)', (name, group) => {
    expect(matchBanned(name)?.group).toBe(group);
  });

  it.each(['preact', '@capacitor/core', '@capacitor/filesystem', '@ionic/utils-fs', 'adjust-sourcemap-loader', 'segmentit', '@capgo/capacitor-native-biometric', 'valibot'])(
    'allows %s',
    (name) => {
      expect(matchBanned(name)).toBeUndefined();
    },
  );
});

describe('lockfile check', () => {
  it('reads package names from importers, packages and snapshots, but not peer ranges', () => {
    const names = lockfilePackageNames(lockfile());
    expect([...names].sort()).toEqual(['@numception/app', 'preact']);
  });

  it('passes the real lockfile', () => {
    expect(findBannedInLockfile(readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8'))).toEqual([]);
  });

  it('fails a direct dependency, naming the package', () => {
    const text = lockfile({
      importer: "      '@sentry/browser':\n        specifier: ^10.0.0\n        version: 10.0.0",
      packages: "  '@sentry/browser@10.0.0':\n    resolution: {integrity: sha512-y}\n",
      snapshots: "  '@sentry/browser@10.0.0':\n    dependencies:\n      '@sentry/core': 10.0.0\n\n  '@sentry/core@10.0.0': {}\n",
    });
    expect(findBannedInLockfile(text).map((h) => h.name)).toEqual(['@sentry/browser', '@sentry/core']);
  });

  it('fails a transitive, unimported package', () => {
    const text = lockfile({
      packages: "  some-wrapper@1.0.0:\n    resolution: {integrity: sha512-z}\n\n  '@capgo/capacitor-updater@7.0.0(@capacitor/core@8.5.3)':\n    resolution: {integrity: sha512-w}\n",
      snapshots: "  some-wrapper@1.0.0:\n    dependencies:\n      '@capgo/capacitor-updater': 7.0.0(@capacitor/core@8.5.3)\n",
    });
    expect(findBannedInLockfile(text)).toEqual([
      { name: '@capgo/capacitor-updater', pattern: '@capgo/capacitor-updater', group: 'live-update' },
    ]);
  });
});

describe('remote-load scan', () => {
  it.each([
    ['<script src="https://cdn.example.com/x.js"></script>', 'script src'],
    ["<script type='module' src='//cdn.example.com/x.js'></script>", 'script src'],
    ['<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">', 'link href'],
    ['<link rel="preload" as="font" href="http://cdn.example.com/f.woff2" crossorigin>', 'link href'],
    ["@import url(https://fonts.googleapis.com/css2?family=Inter);", 'CSS @import'],
    ['@import "https://cdn.example.com/reset.css";', 'CSS @import'],
    ["  src: url('https://cdn.example.com/f.woff2') format('woff2');", 'CSS url()'],
    ["const face = new FontFace('X', 'url(//cdn.example.com/f.woff2)');", 'CSS url()'],
    ["const m = await import('https://cdn.example.com/x.js');", 'dynamic import()'],
    ['const m = await import(`https://cdn.example.com/${name}.js`);', 'dynamic import()'],
    ["import { x } from 'https://cdn.example.com/x.js';", 'static import'],
    ["export * from 'https://cdn.example.com/x.js';", 'static import'],
    ["import 'https://cdn.example.com/x.js';", 'side-effect import'],
  ])('fails %s', (line, kind) => {
    expect(findRemoteLoads(`first line\n${line}\n`, 'f.html')).toEqual([{ file: 'f.html', line: 2, kind, text: line.trim() }]);
  });

  it.each([
    [
      'link',
      '<head>\n  <link\n    rel="stylesheet"\n    href="https://fonts.googleapis.com/css2?family=Inter"\n  />\n</head>',
      'link href',
      4,
    ],
    ['script', '<body>\n<script\n  type="module"\n  src="https://cdn.example.com/x.js"\n></script>', 'script src', 4],
    ['import()', "const m = await import(\n  'https://cdn.example.com/x.js'\n);", 'dynamic import()', 2],
  ])('fails a %s split across lines, reporting the URL line', (_name, text, kind, line) => {
    expect(findRemoteLoads(text, 'f')).toEqual([{ file: 'f', line, kind, text: text.split('\n')[line - 1]?.trim() }]);
  });

  it.each([
    '<script type="module" src="/src/main.ts"></script>',
    '<link rel="icon" href="./favicon.svg">',
    "@import './local.css';",
    "src: url('/fonts/inter.woff2') format('woff2');",
    "const m = await import('./lazy');",
    "import { x } from './x';",
    '// See https://example.com/docs for details.',
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  ])('allows %s', (line) => {
    expect(findRemoteLoads(line, 'f')).toEqual([]);
  });

  it('passes the real workspace', () => {
    const { banned, remote, scanned } = checkSupply(repoRoot);
    expect({ banned, remote }).toEqual({ banned: [], remote: [] });
    expect(scanned).toBeGreaterThan(0);
  });

  it('scans packages/*/src, apps/client/src, apps/client/index.html and content/ only', () => {
    const root = fixtureRepo({
      'packages/ui/src/a.css': '@import url(https://fonts.example.com/a.css);',
      'packages/ui/README.html': '<script src="https://cdn.example.com/ignored.js"></script>',
      'packages/ui/node_modules/x/index.js': "import('https://cdn.example.com/ignored.js')",
      'apps/client/src/main.ts': "import('https://cdn.example.com/b.js');",
      'apps/client/index.html': '<html>\n<script src="https://cdn.example.com/c.js"></script>\n</html>',
      'apps/client/vite.config.ts': "import('https://cdn.example.com/ignored.js');",
      'content/themes/neon.json': '{ "font": "url(https://fonts.example.com/d.woff2)" }',
      'prototypes/x/src/main.ts': "import('https://cdn.example.com/ignored.js');",
    });
    const { remote } = checkSupply(root);
    expect(remote.map((r) => `${r.file}:${r.line}`).sort()).toEqual([
      'apps/client/index.html:2',
      'apps/client/src/main.ts:1',
      'content/themes/neon.json:1',
      'packages/ui/src/a.css:1',
    ]);
  });
});

describe('check-supply CLI', () => {
  it('exits 0 on the real workspace', () => {
    const r = runCli(repoRoot);
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
  });

  it('exits non-zero naming a banned package in the lockfile', () => {
    const root = fixtureRepo({
      'pnpm-lock.yaml': lockfile({ packages: "  '@sentry/browser@10.0.0':\n    resolution: {integrity: sha512-y}\n" }),
    });
    const r = runCli(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('banned-package: @sentry/browser');
  });

  it('still runs (and fails) when invoked through a symlink', () => {
    const root = fixtureRepo({
      'pnpm-lock.yaml': lockfile({ packages: "  '@sentry/browser@10.0.0':\n    resolution: {integrity: sha512-y}\n" }),
    });
    const link = join(root, 'check-supply-link.mjs');
    symlinkSync(script, link);
    const r = spawnSync(process.execPath, [link, '--root', root], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('banned-package: @sentry/browser');
  });

  it('exits non-zero naming file:line for a remote script in index.html', () => {
    const root = fixtureRepo({
      'apps/client/index.html': '<!doctype html>\n<html>\n  <script src="https://cdn.example.com/x.js"></script>\n</html>\n',
    });
    const r = runCli(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('remote-load: apps/client/index.html:3 script src');
  });
});
