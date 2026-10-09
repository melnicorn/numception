import type { CapacitorConfig } from '@capacitor/cli';

// Native shells load the built client from dist/ at base `/`. The `app.numception`
// prefix is a placeholder until store ids are registered; flavour ids arrive with
// build flavours (AD-18).
const config: CapacitorConfig = {
  appId: 'app.numception.dev',
  appName: 'Numception',
  webDir: 'dist',
};

export default config;
