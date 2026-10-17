import { circlesOverlap, pointInRect, segmentHitsCircle } from '../../src/core/geometry';

describe('geometry', () => {
  it('tests points against half-open rects', () => {
    const rect = { x: 0, y: 0, w: 10, h: 5 };
    expect(pointInRect({ x: 0, y: 0 }, rect)).toBe(true);
    expect(pointInRect({ x: 9.9, y: 4.9 }, rect)).toBe(true);
    expect(pointInRect({ x: 10, y: 2 }, rect)).toBe(false);
  });

  it('detects overlapping circles', () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 2, { x: 3, y: 0 }, 1)).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0 }, 2, { x: 3.1, y: 0 }, 1)).toBe(false);
  });

  it('catches fast segments tunnelling through a circle', () => {
    expect(segmentHitsCircle({ x: -10, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 1 }, 2)).toBe(true);
    expect(segmentHitsCircle({ x: -10, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 3 }, 2)).toBe(false);
  });

  it('handles segments that end before the circle', () => {
    expect(segmentHitsCircle({ x: -10, y: 0 }, { x: -5, y: 0 }, { x: 0, y: 0 }, 2)).toBe(false);
  });

  it('handles zero-length segments', () => {
    expect(segmentHitsCircle({ x: 1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, 2)).toBe(true);
  });
});
