// Tests for the flavour check. Fixtures are temp repos outside the repo, seeded
// from the real build.gradle, base xcconfig and dev-panel source.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { FLAVOURS, type FlavourName } from '../apps/client/flavours.ts';
import { xcconfigFor } from '../apps/client/scripts/write-ios-flavour.mjs';
import {
  checkFlavours,
  DEV_PANEL_MARKER,
  pageIdentity,
  parseGradleWiring,
  parseXcconfig,
} from './check-flavours.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'tools/check-flavours.mjs');
const GRADLE = 'apps/client/android/app/build.gradle';
const BASE_XCCONFIG = 'apps/client/ios/flavour-base.xcconfig';
const PANEL = 'packages/ui/src/dev-panel/dev-panel.tsx';

const tempDirs: string[] = [];
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

function page(name: FlavourName, overrides: { appId?: string; title?: string } = {}): string {
  const f = FLAVOURS[name];
  return [
    '<!doctype html>',
    `<html data-flavour="${f.name}" lang="en">`,
    '<head>',
    `<title>${overrides.title ?? f.appName}</title>`,
    `<meta name="application-name" content="${f.appName}">`,
    `<meta name="numception-app-id" content="${overrides.appId ?? f.appId}">`,
    '</head><body><div id="app"></div></body></html>',
  ].join('\n');
}

/** A repo that passes; `files` overrides or adds paths (null deletes). */
function fixtureRepo(files: Record<string, string | null> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'numception-flavours-'));
  tempDirs.push(root);
  const base: Record<string, string> = {
    [GRADLE]: readFileSync(join(repoRoot, GRADLE), 'utf8'),
    [BASE_XCCONFIG]: readFileSync(join(repoRoot, BASE_XCCONFIG), 'utf8'),
    [PANEL]: readFileSync(join(repoRoot, PANEL), 'utf8'),
  };
  for (const name of ['dev', 'playtest', 'prod'] as const) {
    base[`apps/client/dist/${name}/index.html`] = page(name);
    base[`apps/client/dist/${name}/assets/index-abc.js`] = FLAVOURS[name].devPanel
      ? 'import("./mount-dev-panel-x.js")'
      : 'console.log("tracer")';
    if (FLAVOURS[name].devPanel) {
      base[`apps/client/dist/${name}/assets/mount-dev-panel-x.js`] = `const id="${DEV_PANEL_MARKER}";`;
    }
  }
  for (const [file, text] of Object.entries({ ...base, ...files })) {
    if (text === null) continue;
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
  return root;
}

describe('parsers', () => {
  it('reads xcconfig settings, skipping comments and includes', () => {
    const xc = parseXcconfig('// c\nA = 1\nB = Numception Dev // trailing\n#include? "x.xcconfig"\n');
    expect([...xc.entries()]).toEqual([
      ['A', '1'],
      ['B', 'Numception Dev'],
    ]);
  });

  it('reads the generated xcconfig for each flavour', () => {
    for (const f of Object.values(FLAVOURS)) {
      const xc = parseXcconfig(xcconfigFor(f));
      expect(xc.get('NUMCEPTION_APP_ID')).toBe(f.appId);
      expect(xc.get('NUMCEPTION_APP_NAME')).toBe(f.appName);
    }
  });

  it('reads the synced-config wiring from the real build.gradle', () => {
    expect(parseGradleWiring(readFileSync(join(repoRoot, GRADLE), 'utf8'))).toMatchObject({
      readsSyncedConfig: true,
      hasProductFlavors: false,
      appIdFallback: 'app.numception.dev',
      appNameFallback: 'Numception Dev',
    });
  });

  it('reads the page identity with attributes in any order', () => {
    expect(
      pageIdentity('<html lang="en" data-flavour="dev"><title>T</title><meta content="a.b" name="numception-app-id">'),
    ).toEqual({ appId: 'a.b', applicationName: undefined, title: 'T', flavour: 'dev' });
  });
});

