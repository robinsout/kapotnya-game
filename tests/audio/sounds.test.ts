import { SOUND_RECIPES } from '../../src/audio/sounds';

describe('sound recipes', () => {
  it('define audible, finite layers for every game event', () => {
    for (const [event, layers] of Object.entries(SOUND_RECIPES)) {
      expect(layers.length, event).toBeGreaterThan(0);
      for (const layer of layers) {
        expect(layer.duration, event).toBeGreaterThan(0);
        expect(layer.volume, event).toBeGreaterThan(0);
        expect(layer.volume, event).toBeLessThanOrEqual(1);
        if (layer.type === 'tone') {
          // exponentialRamp requires strictly positive frequencies.
          expect(layer.from, event).toBeGreaterThan(0);
          expect(layer.to, event).toBeGreaterThan(0);
        }
      }
    }
  });
});
