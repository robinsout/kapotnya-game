import { REFINERY, TURRET } from '../config';
import type { GameState } from '../game/types';
import { formatTime, padScore, plural } from './format';

export interface HudElements {
  root: HTMLElement;
  hpFill: HTMLElement;
  score: HTMLElement;
  ammo: HTMLElement;
  rockets: HTMLElement;
  screen: HTMLElement;
}

export interface HudExtras {
  best: number;
  newRecord: boolean;
  paused: boolean;
  muted: boolean;
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
    this.el.ammo.dataset.low = String(state.turret.ammo < 20);
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

export const screenHtml = (state: GameState, extras: HudExtras): string => {
  const sound = `<p class="hint">M — звук ${extras.muted ? 'выкл' : 'вкл'}</p>`;
  switch (state.phase) {
    case 'title':
      return `
        <h1 class="title">КАПОТНЯ</h1>
        <p class="subtitle">Защити нефтезавод от дронов</p>
        <ul class="controls">
          <li><b>A / D</b> или <b>стрелки</b> — ехать</li>
          <li><b>Мышь</b> — целиться, <b>ЛКМ</b> — огонь</li>
          <li><b>ПКМ</b> или <b>Пробел</b> — ракета</li>
          <li>Подбирай ящики с патронами и ракетами</li>
        </ul>
        ${extras.best > 0 ? `<p class="best">Рекорд: ${padScore(extras.best)}</p>` : ''}
        <p class="blink">Нажми ENTER или кликни</p>
        ${sound}`;
    case 'over':
      return `
        <h2 class="title danger">ЗАВОД УНИЧТОЖЕН</h2>
        <p>Счёт: <b>${padScore(state.score)}</b>${extras.newRecord ? ' <span class="record">НОВЫЙ РЕКОРД!</span>' : ''}</p>
        <p>Сбито: ${state.kills} ${plural(state.kills, 'дрон', 'дрона', 'дронов')} · Продержался ${formatTime(state.time)}</p>
        <p class="best">Рекорд: ${padScore(extras.best)}</p>
        <p class="blink">ENTER — ещё раз</p>`;
    case 'playing':
    case 'collapse':
      return extras.paused ? `<h2 class="title">ПАУЗА</h2><p class="blink">P — продолжить</p>${sound}` : '';
  }
};
