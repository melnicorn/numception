import type { LifecycleCommand, LifecyclePort } from '@numception/app';

/** The parts of `document` the lifecycle source reads. */
export type LifecycleDocument = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
/** The parts of `window` it reads. */
export type LifecycleWindow = Pick<Window, 'addEventListener' | 'removeEventListener'>;

/**
 * The web `LifecyclePort` (AD-16, AD-17): `visibilitychange` to hidden and
 * `pagehide` emit `Pause { lifecycle }`; `visibilitychange` to visible (and a
 * `pageshow` from the back-forward cache while visible) emit
 * `Resume { lifecycle }`. A page that starts hidden is paused at once. Repeats are
 * harmless: core ignores a reason already present or absent.
 */
export function webLifecycle(doc: LifecycleDocument = document, win: LifecycleWindow = window): LifecyclePort {
  return {
    start(listener) {
      const pause: LifecycleCommand = { type: 'Pause', reason: 'lifecycle' };
      const resume: LifecycleCommand = { type: 'Resume', reason: 'lifecycle' };
      const onVisibility = () => listener(doc.visibilityState === 'hidden' ? pause : resume);
      const onPageHide = () => listener(pause);
      const onPageShow = () => {
        if (doc.visibilityState !== 'hidden') listener(resume);
      };
      doc.addEventListener('visibilitychange', onVisibility);
      win.addEventListener('pagehide', onPageHide);
      win.addEventListener('pageshow', onPageShow);
      if (doc.visibilityState === 'hidden') listener(pause);
      return () => {
        doc.removeEventListener('visibilitychange', onVisibility);
        win.removeEventListener('pagehide', onPageHide);
        win.removeEventListener('pageshow', onPageShow);
      };
    },
  };
}
