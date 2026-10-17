import type { Rect } from '../core/geometry';
import type { Vec2 } from '../core/math';
import type { Rng } from '../core/random';
import { pick, range } from '../core/random';
import { WORLD } from '../config';

export type StructureKind = 'bigTank' | 'tank' | 'column' | 'flare' | 'unit';

export interface Structure {
  readonly id: string;
  readonly kind: StructureKind;
  readonly rect: Rect;
}

const ground = WORLD.groundY;
const standing = (x: number, top: number, w: number): Rect => ({ x, y: top, w, h: ground - top });

/** Static layout of the refinery — shared by game logic (targets) and the renderer. */
export const STRUCTURES: readonly Structure[] = [
  { id: 'big-tank', kind: 'bigTank', rect: standing(30, 112, 64) },
  { id: 'tank-2', kind: 'tank', rect: standing(108, 132, 36) },
  { id: 'column-1', kind: 'column', rect: standing(156, 80, 10) },
  { id: 'column-2', kind: 'column', rect: standing(172, 96, 13) },
  { id: 'flare', kind: 'flare', rect: standing(197, 56, 4) },
  { id: 'tank-3', kind: 'tank', rect: standing(214, 128, 40) },
  { id: 'unit', kind: 'unit', rect: standing(264, 116, 46) },
];

export const BIG_TANK: Structure = STRUCTURES.find((s) => s.kind === 'bigTank')!;

/** Size of the big tank's roof ("lid") that flies off on the final explosion. */
export const LID_HEIGHT = 6;
export const LID_WIDTH = BIG_TANK.rect.w + 2;

const TARGETABLE = STRUCTURES.filter((s) => s.kind !== 'flare');

/** Picks a random point on the upper part of a targetable structure. */
export const pickTargetPoint = (rng: Rng): Vec2 => {
  const { rect } = pick(rng, TARGETABLE);
  return {
    x: Math.round(range(rng, rect.x + 2, rect.x + rect.w - 2)),
    y: Math.round(range(rng, rect.y + 2, rect.y + Math.min(rect.h, 24))),
  };
};
