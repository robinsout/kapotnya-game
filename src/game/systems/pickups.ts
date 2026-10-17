import { PICKUPS, TURRET, WORLD } from '../../config';
import type { Vec2 } from '../../core/math';
import type { Rng } from '../../core/random';
import type { GameState, Pickup, PickupKind } from '../types';
import { allocateId } from '../state';
import { addParticle } from './particles';

/** Rolls the loot table once; rockets are rarer than ammo. */
export const rollLoot = (rng: Rng): PickupKind | null => {
  const roll = rng.next();
  if (roll < PICKUPS.rocketChance) return 'rocket';
  if (roll < PICKUPS.rocketChance + PICKUPS.ammoChance) return 'ammo';
  return null;
};

export const maybeDropPickup = (state: GameState, rng: Rng, pos: Vec2): Pickup | null => {
  const kind = rollLoot(rng);
  if (!kind) return null;
  const pickup: Pickup = {
    id: allocateId(state),
    kind,
    pos: { x: pos.x, y: pos.y },
    landed: false,
    ttl: PICKUPS.groundTtl,
  };
  state.pickups.push(pickup);
  return pickup;
};

/** Ground level for a resting pickup's centre. */
export const PICKUP_REST_Y = WORLD.groundY - 3;

export const canCollect = (state: GameState, pickup: Pickup): boolean =>
  Math.abs(pickup.pos.x - state.turret.x) <= TURRET.pickupRadius && pickup.pos.y >= TURRET.y - 16;

export const applyPickup = (state: GameState, kind: PickupKind): void => {
  const turret = state.turret;
  if (kind === 'ammo') {
    turret.ammo = Math.min(TURRET.maxAmmo, turret.ammo + PICKUPS.ammoAmount);
  } else {
    turret.rockets = Math.min(TURRET.maxRockets, turret.rockets + 1);
  }
  state.events.push('pickup');
};

export const updatePickups = (state: GameState, dt: number): void => {
  const collectEnabled = state.phase === 'playing';
  state.pickups = state.pickups.filter((pickup) => {
    if (!pickup.landed) {
      pickup.pos.y += PICKUPS.fallSpeed * dt;
      if (pickup.pos.y >= PICKUP_REST_Y) {
        pickup.pos.y = PICKUP_REST_Y;
        pickup.landed = true;
      }
    } else {
      pickup.ttl -= dt;
    }

    if (collectEnabled && canCollect(state, pickup)) {
      applyPickup(state, pickup.kind);
      addParticle(state, { kind: 'flash', pos: pickup.pos, life: 0.1, size: 4 });
      return false;
    }
    return pickup.ttl > 0;
  });
};
