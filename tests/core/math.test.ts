import { angleTo, clamp, distance, fromAngle, lerp, rotateTowards, wrapAngle } from '../../src/core/math';

describe('math', () => {
  it('clamps values into range', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('interpolates linearly', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  it('measures distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('builds vectors from angles', () => {
    const v = fromAngle(-Math.PI / 2, 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(-2);
  });

  it('computes angle between points in screen space', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(-Math.PI / 2);
  });

  it('wraps angles into (-PI, PI]', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(Math.PI / 2 + 4 * Math.PI)).toBeCloseTo(Math.PI / 2);
  });

  describe('rotateTowards', () => {
    it('snaps when within the step', () => {
      expect(rotateTowards(0, 0.05, 0.1)).toBe(0.05);
    });

    it('limits the rotation to the step', () => {
      expect(rotateTowards(0, 1, 0.1)).toBeCloseTo(0.1);
      expect(rotateTowards(0, -1, 0.1)).toBeCloseTo(-0.1);
    });

    it('takes the shortest arc across the ±PI seam', () => {
      expect(rotateTowards(Math.PI - 0.05, -Math.PI + 0.05, 0.02)).toBeCloseTo(Math.PI - 0.03);
    });
  });
});
