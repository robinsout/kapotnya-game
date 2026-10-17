import { WORLD } from '../config';
import type { Rect } from '../core/geometry';
import { seededRng, chance } from '../core/random';
import type { Structure } from '../game/refinery';
import { LID_HEIGHT, LID_WIDTH, STRUCTURES } from '../game/refinery';
import type { PixelCanvas } from './canvas';
import { createOffscreen } from './canvas';
import { COLORS } from './palette';
import type { Sprite } from './sprite';

/** Cylinder shading: light on the left, dark on the right. */
const cylinder = (pc: PixelCanvas, r: Rect, light: string, mid: string, dark: string): void => {
  pc.rect(r.x, r.y, r.w, r.h, mid);
  pc.rect(r.x, r.y, Math.max(1, Math.floor(r.w * 0.2)), r.h, light);
  pc.rect(r.x + r.w - Math.max(1, Math.floor(r.w * 0.25)), r.y, Math.max(1, Math.floor(r.w * 0.25)), r.h, dark);
};

/** Big tank roof as a sprite, so it can be drawn in place or spinning in the air. */
export const createLidSprite = (): Sprite => {
  const width = LID_WIDTH;
  const insets = [12, 6, 3, 1, 0, 0];
  const colors = [
    COLORS.steelLight,
    COLORS.steelLight,
    COLORS.steel,
    COLORS.steel,
    COLORS.steelDark,
    COLORS.rust,
  ];
  const pixels: (string | null)[] = [];
  for (let y = 0; y < LID_HEIGHT; y++) {
    for (let x = 0; x < width; x++) {
      pixels.push(x >= insets[y] && x < width - insets[y] ? colors[y] : null);
    }
  }
  return { width, height: LID_HEIGHT, pixels };
};

export const LID_SPRITE = createLidSprite();

const drawBigTank = (pc: PixelCanvas, s: Structure, destroyed: boolean): void => {
  const r = s.rect;
  cylinder(pc, r, COLORS.steelLight, COLORS.steel, COLORS.steelDark);
  for (let y = r.y + 8; y < r.y + r.h; y += 10) pc.rect(r.x, y, r.w, 1, COLORS.steelDark);
  // Red warning band and a spiral staircase.
  pc.rect(r.x, r.y + 14, r.w, 3, COLORS.red);
  pc.line(r.x + 4, WORLD.groundY - 1, r.x + r.w - 6, r.y + 2, COLORS.pipeDark);
  pc.line(r.x + 4, WORLD.groundY - 3, r.x + r.w - 6, r.y, COLORS.steelDark);

  if (!destroyed) {
    pc.sprite(LID_SPRITE, r.x - 1, r.y - LID_HEIGHT);
    return;
  }
  // Torn, scorched top edge.
  const rng = seededRng(7);
  for (let x = r.x; x < r.x + r.w; x++) {
    const tear = Math.floor(rng.next() * 6) + (chance(rng, 0.2) ? 4 : 0);
    pc.rect(x, r.y, 1, tear, COLORS.black);
    pc.rect(x, r.y + tear, 1, Math.floor(rng.next() * 6), COLORS.smoke);
  }
};

const drawTank = (pc: PixelCanvas, s: Structure): void => {
  const r = s.rect;
  cylinder(pc, r, COLORS.white, COLORS.steelLight, COLORS.steel);
  pc.rect(r.x, r.y + 6, r.w, 2, COLORS.red);
  pc.rect(r.x + 2, r.y - 2, r.w - 4, 2, COLORS.steelLight);
  pc.rect(r.x + 6, r.y - 3, r.w - 12, 1, COLORS.white);
  pc.rect(r.x, r.y + r.h - 3, r.w, 1, COLORS.steel);
};

const drawColumn = (pc: PixelCanvas, s: Structure): void => {
  const r = s.rect;
  cylinder(pc, r, COLORS.steelLight, COLORS.steel, COLORS.steelDark);
  for (let y = r.y + 10; y < r.y + r.h - 6; y += 14) {
    pc.rect(r.x - 2, y, r.w + 4, 1, COLORS.pipeDark);
    pc.rect(r.x - 2, y - 2, 1, 2, COLORS.pipeDark);
    pc.rect(r.x + r.w + 1, y - 2, 1, 2, COLORS.pipeDark);
  }
  for (let y = r.y + 2; y < r.y + r.h; y += 2) pc.pixel(r.x + r.w, y, COLORS.pipeDark);
  pc.rect(r.x + 1, r.y - 2, r.w - 2, 2, COLORS.steelDark);
};

const drawFlare = (pc: PixelCanvas, s: Structure): void => {
  const r = s.rect;
  for (let y = r.y; y < r.y + r.h; y++) {
    const band = Math.floor((y - r.y) / 6) % 2 === 0;
    pc.rect(r.x, y, r.w, 1, band ? COLORS.red : COLORS.white);
  }
  // Guy wires.
  pc.line(r.x, r.y + 20, r.x - 16, WORLD.groundY - 1, COLORS.pipeDark);
  pc.line(r.x + r.w - 1, r.y + 20, r.x + r.w + 15, WORLD.groundY - 1, COLORS.pipeDark);
};

const drawUnit = (pc: PixelCanvas, s: Structure): void => {
  const r = s.rect;
  pc.rect(r.x, r.y, r.w, r.h, COLORS.pipe);
  pc.rect(r.x, r.y, r.w, 2, COLORS.steel);
  for (let y = r.y + 5; y < r.y + r.h - 4; y += 7) {
    for (let x = r.x + 3; x < r.x + r.w - 3; x += 6) pc.rect(x, y, 3, 3, COLORS.window);
  }
  pc.rect(r.x + r.w - 10, r.y - 18, 5, 18, COLORS.steelDark);
  pc.rect(r.x + r.w - 10, r.y - 18, 5, 2, COLORS.red);
};

const drawPipes = (pc: PixelCanvas): void => {
  pc.rect(20, 150, 290, 2, COLORS.pipe);
  pc.rect(20, 152, 290, 1, COLORS.pipeDark);
  pc.rect(96, 142, 120, 1, COLORS.pipe);
  for (let x = 24; x < 310; x += 18) pc.rect(x, 152, 1, WORLD.groundY - 152, COLORS.pipeDark);
};

/** Static refinery picture: intact or with the big tank torn open. */
export const renderRefinery = (destroyed: boolean): HTMLCanvasElement => {
  const pc = createOffscreen(WORLD.width, WORLD.height);
  drawPipes(pc);
  for (const s of STRUCTURES) {
    switch (s.kind) {
      case 'bigTank':
        drawBigTank(pc, s, destroyed);
        break;
      case 'tank':
        drawTank(pc, s);
        break;
      case 'column':
        drawColumn(pc, s);
        break;
      case 'flare':
        drawFlare(pc, s);
        break;
      case 'unit':
        drawUnit(pc, s);
        break;
    }
  }
  return pc.ctx.canvas;
};

/** Points where red aviation lights blink. */
export const AVIATION_LIGHTS = STRUCTURES.filter((s) => s.kind === 'column' || s.kind === 'flare').map((s) => ({
  x: s.rect.x + Math.floor(s.rect.w / 2),
  y: s.rect.y - 3,
}));

export const FLARE_TIP = (() => {
  const flare = STRUCTURES.find((s) => s.kind === 'flare')!;
  return { x: flare.rect.x + flare.rect.w / 2, y: flare.rect.y };
})();
