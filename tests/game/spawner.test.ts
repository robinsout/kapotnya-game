import { SPAWNER } from '../../src/config';
import { difficulty, rollDroneKind, spawnInterval, updateSpawner, wingChance } from '../../src/game/systems/spawner';
import { constantRng, playingState } from '../helpers';

describe('spawner', () => {
  it('ramps difficulty from 0 to 1 over the ramp time', () => {
    expect(difficulty(0)).toBe(0);
    expect(difficulty(SPAWNER.rampTime / 2)).toBe(0.5);
    expect(difficulty(SPAWNER.rampTime * 3)).toBe(1);
  });

  it('spawns faster and nastier drones over time', () => {
    expect(spawnInterval(0)).toBe(SPAWNER.initialInterval);
    expect(spawnInterval(SPAWNER.rampTime)).toBe(SPAWNER.minInterval);
    expect(wingChance(SPAWNER.rampTime)).toBeGreaterThan(wingChance(0));
  });

  it('rolls the drone kind from the current wing chance', () => {
    expect(rollDroneKind(constantRng(0.05), 0)).toBe('wing');
    expect(rollDroneKind(constantRng(0.5), 0)).toBe('quad');
  });

  it('spawns a drone when the timer runs out and re-arms', () => {
    const state = playingState();
    state.spawner.timer = 0.01;
    updateSpawner(state, 0.02, constantRng(0.5));
    expect(state.drones).toHaveLength(1);
    expect(state.spawner.timer).toBeGreaterThan(0);

    updateSpawner(state, 0.02, constantRng(0.5));
    expect(state.drones).toHaveLength(1);
  });
});
