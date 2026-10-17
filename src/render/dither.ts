const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/** Ordered-dither threshold in [0, 1) for pixel (x, y). */
export const bayerThreshold = (x: number, y: number): number =>
  (BAYER_4X4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/**
 * Picks a colour from a vertical gradient with ordered dithering, which gives
 * smooth-looking transitions while staying within the palette.
 */
export const ditheredGradient = (colors: readonly string[], t: number, x: number, y: number): string => {
  if (colors.length === 0) throw new Error('ditheredGradient: no colours');
  const scaled = Math.min(Math.max(t, 0), 1) * (colors.length - 1);
  const index = Math.floor(scaled);
  if (index >= colors.length - 1) return colors[colors.length - 1];
  return scaled - index > bayerThreshold(x, y) ? colors[index + 1] : colors[index];
};
