import { SoundEngine } from './audio/soundEngine';
import { FixedStep } from './core/fixedStep';
import type { Rng } from './core/random';
import { createGameState } from './game/state';
import { step } from './game/step';
import type { GameState } from './game/types';
import type { InputController } from './input/inputController';
import type { Renderer } from './render/renderer';
import type { HighScore } from './ui/highScore';
import type { Hud } from './ui/hud';

const STEP = 1 / 60;
/** Clamp long frames (tab switch, debugger) to keep the simulation stable. */
const MAX_FRAME = 0.25;

export interface AppDeps {
  input: InputController;
  renderer: Renderer;
  hud: Hud;
  sound: SoundEngine;
  highScore: HighScore;
  rng: Rng;
}

/** Wires input → simulation → rendering/audio/HUD on top of requestAnimationFrame. */
export class App {
  private state: GameState = createGameState('title');
  private readonly clock = new FixedStep(STEP);
  private paused = false;
  private newRecord = false;
  private lastTime: number | null = null;
  private elapsed = 0;

  constructor(private readonly deps: AppDeps) {
    deps.input.onCommand((command) => {
      if (command === 'mute') deps.sound.toggleMute();
      else this.togglePause();
    });
  }

  start(): void {
    requestAnimationFrame(this.frame);
  }

  /** Current simulation state (read-only use: debugging, tests). */
  get current(): GameState {
    return this.state;
  }

  togglePause(): void {
    if (this.state.phase === 'playing' || this.state.phase === 'collapse') this.paused = !this.paused;
  }

  private readonly frame = (now: number): void => {
    const dt = this.lastTime === null ? 0 : Math.min(MAX_FRAME, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.elapsed += dt;

    const steps = this.clock.advance(dt);
    if (!this.paused) {
      for (let i = 0; i < steps; i++) this.tick();
    }

    const { renderer, hud, input, sound, highScore } = this.deps;
    renderer.render(this.state, input.aimPoint, this.elapsed);
    hud.update(this.state, { best: highScore.value, newRecord: this.newRecord, paused: this.paused, muted: sound.muted });
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
