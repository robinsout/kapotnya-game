import { bayerThreshold, ditheredGradient } from '../../src/render/dither';

describe('dither', () => {
  it('produces thresholds in (0, 1)', () => {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const t = bayerThreshold(x, y);
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(1);
      }
    }
  });

  it('returns the end colours at the gradient extremes', () => {
    const colors = ['a', 'b', 'c'];
    expect(ditheredGradient(colors, 0, 0, 0)).toBe('a');
    expect(ditheredGradient(colors, 1, 0, 0)).toBe('c');
    expect(ditheredGradient(colors, 5, 0, 0)).toBe('c');
  });

  it('mixes neighbouring colours in proportion inside a band', () => {
    const colors = ['a', 'b'];
    let bCount = 0;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (ditheredGradient(colors, 0.25, x, y) === 'b') bCount++;
    expect(bCount).toBe(4);
  });

  it('rejects an empty palette', () => {
    expect(() => ditheredGradient([], 0.5, 0, 0)).toThrow();
  });
});
