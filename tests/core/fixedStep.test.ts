import { FixedStep } from '../../src/core/fixedStep';

describe('FixedStep', () => {
  it('converts frame time into whole steps and carries the remainder', () => {
    const clock = new FixedStep(0.1);
    expect(clock.advance(0.25)).toBe(2);
    expect(clock.advance(0.06)).toBe(1);
    expect(clock.advance(0.01)).toBe(0);
  });

  it('caps the backlog after a long pause', () => {
    const clock = new FixedStep(0.1, 3);
    expect(clock.advance(5)).toBe(3);
    expect(clock.advance(0.1)).toBe(1);
  });

  it('ignores negative frame times', () => {
    expect(new FixedStep(0.1).advance(-1)).toBe(0);
  });
});
