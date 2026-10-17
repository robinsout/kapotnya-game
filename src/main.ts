import './style.css';
import { App } from './app';
import { SoundEngine } from './audio/soundEngine';
import { mathRandom } from './core/random';
import { InputController } from './input/inputController';
import { Renderer } from './render/renderer';
import { HighScore, browserStorage } from './ui/highScore';
import { Hud } from './ui/hud';
import { bindTouchControls, fullscreenSupported, toggleFullscreen } from './ui/touchControls';
import { bindViewport, isTouchDevice } from './ui/viewport';

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
};

const canvas = byId<HTMLCanvasElement>('game');
const root = byId('root');
bindViewport(root, byId('stage'));

const input = new InputController(canvas);
input.attach();

const sound = new SoundEngine();
// Browsers (iOS especially) only allow audio after a user gesture.
const unlockAudio = (): void => sound.unlock();
for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) window.addEventListener(type, unlockAudio);

const app = new App({
  input,
  renderer: new Renderer(canvas.getContext('2d')!),
  hud: new Hud({
    root: byId('hud'),
    hpFill: byId('hp-fill'),
    score: byId('score'),
    ammo: byId('ammo'),
    rockets: byId('rockets'),
    warning: byId('warning'),
    screen: byId('screen'),
  }),
  sound,
  highScore: new HighScore(browserStorage()),
  rng: mathRandom,
  isTouch: isTouchDevice,
});

input.onCommand((command) => (command === 'mute' ? app.toggleMute() : app.togglePause()));

bindTouchControls(root, {
  press: (action, down) => input.press(action, down),
  command: (command) => {
    if (command === 'pause') app.togglePause();
    else if (command === 'mute') app.toggleMute();
    else void toggleFullscreen();
  },
});
if (!fullscreenSupported()) root.querySelector<HTMLElement>('[data-command="fullscreen"]')?.setAttribute('hidden', '');

// Phones lock, users switch apps — never keep playing in the background.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) app.pause();
});

app.start();

if (import.meta.env.DEV) {
  // Debug handle for poking the game from the devtools console.
  (window as unknown as { kapotnya: App }).kapotnya = app;
}
