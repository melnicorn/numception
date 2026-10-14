import type { AccessibilityPrefsPort } from '@numception/app';

/** The parts of a `MediaQueryList` the adapter reads. */
export type MotionQuery = {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
};

/** The OS Reduce Motion query. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The web `AccessibilityPrefsPort` (AD-16): `prefers-reduced-motion` (iOS Settings →
 * Accessibility → Motion → Reduce Motion, in Safari and WKWebView alike), reported
 * at start and on every change. Without `matchMedia` it reports Reduce Motion off.
 */
export function webAccessibilityPrefs(
  match: ((query: string) => MotionQuery) | undefined = typeof globalThis.matchMedia === 'function' ? (q) => globalThis.matchMedia(q) : undefined,
): AccessibilityPrefsPort {
  return {
    start(listener) {
      const query = match?.(REDUCED_MOTION_QUERY);
      if (query === undefined) {
        listener({ reduceMotion: false });
        return () => {};
      }
      const onChange = () => listener({ reduceMotion: query.matches });
      query.addEventListener('change', onChange);
      onChange();
      return () => query.removeEventListener('change', onChange);
    },
  };
}
