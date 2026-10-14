import type { HapticKind, HapticsPort } from '@numception/app';
import type { HapticsPlugin, ImpactStyle } from '@capacitor/haptics';

/** The part of the Capacitor Haptics plugin the adapter uses (a fake one in tests). */
export type HapticsPluginLike = Pick<HapticsPlugin, 'impact'>;

/**
 * Each port kind as a Capacitor impact style (`ImpactStyle`'s string values, so
 * this module needs no runtime import of the plugin). Capacitor has no soft style;
 * soft plays the lightest one.
 */
export const IMPACT_STYLES: Readonly<Record<HapticKind, ImpactStyle>> = Object.freeze({
  light: 'LIGHT' as ImpactStyle,
  medium: 'MEDIUM' as ImpactStyle,
  heavy: 'HEAVY' as ImpactStyle,
  soft: 'LIGHT' as ImpactStyle,
});

/**
 * The haptics port over the Capacitor Haptics plugin (AD-16, FR-41). Never throws:
 * a plugin error, thrown or rejected, is caught and ignored (a missed tap is not
 * worth a crash). Fire and forget: the impact is not awaited.
 */
export function nativeHaptics(plugin: HapticsPluginLike): HapticsPort {
  return {
    impact(kind) {
      try {
        void Promise.resolve(plugin.impact({ style: IMPACT_STYLES[kind] })).catch(() => {});
      } catch {
        // The bridge refused the call: no tap this time.
      }
    },
  };
}
