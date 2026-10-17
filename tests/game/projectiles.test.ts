import { DRONES, ROCKET } from '../../src/config';
import { spawnDrone } from '../../src/game/systems/drones';
import { detonateRocket, findNearestDrone, updateBullets, updateRockets } from '../../src/game/systems/projectiles';
import type { Rocket } from '../../src/game/types';
import { constantRng, playingState } from '../helpers';

const rng = constantRng(0.99);

const rocketAt = (x: number, y: number, angle = -Math.PI / 2): Rocket => ({
  pos: { x, y },
  vel: { x: 0, y: -ROCKET.startSpeed },
  angle,
  age: 0,
});

describe('bullets', () => {
  it('hit drones along their path, even when moving fast', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'wing', altitude: 50, fromLeft: true });
    drone.pos = { x: 100, y: 50 };
    state.bullets.push({ pos: { x: 100, y: 60 }, vel: { x: 0, y: -1000 } });
    updateBullets(state, 0.016, rng);
    expect(state.bullets).toHaveLength(0);
    expect(drone.hp).toBe(DRONES.wing.hp - 1);
  });

  it('ignore drones that are already falling', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: 50, fromLeft: true });
    drone.pos = { x: 100, y: 50 };
    drone.mode = 'falling';
    state.bullets.push({ pos: { x: 100, y: 52 }, vel: { x: 0, y: -100 } });
    updateBullets(state, 0.016, rng);
    expect(state.bullets).toHaveLength(1);
  });

  it('are removed once off-screen', () => {
    const state = playingState();
    state.bullets.push({ pos: { x: 100, y: -19 }, vel: { x: 0, y: -300 } });
    updateBullets(state, 0.016, rng);
    expect(state.bullets).toHaveLength(0);
  });
});

describe('rockets', () => {
  it('home in on the nearest live drone', () => {
    const state = playingState();
    const far = spawnDrone(state, rng, { kind: 'quad', altitude: 10, fromLeft: true });
    far.pos = { x: 300, y: 10 };
    const near = spawnDrone(state, rng, { kind: 'quad', altitude: 10, fromLeft: true });
    near.pos = { x: 60, y: 80 };
    const rocket = rocketAt(50, 150);
    expect(findNearestDrone(state, rocket)).toBe(near);

    near.mode = 'falling';
    expect(findNearestDrone(state, rocket)).toBe(far);
  });

  it('turn towards their target over time', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: 10, fromLeft: true });
    drone.pos = { x: 200, y: 100 };
    state.rockets.push(rocketAt(100, 100));
    updateRockets(state, 0.05, rng);
    expect(state.rockets[0].angle).toBeGreaterThan(-Math.PI / 2);
  });

  it('destroy every drone in the blast radius', () => {
    const state = playingState();
    const inside = spawnDrone(state, rng, { kind: 'wing', altitude: 10, fromLeft: true });
    inside.pos = { x: 100 + ROCKET.blastRadius - 1, y: 50 };
    const outside = spawnDrone(state, rng, { kind: 'quad', altitude: 10, fromLeft: true });
    outside.pos = { x: 100 + ROCKET.blastRadius + 5, y: 50 };
    detonateRocket(state, rng, rocketAt(100, 50));
    expect(inside.mode).toBe('falling');
    expect(outside.mode).toBe('cruise');
    expect(state.events).toContain('explosion');
  });

  it('detonate on contact', () => {
    const state = playingState();
    const drone = spawnDrone(state, rng, { kind: 'quad', altitude: 10, fromLeft: true });
    drone.pos = { x: 100, y: 48 };
    state.rockets.push(rocketAt(100, 50));
    updateRockets(state, 0.016, rng);
    expect(state.rockets).toHaveLength(0);
    expect(drone.mode).toBe('falling');
  });

  it('self-destruct when their fuel runs out', () => {
    const state = playingState();
    const rocket = rocketAt(100, 100);
    rocket.age = ROCKET.lifetime;
    state.rockets.push(rocket);
    updateRockets(state, 0.016, rng);
    expect(state.rockets).toHaveLength(0);
    expect(state.events).toContain('explosion');
  });
});
