import { type Application, Container, Graphics, Rectangle, Sprite, type Texture } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';

// The bake-off scene, built exactly to the shared spec in ../README.md
// ("Shared scene spec"). Every number here comes from that spec; change the spec
// first, then both prototypes.

// ---------------------------------------------------------------------------
// Spec constants

const PALETTE = [0x29f0ff, 0xff3df2, 0xb6ff3d] as const;

const TIER2_SPACING = 1000;
const TIER1_SPACING = TIER2_SPACING / 3;
const CELL_RADIUS_FACTOR = 0.22;
const FRAME_RADIUS_FACTOR = 1.15;
const FRAME_CUT = 0.15;
const SPOKE_START_FACTOR = 0.1;
const SEGMENTS_PER_PUZZLE = 30;
const TIER2_DRAWN_FROM = 18; // tier-2 segments 18-29 are drawn

const FIT_FRACTION = 0.8;
const ZOOMED_SCALE = 3;

const LINE_WIDTH_CSS = 3;
// Glow (README "Lines", PixiJS mapping). GlowFilter steps one filter-input unit per
// ring, and PixiJS sizes the filter input in css px (uInputSize is the logical size),
// so distance 12 is 12 css px at any resolution, like Phaser's 12 steps of DPR device
// px. Its padding defaults to the distance, also in css px. Quality sets the angle
// step to 1 / (quality x distance) rad: 0.1326 gives 10 directions per ring, so
// 12 rings x 10 = 120 samples per pixel, the same count as Phaser's quality 10.
const GLOW_DISTANCE_CSS = 12;
const GLOW_OUTER_STRENGTH = 2;
const GLOW_QUALITY = 0.1326;

const PARTICLE_COUNT = 200;
const PARTICLE_LIFE = 1.5;
const PARTICLE_MIN_DIAMETER_CSS = 2;
const PARTICLE_MAX_DIAMETER_CSS = 4;
const PARTICLE_MIN_SPEED = 40;
const PARTICLE_MAX_SPEED = 120;
const DOT_TEXTURE_SIZE = 16;

const LOOP = 5.0;
const HOLD1_END = 1.5;
const PAN_LEG = 0.75;
const COLLAPSE_END = 2.7;
const HOLD2_END = 4.2;
const PULSE_PERIOD = 0.75;
const MAX_DELTA = 0.1;

// ---------------------------------------------------------------------------
// Debug hook for the e2e spec (exposed as window.__bakeoff by main.ts). Updated in
// place, never reallocated, and it survives scene restarts so counters keep growing.

export interface BakeoffDebug {
  liveParticles: number; // particle dots visible in the stage tree last frame
  loopsCompleted: number; // 5 s loops completed since page load
  restarts: number; // scene restarts after a WebGL context restore
}

export const bakeoffDebug: BakeoffDebug = { liveParticles: 0, loopsCompleted: 0, restarts: 0 };

// ---------------------------------------------------------------------------
// Geometry: segments are stored flat as [ax, ay, bx, by] in Float32Arrays.

const ANGLES = [-90, 30, 150].map((d) => (d * Math.PI) / 180);

interface Puzzle {
  segments: Float32Array; // 30 segments x 4
  cells: Float32Array; // 3 cell centres x 2
}

