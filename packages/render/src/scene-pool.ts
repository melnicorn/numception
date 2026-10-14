import type { ThemeTokens } from '@numception/app';
import { type Container, Graphics, Text } from 'pixi.js';

/** The Text style fields the play view sets. */
export type TextLook = { readonly fontFamily: string; readonly fontWeight: ThemeTokens['fontWeight']; readonly fontSize: number; readonly fill: number };

/**
 * Graphics and Text reused across frames (performance: a beat redraws every frame,
 * and recreating Text re-rasterises it). Each frame takes objects in draw order
 * between `begin` and `end`; their `zIndex` follows that order, and objects not
 * taken this frame are hidden. A Text keeps its texture while its string and style
 * are unchanged, so animating position, scale and alpha costs no re-rasterising.
 * The pool holds no game state: every frame is drawn from the view alone.
 */
export class ScenePool {
  private readonly graphics: Graphics[] = [];
  private readonly texts: Text[] = [];
  private graphicsUsed = 0;
  private textsUsed = 0;
  private order = 0;

  constructor(private readonly container: Container) {
    container.sortableChildren = true;
  }

  begin(): void {
    this.graphicsUsed = 0;
    this.textsUsed = 0;
    this.order = 0;
  }

  /** A cleared Graphics, drawn above everything taken before it this frame. */
  takeGraphics(): Graphics {
    let g = this.graphics[this.graphicsUsed];
    if (g === undefined) {
      g = new Graphics();
      this.graphics.push(g);
      this.container.addChild(g);
    }
    this.graphicsUsed += 1;
    g.clear();
    g.alpha = 1;
    g.visible = true;
    g.zIndex = this.order++;
    return g;
  }

  /** A centred Text showing `text` in `look`, drawn above everything taken before it this frame. */
  takeText(text: string, look: TextLook): Text {
    let t = this.texts[this.textsUsed];
    if (t === undefined) {
      t = new Text({ text, style: { ...look } });
      t.anchor.set(0.5);
      this.texts.push(t);
      this.container.addChild(t);
    }
    this.textsUsed += 1;
    if (t.text !== text) t.text = text;
    const style = t.style;
    if (style.fontFamily !== look.fontFamily) style.fontFamily = look.fontFamily;
    if (style.fontWeight !== look.fontWeight) style.fontWeight = look.fontWeight;
    if (style.fontSize !== look.fontSize) style.fontSize = look.fontSize;
    if (style.fill !== look.fill) style.fill = look.fill;
    t.visible = true;
    t.alpha = 1;
    t.scale.set(1);
    t.zIndex = this.order++;
    return t;
  }

  /** Hides what this frame did not take. */
  end(): void {
    for (let i = this.graphicsUsed; i < this.graphics.length; i += 1) {
      const g = this.graphics[i];
      if (g !== undefined) {
        g.clear();
        g.visible = false;
      }
    }
    for (let i = this.textsUsed; i < this.texts.length; i += 1) {
      const t = this.texts[i];
      if (t !== undefined) t.visible = false;
    }
  }

  /** Destroys every pooled object (e.g. after a lost WebGL context); the pool refills on the next frame. */
  reset(): void {
    for (const object of [...this.graphics, ...this.texts]) object.destroy();
    this.graphics.length = 0;
    this.texts.length = 0;
  }
}
