// Drives dependency-cruiser with the real `.dependency-cruiser.cjs` against small
// fixture workspaces built in a temp dir (never under the repo, so neither
// `pnpm lint:deps`, `tsc -b` nor the e2e can pick them up).
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cruise, type ICruiseResult, type IConfiguration } from 'dependency-cruiser';
import extractTSConfig from 'dependency-cruiser/config-utl/extract-ts-config';
import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const config = require(join(repoRoot, '.dependency-cruiser.cjs')) as IConfiguration;

const PACKAGES = ['core', 'app', 'render', 'ui', 'platform-web', 'platform-native'] as const;
const SCOPE = ['packages', 'apps/client/src'];

type Violation = { rule: string; from: string; to: string };

async function runCruise(baseDir: string, tsConfigFile?: string): Promise<Violation[]> {
  const { tsConfig: _tsConfigOption, ...options } = config.options ?? {};
  const result = await cruise(
    SCOPE,
    { ...options, validate: true, ruleSet: { forbidden: config.forbidden ?? [] }, baseDir, outputType: 'json' },
    {},
    { tsConfig: tsConfigFile ? extractTSConfig(tsConfigFile) : undefined },
  );
  const output = JSON.parse(result.output as string) as ICruiseResult;
  return output.summary.violations.map((v) => ({ rule: v.rule.name, from: v.from, to: v.to }));
}

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

function write(root: string, file: string, text: string): void {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
}

/**
 * Builds a fixture workspace: the six packages (each `src/index.ts` exporting a
 * constant), `apps/client/src/main.ts`, pnpm-style `node_modules` links for the
 * workspace packages, and pnpm-style stub installs for `npmStubs`. `files`
 * overrides or adds source files. Returns the violations.
 */
async function lint(files: Record<string, string> = {}, npmStubs: string[] = []): Promise<Violation[]> {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'numception-depcruise-')));
  tempDirs.push(root);
  const base: Record<string, string> = {
    'apps/client/src/main.ts': "import { ui } from '@numception/ui';\nexport const main = ui;\n",
    'prototypes/renderer-bakeoff/phaser/src/main.ts': 'export const proto = 1;\n',
  };
  for (const pkg of PACKAGES) {
    base[`packages/${pkg}/package.json`] = JSON.stringify({
      name: `@numception/${pkg}`,
      type: 'module',
      exports: { '.': './src/index.ts' },
    });
    base[`packages/${pkg}/src/index.ts`] = `export const ${pkg.replace('-', '_')} = '${pkg}';\n`;
    base[`packages/${pkg}/src/view.ts`] = `export type ${pkg.replace('-', '')}View = { id: string };\n`;
  }
  for (const [file, text] of Object.entries({ ...base, ...files })) write(root, file, text);
  mkdirSync(join(root, 'node_modules/@numception'), { recursive: true });
  for (const pkg of PACKAGES) {
    symlinkSync(join(root, 'packages', pkg), join(root, 'node_modules/@numception', pkg));
  }
  for (const name of npmStubs) {
    const store = join(root, 'node_modules/.pnpm', `${name.replace('/', '+')}@1.0.0`, 'node_modules', name);
    write(store, 'package.json', JSON.stringify({ name, version: '1.0.0', type: 'module', main: 'index.js' }));
    write(store, 'index.js', 'export default {};\n');
    mkdirSync(dirname(join(root, 'node_modules', name)), { recursive: true });
    symlinkSync(store, join(root, 'node_modules', name));
  }
  return runCruise(root);
}

const rules = (vs: Violation[]) => [...new Set(vs.map((v) => v.rule))].sort();

describe('the real workspace', () => {
  it('has no dependency violations', async () => {
    const violations = await runCruise(repoRoot, join(repoRoot, 'tsconfig.base.json'));
    expect(violations).toEqual([]);
  });
});