function trianglePuzzle(cx: number, cy: number, s: number): Puzzle {
  const segments = new Float32Array(SEGMENTS_PER_PUZZLE * 4);
  const cells = new Float32Array(6);
  const R = s / Math.sqrt(3);
  const r = CELL_RADIUS_FACTOR * s;
  let n = 0;
  const seg = (ax: number, ay: number, bx: number, by: number) => {
    segments[n++] = ax;
    segments[n++] = ay;
    segments[n++] = bx;
    segments[n++] = by;
  };

  for (let k = 0; k < 3; k++) {
    cells[2 * k] = cx + R * Math.cos(ANGLES[k]!);
    cells[2 * k + 1] = cy + R * Math.sin(ANGLES[k]!);
  }

  // 0-17: hexagon cells.
  for (let k = 0; k < 3; k++) {
    const x = cells[2 * k]!;
    const y = cells[2 * k + 1]!;
    for (let j = 0; j < 6; j++) {
      const a0 = (j * Math.PI) / 3;
      const a1 = ((j + 1) * Math.PI) / 3;
      seg(x + r * Math.cos(a0), y + r * Math.sin(a0), x + r * Math.cos(a1), y + r * Math.sin(a1));
    }
  }

  // 18-20: connectors between neighbouring cells.
  for (let k = 0; k < 3; k++) {
    const x0 = cells[2 * k]!;
    const y0 = cells[2 * k + 1]!;
    const x1 = cells[2 * ((k + 1) % 3)]!;
    const y1 = cells[2 * ((k + 1) % 3) + 1]!;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    seg(x0 + r * ux, y0 + r * uy, x1 - r * ux, y1 - r * uy);
  }

  // 21-23: spokes from the centroid to each cell.
  for (let k = 0; k < 3; k++) {
    const ux = Math.cos(ANGLES[k]!);
    const uy = Math.sin(ANGLES[k]!);
    const start = SPOKE_START_FACTOR * s;
    seg(cx + start * ux, cy + start * uy, cells[2 * k]! - r * ux, cells[2 * k + 1]! - r * uy);
  }

  // 24-29: truncated-triangle frame.
  const Rf = FRAME_RADIUS_FACTOR * s;
  const fx = ANGLES.map((a) => cx + Rf * Math.cos(a));
  const fy = ANGLES.map((a) => cy + Rf * Math.sin(a));
  const ax: number[] = [];
  const ay: number[] = [];
  const bx: number[] = [];
  const by: number[] = [];
  for (let k = 0; k < 3; k++) {
    const k1 = (k + 1) % 3;
    const dx = fx[k1]! - fx[k]!;
    const dy = fy[k1]! - fy[k]!;
    ax.push(fx[k]! + FRAME_CUT * dx);
    ay.push(fy[k]! + FRAME_CUT * dy);
    bx.push(fx[k]! + (1 - FRAME_CUT) * dx);
    by.push(fy[k]! + (1 - FRAME_CUT) * dy);
  }
  for (let k = 0; k < 3; k++) {
    const k1 = (k + 1) % 3;
    seg(ax[k]!, ay[k]!, bx[k]!, by[k]!);
    seg(bx[k]!, by[k]!, ax[k1]!, ay[k1]!);
  }

  return { segments, cells };
}

// Larger of the width and height of the frame's bounding box (segments 24-29).
function frameExtent(p: Puzzle): number {
  const segs = p.segments;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 24 * 4; i < 30 * 4; i += 2) {
    minX = Math.min(minX, segs[i]!);
    maxX = Math.max(maxX, segs[i]!);
    minY = Math.min(minY, segs[i + 1]!);
    maxY = Math.max(maxY, segs[i + 1]!);
  }
  return Math.max(maxX - minX, maxY - minY);
}

