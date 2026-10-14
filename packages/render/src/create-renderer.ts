import { hitTestView, type LayoutPoint, type NodeCellRef, type PlayVM } from '@numception/app';
// The browser environment (events, text, graphics pipes) and the WebGL renderer are
// imported statically and initialised with `manageImports: false`, so no lazy chunk
// sits between script load and the first puzzle frame (autoDetectRenderer and the
// environment loader would each fetch one).
import 'pixi.js/browser';
import { Container, Graphics, Ticker, WebGLRenderer } from 'pixi.js';
import {
  advanceCameraT,
  advanceFromAlpha,
  advanceToAlpha,
  cameraAt,
  collapseCameraT,
  collapseFromAlpha,
  collapseToLook,
  contextFadeIn,
  contextLook,
  crossfade,
  easeOut,
  fusedLook,
  IDLE_LOOK,
  type LayerLook,
  solveLook,
} from './beat-motion';
import { drawKey } from './draw-key';
import { isPrimaryPress } from './is-primary-press';
import { blendScale, sizingTransform } from './numeral-size';
import { paintView } from './paint-view';
import type { RenderPort } from './render-port';
import { resumeButton } from './resume-button';
import { ScenePool } from './scene-pool';
import { ARROW_WIDTH_PX, arrowAlpha, ghostArrow, pulseLook } from './soft-miss-motion';
import { contextTransform, fitRect, idleTransform, nestTransform, shapeBox, toScreen, toUnit, type ViewTransform } from './view-transform';

/** Taps within this many CSS px of a shared edge are no-ops (DESIGN: "a few px"). */
export const EDGE_TOLERANCE_PX = 3;
/** The press acknowledgement: a dot of this radius (CSS px) fading over this long. */
const PRESS_RADIUS_PX = 14;
const PRESS_ALPHA = 0.35;
const PRESS_MS = 220;

/**
 * The veil over a blurred board (AD-17): the surface colour at this alpha, so the
 * puzzle shows only as a soft ghost until the first tap lifts it.
 */
export const BLUR_VEIL_ALPHA = 0.86;

/** The surface drawn before the first view (Kiln surface). */
const DEFAULT_SURFACE = '#ECE3D7';

export type RendererOptions = {
  /** Called on pointer up over a cell (after `hitTest`); never for shared edges, the operator or outside. */
  readonly onTap: (ref: NodeCellRef) => void;
};

/** The PixiJS renderer, plus `pagePoint` for dev and playtest test hooks. */
export type Renderer = RenderPort & {
  /** A unit-box point of the current view in page (client) coordinates, or null before mount. */
  readonly pagePoint: (point: LayoutPoint) => LayoutPoint | null;
  /**
   * For dev and playtest test hooks: frames the ticker has rendered (none while the
   * WebGL context is lost) and scene rebuilds after a restored context.
   */
  readonly stats: () => RendererStats;
};

export type RendererStats = { readonly framesRendered: number; readonly rebuilds: number };

function hex(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}

/**
 * The play-view canvas (AD-14) on PixiJS 8: device pixel ratio with autoDensity,
 * resize-aware, no filters. Every `render` with a new view, or a beat's new
 * progress, redraws the frame from the PlayVM alone (`paintView`, `beat-motion`),
 * reusing pooled Graphics and Text; render keeps no game state. A lost WebGL
 * context is rebuilt from the latest view once restored (AD-14). Pointer down draws a press acknowledgement at the pointer, whatever is under it
 * (AD-2: not a verdict); pointer up hit-tests and calls `onTap`.
 */
