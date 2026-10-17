/** A tiny pixel image: row-major colours, `null` for transparent pixels. */
export interface Sprite {
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly (string | null)[];
}

export type Palette = Readonly<Record<string, string>>;

const TRANSPARENT = '.';

/**
 * Builds a sprite from ASCII art. Each character maps to a palette colour,
 * '.' is transparent. Throws on ragged rows or unknown characters so typos
 * in sprite data fail loudly.
 */
export const parseSprite = (rows: readonly string[], palette: Palette): Sprite => {
  if (rows.length === 0) throw new Error('parseSprite: empty sprite');
  const width = rows[0].length;
  const pixels: (string | null)[] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`parseSprite: row ${y} has length ${row.length}, expected ${width}`);
    }
    for (const char of row) {
      if (char === TRANSPARENT) {
        pixels.push(null);
        continue;
      }
      const color = palette[char];
      if (!color) throw new Error(`parseSprite: unknown palette key "${char}" in row ${y}`);
      pixels.push(color);
    }
  });
  return { width, height: rows.length, pixels };
};

export const pixelAt = (sprite: Sprite, x: number, y: number): string | null => {
  if (x < 0 || y < 0 || x >= sprite.width || y >= sprite.height) return null;
  return sprite.pixels[y * sprite.width + x];
};

export const flipX = (sprite: Sprite): Sprite => {
  const pixels: (string | null)[] = [];
  for (let y = 0; y < sprite.height; y++) {
    for (let x = sprite.width - 1; x >= 0; x--) pixels.push(pixelAt(sprite, x, y));
  }
  return { width: sprite.width, height: sprite.height, pixels };
};

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

/**
 * Nearest-neighbour rotation around the sprite centre. Returns pixel offsets
 * relative to the centre, which keeps the chunky pixel look (no smoothing).
 */
export const rotatePixels = (sprite: Sprite, angle: number): Pixel[] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = (sprite.width - 1) / 2;
  const cy = (sprite.height - 1) / 2;
  const radius = Math.ceil(Math.hypot(sprite.width, sprite.height) / 2);
  const result: Pixel[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      // Inverse-rotate the destination pixel back into sprite space.
      const sx = Math.round(cx + dx * cos + dy * sin);
      const sy = Math.round(cy - dx * sin + dy * cos);
      const color = pixelAt(sprite, sx, sy);
      if (color) result.push({ x: dx, y: dy, color });
    }
  }
  return result;
};

/** Integer points of a line (Bresenham), endpoints included. */
export const linePoints = (x0: number, y0: number, x1: number, y1: number): Array<[number, number]> => {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const xEnd = Math.round(x1);
  const yEnd = Math.round(y1);
  const dx = Math.abs(xEnd - x);
  const dy = -Math.abs(yEnd - y);
  const sx = x < xEnd ? 1 : -1;
  const sy = y < yEnd ? 1 : -1;
  let err = dx + dy;
  const points: Array<[number, number]> = [];
  for (;;) {
    points.push([x, y]);
    if (x === xEnd && y === yEnd) return points;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};
