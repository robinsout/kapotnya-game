import { CONTROLS_BELOW_HEIGHT, CONTROLS_SIDE_WIDTH, computeLayout } from '../../src/ui/layout';

const W = 320;
const H = 180;

describe('computeLayout', () => {
  it('uses integer scaling and no touch controls on desktop', () => {
    expect(computeLayout({ width: 1920, height: 1080 }, false, W, H)).toEqual({ scale: 6, controls: 'none' });
  });

  it('puts controls under the canvas on a portrait phone', () => {
    const layout = computeLayout({ width: 390, height: 844 }, true, W, H);
    expect(layout.controls).toBe('below');
    expect(layout.scale).toBeCloseTo(390 / W);
    expect(layout.scale * H + CONTROLS_BELOW_HEIGHT).toBeLessThanOrEqual(844);
  });

  it('shrinks the canvas if a short portrait screen needs room for buttons', () => {
    const portrait = computeLayout({ width: 400, height: 401 }, true, W, H);
    expect(portrait.controls).toBe('below');
    expect(portrait.scale * H).toBeLessThanOrEqual(401 - CONTROLS_BELOW_HEIGHT);
  });

  it('puts controls in the side columns on a wide landscape phone', () => {
    const layout = computeLayout({ width: 844, height: 390 }, true, W, H);
    expect(layout.controls).toBe('sides');
    expect(layout.scale * W + CONTROLS_SIDE_WIDTH * 2).toBeLessThanOrEqual(844);
    expect(layout.scale).toBeGreaterThan((390 / H) * 0.8);
  });

  it('overlays controls when side columns would shrink the game too much', () => {
    const layout = computeLayout({ width: 700, height: 420 }, true, W, H);
    expect(layout.controls).toBe('overlay');
    expect(layout.scale).toBeCloseTo(700 / W);
  });
});
