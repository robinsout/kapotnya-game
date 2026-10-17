import { FixedStep } from './core/fixedStep';
import type { Vec2 } from './core/math';
import type { Rng } from './core/random';
import { createGameState } from './game/state';
import { step } from './game/step';
import type { GameEvent, GameState, InputState } from './game/types';
import type { HudExtras } from './ui/hud';

const STEP = 1 / 60;
/** Clamp long frames (tab switch, debugger) to keep the simulation stable. */
const MAX_FRAME = 0.25;

/** Ports the app depends on — implemented by the browser adapters, faked in tests. */
export interface InputPort {
  sample(): InputState;
  consumeEdges(): void;
  readonly aimPoint: Readonly<Vec2>;
}

export interface RendererPort {
  render(state: GameState, aim: Vec2, clock: number): void;
}

export interface HudPort {
  update(state: GameState, extras: HudExtras): void;
}

export interface SoundPort {
  readonly muted: boolean;
  play(events: readonly GameEvent[]): void;
  toggleMute(): boolean;
}

export interface ScorePort {
  readonly value: number;
  submit(score: number): boolean;
}

export interface AppDeps {
  input: InputPort;
  renderer: RendererPort;
  hud: HudPort;
  sound: SoundPort;
  highScore: ScorePort;
  rng: Rng;
  isTouch: () => boolean;
}

/** Wires input → simulation → rendering/audio/HUD on top of requestAnimationFrame. */
export class App {
  private state: GameState = createGameState('title');
  private readonly clock = new FixedStep(STEP);
  private paused = false;
  private newRecord = false;
  private lastTime: number | null = null;
  private elapsed = 0;

  constructor(private readonly deps: AppDeps) {}

  start(): void {
    requestAnimationFrame(this.frame);
  }

  /** Current simulation state (read-only use: debugging, tests). */
  get current(): GameState {
    return this.state;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private get pausable(): boolean {
    return this.state.phase === 'playing' || this.state.phase === 'collapse';
  }

  togglePause(): void {
    if (this.pausable) this.paused = !this.paused;
  }

  /** Pauses without toggling — e.g. when the tab is hidden or the phone locks. */
  pause(): void {
    if (this.pausable) this.paused = true;
  }

  toggleMute(): void {
    this.deps.sound.toggleMute();
  }

  /** Advances real time by `dt` seconds: simulates, then draws one frame. */
  advance(dt: number): void {
    const { renderer, hud, input, sound, highScore } = this.deps;
    this.elapsed += dt;
    const steps = this.clock.advance(dt);

    if (this.paused) {
      // Any tap / start press resumes; other presses made while paused are dropped.
      if (input.sample().start) this.paused = false;
      input.consumeEdges();
    } else {
      for (let i = 0; i < steps; i++) this.tick();
    }

    renderer.render(this.state, input.aimPoint, this.elapsed);
    hud.update(this.state, {
      best: highScore.value,
      newRecord: this.newRecord,
      paused: this.paused,
      muted: sound.muted,
      touch: this.deps.isTouch(),
    });
  }

  private readonly frame = (now: number): void => {
    const dt = this.lastTime === null ? 0 : Math.min(MAX_FRAME, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.advance(dt);
    requestAnimationFrame(this.frame);
  };

  private tick(): void {
    const { input, rng, sound, highScore } = this.deps;
    const previous = this.state;
    this.state = step(this.state, input.sample(), STEP, rng);
    input.consumeEdges();
    if (this.state !== previous) this.newRecord = false;
    if (this.state.events.includes('gameOver')) this.newRecord = highScore.submit(this.state.score);
    sound.play(this.state.events);
  }
}
