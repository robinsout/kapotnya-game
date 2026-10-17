import type { Vec2 } from '../core/math';
import type { DroneKind } from '../config';

export type Phase = 'title' | 'playing' | 'collapse' | 'over';

export interface Turret {
  x: number;
  /** Barrel angle in radians; always pointing upwards (negative). */
  angle: number;
  ammo: number;
  rockets: number;
  fireCooldown: number;
  rocketCooldown: number;
}

export interface Bullet {
  pos: Vec2;
  vel: Vec2;
}

export interface Rocket {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  age: number;
}

export type DroneMode = 'cruise' | 'dive' | 'falling';

export interface Drone {
  id: number;
  kind: DroneKind;
  mode: DroneMode;
  pos: Vec2;
  vel: Vec2;
  hp: number;
  target: Vec2;
  /** Rotation used while falling. */
  angle: number;
  spin: number;
  /** Seconds since spawn, drives propeller/blink animation. */
  age: number;
}

export type PickupKind = 'ammo' | 'rocket';

export interface Pickup {
  id: number;
  kind: PickupKind;
  pos: Vec2;
  landed: boolean;
  /** Seconds left on the ground before it disappears. */
  ttl: number;
}

export type ParticleKind = 'spark' | 'smoke' | 'fire' | 'debris' | 'flash';

export interface Particle {
  kind: ParticleKind;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
}

export interface Fire {
  pos: Vec2;
  /** Phase offset so fires don't flicker in sync. */
  seed: number;
}

export interface Lid {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  spin: number;
  landed: boolean;
}

export interface Collapse {
  elapsed: number;
  lid: Lid;
  /** Seconds since the lid hit the ground, null while it is still airborne. */
  landedFor: number | null;
}

export type GameEvent =
  | 'shot'
  | 'empty'
  | 'rocketLaunch'
  | 'droneHit'
  | 'droneDown'
  | 'explosion'
  | 'impact'
  | 'pickup'
  | 'bigExplosion'
  | 'lidLanded'
  | 'gameOver';

export interface Spawner {
  timer: number;
}

export interface GameState {
  phase: Phase;
  /** Seconds spent in the current run. */
  time: number;
  score: number;
  kills: number;
  refineryHp: number;
  turret: Turret;
  bullets: Bullet[];
  rockets: Rocket[];
  drones: Drone[];
  pickups: Pickup[];
  particles: Particle[];
  fires: Fire[];
  collapse: Collapse | null;
  spawner: Spawner;
  /** Screen shake intensity in pixels, decays over time. */
  shake: number;
  nextId: number;
  /** Events emitted during the last step (audio/UI hooks). */
  events: GameEvent[];
}

export interface InputState {
  /** -1 left, 0 idle, 1 right. */
  moveX: number;
  /** Aim point in world coordinates. */
  aim: Vec2;
  fire: boolean;
  /** Edge-triggered: true only on the frame the rocket button was pressed. */
  rocket: boolean;
  /** Edge-triggered start/restart. */
  start: boolean;
}

export const idleInput = (): InputState => ({
  moveX: 0,
  aim: { x: 160, y: 0 },
  fire: false,
  rocket: false,
  start: false,
});
