import { HUD, REFINERY, TURRET } from '../config';
import type { GameState } from '../game/types';
import { formatTime, padScore, plural } from './format';

export interface HudElements {
  root: HTMLElement;
  hpFill: HTMLElement;
  score: HTMLElement;
  ammo: HTMLElement;
  rockets: HTMLElement;
  warning: HTMLElement;
  screen: HTMLElement;
}

export interface HudExtras {
  best: number;
  newRecord: boolean;
  paused: boolean;
  muted: boolean;
  /** Touch device: show tap-based hints instead of keyboard ones. */
  touch: boolean;
}

/** Renders HUD and menu screens into the DOM, touching it only when values change. */
export class Hud {
  private lastHud: string | null = null;
  private lastScreen: string | null = null;

  constructor(private readonly el: HudElements) {}

  update(state: GameState, extras: HudExtras): void {
    this.updateHud(state);
    this.updateScreen(state, extras);
  }

  private updateHud(state: GameState): void {
    const hpPercent = Math.round((state.refineryHp / REFINERY.maxHp) * 100);
    const key = [state.phase, hpPercent, state.score, state.turret.ammo, state.turret.rockets].join('|');
    if (key === this.lastHud) return;
    this.lastHud = key;

    this.el.root.hidden = state.phase === 'title';
    this.el.hpFill.style.width = `${hpPercent}%`;
    this.el.hpFill.dataset.level = hpPercent > 60 ? 'ok' : hpPercent > 30 ? 'warn' : 'danger';
    this.el.score.textContent = padScore(state.score);
    this.el.ammo.textContent = String(state.turret.ammo);
    this.el.ammo.dataset.low = String(state.turret.ammo < HUD.lowAmmo);
    const warning = resourceWarning(state);
    this.el.warning.textContent = warning;
    this.el.warning.hidden = warning === '';
    this.el.rockets.replaceChildren(
      ...Array.from({ length: TURRET.maxRockets }, (_, i) => {
        const slot = document.createElement('span');
        slot.className = i < state.turret.rockets ? 'rocket-slot full' : 'rocket-slot';
        return slot;
      }),
    );
  }

  private updateScreen(state: GameState, extras: HudExtras): void {
    const html = screenHtml(state, extras);
    if (html === this.lastScreen) return;
    this.lastScreen = html;
    this.el.screen.hidden = html === '';
    this.el.screen.innerHTML = html;
  }
}

/** Nudges the player to collect crates — ammo and rockets never refill by themselves. */
export const resourceWarning = (state: GameState): string => {
  if (state.phase !== 'playing') return '';
  const { ammo, rockets } = state.turret;
  if (ammo === 0 && rockets === 0) return 'ПУСТО! ЛОВИ ЯЩИКИ';
  if (ammo === 0) return 'ПАТРОНЫ КОНЧИЛИСЬ! ЛОВИ ЯЩИКИ';
  if (ammo < HUD.lowAmmo) return 'МАЛО ПАТРОНОВ';
  return '';
};

const titleControls = (touch: boolean): string =>
  touch
    ? `<li><b>◀ ▶</b> — ехать</li>
       <li><b>Касание неба</b> — целиться и стрелять</li>
       <li><b>РАКЕТА</b> — самонаводящаяся ракета</li>`
    : `<li><b>A / D</b> или <b>стрелки</b> — ехать</li>
       <li><b>Мышь</b> — целиться, <b>ЛКМ</b> — огонь</li>
       <li><b>ПКМ</b> или <b>Пробел</b> — ракета</li>`;

export const screenHtml = (state: GameState, extras: HudExtras): string => {
  const sound = extras.touch ? '' : `<p class="hint">M — звук ${extras.muted ? 'выкл' : 'вкл'}</p>`;
  const action = extras.touch ? 'Коснись экрана' : 'Нажми ENTER или кликни';
  switch (state.phase) {
    case 'title':
      return `
        <h1 class="title">КАПОТНЯ</h1>
        <p class="subtitle">Защити нефтезавод от дронов</p>
        <ul class="controls">
          ${titleControls(extras.touch)}
          <li class="accent">Патроны и ракеты не бесконечны — собирай ящики!</li>
        </ul>
        ${extras.best > 0 ? `<p class="best">Рекорд: ${padScore(extras.best)}</p>` : ''}
        <p class="blink">${action}</p>
        ${sound}`;
    case 'over':
      return `
        <h2 class="title danger">ЗАВОД УНИЧТОЖЕН</h2>
        <p>Счёт: <b>${padScore(state.score)}</b>${extras.newRecord ? ' <span class="record">НОВЫЙ РЕКОРД!</span>' : ''}</p>
        <p>Сбито: ${state.kills} ${plural(state.kills, 'дрон', 'дрона', 'дронов')} · ${formatTime(state.time)}</p>
        <p class="best">Рекорд: ${padScore(extras.best)}</p>
        <p class="blink">${extras.touch ? 'Коснись — ещё раз' : 'ENTER — ещё раз'}</p>`;
    case 'playing':
    case 'collapse':
      return extras.paused
        ? `<h2 class="title">ПАУЗА</h2><p class="blink">${extras.touch ? 'Коснись — продолжить' : 'P — продолжить'}</p>${sound}`
        : '';
  }
};
