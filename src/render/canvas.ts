import type { Sprite } from './sprite';
import { linePoints, rotatePixels } from './sprite';

/** Thin pixel-perfect drawing helpers over a 2D context. */
export class PixelCanvas {
  private readonly spriteCache = new WeakMap<Sprite, HTMLCanvasElement>();

  constructor(readonly ctx: CanvasRenderingContext2D) {
    ctx.imageSmoothingEnabled = false;
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  pixel(x: number, y: number, color: string): void {
    this.rect(x, y, 1, 1, color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    this.ctx.fillStyle = color;
    for (const [x, y] of linePoints(x0, y0, x1, y1)) this.ctx.fillRect(x, y, 1, 1);
  }

  /** Draws a sprite with its top-left corner at (x, y). */
  sprite(sprite: Sprite, x: number, y: number): void {
    this.ctx.drawImage(this.toCanvas(sprite), Math.round(x), Math.round(y));
  }

  spriteCentered(sprite: Sprite, cx: number, cy: number): void {
    this.sprite(sprite, cx - Math.floor(sprite.width / 2), cy - Math.floor(sprite.height / 2));
  }

  spriteRotated(sprite: Sprite, cx: number, cy: number, angle: number): void {
    const x = Math.round(cx);
    const y = Math.round(cy);
    for (const p of rotatePixels(sprite, angle)) {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(x + p.x, y + p.y, 1, 1);
    }
  }

  private toCanvas(sprite: Sprite): HTMLCanvasElement {
    const cached = this.spriteCache.get(sprite);
    if (cached) return cached;
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d')!;
    sprite.pixels.forEach((color, i) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(i % sprite.width, Math.floor(i / sprite.width), 1, 1);
    });
    this.spriteCache.set(sprite, canvas);
    return canvas;
  }
}

export const createOffscreen = (width: number, height: number): PixelCanvas => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return new PixelCanvas(canvas.getContext('2d')!);
};
