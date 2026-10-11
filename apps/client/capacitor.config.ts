import type { CapacitorConfig } from '@capacitor/cli';

// Native shells load the built client from dist/ at base `/`. The `app.numception`
// prefix is a placeholder until store ids are registered; flavour ids arrive with
// build flavours (AD-18).
//
// BAKEOFF=phaser or BAKEOFF=pixi points the shells at a renderer bake-off build
// instead (prototypes/renderer-bakeoff, tickets 8 and 9). Unset or empty ships the
// client.
const bakeoffWebDirs: Record<string, string> = {
  phaser: '../../prototypes/renderer-bakeoff/phaser/dist',
  pixi: '../../prototypes/renderer-bakeoff/pixi/dist',
};

function webDir(): string {
  const bakeoff = process.env.BAKEOFF ?? '';
  if (bakeoff === '') return 'dist';
  if (!Object.hasOwn(bakeoffWebDirs, bakeoff)) {
    throw new Error(
      `Unknown BAKEOFF="${bakeoff}". Expected one of: ${Object.keys(bakeoffWebDirs).join(', ')} (or unset for the client).`,
    );
  }
  return bakeoffWebDirs[bakeoff]!;
}

const config: CapacitorConfig = {
  appId: 'app.numception.dev',
  appName: 'Numception',
  webDir: webDir(),
  // Bake-off builds forward console.log in release too, so ticket 3 can read the
  // readout's measurement lines over USB (devicectl --console).
  ...(process.env.BAKEOFF ? { loggingBehavior: 'production' as const } : {}),
};

export default config;
