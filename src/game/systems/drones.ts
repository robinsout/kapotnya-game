import type { DroneKind } from '../../config';
import { DRONES, WORLD } from '../../config';
import type { Vec2 } from '../../core/math';
import { distance } from '../../core/math';
import type { Rng } from '../../core/random';
import { chance, range } from '../../core/random';
import { pickTargetPoint } from '../refinery';
import { allocateId } from '../state';
import type { Drone, GameState } from '../types';
import { damageRefinery } from './refineryDamage';
import { addParticle, spawnDebris, spawnExplosion, spawnSparks } from './particles';
import { maybeDropPickup } from './pickups';

const SPAWN_MARGIN = 12;
/** Drones start diving when the target is roughly this steep below them (dx / dy). */
const DIVE_SLOPE = 0.9;

export interface SpawnOptions {
  kind: DroneKind;
  altitude: number;
  fromLeft: boolean;
  target?: Vec2;
}

export const spawnDrone = (state: GameState, rng: Rng, options: SpawnOptions): Drone => {
  const spec = DRONES[options.kind];
  const direction = options.fromLeft ? 1 : -1;
  const drone: Drone = {
    id: allocateId(state),
    kind: options.kind,
    mode: 'cruise',
    pos: { x: options.fromLeft ? -SPAWN_MARGIN : WORLD.width + SPAWN_MARGIN, y: options.altitude },
    vel: { x: direction * spec.cruiseSpeed, y: 0 },
    hp: spec.hp,
    target: options.target ?? pickTargetPoint(rng),
    angle: 0,
    spin: 0,
    age: 0,
  };
  state.drones.push(drone);
  return drone;
};

export const isAlive = (drone: Drone): boolean => drone.mode !== 'falling';

/** Applies damage; returns true when the drone was shot down by this hit. */
export const damageDrone = (state: GameState, rng: Rng, drone: Drone, amount: number): boolean => {
  if (!isAlive(drone)) return false;
  drone.hp -= amount;
  if (drone.hp > 0) {
    spawnSparks(state, rng, drone.pos, 3);
    state.events.push('droneHit');
    return false;
  }
  const spec = DRONES[drone.kind];
  drone.mode = 'falling';
  drone.spin = range(rng, 4, 9) * (chance(rng, 0.5) ? 1 : -1);
  drone.vel = { x: drone.vel.x * 0.5, y: Math.min(drone.vel.y, 0) - 20 };
  state.score += spec.score;
  state.kills += 1;
  spawnExplosion(state, rng, drone.pos, 0.6);
  maybeDropPickup(state, rng, drone.pos);
  state.events.push('droneDown');
  return true;
};

const shouldDive = (drone: Drone): boolean => {
  const dx = drone.target.x - drone.pos.x;
  const dy = drone.target.y - drone.pos.y;
  const approaching = Math.sign(dx) === Math.sign(drone.vel.x) || dx === 0;
  return !approaching || Math.abs(dx) <= dy * DIVE_SLOPE;
};

const impact = (state: GameState, rng: Rng, drone: Drone): void => {
  spawnExplosion(state, rng, drone.target, 1.2);
  spawnDebris(state, rng, drone.target, 6);
  state.shake = Math.max(state.shake, 3);
  state.events.push('impact');
  damageRefinery(state, rng, DRONES[drone.kind].damage, drone.target);
};

/** Returns false when the drone should be removed from the world. */
const updateDrone = (state: GameState, rng: Rng, drone: Drone, dt: number): boolean => {
  const spec = DRONES[drone.kind];
  drone.age += dt;

  switch (drone.mode) {
    case 'cruise':
      if (shouldDive(drone)) drone.mode = 'dive';
      break;
    case 'dive': {
      const remaining = distance(drone.pos, drone.target);
      const stepLength = spec.diveSpeed * dt;
      if (remaining <= stepLength + 0.5) {
        impact(state, rng, drone);
        return false;
      }
      drone.vel = {
        x: ((drone.target.x - drone.pos.x) / remaining) * spec.diveSpeed,
        y: ((drone.target.y - drone.pos.y) / remaining) * spec.diveSpeed,
      };
      break;
    }
    case 'falling':
      drone.vel.y += WORLD.gravity * dt;
      drone.angle += drone.spin * dt;
      if (chance(rng, dt * 25)) {
        addParticle(state, {
          kind: 'smoke',
          pos: drone.pos,
          vel: { x: range(rng, -4, 4), y: range(rng, -8, -2) },
          life: range(rng, 0.5, 1),
          size: 2,
        });
      }
      if (drone.pos.y >= WORLD.groundY - 2) {
        spawnExplosion(state, rng, { x: drone.pos.x, y: WORLD.groundY - 2 }, 0.7);
        state.events.push('explosion');
        return false;
      }
      break;
  }

  drone.pos.x += drone.vel.x * dt;
  drone.pos.y += drone.vel.y * dt;
  return true;
};

export const updateDrones = (state: GameState, dt: number, rng: Rng): void => {
  state.drones = state.drones.filter((drone) => updateDrone(state, rng, drone, dt));
};
