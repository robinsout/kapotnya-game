// @vitest-environment jsdom
import { REFINERY, TURRET } from '../../src/config';
import { createGameState } from '../../src/game/state';
import type { HudElements, HudExtras } from '../../src/ui/hud';
import { Hud, resourceWarning, screenHtml } from '../../src/ui/hud';

const extras = (overrides: Partial<HudExtras> = {}): HudExtras => ({
  best: 0,
  newRecord: false,
  paused: false,
  muted: false,
  touch: false,
  ...overrides,
});

const elements = (): HudElements => {
  const make = () => document.createElement('div');
  return {
    root: make(),
    hpFill: make(),
    score: make(),
    ammo: make(),
    rockets: make(),
    warning: make(),
    screen: make(),
  };
};

describe('Hud', () => {
  it('hides the HUD on the title screen and shows the menu', () => {
    const el = elements();
    new Hud(el).update(createGameState('title'), extras());
    expect(el.root.hidden).toBe(true);
    expect(el.screen.hidden).toBe(false);
    expect(el.screen.textContent).toContain('КАПОТНЯ');
  });

  it('shows refinery health, ammo, rockets and score while playing', () => {
    const el = elements();
    const state = createGameState('playing');
    state.refineryHp = REFINERY.maxHp * 0.25;
    state.score = 120;
    state.turret.ammo = 10;
    state.turret.rockets = 2;
    new Hud(el).update(state, extras());

    expect(el.root.hidden).toBe(false);
    expect(el.screen.hidden).toBe(true);
    expect(el.hpFill.style.width).toBe('25%');
    expect(el.hpFill.dataset.level).toBe('danger');
    expect(el.score.textContent).toBe('000120');
    expect(el.ammo.textContent).toBe('10');
    expect(el.ammo.dataset.low).toBe('true');
    expect(el.rockets.children).toHaveLength(TURRET.maxRockets);
    expect(el.rockets.querySelectorAll('.full')).toHaveLength(2);
    expect(el.warning.hidden).toBe(false);
    expect(el.warning.textContent).toBe('МАЛО ПАТРОНОВ');
  });

  it('does not touch the DOM when nothing changed', () => {
    const el = elements();
    const hud = new Hud(el);
    const state = createGameState('playing');
    hud.update(state, extras());
    const slot = el.rockets.firstChild;
    hud.update(state, extras());
    expect(el.rockets.firstChild).toBe(slot);
  });
});

describe('screenHtml', () => {
  it('shows the pause screen only when paused', () => {
    const state = createGameState('playing');
    expect(screenHtml(state, extras())).toBe('');
    expect(screenHtml(state, extras({ paused: true }))).toContain('ПАУЗА');
  });

  it('summarises the run on game over', () => {
    const state = createGameState('over');
    state.score = 300;
    state.kills = 2;
    state.time = 75;
    const html = screenHtml(state, extras({ best: 300, newRecord: true }));
    expect(html).toContain('ЗАВОД УНИЧТОЖЕН');
    expect(html).toContain('000300');
    expect(html).toContain('2 дрона');
    expect(html).toContain('1:15');
    expect(html).toContain('НОВЫЙ РЕКОРД');
  });

  it('shows the best score on the title screen once there is one', () => {
    const state = createGameState('title');
    expect(screenHtml(state, extras())).not.toContain('Рекорд');
    expect(screenHtml(state, extras({ best: 50 }))).toContain('000050');
  });
});

describe('resourceWarning', () => {
  it('stays quiet with enough ammo or outside of play', () => {
    expect(resourceWarning(createGameState('playing'))).toBe('');
    const over = createGameState('over');
    over.turret.ammo = 0;
    expect(resourceWarning(over)).toBe('');
  });

  it('escalates as ammo and rockets run out', () => {
    const state = createGameState('playing');
    state.turret.ammo = 3;
    expect(resourceWarning(state)).toBe('МАЛО ПАТРОНОВ');
    state.turret.ammo = 0;
    expect(resourceWarning(state)).toContain('ПАТРОНЫ КОНЧИЛИСЬ');
    state.turret.rockets = 0;
    expect(resourceWarning(state)).toContain('ПУСТО');
  });
});

describe('screenHtml hints', () => {
  it('reminds that resources are finite', () => {
    expect(screenHtml(createGameState('title'), extras())).toContain('не бесконечны');
  });

  it('shows touch hints on touch devices', () => {
    const html = screenHtml(createGameState('title'), extras({ touch: true }));
    expect(html).toContain('Коснись экрана');
    expect(html).not.toContain('ENTER');
    expect(screenHtml(createGameState('over'), extras({ touch: true }))).toContain('Коснись');
  });
});
