import { WORLD } from '../config';
import type { Layout } from './layout';
import { computeLayout } from './layout';

export const isTouchDevice = (): boolean =>
  window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const viewportSize = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
});

/** Keeps the canvas scale and touch-control placement in sync with the screen. */
export const bindViewport = (root: HTMLElement, stage: HTMLElement): (() => Layout) => {
  let layout: Layout = { scale: 1, controls: 'none' };
  const apply = (): void => {
    layout = computeLayout(viewportSize(), isTouchDevice(), WORLD.width, WORLD.height);
    stage.style.setProperty('--scale', String(layout.scale));
    root.dataset.controls = layout.controls;
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  window.visualViewport?.addEventListener('resize', apply);
  return () => layout;
};
