import { computeScale } from './scale';

/** Where the on-screen touch controls go relative to the game canvas. */
export type ControlsPlacement = 'none' | 'below' | 'sides' | 'overlay';

export interface Layout {
  scale: number;
  controls: ControlsPlacement;
}

export interface Viewport {
  width: number;
  height: number;
}

/** Vertical space reserved under the canvas for buttons in portrait. */
export const CONTROLS_BELOW_HEIGHT = 130;
/** Minimum width of each side column for buttons in landscape. */
export const CONTROLS_SIDE_WIDTH = 120;
/** Shrink the canvas at most this much to make room for side controls. */
const MAX_SIDE_SHRINK = 0.75;

/**
 * Chooses canvas scale and touch-control placement. Desktop keeps crisp integer
 * scaling; touch devices use every available pixel and keep buttons off the playfield
 * whenever there's room.
 */
export const computeLayout = (viewport: Viewport, touch: boolean, worldW: number, worldH: number): Layout => {
  const { width, height } = viewport;
  if (!touch) return { scale: computeScale(width, height, worldW, worldH), controls: 'none' };

  const fullScale = Math.min(width / worldW, height / worldH);

  if (height > width) {
    const scale = Math.min(width / worldW, (height - CONTROLS_BELOW_HEIGHT) / worldH);
    return { scale: Math.max(0.25, scale), controls: 'below' };
  }

  const sideScale = Math.min(height / worldH, (width - CONTROLS_SIDE_WIDTH * 2) / worldW);
  if (sideScale >= fullScale * MAX_SIDE_SHRINK) return { scale: sideScale, controls: 'sides' };
  return { scale: fullScale, controls: 'overlay' };
};
