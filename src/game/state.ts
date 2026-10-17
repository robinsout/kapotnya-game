import { REFINERY, SPAWNER, TURRET, WORLD } from '../config';
import type { GameState, Phase } from './types';

export const createGameState = (phase: Phase = 'title'): GameState => ({
  phase,
  time: 0,
  score: 0,
  kills: 0,
  refineryHp: REFINERY.maxHp,
  turret: {
    x: WORLD.width / 2,
    angle: -Math.PI / 2,
    ammo: TURRET.startAmmo,
    rockets: TURRET.startRockets,
    fireCooldown: 0,
    rocketCooldown: 0,
  },
  bullets: [],
  rockets: [],
  drones: [],
  pickups: [],
  particles: [],
  floaters: [],
  fires: [],
  collapse: null,
  spawner: { timer: SPAWNER.initialInterval / 2 },
  shake: 0,
  nextId: 1,
  events: [],
});

export const allocateId = (state: GameState): number => state.nextId++;
