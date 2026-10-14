import { hitTestView, type LayoutPoint, type NodeCellRef, type PlayVM } from '@numception/app';
// The browser environment (events, text, graphics pipes) and the WebGL renderer are
// imported statically and initialised with `manageImports: false`, so no lazy chunk
// sits between script load and the first puzzle frame (autoDetectRenderer and the
// environment loader would each fetch one).
import 'pixi.js/browser';
import { Container, Graphics, Text, Ticker, WebGLRenderer } from 'pixi.js';
import { drawKey } from './draw-key';
import { isPrimaryPress } from './is-primary-press';
import { numeralSize } from './numeral-size';
import type { RenderPort } from './render-port';
import { fitView, toScreen, toUnit, type ViewTransform } from './view-transform';

/** Taps within this many CSS px of a shared edge are no-ops (DESIGN: "a few px"). */
export const EDGE_TOLERANCE_PX = 3;
/** The press acknowledgement: a dot of this radius (CSS px) fading over this long. */
const PRESS_RADIUS_PX = 14;
const PRESS_ALPHA = 0.35;
const PRESS_MS = 220;

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
};

function hex(color: string): number {
  return Number.parseInt(color.replace('#', ''), 16);
}

/**
 * The play-view canvas (AD-14) on PixiJS 8: device pixel ratio with autoDensity,
 * resize-aware, no filters. Every `render` rebuilds the scene from the PlayVM.
 * Pointer down draws a press acknowledgement at the pointer, whatever is under it
 * (AD-2: not a verdict); pointer up hit-tests and calls `onTap`.
 */
export function createRenderer(options: RendererOptions): Renderer {
  let app: { renderer: WebGLRenderer; stage: Container; ticker: Ticker; canvas: HTMLCanvasElement; render: () => void } | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let scene: Container | undefined;
  let presses: Container | undefined;
  let host: HTMLElement | undefined;
  let vm: PlayVM | null = null;
  let transform: ViewTransform | undefined;
  let destroyed = false;
  let drawnKey: string | undefined;
  const activePointers = new Set<number>();

  function size(): { width: number; height: number } {
    return { width: app?.renderer.screen.width ?? 0, height: app?.renderer.screen.height ?? 0 };
  }

  function draw(): void {
    if (app === undefined || scene === undefined) return;
    for (const child of scene.removeChildren()) child.destroy({ children: true });
    const theme = vm?.theme;
    app.renderer.background.color = theme?.surface ?? DEFAULT_SURFACE;
    if (vm === null || theme === undefined) {
      transform = undefined;
      return;
    }
    const { width, height } = size();
    const t = fitView(vm, width, height);
    transform = t;
    const flat = (polygon: readonly LayoutPoint[]) => polygon.flatMap((p) => toScreen(t, p));

    const wash = new Graphics().poly(flat(vm.operator.polygon)).fill({ color: hex(theme.operator), alpha: theme.operatorWashAlpha });
    scene.addChild(wash);
    let numberSize = theme.numberSizePx;
    for (const cell of vm.cells) {
      const solved = cell.state === 'solved';
      const tile = new Graphics()
        .poly(flat(cell.polygon))
        .fill({ color: hex(solved ? theme.solvedFill : theme.cellFill) })
        .stroke({ width: theme.lineWidth, color: hex(theme.line), join: 'round' });
      scene.addChild(tile);
      numberSize = numeralSize(theme, t, cell.inscribedRadius, width);
      const label = new Text({
        text: cell.text,
        style: {
          fontFamily: theme.fontFamily,
          fontWeight: theme.fontWeight,
          fontSize: numberSize,
          fill: hex(solved ? theme.solvedNumber : theme.number),
        },
      });
      label.anchor.set(0.5);
      label.position.set(...toScreen(t, cell.labelPoint));
      scene.addChild(label);
    }
    const symbol = new Text({
      text: vm.operator.symbol,
      style: {
        fontFamily: theme.fontFamily,
        fontWeight: theme.fontWeight,
        fontSize: (numberSize * theme.operatorSizePx) / theme.numberSizePx,
        fill: hex(theme.operator),
      },
    });
    symbol.anchor.set(0.5);
    symbol.position.set(...toScreen(t, vm.operator.labelPoint));
    scene.addChild(symbol);
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
    app.render();
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
      scene = new Container();
      presses = new Container();
      stage.addChild(scene, presses);
      ticker.add(() => renderer.render(stage));
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
      // Draw before the canvas is attached, so its first visible frame is the view.
      draw();
      renderer.render(stage);
      el.append(canvas);
      ticker.start();
    },
    render(next) {
      const key = drawKey(next);
      vm = next;
      // Beats re-render every frame with a new progress; until transitions are drawn
      // (entry 3) the scene only changes when what is drawn does.
      if (key === drawnKey) return;
      drawnKey = key;
      draw();
    },
    hitTest,
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
      resizeObserver?.disconnect();
      resizeObserver = undefined;
      app.ticker.destroy();
      app.stage.destroy({ children: true });
      app.renderer.destroy(true);
      app = undefined;
      scene = undefined;
      presses = undefined;
      transform = undefined;
    },
  };
}
