// Build-time flavour constants, replaced by Vite's `define` (see vite.config.ts and
// flavours.ts). Use the globals directly in an `if`, so the bundler sees a literal
// and can drop the dead branch: prod must not contain any dev-panel code (AD-18).

declare global {
  /** The flavour this bundle was built for. */
  const __NUMCEPTION_FLAVOUR__: 'dev' | 'playtest' | 'prod';
  /** True in dev and playtest builds; literal `false` in prod. */
  const __NUMCEPTION_DEV_PANEL__: boolean;
  /** True in PWA builds (playtest, prod); literal `false` in dev, which has no service worker. */
  const __NUMCEPTION_PWA__: boolean;
}

export {};
