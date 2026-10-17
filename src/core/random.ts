/** Source of randomness; injected everywhere so game logic stays deterministic in tests. */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
}

export const mathRandom: Rng = { next: () => Math.random() };

/** Mulberry32 — tiny seeded PRNG. */
export const seededRng = (seed: number): Rng => {
  let t = seed >>> 0;
  return {
    next() {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    },
  };
};

export const range = (rng: Rng, min: number, max: number): number => min + rng.next() * (max - min);

export const intRange = (rng: Rng, min: number, maxInclusive: number): number =>
  Math.floor(range(rng, min, maxInclusive + 1));

export const chance = (rng: Rng, probability: number): boolean => rng.next() < probability;

export const pick = <T>(rng: Rng, items: readonly T[]): T => {
  if (items.length === 0) throw new Error('pick: empty list');
  return items[Math.floor(rng.next() * items.length)];
};