function ease(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (2 - 2 * x) ** 3 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Scene

// Reused stroke style, mutated in place each frame (no per-frame allocation here).
interface StrokeStyle {
  width: number;
  color: number;
  alpha: number;
}

export class BakeoffScene {
  private readonly app: Application;
  private readonly dpr: number;
  private readonly tier2: Puzzle;
  private readonly tier1: Puzzle[];
  private readonly extent: number;
  private loopTime = 0;

  // Camera: the world container is scaled and moved; screen css px per world unit.
  private readonly world: Container;
  private zoom = 1;

  private readonly layers: Graphics[]; // one per palette colour, each with its glow
  private readonly stroke: StrokeStyle = { width: 1, color: 0, alpha: 1 };

  // Particle pool: 200 sprites plus parallel typed arrays.
  private readonly dotTexture: Texture;
  private readonly dotLayer: Container;
  private readonly dots: Sprite[] = [];
  private readonly px = new Float32Array(PARTICLE_COUNT);
  private readonly py = new Float32Array(PARTICLE_COUNT);
  private readonly vx = new Float32Array(PARTICLE_COUNT);
  private readonly vy = new Float32Array(PARTICLE_COUNT);
  private readonly life = new Float32Array(PARTICLE_COUNT); // remaining seconds
  private readonly diameter = new Float32Array(PARTICLE_COUNT); // css px

  // Collapse progress, camera scale and pulse for the current frame.
  private progress = 0;
  private cameraScale = ZOOMED_SCALE;
  private pulse = 1;

  constructor(app: Application) {
    this.app = app;
    this.dpr = app.renderer.resolution;

    this.tier2 = trianglePuzzle(0, 0, TIER2_SPACING);
    this.tier1 = [0, 1, 2].map((k) =>
      trianglePuzzle(this.tier2.cells[2 * k]!, this.tier2.cells[2 * k + 1]!, TIER1_SPACING),
    );
    this.extent = frameExtent(this.tier2);

    this.world = new Container();
    app.stage.addChild(this.world);

    // One Graphics per colour, each with one outer glow in its colour. Filters render
    // at device pixel ratio (the Filter default is resolution 1, which would be soft).
    this.layers = PALETTE.map((colour) => {
      const graphics = new Graphics();
      const glow = new GlowFilter({
        color: colour,
        distance: GLOW_DISTANCE_CSS,
        outerStrength: GLOW_OUTER_STRENGTH,
        innerStrength: 0,
        quality: GLOW_QUALITY,
        knockout: false,
      });
      glow.resolution = this.dpr;
      graphics.filters = [glow];
      this.world.addChild(graphics);
      return graphics;
    });

    this.dotTexture = this.createDotTexture();
    this.dotLayer = new Container();
    this.world.addChild(this.dotLayer);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = new Sprite(this.dotTexture);
      dot.anchor.set(0.5);
      dot.blendMode = 'add';
      this.dots.push(dot);
      this.dotLayer.addChild(dot);
      this.spawn(i);
      // Spread deaths evenly from the first frame: remaining life in (0, 1.5].
      this.life[i] = PARTICLE_LIFE * (1 - Math.random());
    }

    this.applyLoop(0);
    this.draw();
  }

  update(deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, MAX_DELTA);
    this.loopTime += dt;
    if (this.loopTime >= LOOP) {
      this.loopTime %= LOOP;
      bakeoffDebug.loopsCompleted++;
    }
    this.applyLoop(dt);
    this.draw();
  }

  destroy(): void {
    this.app.stage.removeChild(this.world);
    for (const layer of this.layers) {
      for (const filter of layer.filters) filter.destroy();
    }
    // `context: true` frees the line Graphics' owned GraphicsContexts, which
    // Graphics.destroy keeps when given other options.
    this.world.destroy({ children: true, context: true });
    this.dotTexture.destroy(true);
  }

  // -------------------------------------------------------------------------

  private createDotTexture(): Texture {
    const g = new Graphics()
      .circle(DOT_TEXTURE_SIZE / 2, DOT_TEXTURE_SIZE / 2, DOT_TEXTURE_SIZE / 2)
      .fill(0xffffff);
    const texture = this.app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, DOT_TEXTURE_SIZE, DOT_TEXTURE_SIZE),
      resolution: 1,
      antialias: true,
    });
    g.destroy();
    return texture;
  }

  private spawn(i: number): void {
    const cell = Math.floor(Math.random() * 9);
    const k = Math.floor(cell / 3);
    const c = cell % 3;
    const p = this.progress;
    const cx = lerp(this.tier1[k]!.cells[2 * c]!, this.tier2.cells[2 * k]!, p);
    const cy = lerp(this.tier1[k]!.cells[2 * c + 1]!, this.tier2.cells[2 * k + 1]!, p);
    const radius = lerp(CELL_RADIUS_FACTOR * TIER1_SPACING, CELL_RADIUS_FACTOR * TIER2_SPACING, p);

    // Uniform in a disc of half the current cell radius.
    const rr = 0.5 * radius * Math.sqrt(Math.random());
    const ra = Math.random() * Math.PI * 2;
    this.px[i] = cx + rr * Math.cos(ra);
    this.py[i] = cy + rr * Math.sin(ra);

    const speed = lerp(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED, Math.random());
    const va = Math.random() * Math.PI * 2;
    this.vx[i] = speed * Math.cos(va);
    this.vy[i] = speed * Math.sin(va);
    this.life[i] = PARTICLE_LIFE;
    this.diameter[i] = lerp(PARTICLE_MIN_DIAMETER_CSS, PARTICLE_MAX_DIAMETER_CSS, Math.random());
    this.dots[i]!.tint = PALETTE[k]!;
  }

  // Advance the loop: camera, collapse progress, pulse, particles.
  private applyLoop(dt: number): void {
    const t = this.loopTime;
    const p0x = this.tier2.cells[0]!;
    const p0y = this.tier2.cells[1]!;
    const p1x = this.tier2.cells[2]!;
    const p1y = this.tier2.cells[3]!;
    const p2x = this.tier2.cells[4]!;
    const p2y = this.tier2.cells[5]!;

    let camX: number;
    let camY: number;
    this.pulse = 1;

    if (t < HOLD1_END) {
      const firstLeg = t < PAN_LEG;
      const e = ease(firstLeg ? t / PAN_LEG : (t - PAN_LEG) / PAN_LEG);
      camX = firstLeg ? lerp(p0x, p1x, e) : lerp(p1x, p2x, e);
      camY = firstLeg ? lerp(p0y, p1y, e) : lerp(p1y, p2y, e);
      this.cameraScale = ZOOMED_SCALE;
      this.progress = 0;
    } else if (t < COLLAPSE_END) {
      const e = ease((t - HOLD1_END) / (COLLAPSE_END - HOLD1_END));
      camX = lerp(p2x, 0, e);
      camY = lerp(p2y, 0, e);
      this.cameraScale = lerp(ZOOMED_SCALE, 1, e);
      this.progress = e;
    } else if (t < HOLD2_END) {
      camX = 0;
      camY = 0;
      this.cameraScale = 1;
      this.progress = 1;
      this.pulse = 0.7 + 0.3 * Math.cos((2 * Math.PI * (t - COLLAPSE_END)) / PULSE_PERIOD);
    } else {
      const e = ease((t - HOLD2_END) / (LOOP - HOLD2_END));
      camX = lerp(0, p0x, e);
      camY = lerp(0, p0y, e);
      this.cameraScale = lerp(1, ZOOMED_SCALE, e);
      this.progress = 1 - e;
    }

    // Camera: base fit follows the viewport (app.screen is in css px, autoDensity).
    const { width, height } = this.app.screen;
    const baseFit = (FIT_FRACTION * Math.min(width, height)) / this.extent;
    const zoom = baseFit * this.cameraScale;
    this.zoom = zoom;
    this.world.scale.set(zoom);
    this.world.position.set(width / 2 - camX * zoom, height / 2 - camY * zoom);

    // Particles: age, respawn the dead in the same frame, move, restyle.
    const cssToWorld = 1 / zoom;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let life = this.life[i]! - dt;
      if (life <= 0) {
        this.spawn(i);
        life = PARTICLE_LIFE;
      } else {
        this.px[i] = this.px[i]! + this.vx[i]! * dt;
        this.py[i] = this.py[i]! + this.vy[i]! * dt;
      }
      this.life[i] = life;
      const dot = this.dots[i]!;
      dot.position.set(this.px[i]!, this.py[i]!);
      dot.alpha = life / PARTICLE_LIFE;
      dot.scale.set((this.diameter[i]! * cssToWorld) / DOT_TEXTURE_SIZE);
    }
    bakeoffDebug.liveParticles = this.countRenderedDots();
  }

  // Counts what is actually in the stage tree (not the pool), so a leaked or missing
  // particle object shows up in the debug hook.
  private countRenderedDots(): number {
    const world = this.world;
    const layer = this.dotLayer;
    if (!world.visible || !world.renderable || world.parent !== this.app.stage) return 0;
    if (!layer.visible || !layer.renderable || layer.parent !== world) return 0;
    const list = this.dotLayer.children;
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      const obj = list[i];
      if (
        obj instanceof Sprite &&
        obj.texture === this.dotTexture &&
        obj.visible &&
        obj.renderable &&
        obj.alpha > 0
      ) {
        n++;
      }
    }
    return n;
  }

  private draw(): void {
    const stroke = this.stroke;
    stroke.width = LINE_WIDTH_CSS / this.zoom; // world units for 3 css px on screen
    const p = this.progress;
    const pulse = this.pulse;
    const t2 = this.tier2.segments;

    for (const g of this.layers) g.clear();

    // Tier-1 puzzles: segment i lerps to tier-2 segment 6k + (i mod 6), an edge of
    // tier-2 cell k's hexagon. All 30 share one alpha, so one stroke per puzzle.
    for (let k = 0; k < 3; k++) {
      const g = this.layers[k]!;
      const src = this.tier1[k]!.segments;
      for (let i = 0; i < SEGMENTS_PER_PUZZLE; i++) {
        const s = i * 4;
        const d = (k * 6 + (i % 6)) * 4;
        g.moveTo(lerp(src[s]!, t2[d]!, p), lerp(src[s + 1]!, t2[d + 1]!, p));
        g.lineTo(lerp(src[s + 2]!, t2[d + 2]!, p), lerp(src[s + 3]!, t2[d + 3]!, p));
      }
      stroke.color = PALETTE[k]!;
      stroke.alpha = pulse;
      g.stroke(stroke);
    }

    // Tier-2 segments 18-29 at alpha p, segment j in palette[j mod 3]: one stroke per
    // colour (4 segments each), drawn even at alpha 0 so the count never changes.
    for (let c = 0; c < 3; c++) {
      const g = this.layers[c]!;
      for (let j = TIER2_DRAWN_FROM + c; j < SEGMENTS_PER_PUZZLE; j += 3) {
        const s = j * 4;
        g.moveTo(t2[s]!, t2[s + 1]!);
        g.lineTo(t2[s + 2]!, t2[s + 3]!);
      }
      stroke.color = PALETTE[c]!;
      stroke.alpha = p * pulse;
      g.stroke(stroke);
    }
  }
}
