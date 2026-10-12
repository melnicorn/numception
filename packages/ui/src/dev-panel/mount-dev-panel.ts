// Entry of the `@numception/ui/dev-panel` subpath export. Kept out of the package
// root (src/index.ts) so the client can load it only behind its build-time flavour
// guard and prod bundles never contain it (AD-18).
import { h, render } from 'preact';
import { DevPanel } from './dev-panel';

/**
 * Renders the dev panel into `el`, so callers never import Preact themselves.
 * `tuning` is the bundled tuning JSON, passed through unvalidated: core validates it
 * (AD-7) and the panel shows any error.
 */
export function mountDevPanel(el: HTMLElement, tuning: unknown): void {
  render(h(DevPanel, { tuning }), el);
}
