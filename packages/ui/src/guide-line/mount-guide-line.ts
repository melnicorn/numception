import type { Game } from '@numception/app';
import { h, render } from 'preact';
import { GuideLine } from './guide-line';

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
    const text = view?.guideLine;
    const theme = view?.theme;
    if (shown !== undefined && shown.text === text && shown.themeId === theme?.themeId) return;
    shown = { text, themeId: theme?.themeId };
    render(h(GuideLine, { text, theme }), el);
  };
  update();
  return game.subscribe(update);
}
