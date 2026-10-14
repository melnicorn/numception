// Capacitor adapters for the platform ports (AD-16); the only package besides apps/client that may import @capacitor/*.
// The client imports this package dynamically, and only inside a native shell, so
// the web and PWA bundles never load the plugins.
export { capacitorHaptics } from './capacitor-haptics';
export { type HapticsPluginLike, IMPACT_STYLES, nativeHaptics } from './native-haptics';
