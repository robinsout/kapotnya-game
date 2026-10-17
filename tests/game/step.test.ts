import { COLLAPSE } from '../../src/config';
import { createGameState } from '../../src/game/state';
import { RESTART_LOCK, step } from '../../src/game/step';
import { startCollapse } from '../../src/game/systems/collapse';
import { seededRng } from '../../src/core/random';
import { constantRng, input, playingState } from '../helpers';

const rng = constantRng(0.5);

describe('step', () => {
  it('waits on the title screen until start is pressed', () => {
    const title = createGameState('title');
    expect(step(title, input(), 0.016, rng)).toBe(title);
    const next = step(title, input({ start: true }), 0.016, rng);
    expect(next).not.toBe(title);
    expect(next.phase).toBe('playing');
  });

  it('advances time and clears last step events while playing', () => {
    const state = playingState();
    state.events = ['shot'];
    step(state, input(), 0.5, rng);
    expect(state.time).toBe(0.5);
    expect(state.events).not.toContain('shot');
  });

  it('decays screen shake', () => {
    const state = playingState({ shake: 5 });
    step(state, input(), 0.1, rng);
    expect(state.shake).toBeLessThan(5);
  });

  it('ignores player input during the collapse', () => {
    const state = playingState();
    startCollapse(state, rng);
    const ammo = state.turret.ammo;
    step(state, input({ fire: true }), 0.016, rng);
    expect(state.turret.ammo).toBe(ammo);
    expect(state.time).toBe(0);
  });

  it('restarts from game over only after the restart lock', () => {
    const state = playingState();
    startCollapse(state, rng);
    state.phase = 'over';
    state.collapse!.lid.landed = true;
    state.collapse!.landedFor = COLLAPSE.afterLandDelay;
    expect(step(state, input({ start: true }), 0.016, rng)).toBe(state);

    state.collapse!.landedFor = COLLAPSE.afterLandDelay + RESTART_LOCK;
    const next = step(state, input({ start: true }), 0.016, rng);
    expect(next).not.toBe(state);
    expect(next.phase).toBe('playing');
    expect(next.score).toBe(0);
  });

  it('a full undefended run ends with the refinery destroyed', () => {
    let state = playingState();
    const seeded = seededRng(1);
    for (let i = 0; i < 60 * 600 && state.phase !== 'over'; i++) state = step(state, input(), 1 / 60, seeded);
    expect(state.phase).toBe('over');
    expect(state.refineryHp).toBe(0);
  });
});
