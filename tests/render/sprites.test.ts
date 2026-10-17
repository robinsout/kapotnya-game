import { LID_HEIGHT, LID_WIDTH } from '../../src/game/refinery';
import { LID_SPRITE } from '../../src/render/refineryArt';
import { QUAD_FRAMES, WING_FRAMES } from '../../src/render/sprites';

describe('sprite data', () => {
  it('keeps animation frames the same size', () => {
    expect(QUAD_FRAMES[0].width).toBe(QUAD_FRAMES[1].width);
    expect(WING_FRAMES.left[0].width).toBe(WING_FRAMES.right[0].width);
  });

  it('builds the lid sprite matching the game-side lid size', () => {
    expect(LID_SPRITE.width).toBe(LID_WIDTH);
    expect(LID_SPRITE.height).toBe(LID_HEIGHT);
    // Bottom rows span the full width (rim), the top row is inset (dome).
    expect(LID_SPRITE.pixels[(LID_HEIGHT - 1) * LID_WIDTH]).not.toBeNull();
    expect(LID_SPRITE.pixels[0]).toBeNull();
  });
});
