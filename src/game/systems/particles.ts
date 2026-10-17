import type { Vec2 } from '../../core/math';
import type { Rng } from '../../core/random';
import { chance, range } from '../../core/random';
import type { GameState, Particle, ParticleKind } from '../types';

const MAX_PARTICLES = 900;

export interface ParticleOptions {
  kind: ParticleKind;
  pos: Vec2;
  vel?: Vec2;
  life: number;
  size?: number;
  gravity?: number;
}

export const addParticle = (state: GameState, options: ParticleOptions): void => {
  if (state.particles.length >= MAX_PARTICLES) return;
  const particle: Particle = {
    kind: options.kind,
    pos: { ...options.pos },
    vel: options.vel ? { ...options.vel } : { x: 0, y: 0 },
    life: options.life,
    maxLife: options.life,
    size: options.size ?? 1,
    gravity: options.gravity ?? 0,
  };
  state.particles.push(particle);
};

const burst = (
  state: GameState,
  rng: Rng,
  count: number,
  speed: number,
  make: (vel: Vec2) => ParticleOptions,
): void => {
  for (let i = 0; i < count; i++) {
    const angle = range(rng, 0, Math.PI * 2);
    const s = range(rng, speed * 0.2, speed);
    addParticle(state, make({ x: Math.cos(angle) * s, y: Math.sin(angle) * s }));
  }
};

/** Fireball + sparks + smoke. `scale` 1 is a drone-sized blast. */
export const spawnExplosion = (state: GameState, rng: Rng, pos: Vec2, scale = 1): void => {
  addParticle(state, { kind: 'flash', pos, life: 0.12, size: Math.round(6 * scale) });
  burst(state, rng, Math.round(10 * scale), 50 * scale, (vel) => ({
    kind: 'fire',
    pos,
    vel,
    life: range(rng, 0.25, 0.6),
    size: chance(rng, 0.4) ? 2 : 1,
  }));
  burst(state, rng, Math.round(8 * scale), 90 * scale, (vel) => ({
    kind: 'spark',
    pos,
    vel,
    life: range(rng, 0.2, 0.5),
    gravity: 120,
  }));
  burst(state, rng, Math.round(6 * scale), 18 * scale, (vel) => ({
    kind: 'smoke',
    pos,
    vel: { x: vel.x, y: vel.y - 12 },
    life: range(rng, 0.8, 1.6),
    size: 2,
  }));
};

export const spawnDebris = (state: GameState, rng: Rng, pos: Vec2, count: number): void => {
  burst(state, rng, count, 70, (vel) => ({
    kind: 'debris',
    pos,
    vel: { x: vel.x, y: vel.y - 40 },
    life: range(rng, 0.6, 1.2),
    gravity: 160,
  }));
};

export const spawnSparks = (state: GameState, rng: Rng, pos: Vec2, count: number): void => {
  burst(state, rng, count, 60, (vel) => ({
    kind: 'spark',
    pos,
    vel,
    life: range(rng, 0.1, 0.25),
    gravity: 80,
  }));
};

export const updateParticles = (state: GameState, dt: number): void => {
  for (const p of state.particles) {
    p.life -= dt;
    p.vel.y += p.gravity * dt;
    if (p.kind === 'smoke') {
      // Smoke drifts with the wind and slows down.
      p.vel.x += 6 * dt;
      p.vel.x *= 1 - 0.8 * dt;
      p.vel.y *= 1 - 0.8 * dt;
    }
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
};

/** Burning spots on the refinery keep emitting smoke and embers. */
export const emitFireParticles = (state: GameState, rng: Rng, dt: number): void => {
  for (const fire of state.fires) {
    if (chance(rng, dt * 5)) {
      addParticle(state, {
        kind: 'smoke',
        pos: { x: fire.pos.x + range(rng, -1, 1), y: fire.pos.y - 3 },
        vel: { x: range(rng, -3, 3), y: range(rng, -22, -12) },
        life: range(rng, 1.2, 2.4),
        size: 2,
      });
    }
    if (chance(rng, dt * 3)) {
      addParticle(state, {
        kind: 'fire',
        pos: { x: fire.pos.x + range(rng, -2, 2), y: fire.pos.y - 2 },
        vel: { x: range(rng, -4, 4), y: range(rng, -30, -15) },
        life: range(rng, 0.2, 0.45),
      });
    }
  }
};
