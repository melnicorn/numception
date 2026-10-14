// Entry of the `@numception/ui/dev-panel` subpath export. Kept out of the package
// root (src/index.ts) so the client can load it only behind its build-time flavour
// guard and prod bundles never contain it (AD-18).
import type { SettingsControls } from '@numception/app';
import { h, render } from 'preact';
import { DevPanel } from './dev-panel';

/**
 * Renders the dev panel into `el`, so callers never import Preact themselves.
 * `tunings` maps each bundled tuning's version (e.g. `"1"`) to its JSON, passed
 * through unvalidated: core validates it (AD-7) and the panel shows any error.
 * `settings` reads and changes the active profile's settings (the Settings and Sound blocks).
 * `preview` replays a round change as a given transition (the Transitions block).
 */
export function mountDevPanel(
  el: HTMLElement,
  tunings: Readonly<Record<string, unknown>>,
  settings?: SettingsControls,
  preview?: (transitionId: string) => boolean,
): void {
  render(h(DevPanel, { tunings, ...(settings === undefined ? {} : { settings }), ...(preview === undefined ? {} : { preview }) }), el);
}
