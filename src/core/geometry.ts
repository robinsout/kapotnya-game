import type { Vec2 } from './math';
import { distanceSq } from './math';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const pointInRect = (p: Vec2, r: Rect): boolean =>
  p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;

export const circlesOverlap = (a: Vec2, ra: number, b: Vec2, rb: number): boolean =>
  distanceSq(a, b) <= (ra + rb) * (ra + rb);

/** True when segment a→b passes within `radius` of `center` (used for fast bullets). */
export const segmentHitsCircle = (a: Vec2, b: Vec2, center: Vec2, radius: number): boolean => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((center.x - a.x) * dx + (center.y - a.y) * dy) / lengthSq));
  const closest = { x: a.x + dx * t, y: a.y + dy * t };
  return distanceSq(closest, center) <= radius * radius;
};
