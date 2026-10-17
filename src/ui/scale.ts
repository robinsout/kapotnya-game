/**
 * Picks the display scale for the virtual canvas: integer when there's room
 * (crisp pixels), fractional on tiny screens so the game still fits.
 */
export const computeScale = (viewportW: number, viewportH: number, worldW: number, worldH: number): number => {
  const fit = Math.min(viewportW / worldW, viewportH / worldH);
  if (fit >= 1) return Math.floor(fit);
  return Math.max(0.25, fit);
};
