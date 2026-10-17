import type { GameEvent } from '../game/types';

export interface ToneSpec {
  type: 'tone';
  wave: OscillatorType;
  from: number;
  to: number;
  duration: number;
  volume: number;
}

export interface NoiseSpec {
  type: 'noise';
  duration: number;
  volume: number;
  /** Low-pass cutoff in Hz; lower sounds heavier. */
  cutoff: number;
}

export type SoundSpec = ToneSpec | NoiseSpec;

const tone = (wave: OscillatorType, from: number, to: number, duration: number, volume: number): ToneSpec => ({
  type: 'tone',
  wave,
  from,
  to,
  duration,
  volume,
});

const noise = (duration: number, volume: number, cutoff: number): NoiseSpec => ({
  type: 'noise',
  duration,
  volume,
  cutoff,
});

/** Chiptune-style recipes for each game event; several layers play together. */
export const SOUND_RECIPES: Readonly<Record<GameEvent, readonly SoundSpec[]>> = {
  shot: [noise(0.05, 0.12, 3000), tone('square', 220, 90, 0.05, 0.05)],
  empty: [tone('square', 140, 120, 0.06, 0.06)],
  rocketLaunch: [noise(0.5, 0.18, 1200), tone('sawtooth', 200, 600, 0.4, 0.05)],
  droneHit: [tone('square', 900, 700, 0.04, 0.05)],
  droneDown: [tone('square', 600, 120, 0.3, 0.07)],
  explosion: [noise(0.5, 0.3, 700)],
  impact: [noise(0.7, 0.4, 500), tone('sine', 90, 40, 0.5, 0.2)],
  pickup: [tone('square', 520, 520, 0.07, 0.07), tone('square', 780, 1040, 0.15, 0.07)],
  bigExplosion: [noise(2.2, 0.6, 400), tone('sine', 70, 25, 1.8, 0.4)],
  lidLanded: [noise(0.6, 0.45, 900), tone('triangle', 160, 60, 0.4, 0.2)],
  gameOver: [tone('square', 330, 330, 0.25, 0.06), tone('square', 247, 196, 0.6, 0.06)],
};

/** Events that fire often get rate-limited to avoid an audio wall of noise. */
export const MIN_INTERVAL: Partial<Record<GameEvent, number>> = {
  shot: 0.07,
  droneHit: 0.05,
  explosion: 0.08,
};
