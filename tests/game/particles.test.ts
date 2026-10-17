import { addParticle, emitFireParticles, spawnExplosion, updateParticles } from '../../src/game/systems/particles';
import { constantRng, playingState } from '../helpers';

describe('particles', () => {
  it('move, obey gravity and expire', () => {
    const state = playingState();
    addParticle(state, { kind: 'spark', pos: { x: 0, y: 0 }, vel: { x: 10, y: 0 }, life: 0.5, gravity: 100 });
    updateParticles(state, 0.1);
    expect(state.particles[0].pos.x).toBeCloseTo(1);
    expect(state.particles[0].vel.y).toBeCloseTo(10);
    updateParticles(state, 0.5);
    expect(state.particles).toHaveLength(0);
  });

  it('copies positions so particles never alias game objects', () => {
    const state = playingState();
    const pos = { x: 5, y: 5 };
    addParticle(state, { kind: 'flash', pos, life: 1 });
    state.particles[0].pos.x = 99;
    expect(pos.x).toBe(5);
  });

  it('creates explosions made of several particle kinds', () => {
    const state = playingState();
    spawnExplosion(state, constantRng(0.3), { x: 50, y: 50 });
    const kinds = new Set(state.particles.map((p) => p.kind));
    expect(kinds).toEqual(new Set(['flash', 'fire', 'spark', 'smoke']));
  });

  it('caps the particle count', () => {
    const state = playingState();
    for (let i = 0; i < 2000; i++) addParticle(state, { kind: 'spark', pos: { x: 0, y: 0 }, life: 1 });
    expect(state.particles.length).toBeLessThanOrEqual(900);
  });

  it('lets refinery fires emit smoke', () => {
    const state = playingState();
    state.fires.push({ pos: { x: 10, y: 120 }, seed: 0 });
    emitFireParticles(state, constantRng(0), 0.1);
    expect(state.particles.some((p) => p.kind === 'smoke')).toBe(true);
  });
});
