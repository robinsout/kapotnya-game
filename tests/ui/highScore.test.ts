import { HighScore } from '../../src/ui/highScore';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
};

describe('HighScore', () => {
  it('reads the stored record', () => {
    expect(new HighScore(memoryStorage({ 'kapotnya.best': '420' })).value).toBe(420);
  });

  it('treats garbage as no record', () => {
    expect(new HighScore(memoryStorage({ 'kapotnya.best': 'abc' })).value).toBe(0);
  });

  it('stores only improvements', () => {
    const storage = memoryStorage();
    const best = new HighScore(storage);
    expect(best.submit(100)).toBe(true);
    expect(best.submit(50)).toBe(false);
    expect(best.value).toBe(100);
    expect(storage.data['kapotnya.best']).toBe('100');
  });

  it('works without storage or with throwing storage', () => {
    expect(new HighScore(null).submit(10)).toBe(true);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const best = new HighScore(broken);
    expect(best.value).toBe(0);
    expect(best.submit(5)).toBe(true);
    expect(best.value).toBe(5);
  });
});
