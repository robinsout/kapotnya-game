import { WORLD } from '../../src/config';
import { pointInRect } from '../../src/core/geometry';
import { BIG_TANK, STRUCTURES, pickTargetPoint } from '../../src/game/refinery';
import { seededRng } from '../../src/core/random';

describe('refinery layout', () => {
  it('has exactly one big tank', () => {
    expect(STRUCTURES.filter((s) => s.kind === 'bigTank')).toEqual([BIG_TANK]);
  });

  it('keeps every structure on screen and standing on the ground', () => {
    for (const { rect } of STRUCTURES) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(WORLD.width);
      expect(rect.y + rect.h).toBe(WORLD.groundY);
    }
  });

  it('picks drone targets on targetable structures only', () => {
    const rng = seededRng(3);
    const targetable = STRUCTURES.filter((s) => s.kind !== 'flare');
    for (let i = 0; i < 200; i++) {
      const point = pickTargetPoint(rng);
      expect(targetable.some((s) => pointInRect(point, s.rect))).toBe(true);
    }
  });
});
