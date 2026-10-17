import { chance, intRange, pick, range, seededRng } from '../../src/core/random';
import { sequenceRng } from '../helpers';

describe('random', () => {
  it('seeded rng is deterministic and in [0, 1)', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    for (let i = 0; i < 100; i++) {
      const value = a.next();
      expect(value).toBe(b.next());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('maps rng output onto ranges', () => {
    expect(range(sequenceRng([0.5]), 10, 20)).toBe(15);
    expect(intRange(sequenceRng([0.999]), 1, 3)).toBe(3);
    expect(intRange(sequenceRng([0]), 1, 3)).toBe(1);
  });

  it('rolls chances', () => {
    expect(chance(sequenceRng([0.2]), 0.3)).toBe(true);
    expect(chance(sequenceRng([0.4]), 0.3)).toBe(false);
  });

  it('picks list items and rejects empty lists', () => {
    expect(pick(sequenceRng([0.6]), ['a', 'b'])).toBe('b');
    expect(() => pick(sequenceRng([0]), [])).toThrow();
  });
});
