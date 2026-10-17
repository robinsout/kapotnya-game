import type { Particle } from '../../src/game/types';
import { COLORS } from '../../src/render/palette';
import { particleColor } from '../../src/render/renderer';

const particle = (kind: Particle['kind'], life: number): Particle => ({
  kind,
  life,
  maxLife: 1,
  pos: { x: 0, y: 0 },
  vel: { x: 0, y: 0 },
  size: 1,
  gravity: 0,
});

describe('particleColor', () => {
  it('cools fire down from white-hot to red', () => {
    expect(particleColor(particle('fire', 0.9))).toBe(COLORS.fireCore);
    expect(particleColor(particle('fire', 0.1))).toBe(COLORS.red);
  });

  it('darkens smoke as it ages', () => {
    expect(particleColor(particle('smoke', 0.9))).toBe(COLORS.smokeLight);
    expect(particleColor(particle('smoke', 0.2))).toBe(COLORS.smoke);
  });
});
