// The dev and playtest test hook (`window.__numception`): read-only access for the
// e2e specs. Installed only behind `__NUMCEPTION_DEV_PANEL__`, so prod never ships
// it; tools/check-flavours.mjs checks the marker below is absent from prod builds.
import { type Game, type GameEvent, type LayoutPoint, type PauseReason, type PlayVM, puzzleInView, type SaveWriterStats } from '@numception/app';
import type { Renderer, RendererStats } from '@numception/render';

/** The hook's global name; also the marker tools/check-flavours.mjs looks for. */
export const TEST_HOOK_NAME = '__numception';

export type TestHook = {
  /** The current PlayVM (a JSON copy). */
  readonly view: () => PlayVM | null;
  /** A unit-box point of the current view in page coordinates. */
  readonly pagePoint: (point: LayoutPoint) => LayoutPoint | null;
  /** Every event dispatched since the hook was installed, oldest first. */
  readonly events: () => readonly GameEvent[];
  /** The renderer's frame and context-restore rebuild counters. */
  readonly renderStats: () => RendererStats;
  /** The view the canvas was mounted with: its first frame (a JSON copy). */
  readonly mountedView: () => PlayVM | null;
  /** Core's pause reasons (AD-17). */
  readonly pauseReasons: () => readonly PauseReason[];
  /** The save writer's counters, or null when this session does not save. */
  readonly saves: () => SaveWriterStats | null;
  /**
   * The puzzle in view's operator and cell roles (a + b = c or a − b = c; c is the
   * answer, and in − the soft-miss cell is b), or null on an overview. The play
   * view never carries the answer, so the specs read it here.
   */
  readonly roles: () => PuzzleRolesView | null;
};

export type PuzzleRolesView = { readonly operator: 'add' | 'sub'; readonly a: number; readonly b: number; readonly c: number; readonly answerIndex: number };

/** What the composition root hands the hook besides the game and renderer. */
export type TestHookExtras = { readonly mountedView: PlayVM | null; readonly saves: () => SaveWriterStats | null };

/** Installs the hook on `window`. */
export function installTestHook(game: Game, renderer: Renderer, extras: TestHookExtras): void {
  const events: GameEvent[] = [];
  game.subscribe((_view, batch) => {
    events.push(...batch);
  });
  const hook: TestHook = {
    view: () => structuredClone(game.getView()),
    pagePoint: (point) => renderer.pagePoint(point),
    events: () => structuredClone(events),
    renderStats: () => renderer.stats(),
    mountedView: () => structuredClone(extras.mountedView),
    pauseReasons: () => [...game.getState().pauseReasons],
    saves: () => extras.saves(),
    roles: () => {
      const puzzle = puzzleInView(game.getState());
      return puzzle === undefined ? null : { operator: puzzle.spec.operator, ...puzzle.roles, answerIndex: puzzle.answerIndex };
    },
  };
  Object.defineProperty(window, TEST_HOOK_NAME, { value: Object.freeze(hook), writable: false, configurable: false });
}
