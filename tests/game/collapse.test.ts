import { COLLAPSE, WORLD } from '../../src/config';
import { LID_HEIGHT } from '../../src/game/refinery';
import { flatAngle, lidExtent, lidStartPosition, startCollapse, updateCollapse } from '../../src/game/systems/collapse';
import type { GameState } from '../../src/game/types';
import { constantRng, playingState } from '../helpers';

const rng = constantRng(0.5);
const DT = 1 / 60;

const runUntil = (state: GameState, predicate: () => boolean, maxSeconds = 20): void => {
  for (let t = 0; t < maxSeconds && !predicate(); t += DT) updateCollapse(state, DT, rng);
};

describe('collapse', () => {
  it('launches the lid upwards from the top of the big tank', () => {
    const state = playingState();
    state.bullets.push({ pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });
    startCollapse(state, rng);
    expect(state.phase).toBe('collapse');
    expect(state.bullets).toHaveLength(0);
    expect(state.collapse?.lid.pos).toEqual(lidStartPosition());
    expect(state.collapse?.lid.vel.y).toBe(-COLLAPSE.lidLaunchSpeed);
    expect(state.shake).toBeGreaterThan(0);
  });

  it('measures the lid extent for flat and upright lids', () => {
    expect(lidExtent(0)).toBeCloseTo(LID_HEIGHT / 2);
    expect(lidExtent(Math.PI / 2)).toBeGreaterThan(LID_HEIGHT);
  });

  it('snaps to the nearest flat orientation', () => {
    expect(flatAngle(0.4)).toBe(0);
    expect(flatAngle(2.9)).toBeCloseTo(Math.PI);
    expect(flatAngle(-3.5)).toBeCloseTo(-Math.PI);
  });

  it('flies up, comes back down and lies flat on the ground', () => {
    const state = playingState();
    startCollapse(state, rng);
    const lid = state.collapse!.lid;
    let highest = lid.pos.y;
    runUntil(state, () => {
      highest = Math.min(highest, lid.pos.y);
      return lid.landed;
    });
    expect(highest).toBeLessThan(lidStartPosition().y - 50);
    expect(lid.landed).toBe(true);
    expect(state.events).toContain('lidLanded');

    runUntil(state, () => Math.abs(lid.angle - flatAngle(lid.angle)) < 1e-9, 2);
    expect(lid.pos.y).toBeCloseTo(WORLD.groundY - LID_HEIGHT / 2);
  });

  it('ends the game a moment after the lid lands', () => {
    const state = playingState();
    startCollapse(state, rng);
    runUntil(state, () => state.collapse!.lid.landed);
    expect(state.phase).toBe('collapse');
    runUntil(state, () => state.phase === 'over');
    expect(state.phase).toBe('over');
    expect(state.collapse!.landedFor).toBeGreaterThanOrEqual(COLLAPSE.afterLandDelay);
    expect(state.events).toContain('gameOver');
  });
});
