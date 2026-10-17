/** 3×5 bitmap glyphs for tiny in-world numbers ("+50"). '#' is a lit pixel. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '###', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '..#', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  '+': ['...', '.#.', '###', '.#.', '...'],
};

export const GLYPH_WIDTH = 3;
export const GLYPH_HEIGHT = 5;
const SPACING = 1;

export const textWidth = (text: string): number =>
  text.length === 0 ? 0 : text.length * (GLYPH_WIDTH + SPACING) - SPACING;

/** Lit pixel offsets for `text`, top-left at (0, 0). Unknown characters render as blanks. */
export const textPixels = (text: string): Array<[number, number]> => {
  const pixels: Array<[number, number]> = [];
  [...text].forEach((char, i) => {
    const glyph = GLYPHS[char];
    if (!glyph) return;
    const offsetX = i * (GLYPH_WIDTH + SPACING);
    glyph.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === '#') pixels.push([offsetX + x, y]);
      });
    });
  });
  return pixels;
};
