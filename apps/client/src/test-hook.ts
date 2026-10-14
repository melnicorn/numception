// The dev and playtest test hook (`window.__numception`): read-only access for the
// e2e specs. Installed only behind `__NUMCEPTION_DEV_PANEL__`, so prod never ships
// it; tools/check-flavours.mjs checks the marker below is absent from prod builds.
import type { Game, GameEvent, LayoutPoint, PlayVM } from '@numception/app';
import type { Renderer } from '@numception/render';

/** The hook's global name; also the marker tools/check-flavours.mjs looks for. */
export const TEST_HOOK_NAME = '__numception';

export type TestHook = {
  /** The current PlayVM (a JSON copy). */
  readonly view: () => PlayVM | null;
  /** A unit-box point of the current view in page coordinates. */
  readonly pagePoint: (point: LayoutPoint) => LayoutPoint | null;
  /** Every event dispatched since the hook was installed, oldest first. */
  readonly events: () => readonly GameEvent[];
};

/** Installs the hook on `window`. */
export function installTestHook(game: Game, renderer: Renderer): void {
  const events: GameEvent[] = [];
  game.subscribe((_view, batch) => {
    events.push(...batch);
  });
  const hook: TestHook = {
    view: () => structuredClone(game.getView()),
    pagePoint: (point) => renderer.pagePoint(point),
    events: () => structuredClone(events),
  };
  Object.defineProperty(window, TEST_HOOK_NAME, { value: Object.freeze(hook), writable: false, configurable: false });
}
