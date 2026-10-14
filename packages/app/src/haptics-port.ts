/** A haptic impact's strength. */
export type HapticKind = 'light' | 'medium' | 'heavy' | 'soft';

/** The haptics port (AD-16). Adapters never throw; the real one arrives with entry 3. */
export type HapticsPort = { readonly impact: (kind: HapticKind) => void };

/** The no-op haptics adapter (AD-16: every feature works without haptics). */
export const noHaptics: HapticsPort = Object.freeze({ impact: () => {} });
