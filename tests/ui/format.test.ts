import { formatTime, padScore, plural } from '../../src/ui/format';

describe('format', () => {
  it('formats elapsed time as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.9)).toBe('1:05');
    expect(formatTime(-3)).toBe('0:00');
  });

  it('pads scores to six digits', () => {
    expect(padScore(25)).toBe('000025');
    expect(padScore(1234567)).toBe('1234567');
  });

  it('picks Russian plural forms', () => {
    const drones = (n: number) => plural(n, 'дрон', 'дрона', 'дронов');
    expect(drones(1)).toBe('дрон');
    expect(drones(3)).toBe('дрона');
    expect(drones(5)).toBe('дронов');
    expect(drones(11)).toBe('дронов');
    expect(drones(21)).toBe('дрон');
    expect(drones(112)).toBe('дронов');
    expect(drones(0)).toBe('дронов');
  });
});
