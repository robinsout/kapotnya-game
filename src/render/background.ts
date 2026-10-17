import { WORLD } from '../config';
import type { Rng } from '../core/random';
import { chance, intRange, range, seededRng } from '../core/random';
import type { PixelCanvas } from './canvas';
import { createOffscreen } from './canvas';
import { ditheredGradient } from './dither';
import { COLORS } from './palette';

const SKY = [COLORS.skyTop, COLORS.skyMid, COLORS.skyLow, COLORS.glow] as const;
const HORIZON = WORLD.groundY - 20;

const drawSky = (pc: PixelCanvas): void => {
  for (let y = 0; y < WORLD.groundY; y++) {
    const t = Math.pow(y / HORIZON, 1.6);
    for (let x = 0; x < WORLD.width; x++) pc.pixel(x, y, ditheredGradient(SKY, t, x, y));
  }
};

const drawStars = (pc: PixelCanvas, rng: Rng): void => {
  for (let i = 0; i < 70; i++) {
    const x = intRange(rng, 0, WORLD.width - 1);
    const y = intRange(rng, 0, 80);
    pc.pixel(x, y, chance(rng, 0.2) ? COLORS.white : COLORS.star);
  }
};

const drawMoon = (pc: PixelCanvas, cx: number, cy: number, r: number): void => {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      // Crescent: carve out a shifted disc.
      const sx = x + 3;
      const sy = y - 1;
      if (sx * sx + sy * sy <= r * r) continue;
      pc.pixel(cx + x, cy + y, COLORS.moon);
    }
  }
};

const drawBuilding = (pc: PixelCanvas, rng: Rng, x: number, w: number, h: number, color: string, lit: number): void => {
  const top = WORLD.groundY - h;
  pc.rect(x, top, w, h, color);
  for (let wy = top + 2; wy < WORLD.groundY - 2; wy += 3) {
    for (let wx = x + 1; wx < x + w - 1; wx += 2) {
      if (chance(rng, lit)) pc.pixel(wx, wy, chance(rng, 0.7) ? COLORS.windowDim : COLORS.window);
    }
  }
};

const drawSkyline = (pc: PixelCanvas, rng: Rng): void => {
  // Far layer: panel blocks and a TV tower.
  let x = -4;
  while (x < WORLD.width) {
    const w = intRange(rng, 10, 22);
    drawBuilding(pc, rng, x, w, intRange(rng, 22, 48), COLORS.cityFar, 0.12);
    x += w + intRange(rng, 0, 3);
  }
  const towerX = 118;
  pc.rect(towerX, WORLD.groundY - 96, 2, 96, COLORS.cityFar);
  pc.rect(towerX - 1, WORLD.groundY - 70, 4, 4, COLORS.cityFar);
  pc.rect(towerX, WORLD.groundY - 108, 1, 12, COLORS.cityFar);
  pc.pixel(towerX, WORLD.groundY - 109, COLORS.red);

  // Near layer: lower, darker blocks.
  x = -6;
  while (x < WORLD.width) {
    const w = intRange(rng, 14, 30);
    drawBuilding(pc, rng, x, w, intRange(rng, 10, 26), COLORS.cityNear, 0.06);
    x += w + intRange(rng, 2, 10);
  }
};

const drawGround = (pc: PixelCanvas, rng: Rng): void => {
  pc.rect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY, COLORS.ground);
  pc.rect(0, WORLD.groundY, WORLD.width, 1, COLORS.groundTop);
  for (let i = 0; i < 90; i++) {
    pc.pixel(range(rng, 0, WORLD.width), range(rng, WORLD.groundY + 2, WORLD.height), COLORS.groundTop);
  }
};

/** Static backdrop rendered once into an offscreen canvas. */
export const renderBackground = (): HTMLCanvasElement => {
  const pc = createOffscreen(WORLD.width, WORLD.height);
  const rng = seededRng(1984);
  drawSky(pc);
  drawStars(pc, rng);
  drawMoon(pc, 268, 26, 8);
  drawSkyline(pc, rng);
  drawGround(pc, rng);
  return pc.ctx.canvas;
};
