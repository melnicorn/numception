import type { Game, PlayVM } from '@numception/app';
import { h, render } from 'preact';
import { GuideLine } from './guide-line';

/**
 * The guide line to show for `view`: core's line, except during the round change
 * (`roundStart`), when the band behind it is mid-way between two themes' surfaces
 * and no theme's `number` colour is guaranteed to contrast with it.
 */
export function guideText(view: PlayVM | null): string | undefined {
  return view === null || view.presentation.kind === 'roundStart' ? undefined : view.guideLine;
}

/**
 * Renders the guide-line slot into `el` and keeps it in step with `game`'s view
 * (`PlayVM.guideLine`, decided by core; this only shows it), so callers never
 * import Preact themselves. Re-renders only when the line or the theme changes.
 * Returns the unsubscribe.
 */
export function mountGuideLine(el: HTMLElement, game: Pick<Game, 'getView' | 'subscribe'>): () => void {
  let shown: { text: string | undefined; themeId: string | undefined } | undefined;
  const update = () => {
    const view = game.getView();
    const text = guideText(view);
    const theme = view?.theme;
    if (shown !== undefined && shown.text === text && shown.themeId === theme?.themeId) return;
    shown = { text, themeId: theme?.themeId };
    render(h(GuideLine, { text, theme }), el);
  };
  update();
  return game.subscribe(update);
}