describe('fixture workspace', () => {
  it('passes when clean', async () => {
    expect(await lint()).toEqual([]);
  });

  describe('inward direction', () => {
    it('fails core -> app, naming the rule and both files', async () => {
      const vs = await lint({ 'packages/core/src/index.ts': "export { app } from '@numception/app';\n" });
      expect(vs).toContainEqual({
        rule: 'core-imports-only-pure-deps',
        from: 'packages/core/src/index.ts',
        to: 'packages/app/src/index.ts',
      });
    });

    it('fails app -> ui', async () => {
      const vs = await lint({ 'packages/app/src/index.ts': "export { ui } from '@numception/ui';\n" });
      expect(vs).toContainEqual({
        rule: 'app-imports-only-core',
        from: 'packages/app/src/index.ts',
        to: 'packages/ui/src/index.ts',
      });
    });

    it.each([
      ['render', 'ui', 'render-imports-only-app'],
      ['ui', 'render', 'ui-imports-only-app'],
      ['platform-web', 'core', 'platform-web-imports-only-app'],
      ['platform-web', 'platform-native', 'platform-web-imports-only-app'],
      ['platform-native', 'render', 'platform-native-imports-only-app'],
    ])('fails %s -> %s', async (from, to, rule) => {
      const vs = await lint({ [`packages/${from}/src/extra.ts`]: `import '@numception/${to}';\n` });
      expect(rules(vs)).toContain(rule);
    });

    it('allows adapters -> app and the client -> any package', async () => {
      const files: Record<string, string> = {
        'apps/client/src/main.ts': PACKAGES.map((p) => `import '@numception/${p}';`).join('\n'),
      };
      for (const p of ['render', 'ui', 'platform-web', 'platform-native']) {
        files[`packages/${p}/src/extra.ts`] = "import '@numception/app';\n";
      }
      files['packages/app/src/extra.ts'] = "import '@numception/core';\n";
      expect(await lint(files)).toEqual([]);
    });

    it('fails a Node built-in in core or app', async () => {
      const vs = await lint({
        'packages/core/src/extra.ts': "import { readFileSync } from 'node:fs';\nexport const r = readFileSync;\n",
        'packages/app/src/extra.ts': "import { join } from 'path';\nexport const j = join;\n",
      });
      expect(rules(vs)).toEqual(['app-imports-only-core', 'core-imports-only-pure-deps']);
    });
  });

  describe('core types in adapters', () => {
    it.each(['ui', 'render'])('fails a value import of core from %s', async (pkg) => {
      const vs = await lint({ [`packages/${pkg}/src/extra.ts`]: "import { core } from '@numception/core';\nexport const c = core;\n" });
      expect(vs).toContainEqual({
        rule: 'adapters-import-core-types-only',
        from: `packages/${pkg}/src/extra.ts`,
        to: 'packages/core/src/index.ts',
      });
    });

    it.each(['ui', 'render'])('allows `import type` of core from %s', async (pkg) => {
      const vs = await lint({
        'packages/core/src/index.ts': "export type { coreView } from './view';\nexport const core = 1;\n",
        [`packages/${pkg}/src/extra.ts`]: "import type { coreView } from '@numception/core';\nexport type V = coreView;\n",
      });
      expect(vs).toEqual([]);
    });
  });

  describe('library confinement', () => {
    it.each([
      ['core', 'preact'],
      ['core', '@capacitor/core'],
      ['core', 'phaser'],
      ['app', 'preact'],
      ['app', '@capacitor/core'],
      ['app', 'phaser'],
    ])('fails %s importing %s', async (pkg, lib) => {
      const vs = await lint({ [`packages/${pkg}/src/extra.ts`]: `import '${lib}';\n` }, [lib]);
      expect(rules(vs)).toContain(pkg === 'core' ? 'core-imports-only-pure-deps' : 'app-imports-only-core');
      const libRule = lib === 'preact' ? 'preact-only-in-ui' : lib === 'phaser' ? 'renderer-lib-only-in-render' : 'capacitor-only-in-platform-native-and-client';
      expect(rules(vs)).toContain(libRule);
    });

    it.each([
      ['ui', 'phaser', 'renderer-lib-only-in-render'],
      ['ui', 'pixi.js', 'renderer-lib-only-in-render'],
      ['platform-web', 'pixi-filters', 'renderer-lib-only-in-render'],
      ['render', 'preact', 'preact-only-in-ui'],
      ['platform-native', '@preact/signals', 'preact-only-in-ui'],
      ['platform-web', '@capacitor/core', 'capacitor-only-in-platform-native-and-client'],
      ['ui', '@capacitor/haptics', 'capacitor-only-in-platform-native-and-client'],
    ])('fails %s importing %s', async (pkg, lib, rule) => {
      const vs = await lint({ [`packages/${pkg}/src/extra.ts`]: `import '${lib}';\n` }, [lib]);
      expect(rules(vs)).toEqual([rule]);
    });

    it('fails the client importing preact directly', async () => {
      const vs = await lint({ 'apps/client/src/extra.ts': "import 'preact';\n" }, ['preact']);
      expect(rules(vs)).toEqual(['preact-only-in-ui']);
    });

    it('allows each library in its own package', async () => {
      const vs = await lint(
        {
          'packages/render/src/extra.ts': "import 'phaser';\nimport 'pixi.js';\nimport 'pixi-filters';\n",
          'packages/ui/src/extra.ts': "import 'preact';\nimport '@preact/signals';\n",
          'packages/platform-native/src/extra.ts': "import '@capacitor/core';\n",
          'apps/client/src/extra.ts': "import '@capacitor/core';\n",
        },
        ['phaser', 'pixi.js', 'pixi-filters', 'preact', '@preact/signals', '@capacitor/core'],
      );
      expect(vs).toEqual([]);
    });
  });

  describe('prototypes and apps', () => {
    it('fails packages/ importing prototypes/', async () => {
      const vs = await lint({
        'packages/render/src/extra.ts': "import '../../../prototypes/renderer-bakeoff/phaser/src/main';\n",
      });
      expect(vs).toContainEqual({
        rule: 'packages-not-to-apps-or-prototypes',
        from: 'packages/render/src/extra.ts',
        to: 'prototypes/renderer-bakeoff/phaser/src/main.ts',
      });
    });

    it('fails packages/ importing apps/', async () => {
      const vs = await lint({ 'packages/app/src/extra.ts': "import '../../../apps/client/src/main';\n" });
      expect(rules(vs)).toContain('packages-not-to-apps-or-prototypes');
    });

    it('fails apps/client/src importing prototypes/', async () => {
      const vs = await lint({
        'apps/client/src/extra.ts': "import '../../../prototypes/renderer-bakeoff/phaser/src/main';\n",
      });
      expect(rules(vs)).toEqual(['client-not-to-prototypes']);
    });
  });

  describe('banned list', () => {
    it.each([
      ['packages/ui/src/extra.ts', '@sentry/browser'],
      ['apps/client/src/extra.ts', '@capgo/capacitor-updater'],
      ['packages/platform-web/src/extra.ts', 'posthog-js'],
      ['packages/platform-native/src/extra.ts', '@capacitor-community/admob'],
    ])('fails %s importing %s', async (file, pkg) => {
      const vs = await lint({ [file]: `import '${pkg}';\n` }, [pkg]);
      expect(vs.find((v) => v.rule === 'no-banned-packages')).toMatchObject({ from: file });
    });

    it('fails a banned import even when it is not installed', async () => {
      const vs = await lint({ 'apps/client/src/extra.ts': "import '@bugsnag/js';\n" });
      expect(rules(vs)).toEqual(['no-banned-packages', 'not-to-unresolvable']);
    });
  });

  describe('hygiene', () => {
    it('fails a remote dynamic import', async () => {
      const vs = await lint({
        'apps/client/src/extra.ts': "export const load = () => import('https://cdn.example.com/x.js');\n",
      });
      expect(rules(vs)).toContain('no-remote-imports');
    });

    it('fails a cycle', async () => {
      const vs = await lint({
        'packages/core/src/a.ts': "import { b } from './b';\nexport const a = () => b;\n",
        'packages/core/src/b.ts': "import { a } from './a';\nexport const b = () => a;\n",
      });
      expect(rules(vs)).toEqual(['no-circular']);
    });

    it('fails an unresolvable import', async () => {
      const vs = await lint({ 'packages/app/src/extra.ts': "import './missing';\n" });
      expect(rules(vs)).toContain('not-to-unresolvable');
    });
  });

  describe('allowed core and test dependencies', () => {
    it('allows core -> valibot and pure-rand, and core tests -> vitest and fast-check', async () => {
      const vs = await lint(
        {
          'packages/core/src/extra.ts': "import 'valibot';\nimport 'pure-rand';\n",
          'packages/core/src/extra.test.ts': "import 'vitest';\nimport 'fast-check';\nimport './extra';\n",
          'packages/core/src/extra.prop.test.ts': "import 'fast-check';\nimport 'valibot';\n",
          'packages/app/src/extra.test.ts': "import 'vitest';\nimport '@numception/core';\n",
        },
        ['valibot', 'pure-rand', 'vitest', 'fast-check'],
      );
      expect(vs).toEqual([]);
    });

    it('fails vitest in core source that is not a test', async () => {
      const vs = await lint({ 'packages/core/src/extra.ts': "import 'vitest';\n" }, ['vitest']);
      expect(rules(vs)).toEqual(['core-imports-only-pure-deps']);
    });

    it('fails a core test importing anything beyond the test deps', async () => {
      const vs = await lint({ 'packages/core/src/extra.test.ts': "import '@numception/app';\n" });
      expect(rules(vs)).toEqual(['core-tests-import-only-pure-and-test-deps']);
    });
  });
});
