import { computeScale } from '../../src/ui/scale';

describe('computeScale', () => {
  it('uses the largest integer scale that fits', () => {
    expect(computeScale(1920, 1080, 320, 180)).toBe(6);
    expect(computeScale(1000, 1000, 320, 180)).toBe(3);
  });

  it('falls back to a fractional scale on tiny screens', () => {
    expect(computeScale(160, 400, 320, 180)).toBe(0.5);
  });
});
