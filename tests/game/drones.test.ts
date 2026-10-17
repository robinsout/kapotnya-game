import { DRONES, REFINERY, WORLD } from '../../src/config';
import { damageDrone, isAlive, spawnDrone, updateDrones } from '../../src/game/systems/drones';
import { constantRng, playingState } from '../helpers';

// 0.99 never rolls loot, so tests stay focused on drone behaviour.
const rng = constantRng(0.99);

describe('drones', () => {
  it('spawns off-screen and cruises towards the refinery', () => {
    const state = playingState();
    const left = spawnDrone(state, rng, { kind: 'quad', altitude: 30, fromLeft: true });
    const right = spawnDrone(state, rng, { kind: 'wing', altitude: 40, fromLeft: false });
    expect(left.pos.x).toBeLessThan(0);
    expect(left.vel.x).toBe(DRONES.quad.cruiseSpeed);
    expect(right.pos.x).toBeGreaterThan(WORLD.width);
    expect(right.vel.x).toBe(-DRONES.wing.cruiseSpeed);
    expect(left.id).not.toBe(right.id);
  });

  it('switches to a dive when the target is below at a steep angle', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: 30, fromLeft: true, target: { x: 100, y: 130 } });
    drone.pos.x = 0;
    updateDrones(state, 0.016, rng);
    expect(drone.mode).toBe('cruise');

    drone.pos.x = 50;
    updateDrones(state, 0.016, rng);
    expect(drone.mode).toBe('dive');
  });

  it('damages the refinery on impact and leaves a fire', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'wing', altitude: 100, fromLeft: true, target: { x: 50, y: 120 } });
    drone.mode = 'dive';
    drone.pos = { x: 50, y: 119.5 };
    updateDrones(state, 0.016, rng);
    expect(state.drones).toHaveLength(0);
    expect(state.refineryHp).toBe(REFINERY.maxHp - DRONES.wing.damage);
    expect(state.fires).toHaveLength(1);
    expect(state.events).toContain('impact');
  });

  it('survives non-lethal hits', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'wing', altitude: 30, fromLeft: true });
    expect(damageDrone(state, rng, drone, 1)).toBe(false);
    expect(drone.hp).toBe(DRONES.wing.hp - 1);
    expect(isAlive(drone)).toBe(true);
    expect(state.events).toContain('droneHit');
  });

  it('falls and awards score when shot down', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: 30, fromLeft: true });
    expect(damageDrone(state, rng, drone, 1)).toBe(true);
    expect(drone.mode).toBe('falling');
    expect(state.score).toBe(DRONES.quad.score);
    expect(state.kills).toBe(1);
    expect(damageDrone(state, rng, drone, 1)).toBe(false);
    expect(state.score).toBe(DRONES.quad.score);
  });

  it('crashes into the ground without hurting the refinery', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: WORLD.groundY - 3, fromLeft: true });
    damageDrone(state, rng, drone, 1);
    for (let i = 0; i < 60 && state.drones.length > 0; i++) updateDrones(state, 0.05, rng);
    expect(state.drones).toHaveLength(0);
    expect(state.refineryHp).toBe(REFINERY.maxHp);
    expect(state.events).toContain('explosion');
  });

  it('drops loot when the roll succeeds', () => {
    const state = playingState();
    const drone = spawnDrone(state, constantRng(0.99), { kind: 'quad', altitude: 30, fromLeft: true });
    damageDrone(state, constantRng(0.01), drone, 1);
    expect(state.pickups).toHaveLength(1);
    expect(state.pickups[0].kind).toBe('rocket');
  });
});
