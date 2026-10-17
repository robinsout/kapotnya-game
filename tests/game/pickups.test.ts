import { PICKUPS, TURRET } from '../../src/config';
import {
  PICKUP_REST_Y,
  ammoDropChance,
  applyPickup,
  maybeDropPickup,
  rollLoot,
  updateFloaters,
  updatePickups,
} from '../../src/game/systems/pickups';
import { constantRng, playingState } from '../helpers';

describe('pickups', () => {
  const plentyOfAmmo = TURRET.maxAmmo;

  it('rolls rockets rarer than ammo', () => {
    expect(rollLoot(constantRng(PICKUPS.rocketChance - 0.001), plentyOfAmmo)).toBe('rocket');
    expect(rollLoot(constantRng(PICKUPS.rocketChance + 0.001), plentyOfAmmo)).toBe('ammo');
    expect(rollLoot(constantRng(PICKUPS.rocketChance + PICKUPS.ammoChance + 0.001), plentyOfAmmo)).toBeNull();
  });

  it('drops ammo more often when the player is running dry', () => {
    expect(ammoDropChance(0)).toBe(PICKUPS.lowAmmoChance);
    expect(ammoDropChance(plentyOfAmmo)).toBe(PICKUPS.ammoChance);
    const roll = constantRng(PICKUPS.rocketChance + PICKUPS.ammoChance + 0.01);
    expect(rollLoot(roll, plentyOfAmmo)).toBeNull();
    expect(rollLoot(roll, PICKUPS.lowAmmoThreshold - 1)).toBe('ammo');
  });

  it('drops a crate where the drone died', () => {
    const state = playingState();
    const pickup = maybeDropPickup(state, constantRng(0.1), { x: 40, y: 20 });
    expect(pickup).toMatchObject({ kind: 'ammo', pos: { x: 40, y: 20 }, landed: false });
    expect(state.pickups).toHaveLength(1);
  });

  it('parachutes down and lands on the ground', () => {
    const state = playingState();
    state.turret.x = 300;
    maybeDropPickup(state, constantRng(0.1), { x: 40, y: PICKUP_REST_Y - 1 });
    updatePickups(state, 1);
    expect(state.pickups[0].landed).toBe(true);
    expect(state.pickups[0].pos.y).toBe(PICKUP_REST_Y);
  });

  it('disappears after lying on the ground too long', () => {
    const state = playingState();
    state.turret.x = 300;
    const pickup = maybeDropPickup(state, constantRng(0.1), { x: 40, y: PICKUP_REST_Y })!;
    pickup.landed = true;
    updatePickups(state, PICKUPS.groundTtl + 0.1);
    expect(state.pickups).toHaveLength(0);
  });

  it('is collected when the turret drives over it', () => {
    const state = playingState();
    state.turret.x = 40;
    state.turret.ammo = 10;
    maybeDropPickup(state, constantRng(0.1), { x: 45, y: PICKUP_REST_Y });
    updatePickups(state, 0.016);
    expect(state.pickups).toHaveLength(0);
    expect(state.turret.ammo).toBe(10 + PICKUPS.ammoAmount);
    expect(state.events).toContain('pickup');
    expect(state.floaters).toMatchObject([{ kind: 'ammo', amount: PICKUPS.ammoAmount }]);
  });

  it('floaters rise and fade out', () => {
    const state = playingState();
    state.floaters.push({ kind: 'rocket', amount: 1, pos: { x: 10, y: 100 }, life: 0.5 });
    updateFloaters(state, 0.25);
    expect(state.floaters[0].pos.y).toBeLessThan(100);
    updateFloaters(state, 0.3);
    expect(state.floaters).toHaveLength(0);
  });

  it('is not collected while still high in the air', () => {
    const state = playingState();
    state.turret.x = 40;
    maybeDropPickup(state, constantRng(0.1), { x: 40, y: 30 });
    updatePickups(state, 0.016);
    expect(state.pickups).toHaveLength(1);
  });

  it('caps ammo and rockets', () => {
    const state = playingState();
    state.turret.ammo = TURRET.maxAmmo - 1;
    expect(applyPickup(state, 'ammo')).toBe(1);
    expect(state.turret.ammo).toBe(TURRET.maxAmmo);
    state.turret.rockets = TURRET.maxRockets;
    expect(applyPickup(state, 'rocket')).toBe(0);
    expect(state.turret.rockets).toBe(TURRET.maxRockets);
  });
});
