import { clientToWorld } from '../../src/input/coords';
import { actionsFor } from '../../src/input/keymap';

describe('clientToWorld', () => {
  it('maps CSS pixels on a scaled canvas into world space', () => {
    const rect = { left: 100, top: 50, width: 960, height: 540 };
    expect(clientToWorld(100, 50, rect, 320, 180)).toEqual({ x: 0, y: 0 });
    expect(clientToWorld(580, 320, rect, 320, 180)).toEqual({ x: 160, y: 90 });
  });
});

describe('keymap', () => {
  it('binds movement and actions by physical key code', () => {
    expect(actionsFor('KeyA')).toEqual(['left']);
    expect(actionsFor('ArrowRight')).toEqual(['right']);
    expect(actionsFor('Space')).toEqual(['rocket', 'start']);
    expect(actionsFor('KeyQ')).toEqual([]);
  });
});
