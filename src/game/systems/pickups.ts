import { HUD, PICKUPS, TURRET, WORLD } from '../../config';
import type { Vec2 } from '../../core/math';
import type { Rng } from '../../core/random';
import type { GameState, Pickup, PickupKind } from '../types';
import { allocateId } from '../state';
import { addParticle } from './particles';

export const ammoDropChance = (ammo: number): number =>
  ammo < PICKUPS.lowAmmoThreshold ? PICKUPS.lowAmmoChance : PICKUPS.ammoChance;

/** Rolls the loot table once; rockets are rarer than ammo. */
export const rollLoot = (rng: Rng, ammo: number): PickupKind | null => {
  const roll = rng.next();
  if (roll < PICKUPS.rocketChance) return 'rocket';
  if (roll < PICKUPS.rocketChance + ammoDropChance(ammo)) return 'ammo';
  return null;
};

export const maybeDropPickup = (state: GameState, rng: Rng, pos: Vec2): Pickup | null => {
  const kind = rollLoot(rng, state.turret.ammo);
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

/** Adds the crate's contents (capped) and returns how much was actually gained. */
export const applyPickup = (state: GameState, kind: PickupKind): number => {
  const turret = state.turret;
  let gained: number;
  if (kind === 'ammo') {
    gained = Math.min(TURRET.maxAmmo, turret.ammo + PICKUPS.ammoAmount) - turret.ammo;
    turret.ammo += gained;
  } else {
    gained = Math.min(TURRET.maxRockets, turret.rockets + 1) - turret.rockets;
    turret.rockets += gained;
  }
  state.events.push('pickup');
  return gained;
};

export const updateFloaters = (state: GameState, dt: number): void => {
  for (const floater of state.floaters) {
    floater.life -= dt;
    floater.pos.y -= (HUD.floaterRise / HUD.floaterLife) * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
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
      const amount = applyPickup(state, pickup.kind);
      state.floaters.push({ kind: pickup.kind, amount, pos: { x: pickup.pos.x, y: pickup.pos.y - 8 }, life: HUD.floaterLife });
      addParticle(state, { kind: 'flash', pos: pickup.pos, life: 0.1, size: 4 });
      return false;
    }
    return pickup.ttl > 0;
  });
};
