import { REFINERY } from '../../src/config';
import { damageRefinery } from '../../src/game/systems/refineryDamage';
import { constantRng, playingState } from '../helpers';

const rng = constantRng(0.5);

describe('damageRefinery', () => {
  it('reduces hp and adds fires up to a limit', () => {
    const state = playingState();
    for (let i = 0; i < REFINERY.maxFires + 3; i++) damageRefinery(state, rng, 1, { x: i, y: 120 });
    expect(state.refineryHp).toBe(REFINERY.maxHp - REFINERY.maxFires - 3);
    expect(state.fires).toHaveLength(REFINERY.maxFires);
  });

  it('starts the collapse when hp reaches zero', () => {
    const state = playingState();
    damageRefinery(state, rng, REFINERY.maxHp + 50, { x: 60, y: 120 });
    expect(state.refineryHp).toBe(0);
    expect(state.phase).toBe('collapse');
    expect(state.events).toContain('bigExplosion');
  });

  it('ignores hp damage once the refinery is already destroyed', () => {
    const state = playingState();
    damageRefinery(state, rng, REFINERY.maxHp, { x: 60, y: 120 });
    state.events = [];
    damageRefinery(state, rng, 10, { x: 60, y: 120 });
    expect(state.refineryHp).toBe(0);
    expect(state.events).not.toContain('bigExplosion');
  });
});
