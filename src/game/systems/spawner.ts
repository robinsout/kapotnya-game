import type { DroneKind } from '../../config';
import { SPAWNER } from '../../config';
import { clamp, lerp } from '../../core/math';
import type { Rng } from '../../core/random';
import { chance, range } from '../../core/random';
import type { GameState } from '../types';
import { spawnDrone } from './drones';

/** 0 at the start of a run, 1 once difficulty is maxed out. */
export const difficulty = (time: number): number => clamp(time / SPAWNER.rampTime, 0, 1);

export const spawnInterval = (time: number): number =>
  lerp(SPAWNER.initialInterval, SPAWNER.minInterval, difficulty(time));

export const wingChance = (time: number): number =>
  lerp(SPAWNER.wingChanceStart, SPAWNER.wingChanceMax, difficulty(time));

export const rollDroneKind = (rng: Rng, time: number): DroneKind =>
  chance(rng, wingChance(time)) ? 'wing' : 'quad';

export const updateSpawner = (state: GameState, dt: number, rng: Rng): void => {
  state.spawner.timer -= dt;
  if (state.spawner.timer > 0) return;
  // ±30% jitter keeps waves from feeling metronomic.
  state.spawner.timer += spawnInterval(state.time) * range(rng, 0.7, 1.3);
  spawnDrone(state, rng, {
    kind: rollDroneKind(rng, state.time),
    altitude: range(rng, SPAWNER.minAltitude, SPAWNER.maxAltitude),
    fromLeft: chance(rng, 0.5),
  });
};
