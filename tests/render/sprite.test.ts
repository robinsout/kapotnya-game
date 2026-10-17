import { flipX, linePoints, parseSprite, pixelAt, rotatePixels } from '../../src/render/sprite';

const palette = { a: '#aaa', b: '#bbb' };

describe('sprite', () => {
  it('parses ASCII art into pixels', () => {
    const s = parseSprite(['ab.', '..a'], palette);
    expect(s.width).toBe(3);
    expect(s.height).toBe(2);
    expect(pixelAt(s, 0, 0)).toBe('#aaa');
    expect(pixelAt(s, 1, 0)).toBe('#bbb');
    expect(pixelAt(s, 2, 0)).toBeNull();
    expect(pixelAt(s, 2, 1)).toBe('#aaa');
  });

  it('returns null outside the sprite', () => {
    const s = parseSprite(['a'], palette);
    expect(pixelAt(s, -1, 0)).toBeNull();
    expect(pixelAt(s, 0, 1)).toBeNull();
  });

  it('rejects ragged rows, unknown keys and empty sprites', () => {
    expect(() => parseSprite(['aa', 'a'], palette)).toThrow(/row 1/);
    expect(() => parseSprite(['az'], palette)).toThrow(/"z"/);
    expect(() => parseSprite([], palette)).toThrow();
  });

  it('mirrors horizontally', () => {
    const s = flipX(parseSprite(['ab.'], palette));
    expect(s.pixels).toEqual([null, '#bbb', '#aaa']);
  });

  it('keeps all pixels when rotating by zero', () => {
    const s = parseSprite(['aaa', 'aba', 'aaa'], palette);
    const pixels = rotatePixels(s, 0);
    expect(pixels).toHaveLength(9);
    expect(pixels).toContainEqual({ x: 0, y: 0, color: '#bbb' });
  });

  it('rotates a horizontal bar into a vertical one', () => {
    const s = parseSprite(['abbbb'], palette);
    const pixels = rotatePixels(s, Math.PI / 2);
    expect(new Set(pixels.map((p) => p.x))).toEqual(new Set([0]));
    // Positive angles turn clockwise on screen, so the left end ('a') ends up on top.
    expect(pixels.find((p) => p.color === '#aaa')!.y).toBeLessThan(0);
  });

  describe('linePoints', () => {
    it('includes both endpoints', () => {
      const points = linePoints(0, 0, 3, 0);
      expect(points).toEqual([
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ]);
    });

    it('draws continuous diagonal lines in any direction', () => {
      const points = linePoints(3, 3, 0, 0);
      expect(points).toHaveLength(4);
      expect(points[points.length - 1]).toEqual([0, 0]);
    });

    it('handles a single point', () => {
      expect(linePoints(1.2, 1.4, 1, 1)).toEqual([[1, 1]]);
    });
  });
});
