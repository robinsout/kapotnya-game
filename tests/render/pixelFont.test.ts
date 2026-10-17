import { GLYPH_HEIGHT, textPixels, textWidth } from '../../src/render/pixelFont';

describe('pixelFont', () => {
  it('measures text with 1px spacing', () => {
    expect(textWidth('')).toBe(0);
    expect(textWidth('1')).toBe(3);
    expect(textWidth('+50')).toBe(11);
  });

  it('lays glyphs out left to right within the glyph height', () => {
    const pixels = textPixels('+1');
    expect(pixels.every(([, y]) => y >= 0 && y < GLYPH_HEIGHT)).toBe(true);
    expect(Math.max(...pixels.map(([x]) => x))).toBe(textWidth('+1') - 1);
    // '+' centre pixel
    expect(pixels).toContainEqual([1, 2]);
  });

  it('skips unknown characters but keeps their slot', () => {
    expect(textPixels('?')).toEqual([]);
    expect(Math.min(...textPixels('?1').map(([x]) => x))).toBeGreaterThanOrEqual(4);
  });
});
