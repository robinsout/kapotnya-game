import type { AppDeps, InputPort } from '../src/app';
import { App } from '../src/app';
import type { GameEvent, InputState } from '../src/game/types';
import type { HudExtras } from '../src/ui/hud';
import { constantRng, input } from './helpers';

class FakeInput implements InputPort {
  next: InputState = input();
  consumed = 0;
  readonly aimPoint = { x: 160, y: 40 };
  sample(): InputState {
    return { ...this.next };
  }
  consumeEdges(): void {
    this.consumed++;
    this.next = { ...this.next, start: false, rocket: false };
  }
}

const setup = (touch = false) => {
  const fakeInput = new FakeInput();
  const played: GameEvent[][] = [];
  const hudCalls: HudExtras[] = [];
  let renders = 0;
  let best = 0;
  const deps: AppDeps = {
    input: fakeInput,
    renderer: { render: () => void renders++ },
    hud: { update: (_state, extras) => void hudCalls.push(extras) },
    sound: { muted: false, play: (events) => void played.push([...events]), toggleMute: () => true },
    highScore: {
      get value() {
        return best;
      },
      submit: (score) => {
        best = score;
        return true;
      },
    },
    rng: constantRng(0.99),
    isTouch: () => touch,
  };
  const app = new App(deps);
  return { app, fakeInput, played, hudCalls, renders: () => renders };
};

const startGame = (ctx: ReturnType<typeof setup>) => {
  ctx.fakeInput.next = input({ start: true });
  ctx.app.advance(1 / 60);
};

describe('App', () => {
  it('starts on the title screen and begins a run on start', () => {
    const ctx = setup();
    expect(ctx.app.current.phase).toBe('title');
    startGame(ctx);
    expect(ctx.app.current.phase).toBe('playing');
    expect(ctx.renders()).toBe(1);
  });

  it('runs fixed simulation steps for the elapsed time', () => {
    const ctx = setup();
    startGame(ctx);
    for (let i = 0; i < 30; i++) ctx.app.advance(1 / 60);
    expect(ctx.app.current.time).toBeCloseTo(0.5, 1);
  });

  it('catches up only a few steps after a long hitch', () => {
    const ctx = setup();
    startGame(ctx);
    ctx.app.advance(10);
    expect(ctx.app.current.time).toBeLessThan(0.2);
  });

  it('forwards simulation events to the sound engine', () => {
    const ctx = setup();
    startGame(ctx);
    ctx.fakeInput.next = input({ fire: true });
    ctx.app.advance(1 / 60);
    expect(ctx.played.flat()).toContain('shot');
  });

  it('freezes the simulation while paused and resumes on a tap', () => {
    const ctx = setup();
    startGame(ctx);
    ctx.app.pause();
    const time = ctx.app.current.time;
    ctx.app.advance(1);
    expect(ctx.app.current.time).toBe(time);
    expect(ctx.hudCalls.at(-1)?.paused).toBe(true);

    ctx.fakeInput.next = input({ start: true });
    ctx.app.advance(1 / 60);
    expect(ctx.app.isPaused).toBe(false);
  });

  it('drops rocket presses made during a pause', () => {
    const ctx = setup();
    startGame(ctx);
    ctx.app.pause();
    ctx.fakeInput.next = input({ rocket: true });
    ctx.app.advance(1 / 60);
    ctx.app.togglePause();
    ctx.app.advance(1 / 60);
    expect(ctx.app.current.rockets).toHaveLength(0);
  });

  it('cannot be paused on the title screen', () => {
    const ctx = setup();
    ctx.app.pause();
    expect(ctx.app.isPaused).toBe(false);
  });

  it('tells the HUD whether hints should be for touch', () => {
    const ctx = setup(true);
    ctx.app.advance(1 / 60);
    expect(ctx.hudCalls.at(-1)?.touch).toBe(true);
  });
});
