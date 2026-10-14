import { hitTestView, type LayoutPoint, type NodeCellRef, type PlayVM, type ThemeTokens } from '@numception/app';
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
import { mixOklch } from './oklch';
import { blendTheme, crossfadeLook, inTheme, mixHex, roundChangeLook, scaleAbout } from './round-change';
import { clumpScale, flakeAt, fullCover, type SnowField, SNOW_SWAP, snowColors, snowField } from './snow-field';
import { crossesLightDark, fadeLook, farthestCorner, RIPPLE_RINGS, rippleLook, transitionStyle } from './transition-looks';
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

/** The surface drawn before the first view (Kiln surface, the first-run theme). */
const DEFAULT_SURFACE = '#ECE3D7';

export type RendererOptions = {
  /** Called on pointer up over a cell (after `hitTest`); never for shared edges, the operator or outside. */
  readonly onTap: (ref: NodeCellRef) => void;
  /**
   * Called with the surface colour (`#RRGGBB`) whenever the frame's surface
   * changes, every frame of a round change included, so the page around the canvas
   * can follow it and the whole screen changes theme.
   */
  readonly onSurface?: (color: string) => void;
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
  /**
   * Dev panel only: replays the last round change drawn (or, before any, the view
   * in view changing into `theme`) as transition `transitionId`, self-timed over
   * `durationMs` (the replayed beat's own when omitted). Any new beat cancels it.
   * False when there is nothing to replay yet (not mounted, no view).
   */
  readonly replayRoundChange: (transitionId: string, options?: { readonly theme?: ThemeTokens; readonly durationMs?: number }) => boolean;
};

/**
 * How a frame drew its beat, for the test hooks: `idle`; `solve`; `zoom` (an
 * advance or collapse moving the camera); `cut` (an advance or collapse at
 * Minimal motion: the views crossfade at rest, no camera move); the round change
 * by transition: `themeChange` (token interpolation, `interpolate`), `crossfade`
 * (Minimal motion), `fade`, `ripple` and `snow`.
 */
export type BeatStyle = 'idle' | 'solve' | 'zoom' | 'cut' | 'themeChange' | 'crossfade' | 'fade' | 'ripple' | 'snow';

/** A replayed round change's length when the replayed view has none (the Calm round change at tuning 2). */
const REPLAY_DEFAULT_MS = 1125;

/** The core transition id of the Minimal-motion beats (core `CROSSFADE_TRANSITION_ID`). */
const CROSSFADE = 'crossfade';

