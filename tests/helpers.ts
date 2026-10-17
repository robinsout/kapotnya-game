import type { Rng } from '../src/core/random';
import { createGameState } from '../src/game/state';
import type { GameState, InputState } from '../src/game/types';
import { idleInput } from '../src/game/types';

/** Rng that replays the given values in a loop — makes random branches explicit in tests. */
export const sequenceRng = (values: readonly number[]): Rng => {
  let i = 0;
  return { next: () => values[i++ % values.length] };
};

/** Rng that always returns the same value. */
export const constantRng = (value: number): Rng => ({ next: () => value });

export const playingState = (overrides: Partial<GameState> = {}): GameState => ({
  ...createGameState('playing'),
  ...overrides,
});

export const input = (overrides: Partial<InputState> = {}): InputState => ({ ...idleInput(), ...overrides });
