import * as Phaser from 'phaser';

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
const GLOW_DISTANCE = 12;
const GLOW_OUTER_STRENGTH = 2;
const GLOW_QUALITY = 10;

const PARTICLE_COUNT = 200;
const PARTICLE_LIFE = 1.5;
const PARTICLE_MIN_DIAMETER_CSS = 2;
const PARTICLE_MAX_DIAMETER_CSS = 4;
const PARTICLE_MIN_SPEED = 40;
const PARTICLE_MAX_SPEED = 120;
const DOT_TEXTURE = 'bakeoff-dot';
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
  liveParticles: number; // particle dots visible in the scene's display list last frame
  loopsCompleted: number; // 5 s loops completed since page load
  restarts: number; // scene restarts after a WebGL context restore
  sceneSeconds: number; // loop clock advanced since page load (clamped dt, survives restarts)
}

export const bakeoffDebug: BakeoffDebug = { liveParticles: 0, loopsCompleted: 0, restarts: 0, sceneSeconds: 0 };

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

function ease(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (2 - 2 * x) ** 3 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Scene

interface ColourLayer {
  graphics: Phaser.GameObjects.Graphics;
  colour: number;
}

export class BakeoffScene extends Phaser.Scene {
  private tier2!: Puzzle;
  private tier1!: Puzzle[];
  private baseFit = 1; // screen device px per world unit at camera scale 1
  private dpr = 1;
  private loopTime = 0;

  private layers!: ColourLayer[];

  // Particle pool: 200 images plus parallel typed arrays.
  private dots!: Phaser.GameObjects.Image[];
  private px = new Float32Array(PARTICLE_COUNT);
  private py = new Float32Array(PARTICLE_COUNT);
  private vx = new Float32Array(PARTICLE_COUNT);
  private vy = new Float32Array(PARTICLE_COUNT);
  private life = new Float32Array(PARTICLE_COUNT); // remaining seconds
  private diameter = new Float32Array(PARTICLE_COUNT); // css px

  // Collapse progress, camera scale and pulse for the current frame.
  private progress = 0;
  private cameraScale = ZOOMED_SCALE;
  private pulse = 1;

  constructor() {
    super('bakeoff');
  }

  create(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.loopTime = 0;
    this.progress = 0;

    this.tier2 = trianglePuzzle(0, 0, TIER2_SPACING);
    this.tier1 = [0, 1, 2].map((k) =>
      trianglePuzzle(this.tier2.cells[2 * k]!, this.tier2.cells[2 * k + 1]!, TIER1_SPACING),
    );

    this.cameras.main.setBackgroundColor('#05060a');
    this.updateFit();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateFit, this);

    // One Graphics per colour, each with one glow in its colour. Graphics have no
    // bounds, so their filters focus on the camera context: the glow is screen space.
    this.layers = PALETTE.map((colour) => {
      const graphics = this.add.graphics();
      graphics.enableFilters().setFiltersFocusContext(true);
      graphics.filters!.internal.addGlow(
        colour,
        GLOW_OUTER_STRENGTH,
        0,
        this.dpr,
        false,
        GLOW_QUALITY,
        GLOW_DISTANCE,
      );
      return { graphics, colour };
    });

    this.createDots();

    // Context loss: Phaser restores GL resources itself; restart the scene so
    // generated textures and filter targets are rebuilt from scratch.
    const restart = () => {
      console.info('bake-off: WebGL context restored, restarting the scene');
      bakeoffDebug.restarts++;
      this.scene.restart();
    };
    this.game.renderer.once(Phaser.Renderer.Events.RESTORE_WEBGL, restart);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, restart);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.updateFit, this);
    });

    this.applyLoop(0);
    this.draw();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, MAX_DELTA);
    this.loopTime += dt;
    bakeoffDebug.sceneSeconds += dt;
    if (this.loopTime >= LOOP) {
      this.loopTime %= LOOP;
      bakeoffDebug.loopsCompleted++;
    }
    this.applyLoop(dt);
    this.draw();
  }

  // -------------------------------------------------------------------------

  private updateFit(): void {
    const segs = this.tier2.segments;
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
    const extent = Math.max(maxX - minX, maxY - minY);
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setSize(width, height);
    this.baseFit = (FIT_FRACTION * Math.min(width, height)) / extent;
  }

  private createDots(): void {
    if (this.textures.exists(DOT_TEXTURE)) this.textures.remove(DOT_TEXTURE);
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(DOT_TEXTURE_SIZE / 2, DOT_TEXTURE_SIZE / 2, DOT_TEXTURE_SIZE / 2);
    g.generateTexture(DOT_TEXTURE, DOT_TEXTURE_SIZE, DOT_TEXTURE_SIZE);
    g.destroy();

    this.dots = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = this.add.image(0, 0, DOT_TEXTURE).setBlendMode(Phaser.BlendModes.ADD);
      this.dots.push(dot);
      this.spawn(i);
      // Spread deaths evenly from the first frame: remaining life in (0, 1.5].
      this.life[i] = PARTICLE_LIFE * (1 - Math.random());
    }
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
    this.dots[i]!.setTint(PALETTE[k]!);
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

    const cam = this.cameras.main;
    const zoom = this.baseFit * this.cameraScale;
    cam.setZoom(zoom);
    cam.centerOn(camX, camY);

    // Particles: age, respawn the dead in the same frame, move, restyle.
    const cssToWorld = this.dpr / zoom;
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
      dot.x = this.px[i]!;
      dot.y = this.py[i]!;
      dot.alpha = life / PARTICLE_LIFE;
      dot.setScale((this.diameter[i]! * cssToWorld) / DOT_TEXTURE_SIZE);
    }
    bakeoffDebug.liveParticles = this.countRenderedDots();
  }

  // Counts what is actually on the display list (not the pool), so a leaked or
  // missing particle object shows up in the debug hook.
  private countRenderedDots(): number {
    const list = this.children.list;
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      const obj = list[i];
      if (
        obj instanceof Phaser.GameObjects.Image &&
        obj.texture.key === DOT_TEXTURE &&
        obj.visible &&
        obj.alpha > 0
      ) {
        n++;
      }
    }
    return n;
  }

  private draw(): void {
    const zoom = this.baseFit * this.cameraScale;
    const width = (LINE_WIDTH_CSS * this.dpr) / zoom;
    const p = this.progress;
    const pulse = this.pulse;
    const t2 = this.tier2.segments;

    for (const layer of this.layers) layer.graphics.clear();

    // Tier-1 puzzles: segment i lerps to tier-2 segment (i mod 6) of cell k's hexagon.
    for (let k = 0; k < 3; k++) {
      const g = this.layers[k]!.graphics;
      g.lineStyle(width, PALETTE[k]!, pulse);
      const src = this.tier1[k]!.segments;
      for (let i = 0; i < SEGMENTS_PER_PUZZLE; i++) {
        const s = i * 4;
        const d = (k * 6 + (i % 6)) * 4;
        g.lineBetween(
          lerp(src[s]!, t2[d]!, p),
          lerp(src[s + 1]!, t2[d + 1]!, p),
          lerp(src[s + 2]!, t2[d + 2]!, p),
          lerp(src[s + 3]!, t2[d + 3]!, p),
        );
      }
    }

    // Tier-2 segments 18-29 at alpha p, segment j in palette[j mod 3].
    for (let j = TIER2_DRAWN_FROM; j < SEGMENTS_PER_PUZZLE; j++) {
      const g = this.layers[j % 3]!.graphics;
      g.lineStyle(width, PALETTE[j % 3]!, p * pulse);
      const s = j * 4;
      g.lineBetween(t2[s]!, t2[s + 1]!, t2[s + 2]!, t2[s + 3]!);
    }
  }
}
