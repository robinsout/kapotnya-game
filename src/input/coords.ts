import type { Vec2 } from '../core/math';

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Maps a pointer position in CSS pixels to world coordinates of a scaled canvas. */
export const clientToWorld = (
  clientX: number,
  clientY: number,
  rect: ViewportRect,
  worldWidth: number,
  worldHeight: number,
): Vec2 => ({
  x: ((clientX - rect.left) / rect.width) * worldWidth,
  y: ((clientY - rect.top) / rect.height) * worldHeight,
});