export function createRenderer(options: RendererOptions): Renderer {
  let app: { renderer: WebGLRenderer; stage: Container; ticker: Ticker; canvas: HTMLCanvasElement; render: () => void } | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let pool: ScenePool | undefined;
  let presses: Container | undefined;
  let host: HTMLElement | undefined;
  let vm: PlayVM | null = null;
  let transform: ViewTransform | undefined;
  let destroyed = false;
  let drawnKey: string | undefined;
  let contextLost = false;
  let framesRendered = 0;
  let rebuilds = 0;
  const activePointers = new Set<number>();

  function size(): { width: number; height: number } {
    return { width: app?.renderer.screen.width ?? 0, height: app?.renderer.screen.height ?? 0 };
  }

  /**
   * Draws the frame for the latest view: its beat interpolated from
   * `presentation.progress` (AD-14). A view with a `context` (entry 9) has its
   * parent drawn quietly around it, placed from wherever the view itself is drawn
   * (`contextTransform`), so the super-shape stays in frame through every beat.
   */
  function draw(): void {
    if (app === undefined || pool === undefined) return;
    pool.begin();
    const theme = vm?.theme;
    app.renderer.background.color = theme?.surface ?? DEFAULT_SURFACE;
    if (vm === null || theme === undefined) {
      transform = undefined;
      pool.end();
      return;
    }
    const { width, height } = size();
    const restOf = (view: PlayVM) => idleTransform(view, width, height);
    const rest = restOf(vm);
    // Hit-testing reads the idle transform of the puzzle in view only: its parent
    // and siblings are dead space. Taps resolve to nothing during beats anyway.
    transform = rest;
    const settled = (view: PlayVM, alpha: number): LayerLook =>
      view.solvedAnswer === null ? { ...IDLE_LOOK, alpha } : fusedLook(view.solvedAnswer, alpha);
    /**
     * The view's context parent, around the view drawn at `t`; numerals sized as
     * `followCamera` says. `cellFade` defaults to leaving out the view's own cell,
     * so the puzzle looks as it does at the top and nothing stacks beneath it.
     */
    const paintContext = (view: PlayVM, t: ViewTransform, alpha: number, followCamera: boolean, cellFade?: Record<number, number>) => {
      const context = view.context;
      const parentT = contextTransform(t, view);
      const parentRest = contextTransform(restOf(view), view);
      if (context === undefined || parentT === undefined || parentRest === undefined || alpha <= 0) return;
      const fade = cellFade ?? { [context.cellIndex]: 0 };
      paintView(pool as ScenePool, context.parent, parentT, sizingTransform(parentT, parentRest, followCamera), contextLook(fade, alpha), width);
    };
    const p = vm.presentation;
    const to = p.to ?? vm;
    const { from, camera } = p;
    if (p.kind === 'solve' && p.cellIndex !== null) {
      paintContext(vm, rest, 1, false);
      paintView(pool, vm, rest, rest, solveLook(p.cellIndex, p.progress), width);
    } else if ((p.kind === 'advance' || p.kind === 'collapse') && from !== undefined && camera !== undefined) {
      const collapse = p.kind === 'collapse';
      const cam = cameraAt(camera, collapse ? collapseCameraT(p.progress) : advanceCameraT(p.progress));
      const toT = fitRect(cam, to.aspect, width, height);
      const fromT = nestTransform(toT, camera.fromBox, shapeBox(from), from.aspect);
      if (collapse) {
        // `to` is the child's context parent: it takes over from it, quiet at first.
        // Its own parent (a grandparent, Tower) was not on screen, so it fades in.
        paintContext(to, toT, contextFadeIn(p.progress), false);
        const cell = p.cellIndex ?? 0;
        // Numerals start at the size the context parent had and settle to the rest size.
        const fromParentRest = contextTransform(restOf(from), from) ?? restOf(to);
        const sizing = blendScale(fromParentRest, restOf(to), easeOut(p.progress));
        paintView(pool, to, toT, sizing, collapseToLook(cell, p.progress, theme.operatorDimAlpha), width);
        paintView(pool, from, fromT, sizingTransform(fromT, restOf(from), false), settled(from, collapseFromAlpha(p.progress)), width);
      } else {
        // Inside a shared parent it stays put; when the parents differ (Tower,
        // tier-2 puzzle → the next group's leaf) the old one fades as the new one
        // appears. The higher tier is drawn first: it holds the other. A parent's
        // cell under a moving puzzle crossfades with it (left out while the puzzle
        // on it is opaque).
        const fromAlpha = advanceFromAlpha(p.progress);
        const toAlpha = advanceToAlpha(p.progress);
        const fromCtx = from.context;
        const toCtx = to.context;
        const fromParent = fromCtx?.parent.nodeId;
        const toParent = toCtx?.parent.nodeId;
        const shared = fromParent !== undefined && toParent !== undefined && fromParent.tier === toParent.tier && fromParent.index === toParent.index;
        if (shared && toCtx !== undefined && fromCtx !== undefined) {
          paintContext(to, toT, 1, true, { [fromCtx.cellIndex]: 1 - fromAlpha, [toCtx.cellIndex]: 1 - toAlpha });
        } else {
          const n = fromCtx?.parent.cells.length ?? 0;
          // The old parent's cell that holds the new parent fades as the new parent appears.
          const holdsNew =
            fromParent !== undefined && toParent !== undefined && toParent.tier === fromParent.tier - 1 && n > 0 && Math.floor(toParent.index / n) === fromParent.index
              ? toParent.index % n
              : undefined;
          const appear = contextFadeIn(p.progress);
          const fromFade: Record<number, number> = fromCtx === undefined ? {} : { [fromCtx.cellIndex]: 1 - fromAlpha };
          if (holdsNew !== undefined) fromFade[holdsNew] = 1 - appear;
          const layers = [
            { view: from, t: fromT, alpha: fromAlpha, tier: fromParent?.tier ?? 0, fade: fromFade },
            { view: to, t: toT, alpha: appear, tier: toParent?.tier ?? 0, fade: toCtx === undefined ? {} : { [toCtx.cellIndex]: 1 - toAlpha } },
          ].sort((a, b) => b.tier - a.tier);
          for (const layer of layers) paintContext(layer.view, layer.t, layer.alpha, true, layer.fade);
        }
        paintView(pool, from, fromT, sizingTransform(fromT, restOf(from), true), settled(from, fromAlpha), width);
        paintView(pool, to, toT, sizingTransform(toT, restOf(to), true), { ...IDLE_LOOK, alpha: toAlpha }, width);
      }
    } else if (p.kind === 'roundStart' && from !== undefined) {
      const fade = crossfade(p.progress);
      paintContext(from, restOf(from), fade.from, false);
      paintView(pool, from, restOf(from), restOf(from), settled(from, fade.from), width);
      paintContext(to, restOf(to), fade.to, false);
      paintView(pool, to, restOf(to), restOf(to), { ...IDLE_LOOK, alpha: fade.to }, width);
    } else {
      paintContext(vm, rest, 1, false);
      paintView(pool, vm, rest, rest, settled(vm, 1), width);
    }
    // The soft-miss cue (FR-4) over the idle board: the tapped cell pulses once in
    // `soft-miss` and a ghost arrow points to the answer. Nothing else dims.
    const cue = vm.softMiss;
    if (cue !== undefined) {
      const tapped = vm.cells[cue.cellIndex];
      const answer = vm.cells[cue.answerIndex];
      const color = hex(theme.softMiss);
      if (tapped !== undefined) {
        const look = pulseLook(cue.progress, theme.lineWidth);
        const flat = tapped.polygon.flatMap((pt) => toScreen(rest, pt));
        const pulse = pool.takeGraphics().poly(flat).fill({ color, alpha: look.washAlpha });
        pulse.poly(flat).stroke({ width: look.width, color, alpha: look.alpha, join: 'round' });
      }
      const arrow = tapped === undefined || answer === undefined ? null : ghostArrow(toScreen(rest, tapped.labelPoint), toScreen(rest, answer.labelPoint));
      const alpha = arrowAlpha(cue.progress);
      if (arrow !== null && alpha > 0) {
        pool
          .takeGraphics()
          .moveTo(...arrow.tail)
          .lineTo(...arrow.tip)
          .moveTo(...arrow.left)
          .lineTo(...arrow.tip)
          .lineTo(...arrow.right)
          .stroke({ width: ARROW_WIDTH_PX, color, alpha, cap: 'round', join: 'round' });
      }
    }
    // After a lifecycle pause (AD-17): a veil over the whole board until the first tap.
    if (vm.blurred) {
      pool.takeGraphics().rect(0, 0, width, height).fill({ color: hex(theme.surface), alpha: BLUR_VEIL_ALPHA });
      // A play button so the veil reads as "tap to continue", not "disabled" (any tap still lifts it).
      const button = resumeButton(width, height);
      pool
        .takeGraphics()
        .circle(button.center[0], button.center[1], button.radius)
        .fill({ color: hex(theme.solvedFill) })
        .poly(button.triangle.flat())
        .fill({ color: hex(theme.solvedNumber) });
    }
    pool.end();
  }

  /** After a lost WebGL context is restored: fresh GPU objects, rebuilt from the latest view (AD-14). */
  function rebuild(): void {
    rebuilds += 1;
    pool?.reset();
    draw();
    app?.render();
  }

  function localPoint(event: PointerEvent): LayoutPoint {
    const rect = (app?.canvas ?? host)?.getBoundingClientRect();
    return [event.clientX - (rect?.left ?? 0), event.clientY - (rect?.top ?? 0)];
  }

  function press(point: LayoutPoint): void {
    if (app === undefined || presses === undefined) return;
    const dot = new Graphics().circle(point[0], point[1], PRESS_RADIUS_PX).fill({ color: hex(vm?.theme.press ?? '#AC644E') });
    dot.alpha = PRESS_ALPHA;
    presses.addChild(dot);
    const ticker = app.ticker;
    let elapsed = 0;
    const fade = () => {
      elapsed += ticker.deltaMS;
      dot.alpha = PRESS_ALPHA * Math.max(0, 1 - elapsed / PRESS_MS);
      if (elapsed >= PRESS_MS) {
        ticker.remove(fade);
        dot.destroy();
      }
    };
    ticker.add(fade);
    // Same frame: draw the acknowledgement now rather than on the next tick.
    if (!contextLost) app.render();
  }

  function hitTest(point: LayoutPoint): NodeCellRef | null {
    // While a beat runs (AD-14) taps resolve to nothing; the press acknowledgement still draws.
    if (vm === null || vm.inputLocked || transform === undefined) return null;
    return hitTestView(vm, toUnit(transform, point), EDGE_TOLERANCE_PX / transform.scale);
  }

  const onPointerDown = (event: PointerEvent) => {
    if (!isPrimaryPress(event)) return;
    activePointers.add(event.pointerId);
    press(localPoint(event));
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!activePointers.delete(event.pointerId) || !isPrimaryPress(event)) return;
    const ref = hitTest(localPoint(event));
    if (ref !== null) options.onTap(ref);
  };
  const onPointerCancel = (event: PointerEvent) => {
    activePointers.delete(event.pointerId);
  };
  const onContextMenu = (event: Event) => {
    event.preventDefault();
  };
  // Pixi's context system prevents the default (so the browser may restore the
  // context) and re-initialises the GL state on restore; render then rebuilds the
  // scene from the latest view. Frames are skipped while the context is lost.
  const onContextLost = () => {
    contextLost = true;
  };
  const onContextRestored = () => {
    contextLost = false;
    rebuild();
  };

  return {
    async mount(el) {
      host = el;
      const renderer = new WebGLRenderer();
      await renderer.init({
        manageImports: false,
        background: vm?.theme.surface ?? DEFAULT_SURFACE,
        width: Math.max(1, el.clientWidth),
        height: Math.max(1, el.clientHeight),
        resolution: globalThis.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      if (destroyed) {
        renderer.destroy(true);
        return;
      }
      const stage = new Container();
      const ticker = new Ticker();
      app = { renderer, stage, ticker, canvas: renderer.canvas, render: () => renderer.render(stage) };
      const scene = new Container();
      pool = new ScenePool(scene);
      presses = new Container();
      stage.addChild(scene, presses);
      ticker.add(() => {
        if (contextLost) return;
        renderer.render(stage);
        framesRendered += 1;
      });
      // Resize-aware: follow the mount element and rebuild from the latest view.
      resizeObserver = new ResizeObserver(() => {
        if (app === undefined) return;
        const width = Math.max(1, el.clientWidth);
        const height = Math.max(1, el.clientHeight);
        if (width === renderer.screen.width && height === renderer.screen.height) return;
        renderer.resize(width, height, globalThis.devicePixelRatio || 1);
        draw();
        renderer.render(stage);
      });
      resizeObserver.observe(el);
      const canvas = renderer.canvas;
      canvas.style.display = 'block';
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerCancel);
      canvas.addEventListener('contextmenu', onContextMenu);
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
      // Draw before the canvas is attached, so its first visible frame is the view.
      draw();
      renderer.render(stage);
      el.append(canvas);
      ticker.start();
    },
    render(next) {
      const key = drawKey(next);
      vm = next;
      // Every frame of a beat carries a new progress and redraws; an unchanged idle view does not.
      if (key === drawnKey) return;
      drawnKey = key;
      draw();
    },
    hitTest,
    stats: () => ({ framesRendered, rebuilds }),
    pagePoint(point) {
      if (app === undefined || transform === undefined) return null;
      const rect = app.canvas.getBoundingClientRect();
      const [x, y] = toScreen(transform, point);
      return [rect.left + x, rect.top + y];
    },
    destroy() {
      destroyed = true;
      if (app === undefined) return;
      const canvas = app.canvas;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      resizeObserver?.disconnect();
      resizeObserver = undefined;
      app.ticker.destroy();
      app.stage.destroy({ children: true });
      app.renderer.destroy(true);
      app = undefined;
      pool = undefined;
      presses = undefined;
      transform = undefined;
    },
  };
}
