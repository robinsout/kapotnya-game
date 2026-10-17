import { ROCKET, TURRET } from '../../src/config';
import { clampAimAngle, muzzlePosition, turretPivot, updateTurret } from '../../src/game/systems/turret';
import { constantRng, input, playingState } from '../helpers';

const rng = constantRng(0.5);

describe('turret', () => {
  describe('clampAimAngle', () => {
    it('keeps upward angles as they are', () => {
      expect(clampAimAngle(-Math.PI / 2)).toBe(-Math.PI / 2);
    });

    it('never aims below the horizon', () => {
      expect(clampAimAngle(-0.01)).toBe(-TURRET.minElevation);
      expect(clampAimAngle(0.3)).toBe(-TURRET.minElevation);
      expect(clampAimAngle(Math.PI - 0.3)).toBe(-Math.PI + TURRET.minElevation);
    });
  });

  it('moves horizontally within the rail limits', () => {
    const state = playingState();
    state.turret.x = TURRET.maxX - 1;
    updateTurret(state, input({ moveX: 1 }), 1, rng);
    expect(state.turret.x).toBe(TURRET.maxX);

    updateTurret(state, input({ moveX: -1 }), 0.5, rng);
    expect(state.turret.x).toBeCloseTo(TURRET.maxX - TURRET.speed * 0.5);
  });

  it('aims the barrel at the cursor', () => {
    const state = playingState();
    const pivot = turretPivot(state.turret);
    updateTurret(state, input({ aim: { x: pivot.x + 10, y: pivot.y - 10 } }), 0.016, rng);
    expect(state.turret.angle).toBeCloseTo(-Math.PI / 4);
  });

  it('fires a bullet from the muzzle and spends ammo', () => {
    const state = playingState();
    updateTurret(state, input({ fire: true, aim: { x: state.turret.x, y: 0 } }), 0.016, rng);
    expect(state.bullets).toHaveLength(1);
    expect(state.bullets[0].pos).toEqual(muzzlePosition(state.turret));
    expect(state.bullets[0].vel.y).toBeLessThan(0);
    expect(state.turret.ammo).toBe(TURRET.startAmmo - 1);
    expect(state.events).toContain('shot');
  });

  it('respects the fire rate', () => {
    const state = playingState();
    const firing = input({ fire: true });
    updateTurret(state, firing, 0.016, rng);
    updateTurret(state, firing, 0.016, rng);
    expect(state.bullets).toHaveLength(1);
    updateTurret(state, firing, TURRET.fireCooldown, rng);
    expect(state.bullets).toHaveLength(2);
  });

  it('clicks empty when out of ammo', () => {
    const state = playingState();
    state.turret.ammo = 0;
    updateTurret(state, input({ fire: true }), 0.016, rng);
    expect(state.bullets).toHaveLength(0);
    expect(state.events).toEqual(['empty']);
  });

  it('launches a rocket and spends it', () => {
    const state = playingState();
    updateTurret(state, input({ rocket: true }), 0.016, rng);
    expect(state.rockets).toHaveLength(1);
    expect(Math.hypot(state.rockets[0].vel.x, state.rockets[0].vel.y)).toBeCloseTo(ROCKET.startSpeed);
    expect(state.turret.rockets).toBe(TURRET.startRockets - 1);
    expect(state.events).toContain('rocketLaunch');
  });

  it('cannot launch rockets without stock or during cooldown', () => {
    const state = playingState();
    updateTurret(state, input({ rocket: true }), 0.016, rng);
    updateTurret(state, input({ rocket: true }), 0.016, rng);
    expect(state.rockets).toHaveLength(1);

    state.turret.rockets = 0;
    state.turret.rocketCooldown = 0;
    updateTurret(state, input({ rocket: true }), 0.016, rng);
    expect(state.rockets).toHaveLength(1);
  });
});
