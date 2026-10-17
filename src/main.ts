import './style.css';
import { App } from './app';
import { SoundEngine } from './audio/soundEngine';
import { WORLD } from './config';
import { mathRandom } from './core/random';
import { InputController } from './input/inputController';
import type { Action } from './input/keymap';
import { Renderer } from './render/renderer';
import { HighScore, browserStorage } from './ui/highScore';
import { Hud } from './ui/hud';
import { computeScale } from './ui/scale';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const canvas = byId<HTMLCanvasElement>('game');
const stage = byId('stage');

const fitToViewport = (): void => {
  const scale = computeScale(window.innerWidth, window.innerHeight, WORLD.width, WORLD.height);
  stage.style.setProperty('--scale', String(scale));
};
fitToViewport();
window.addEventListener('resize', fitToViewport);

const input = new InputController(canvas);
input.attach();

const sound = new SoundEngine();
// Browsers only allow audio after a user gesture.
const unlockAudio = (): void => sound.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

document.querySelectorAll<HTMLButtonElement>('#touch [data-action]').forEach((button) => {
  const action = button.dataset.action as Action;
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.press(action, true);
  });
  const release = (): void => input.press(action, false);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

const hud = new Hud({
  root: byId('hud'),
  hpFill: byId('hp-fill'),
  score: byId('score'),
  ammo: byId('ammo'),
  rockets: byId('rockets'),
  screen: byId('screen'),
});

const app = new App({
  input,
  renderer: new Renderer(canvas.getContext('2d')!),
  hud,
  sound,
  highScore: new HighScore(browserStorage()),
  rng: mathRandom,
});
app.start();

if (import.meta.env.DEV) {
  // Debug handle for poking the game from the devtools console.
  (window as unknown as { kapotnya: App }).kapotnya = app;
}