describe('checkFlavours', () => {
  it('passes a consistent repo', () => {
    expect(checkFlavours(fixtureRepo())).toEqual([]);
  });

  it('fails when prod contains the dev-panel marker or a dev-panel chunk', () => {
    const errors = checkFlavours(
      fixtureRepo({
        'apps/client/dist/prod/assets/index-abc.js': `x="${DEV_PANEL_MARKER}"`,
        'apps/client/dist/prod/assets/mount-dev-panel-y.js': 'x',
      }),
    );
    expect(errors).toContain('web prod: dev-panel file apps/client/dist/prod/assets/mount-dev-panel-y.js must not ship');
    expect(errors).toContain('web prod: apps/client/dist/prod/assets/index-abc.js mentions "dev-panel"');
  });

  it('fails when a dev-panel build lacks the marker or chunk', () => {
    const errors = checkFlavours(fixtureRepo({ 'apps/client/dist/playtest/assets/mount-dev-panel-x.js': null }));
    expect(errors).toContain(`web playtest: dev-panel marker "${DEV_PANEL_MARKER}" not found in apps/client/dist/playtest`);
    expect(errors).toContain('web playtest: no dev-panel chunk in apps/client/dist/playtest');
  });

  it('fails when the marker is gone from the panel source', () => {
    expect(checkFlavours(fixtureRepo({ [PANEL]: 'export {}' }))).toContain(
      `dev panel: marker "${DEV_PANEL_MARKER}" not found in ${PANEL}`,
    );
  });

  it('fails on a wrong page identity or a missing build', () => {
    const errors = checkFlavours(
      fixtureRepo({
        'apps/client/dist/playtest/index.html': page('playtest', { appId: 'app.numception.dev', title: 'Numception' }),
        'apps/client/dist/dev/index.html': null,
      }),
    );
    expect(errors).toContain(
      'web playtest: meta numception-app-id is app.numception.dev, expected app.numception.playtest',
    );
    expect(errors).toContain('web playtest: <title> is Numception, expected Numception Playtest');
    expect(errors).toContain('web dev: apps/client/dist/dev/index.html is missing (run pnpm build first)');
  });

  it('fails when build.gradle hard-codes product flavours or an applicationId', () => {
    const real = readFileSync(join(repoRoot, GRADLE), 'utf8');
    const flavoured = real.replace(
      '    buildTypes {',
      '    flavorDimensions = ["flavour"]\n    productFlavors {\n        prod { dimension "flavour"; applicationId "app.numception" }\n    }\n    buildTypes {',
    );
    expect(checkFlavours(fixtureRepo({ [GRADLE]: flavoured }))).toContain(
      `android: ${GRADLE} must not declare productFlavors/flavorDimensions (it follows the last cap:sync)`,
    );
    const hardCoded = real.replace('applicationId numceptionAppId', 'applicationId "app.numception.dev"');
    expect(checkFlavours(fixtureRepo({ [GRADLE]: hardCoded }))).toContain(
      'android: applicationId ("app.numception.dev") must come from the synced config\'s appId with a dev fallback',
    );
  });

  it('fails when build.gradle stops reading the synced config or its fallback drifts', () => {
    const real = readFileSync(join(repoRoot, GRADLE), 'utf8');
    const noSync = real.replace("file('src/main/assets/capacitor.config.json')", "file('other.json')");
    expect(checkFlavours(fixtureRepo({ [GRADLE]: noSync }))).toContain(
      `android: ${GRADLE} must read src/main/assets/capacitor.config.json with JsonSlurper`,
    );
    const badFallback = real.replace("?: 'Numception Dev'", "?: 'Numception'");
    expect(checkFlavours(fixtureRepo({ [GRADLE]: badFallback }))).toContain(
      'android: app_name fallback is Numception, expected Numception Dev',
    );
  });

  it('fails when the iOS fallback is not dev', () => {
    const xc = readFileSync(join(repoRoot, BASE_XCCONFIG), 'utf8').replace(
      'NUMCEPTION_APP_ID = app.numception.dev',
      'NUMCEPTION_APP_ID = app.numception',
    );
    expect(checkFlavours(fixtureRepo({ [BASE_XCCONFIG]: xc })).some((e) => e.startsWith('ios: '))).toBe(true);
  });
});

describe('check-flavours CLI', () => {
  it('exits 0 on a consistent repo and 1 with findings', () => {
    const ok = spawnSync(process.execPath, [script, '--root', fixtureRepo()], { encoding: 'utf8' });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain('check-flavours');
    const bad = spawnSync(
      process.execPath,
      [script, '--root', fixtureRepo({ 'apps/client/dist/prod/assets/index-abc.js': 'dev-panel' })],
      { encoding: 'utf8' },
    );
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('mentions "dev-panel"');
  });
});