/** Frame and rebuild counters, and the frames drawn per `BeatStyle` (styles never drawn are absent). */
export type RendererStats = {
  readonly framesRendered: number;
  readonly rebuilds: number;
  readonly beats: Readonly<Partial<Record<BeatStyle, number>>>;
};

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
  /** The new round revealed through a mask (ripple), over the base pool. */
  let revealLayer: Container | undefined;
  let revealPool: ScenePool | undefined;
  let revealMask: Graphics | undefined;
  /** Transition effects over both (ripple rings, snow). */
  let fxPool: ScenePool | undefined;
  let snowCache: { key: string; field: SnowField } | undefined;
  /** The last round change drawn, for the dev replay, and the replay running. */
  let lastRoundChange: PlayVM | null = null;
  let replay: { readonly view: PlayVM; readonly startedAt: number; readonly durationMs: number } | null = null;
  let presses: Container | undefined;
  let host: HTMLElement | undefined;
  let latest: PlayVM | null = null;
  let transform: ViewTransform | undefined;
  let destroyed = false;
  let drawnKey: string | undefined;
  let contextLost = false;
  let framesRendered = 0;
  let rebuilds = 0;
  let surfaceShown: string | undefined;
  let surfacePending: string | undefined;
  const beats: Partial<Record<BeatStyle, number>> = {};
  const drew = (style: BeatStyle) => {
    beats[style] = (beats[style] ?? 0) + 1;
  };
  const activePointers = new Set<number>();

  /**
   * Sets the frame's background; the page hears of a change once the frame is
   * presented (`flushSurface`), as `page` when the page band shows another colour
   * than the canvas background (a ripple that has passed the top edge).
   */
  function setSurface(color: string, page: string = color): void {
    if (app !== undefined) app.renderer.background.color = color;
    surfacePending = page;
  }

  /** The view this frame draws: the dev replay's at its progress, else the latest. */
  function frameView(): PlayVM | null {
    if (replay === null) return latest;
    const progress = Math.min(1, (performance.now() - replay.startedAt) / replay.durationMs);
    return { ...replay.view, presentation: { ...replay.view.presentation, progress } };
  }

  /** The snow field for this frame size and tap point, laid out once. */
  function snowFor(width: number, height: number, tap: readonly [number, number]): SnowField {
    const key = `${width}x${height}@${Math.round(tap[0])},${Math.round(tap[1])}`;
    if (snowCache?.key !== key) snowCache = { key, field: snowField(width, height, tap) };
    return snowCache.field;
  }

  /** After a frame is rendered: tells the page its new surface, so the page and canvas change together. */
  function flushSurface(): void {
    const color = surfacePending;
    if (color === undefined || color === surfaceShown) return;
    surfaceShown = color;
    options.onSurface?.(color);
  }

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
    if (app === undefined || pool === undefined || revealPool === undefined || fxPool === undefined || revealLayer === undefined || revealMask === undefined) return;
    const vm = frameView();
    const pools = [pool, revealPool, fxPool];
    for (const each of pools) each.begin();
    revealLayer.mask = null;
    revealMask.clear();
    const theme = vm?.theme;
    if (vm === null || theme === undefined) {
      setSurface(DEFAULT_SURFACE);
      transform = undefined;
      for (const each of pools) each.end();
      return;
    }
    const base = pool;
    const reveal = revealPool;
    const fx = fxPool;
    const mask = revealMask;
    const masked = revealLayer;
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
    const paintContext = (view: PlayVM, t: ViewTransform, alpha: number, followCamera: boolean, cellFade?: Record<number, number>, into: ScenePool = base) => {
      const context = view.context;
      const parentT = contextTransform(t, view);
      const parentRest = contextTransform(restOf(view), view);
      if (context === undefined || parentT === undefined || parentRest === undefined || alpha <= 0) return;
      const fade = cellFade ?? { [context.cellIndex]: 0 };
      paintView(into, context.parent, parentT, sizingTransform(parentT, parentRest, followCamera), contextLook(fade, alpha), width, {
        rest: parentRest,
        quiet: 1,
      });
    };
    /** The old round's answer cell, where the player tapped, on screen; the frame centre without one. */
    const tapPoint = (view: PlayVM): readonly [number, number] => {
      const cell = view.solvedAnswer === null ? undefined : view.cells[view.solvedAnswer];
      return cell === undefined ? [width / 2, height / 2] : toScreen(restOf(view), cell.labelPoint);
    };
    const drawRoundChange = (from: PlayVM, to: PlayVM, progress: number, style: ReturnType<typeof transitionStyle>) => {
      drew(style === 'interpolate' ? 'themeChange' : style);
      const [cx, cy] = [width / 2, height / 2];
      const fromRest = restOf(from);
      const toRest = restOf(to);
      const arrive = (view: PlayVM, t: ViewTransform, alpha: number, into: ScenePool = base) => {
        paintContext(view, t, alpha, true, undefined, into);
        paintView(into, view, t, t, { ...IDLE_LOOK, alpha }, width, { rest: toRest, quiet: 0 });
      };
      const leave = (view: PlayVM, t: ViewTransform, alpha: number) => {
        paintView(base, view, t, t, settled(view, alpha), width, { rest: fromRest, quiet: 0 });
      };
      if (style === 'interpolate' || style === 'crossfade') {
        // The old top shrinks away into the frame's centre while the field changes
        // colour (OKLCH), then the new puzzle (with its parent) grows in, both drawn
        // in the frame's blended theme. At Minimal: an sRGB crossfade in place.
        const look = style === 'crossfade' ? crossfadeLook(progress) : roundChangeLook(progress);
        const frameTheme = blendTheme(from.theme, to.theme, look.color, style === 'crossfade' ? mixHex : mixOklch);
        setSurface(frameTheme.surface);
        if (look.fromAlpha > 0) leave(inTheme(from, frameTheme), scaleAbout(fromRest, look.fromScale, cx, cy), look.fromAlpha);
        if (look.toAlpha > 0) arrive(inTheme(to, frameTheme), scaleAbout(toRest, look.toScale, cx, cy), look.toAlpha);
        return;
      }
      if (style === 'fade') {
        // The new round resolves in under the old one, which then dissolves; each in its own theme.
        const look = fadeLook(progress);
        setSurface(mixOklch(from.theme.surface, to.theme.surface, look.color));
        if (look.toAlpha > 0) arrive(to, scaleAbout(toRest, look.toScale, cx, cy), look.toAlpha);
        if (look.fromAlpha > 0) leave(from, scaleAbout(fromRest, look.fromScale, cx, cy), look.fromAlpha);
        return;
      }
      const tap = tapPoint(from);
      const bridge = crossesLightDark(from.theme, to.theme);
      if (style === 'ripple') {
        // A circle from the tap point reveals the new round (a stencil mask, no filter), rings at its front.
        const look = rippleLook(progress, bridge);
        const oldTheme = blendTheme(from.theme, to.theme, look.oldBlend, mixOklch);
        const newTheme = blendTheme(from.theme, to.theme, look.newBlend, mixOklch);
        const maxR = farthestCorner(tap, width, height) + 4;
        const radius = maxR * look.reach;
        const topCovered = radius >= Math.max(Math.hypot(tap[0], tap[1]), Math.hypot(width - tap[0], tap[1]));
        setSurface(oldTheme.surface, topCovered ? newTheme.surface : oldTheme.surface);
        if (radius < maxR) leave(inTheme(from, oldTheme), fromRest, 1);
        if (radius > 0) {
          mask.circle(tap[0], tap[1], radius).fill(0xffffff);
          masked.mask = mask;
          reveal.takeGraphics().rect(0, 0, width, height).fill({ color: hex(newTheme.surface) });
          arrive(inTheme(to, newTheme), toRest, 1, reveal);
        }
        if (look.rings > 0 && radius < maxR) {
          const rings = fx.takeGraphics();
          for (const ring of RIPPLE_RINGS) {
            const r = radius - ring.behind * maxR;
            if (r > 0) rings.circle(tap[0], tap[1], r).stroke({ width: ring.width, color: hex(newTheme.accent), alpha: ring.alpha * look.rings });
          }
        }
        return;
      }
      // Snow / embers: the blanket lands over the old round, the rounds swap under full cover, then it melts from the tap.
      const colors = snowColors(from.theme, to.theme, bridge);
      const field = snowFor(width, height, tap);
      const swapped = progress >= SNOW_SWAP;
      const page = progress < 0.3 ? from.theme.surface : progress < 0.8 ? colors.blanket : to.theme.surface;
      setSurface(swapped ? to.theme.surface : from.theme.surface, page);
      if (swapped) arrive(to, toRest, 1);
      else leave(from, fromRest, 1);
      const rim = fx.takeGraphics();
      const blanket = fx.takeGraphics();
      const lift = colors.embers ? -1.8 : 2.6;
      let any = false;
      for (const c of field.clumps) {
        const k = clumpScale(c, progress);
        if (k <= 0.001) continue;
        any = true;
        rim.circle(c.x, c.y + lift, c.r * k);
        blanket.circle(c.x, c.y, c.r * k);
      }
      if (fullCover(progress)) {
        blanket.rect(0, 0, width, height);
        any = true;
      }
      if (any) {
        rim.fill({ color: hex(colors.rim) });
        blanket.fill({ color: hex(colors.blanket) });
      }
      const flakes = fx.takeGraphics();
      const halos = colors.embers ? fx.takeGraphics() : undefined;
      let falling = 0;
      for (const f of field.flakes) {
        const at = flakeAt(f, progress);
        if (at === null) continue;
        falling += 1;
        halos?.circle(at[0], at[1], f.r * 2.6);
        flakes.circle(at[0], at[1], colors.embers ? f.r * 0.8 : f.r);
      }
      if (falling > 0) {
        if (halos !== undefined) {
          halos.fill({ color: hex(colors.accent), alpha: 0.22 });
          flakes.fill({ color: hex(mixHex(colors.accent, '#FFFFFF', 0.5)) });
          // Embers glow over the blanket: drawn after it.
          halos.zIndex = blanket.zIndex + 0.5;
        } else {
          flakes.fill({ color: hex(colors.flake) }).stroke({ width: 0.7, color: hex(colors.accent), alpha: 0.6 });
        }
      }
    };
    const p = vm.presentation;
    const to = p.to ?? vm;
    const { from, camera } = p;
    // At Minimal motion core marks the moving beats `crossfade`: zooms become cuts with a crossfade (EXPERIENCE).
    const crossfade = p.transitionId === CROSSFADE;
    setSurface(theme.surface);
    if (p.kind === 'solve' && p.cellIndex !== null) {
      drew('solve');
      paintContext(vm, rest, 1, false);
      paintView(pool, vm, rest, rest, solveLook(p.cellIndex, p.progress), width);
    } else if ((p.kind === 'advance' || p.kind === 'collapse') && from !== undefined && crossfade) {
      // A cut with a crossfade: each view at its own rest framing (no camera move,
      // no scaling), the old one fading out as the new one fades in.
      drew('cut');
      const fromRest = restOf(from);
      const toRest = restOf(to);
      const toAlpha = p.progress;
      paintContext(from, fromRest, 1 - toAlpha, false);
      paintView(pool, from, fromRest, fromRest, settled(from, 1 - toAlpha), width, { rest: fromRest, quiet: 0 });
      paintContext(to, toRest, toAlpha, false);
      paintView(pool, to, toRest, toRest, { ...IDLE_LOOK, alpha: toAlpha }, width, { rest: toRest, quiet: 0 });
    } else if ((p.kind === 'advance' || p.kind === 'collapse') && from !== undefined && camera !== undefined) {
      drew('zoom');
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
        paintView(pool, to, toT, sizing, collapseToLook(cell, p.progress, theme.operatorDimAlpha), width, { rest: restOf(to), quiet: 0 });
        paintView(pool, from, fromT, sizingTransform(fromT, restOf(from), false), settled(from, collapseFromAlpha(p.progress)), width, {
          rest: restOf(from),
          quiet: 0,
        });
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
        paintView(pool, from, fromT, sizingTransform(fromT, restOf(from), true), settled(from, fromAlpha), width, { rest: restOf(from), quiet: 0 });
        paintView(pool, to, toT, sizingTransform(toT, restOf(to), true), { ...IDLE_LOOK, alpha: toAlpha }, width, { rest: restOf(to), quiet: 0 });
      }
    } else if (p.kind === 'roundStart' && from !== undefined) {
      // The round change (AD-15): core's transition for it, drawn from `transition-looks`.
      if (latest === vm && replay === null) lastRoundChange = vm;
      drawRoundChange(from, to, p.progress, crossfade ? 'crossfade' : transitionStyle(p.transitionId));
    } else {
      drew('idle');
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
        pulse.poly(flat).stroke({ width: look.width, color, alpha: look.alpha, join: theme.lineJoin });
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
    for (const each of pools) each.end();
  }

  /** After a lost WebGL context is restored: fresh GPU objects, rebuilt from the latest view (AD-14). */
  function rebuild(): void {
    rebuilds += 1;
    surfaceShown = undefined;
    for (const each of [pool, revealPool, fxPool]) each?.reset();
    snowCache = undefined;
    draw();
    app?.render();
  }

  function localPoint(event: PointerEvent): LayoutPoint {
    const rect = (app?.canvas ?? host)?.getBoundingClientRect();
    return [event.clientX - (rect?.left ?? 0), event.clientY - (rect?.top ?? 0)];
  }

  function press(point: LayoutPoint): void {
    if (app === undefined || presses === undefined) return;
    const dot = new Graphics().circle(point[0], point[1], PRESS_RADIUS_PX).fill({ color: hex(latest?.theme.press ?? '#AC644E') });
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
    if (latest === null || latest.inputLocked || transform === undefined) return null;
    return hitTestView(latest, toUnit(transform, point), EDGE_TOLERANCE_PX / transform.scale);
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
        background: latest?.theme.surface ?? DEFAULT_SURFACE,
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
      revealLayer = new Container();
      revealPool = new ScenePool(revealLayer);
      revealMask = new Graphics();
      const fxLayer = new Container();
      fxPool = new ScenePool(fxLayer);
      presses = new Container();
      stage.addChild(scene, revealLayer, revealMask, fxLayer, presses);
      ticker.add(() => {
        if (contextLost) return;
        if (replay !== null) {
          // The dev replay runs on the ticker's clock, then hands back to the latest view.
          if (performance.now() - replay.startedAt >= replay.durationMs) replay = null;
          drawnKey = undefined;
          draw();
        }
        renderer.render(stage);
        framesRendered += 1;
        flushSurface();
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
      flushSurface();
      el.append(canvas);
      ticker.start();
    },
    render(next) {
      const key = drawKey(next);
      latest = next;
      // A beat of the game's own cancels a dev replay.
      if (replay !== null && next !== null && next.presentation.kind !== 'idle') replay = null;
      // Every frame of a beat carries a new progress and redraws; an unchanged idle view does not.
      if (key === drawnKey) return;
      drawnKey = key;
      draw();
    },
    hitTest,
    stats: () => ({ framesRendered, rebuilds, beats: { ...beats } }),
    replayRoundChange(transitionId, options = {}) {
      if (app === undefined || latest === null) return false;
      const last = lastRoundChange;
      const base: PlayVM =
        last ??
        ({
          ...latest,
          presentation: {
            kind: 'roundStart',
            progress: 0,
            durationMs: options.durationMs ?? REPLAY_DEFAULT_MS,
            transitionId,
            cellIndex: null,
            from: { ...latest, presentation: { ...latest.presentation, kind: 'idle', progress: 1 } },
            to: options.theme === undefined ? latest : inTheme(latest, options.theme),
          },
        } satisfies PlayVM);
      const durationMs = options.durationMs ?? (base.presentation.durationMs > 0 ? base.presentation.durationMs : REPLAY_DEFAULT_MS);
      replay = { view: { ...base, presentation: { ...base.presentation, transitionId } }, startedAt: performance.now(), durationMs };
      drawnKey = undefined;
      draw();
      return true;
    },
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
      revealPool = undefined;
      fxPool = undefined;
      revealLayer = undefined;
      revealMask = undefined;
      replay = null;
      presses = undefined;
      transform = undefined;
    },
  };
}
