// Entry of the `@numception/ui/dev-panel` subpath export. Kept out of the package
// root (src/index.ts) so the client can load it only behind its build-time flavour
// guard and prod bundles never contain it (AD-18).
import type { FeedbackControls } from '@numception/app';
import { h, render } from 'preact';
import { DevPanel } from './dev-panel';

/**
 * Renders the dev panel into `el`, so callers never import Preact themselves.
 * `tunings` maps each bundled tuning's version (e.g. `"1"`) to its JSON, passed
 * through unvalidated: core validates it (AD-7) and the panel shows any error.
 * `feedback` reads and sets the feedback flags: sound effects, music, haptics (the Sound block).
 */
export function mountDevPanel(el: HTMLElement, tunings: Readonly<Record<string, unknown>>, feedback?: FeedbackControls): void {
  render(h(DevPanel, feedback === undefined ? { tunings } : { tunings, feedback }), el);
}
