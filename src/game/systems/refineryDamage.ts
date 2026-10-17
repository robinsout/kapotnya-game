import { REFINERY } from '../../config';
import type { Vec2 } from '../../core/math';
import type { Rng } from '../../core/random';
import type { GameState } from '../types';
import { startCollapse } from './collapse';

export const damageRefinery = (state: GameState, rng: Rng, amount: number, point: Vec2): void => {
  if (state.fires.length < REFINERY.maxFires) {
    state.fires.push({ pos: { x: point.x, y: point.y }, seed: rng.next() * 10 });
  }
  if (state.phase !== 'playing') return;
  state.refineryHp = Math.max(0, state.refineryHp - amount);
  if (state.refineryHp === 0) startCollapse(state, rng);
};
