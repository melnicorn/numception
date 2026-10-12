import type { CapacitorConfig } from '@capacitor/cli';
import { flavourOutDir, resolveFlavour } from './flavours.ts';

// Native shells load the built client from dist/<flavour>/ at base `/`. FLAVOUR
// (dev | playtest | prod, default dev) picks the appId, appName and webDir from the
// flavour table (AD-18); an unknown value throws, naming the valid flavours.
//
// BAKEOFF=phaser or BAKEOFF=pixi points the shells at a renderer bake-off build
// instead (prototypes/renderer-bakeoff, tickets 8 and 9). Unset or empty ships the
// client.
const bakeoffWebDirs: Record<string, string> = {
  phaser: '../../prototypes/renderer-bakeoff/phaser/dist',
  pixi: '../../prototypes/renderer-bakeoff/pixi/dist',
};

const flavour = resolveFlavour(process.env);

function webDir(): string {
  const bakeoff = process.env.BAKEOFF ?? '';
  if (bakeoff === '') return flavourOutDir(flavour);
  if (!Object.hasOwn(bakeoffWebDirs, bakeoff)) {
    throw new Error(
      `Unknown BAKEOFF="${bakeoff}". Expected one of: ${Object.keys(bakeoffWebDirs).join(', ')} (or unset for the client).`,
    );
  }
  return bakeoffWebDirs[bakeoff]!;
}

const config: CapacitorConfig = {
  appId: flavour.appId,
  appName: flavour.appName,
  webDir: webDir(),
  // Bake-off builds forward console.log in release too, so ticket 3 can read the
  // readout's measurement lines over USB (devicectl --console).
  ...(process.env.BAKEOFF ? { loggingBehavior: 'production' as const } : {}),
};

export default config;
