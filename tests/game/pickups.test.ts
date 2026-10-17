import { PICKUPS, TURRET } from '../../src/config';
import { PICKUP_REST_Y, applyPickup, maybeDropPickup, rollLoot, updatePickups } from '../../src/game/systems/pickups';
import { constantRng, playingState } from '../helpers';

describe('pickups', () => {
  it('rolls rockets rarer than ammo', () => {
    expect(rollLoot(constantRng(PICKUPS.rocketChance - 0.001))).toBe('rocket');
    expect(rollLoot(constantRng(PICKUPS.rocketChance + 0.001))).toBe('ammo');
    expect(rollLoot(constantRng(PICKUPS.rocketChance + PICKUPS.ammoChance + 0.001))).toBeNull();
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
    applyPickup(state, 'ammo');
    expect(state.turret.ammo).toBe(TURRET.maxAmmo);
    state.turret.rockets = TURRET.maxRockets;
    applyPickup(state, 'rocket');
    expect(state.turret.rockets).toBe(TURRET.maxRockets);
  });
});
