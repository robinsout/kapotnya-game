import { COLLAPSE } from '../config';
import type { Rng } from '../core/random';
import { createGameState } from './state';
import type { GameState, InputState } from './types';
import { updateCollapse } from './systems/collapse';
import { updateDrones } from './systems/drones';
import { emitFireParticles, updateParticles } from './systems/particles';
import { updateFloaters, updatePickups } from './systems/pickups';
import { updateBullets, updateRockets } from './systems/projectiles';
import { updateSpawner } from './systems/spawner';
import { updateTurret } from './systems/turret';

const SHAKE_DECAY = 18;
/** Prevents an accidental restart while the player is still mashing buttons. */
export const RESTART_LOCK = 0.8;

const updateWorld = (state: GameState, dt: number, rng: Rng): void => {
  updateDrones(state, dt, rng);
  updateBullets(state, dt, rng);
  updateRockets(state, dt, rng);
  updatePickups(state, dt);
};

/**
 * Advances the simulation by one fixed step. Returns the state to use next frame:
 * the same object, or a fresh one when a new run starts.
 */
export const step = (state: GameState, input: InputState, dt: number, rng: Rng): GameState => {
  state.events = [];

  switch (state.phase) {
    case 'title':
      if (input.start) return createGameState('playing');
      break;
    case 'playing':
      state.time += dt;
      updateTurret(state, input, dt, rng);
      updateSpawner(state, dt, rng);
      updateWorld(state, dt, rng);
      break;
    case 'collapse':
      updateWorld(state, dt, rng);
      updateCollapse(state, dt, rng);
      break;
    case 'over': {
      updateWorld(state, dt, rng);
      updateCollapse(state, dt, rng);
      const landedFor = state.collapse?.landedFor ?? 0;
      if (input.start && landedFor >= COLLAPSE.afterLandDelay + RESTART_LOCK) return createGameState('playing');
      break;
    }
  }

  emitFireParticles(state, rng, dt);
  updateParticles(state, dt);
  updateFloaters(state, dt);
  state.shake = Math.max(0, state.shake - SHAKE_DECAY * dt);
  return state;
};
