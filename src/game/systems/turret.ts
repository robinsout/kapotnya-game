import { ROCKET, TURRET } from '../../config';
import type { Vec2 } from '../../core/math';
import { angleTo, clamp, fromAngle } from '../../core/math';
import type { Rng } from '../../core/random';
import { range } from '../../core/random';
import type { GameState, InputState, Turret } from '../types';
import { addParticle } from './particles';

const BULLET_SPREAD = 0.025;

export const turretPivot = (turret: Turret): Vec2 => ({ x: turret.x, y: TURRET.y - 4 });

export const muzzlePosition = (turret: Turret): Vec2 => {
  const pivot = turretPivot(turret);
  const offset = fromAngle(turret.angle, TURRET.barrelLength);
  return { x: pivot.x + offset.x, y: pivot.y + offset.y };
};

/**
 * Converts the raw angle towards the cursor into a valid barrel angle:
 * the gun never points below the horizon.
 */
export const clampAimAngle = (rawAngle: number): number => {
  const min = -Math.PI + TURRET.minElevation;
  const max = -TURRET.minElevation;
  if (rawAngle > 0) return rawAngle > Math.PI / 2 ? min : max;
  return clamp(rawAngle, min, max);
};

export const updateTurret = (state: GameState, input: InputState, dt: number, rng: Rng): void => {
  const turret = state.turret;
  turret.x = clamp(turret.x + input.moveX * TURRET.speed * dt, TURRET.minX, TURRET.maxX);
  turret.angle = clampAimAngle(angleTo(turretPivot(turret), input.aim));
  turret.fireCooldown = Math.max(0, turret.fireCooldown - dt);
  turret.rocketCooldown = Math.max(0, turret.rocketCooldown - dt);

  if (input.fire && turret.fireCooldown === 0) fireBullet(state, rng);
  if (input.rocket && turret.rocketCooldown === 0 && turret.rockets > 0) fireRocket(state);
};

const fireBullet = (state: GameState, rng: Rng): void => {
  const turret = state.turret;
  if (turret.ammo <= 0) {
    turret.fireCooldown = 0.35;
    state.events.push('empty');
    return;
  }
  const muzzle = muzzlePosition(turret);
  const angle = turret.angle + range(rng, -BULLET_SPREAD, BULLET_SPREAD);
  state.bullets.push({ pos: muzzle, vel: fromAngle(angle, TURRET.bulletSpeed) });
  turret.ammo -= 1;
  turret.fireCooldown = TURRET.fireCooldown;
  addParticle(state, { kind: 'flash', pos: muzzle, life: 0.05, size: 2 });
  state.events.push('shot');
};

const fireRocket = (state: GameState): void => {
  const turret = state.turret;
  const muzzle = muzzlePosition(turret);
  state.rockets.push({
    pos: muzzle,
    vel: fromAngle(turret.angle, ROCKET.startSpeed),
    angle: turret.angle,
    age: 0,
  });
  turret.rockets -= 1;
  turret.rocketCooldown = TURRET.rocketCooldown;
  state.events.push('rocketLaunch');
};
