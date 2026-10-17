import { DRONES, ROCKET, WORLD } from '../../config';
import { distance, rotateTowards, angleTo, fromAngle } from '../../core/math';
import { circlesOverlap, segmentHitsCircle } from '../../core/geometry';
import type { Rng } from '../../core/random';
import { range } from '../../core/random';
import type { Drone, GameState, Rocket } from '../types';
import { damageDrone, isAlive } from './drones';
import { addParticle, spawnExplosion } from './particles';

const OFFSCREEN_MARGIN = 20;

const isOffscreen = (x: number, y: number): boolean =>
  x < -OFFSCREEN_MARGIN || x > WORLD.width + OFFSCREEN_MARGIN || y < -OFFSCREEN_MARGIN || y > WORLD.groundY;

export const updateBullets = (state: GameState, dt: number, rng: Rng): void => {
  state.bullets = state.bullets.filter((bullet) => {
    const from = { ...bullet.pos };
    bullet.pos.x += bullet.vel.x * dt;
    bullet.pos.y += bullet.vel.y * dt;
    const hit = state.drones.find(
      (drone) => isAlive(drone) && segmentHitsCircle(from, bullet.pos, drone.pos, DRONES[drone.kind].radius),
    );
    if (hit) {
      damageDrone(state, rng, hit, 1);
      return false;
    }
    return !isOffscreen(bullet.pos.x, bullet.pos.y);
  });
};

export const findNearestDrone = (state: GameState, rocket: Rocket): Drone | undefined => {
  let best: Drone | undefined;
  let bestDistance = Infinity;
  for (const drone of state.drones) {
    if (!isAlive(drone)) continue;
    const d = distance(drone.pos, rocket.pos);
    if (d < bestDistance) {
      best = drone;
      bestDistance = d;
    }
  }
  return best;
};

/** Area damage: every live drone inside the blast radius is destroyed. */
export const detonateRocket = (state: GameState, rng: Rng, rocket: Rocket): void => {
  for (const drone of state.drones) {
    if (isAlive(drone) && distance(drone.pos, rocket.pos) <= ROCKET.blastRadius) {
      damageDrone(state, rng, drone, Infinity);
    }
  }
  spawnExplosion(state, rng, rocket.pos, 1.6);
  state.shake = Math.max(state.shake, 4);
  state.events.push('explosion');
};

export const updateRockets = (state: GameState, dt: number, rng: Rng): void => {
  state.rockets = state.rockets.filter((rocket) => {
    rocket.age += dt;
    const target = findNearestDrone(state, rocket);
    if (target) {
      rocket.angle = rotateTowards(rocket.angle, angleTo(rocket.pos, target.pos), ROCKET.turnRate * dt);
    }
    const speed = Math.min(ROCKET.maxSpeed, Math.hypot(rocket.vel.x, rocket.vel.y) + ROCKET.acceleration * dt);
    rocket.vel = fromAngle(rocket.angle, speed);
    rocket.pos.x += rocket.vel.x * dt;
    rocket.pos.y += rocket.vel.y * dt;

    addParticle(state, {
      kind: 'smoke',
      pos: rocket.pos,
      vel: { x: range(rng, -3, 3), y: range(rng, -3, 3) },
      life: range(rng, 0.4, 0.8),
    });

    const touching =
      target !== undefined && circlesOverlap(rocket.pos, ROCKET.hitRadius, target.pos, DRONES[target.kind].radius);
    if (touching || rocket.age >= ROCKET.lifetime || rocket.pos.y >= WORLD.groundY) {
      detonateRocket(state, rng, rocket);
      return false;
    }
    return !isOffscreen(rocket.pos.x, rocket.pos.y);
  });
};
