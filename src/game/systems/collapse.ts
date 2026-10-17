import { COLLAPSE, WORLD } from '../../config';
import type { Rng } from '../../core/random';
import { chance, range } from '../../core/random';
import { rotateTowards } from '../../core/math';
import { BIG_TANK, LID_HEIGHT, LID_WIDTH } from '../refinery';
import type { GameState } from '../types';
import { addParticle, spawnDebris, spawnExplosion } from './particles';

/** How fast a landed lid tips over until it lies flat (rad/s). */
const TIP_OVER_SPEED = 6;

/** Distance from the lid's centre to its lowest point at the given rotation. */
export const lidExtent = (angle: number): number =>
  (Math.abs(Math.sin(angle)) * LID_WIDTH) / 2 + (Math.abs(Math.cos(angle)) * LID_HEIGHT) / 2;

const tankTopCenter = () => ({
  x: BIG_TANK.rect.x + BIG_TANK.rect.w / 2,
  y: BIG_TANK.rect.y,
});

/** The lid sits on top of the tank; its position is tracked by its centre. */
export const lidStartPosition = () => ({
  x: BIG_TANK.rect.x + BIG_TANK.rect.w / 2,
  y: BIG_TANK.rect.y - LID_HEIGHT / 2,
});

/** The big tank blows up: the lid is launched into the sky. */
export const startCollapse = (state: GameState, rng: Rng): void => {
  const top = tankTopCenter();
  state.phase = 'collapse';
  state.bullets = [];
  state.collapse = {
    elapsed: 0,
    landedFor: null,
    lid: {
      pos: lidStartPosition(),
      vel: { x: range(rng, 10, 30), y: -COLLAPSE.lidLaunchSpeed },
      angle: 0,
      spin: COLLAPSE.lidSpin * (chance(rng, 0.5) ? 1 : -1),
      landed: false,
    },
  };
  for (let i = 0; i < 4; i++) {
    spawnExplosion(state, rng, { x: top.x + range(rng, -20, 20), y: top.y + range(rng, 0, 30) }, 2);
  }
  spawnDebris(state, rng, top, 30);
  state.shake = 9;
  state.events.push('bigExplosion');
};

/** Nearest angle at which the lid lies flat (either side up). */
export const flatAngle = (angle: number): number => Math.round(angle / Math.PI) * Math.PI;

export const updateCollapse = (state: GameState, dt: number, rng: Rng): void => {
  const collapse = state.collapse;
  if (!collapse) return;
  collapse.elapsed += dt;
  const { lid } = collapse;

  // The ruined tank keeps burning.
  const top = tankTopCenter();
  if (chance(rng, dt * 30)) {
    addParticle(state, {
      kind: chance(rng, 0.5) ? 'fire' : 'smoke',
      pos: { x: top.x + range(rng, -28, 28), y: top.y + range(rng, -2, 4) },
      vel: { x: range(rng, -6, 6), y: range(rng, -40, -15) },
      life: range(rng, 0.4, 1.8),
      size: 2,
    });
  }
  if (collapse.elapsed < 1.2 && chance(rng, dt * 4)) {
    spawnExplosion(state, rng, { x: top.x + range(rng, -26, 26), y: top.y + range(rng, 0, 40) }, 1.3);
    state.events.push('explosion');
  }

  if (!lid.landed) {
    lid.vel.y += WORLD.gravity * dt;
    lid.pos.x += lid.vel.x * dt;
    lid.pos.y += lid.vel.y * dt;
    lid.angle += lid.spin * dt;
    if (lid.vel.y > 0 && lid.pos.y + lidExtent(lid.angle) >= WORLD.groundY) {
      lid.landed = true;
      lid.vel = { x: 0, y: 0 };
      collapse.landedFor = 0;
      spawnDebris(state, rng, { x: lid.pos.x, y: WORLD.groundY - 2 }, 12);
      state.shake = Math.max(state.shake, 5);
      state.events.push('lidLanded');
    }
  } else {
    // Tip over onto the ground, keeping the lowest point on the surface.
    lid.angle = rotateTowards(lid.angle, flatAngle(lid.angle), TIP_OVER_SPEED * dt);
  }
  if (lid.landed) lid.pos.y = WORLD.groundY - lidExtent(lid.angle);
  if (collapse.landedFor === null) return;

  collapse.landedFor += dt;
  if (state.phase === 'collapse' && collapse.landedFor >= COLLAPSE.afterLandDelay) {
    state.phase = 'over';
    state.events.push('gameOver');
  }
};
