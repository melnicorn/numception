/** A haptic impact's strength. */
export type HapticKind = 'light' | 'medium' | 'heavy' | 'soft';

/** The haptics port (AD-16). Adapters never throw; the Capacitor one is in platform-native. */
export type HapticsPort = { readonly impact: (kind: HapticKind) => void };

/** The no-op haptics adapter (AD-16: every feature works without haptics). */
export const noHaptics: HapticsPort = Object.freeze({ impact: () => {} });
