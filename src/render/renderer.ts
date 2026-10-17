import { PICKUPS, WORLD } from '../config';
import type { Vec2 } from '../core/math';
import { muzzlePosition, turretPivot } from '../game/systems/turret';
import type { Drone, Floater, GameState, Particle, Pickup } from '../game/types';
import { renderBackground } from './background';
import { PixelCanvas } from './canvas';
import { textWidth } from './pixelFont';
import { COLORS } from './palette';
import { AVIATION_LIGHTS, FLARE_TIP, LID_SPRITE, renderRefinery } from './refineryArt';
import {
  AMMO_CRATE,
  PARACHUTE,
  QUAD_FRAMES,
  ROCKET,
  ROCKET_CRATE,
  TURRET_BASE,
  WING_FRAMES,
} from './sprites';

export const particleColor = (p: Particle): string => {
  const t = p.life / p.maxLife;
  switch (p.kind) {
    case 'fire':
      return t > 0.7 ? COLORS.fireCore : t > 0.4 ? COLORS.fire : t > 0.2 ? COLORS.orange : COLORS.red;
    case 'smoke':
      return t > 0.6 ? COLORS.smokeLight : COLORS.smoke;
    case 'spark':
      return t > 0.5 ? COLORS.fireCore : COLORS.yellow;
    case 'debris':
      return COLORS.steelDark;
    case 'flash':
      return COLORS.fireCore;
  }
};

/** Draws the whole scene onto a WORLD-sized canvas. Holds no game state. */
export class Renderer {
  private readonly pc: PixelCanvas;
  private readonly background = renderBackground();
  private readonly refineryIntact = renderRefinery(false);
  private readonly refineryDestroyed = renderRefinery(true);

  constructor(ctx: CanvasRenderingContext2D) {
    this.pc = new PixelCanvas(ctx);
  }

  render(state: GameState, aim: Vec2, clock: number): void {
    const { ctx } = this.pc;
    ctx.save();
    if (state.shake > 0) {
      const s = state.shake;
      ctx.translate(Math.round((Math.random() * 2 - 1) * s), Math.round((Math.random() * 2 - 1) * s));
    }
    ctx.drawImage(this.background, 0, 0);
    ctx.drawImage(state.collapse ? this.refineryDestroyed : this.refineryIntact, 0, 0);
    this.drawRefineryEffects(state, clock);
    state.pickups.forEach((p) => this.drawPickup(p, clock));
    state.drones.forEach((d) => this.drawDrone(d));
    this.drawRockets(state, clock);
    this.drawBullets(state);
    if (state.collapse) {
      const { lid } = state.collapse;
      this.pc.spriteRotated(LID_SPRITE, lid.pos.x, lid.pos.y, lid.angle);
    }
    this.drawTurret(state);
    state.particles.forEach((p) => this.drawParticle(p));
    state.floaters.forEach((f) => this.drawFloater(f));
    ctx.restore();

    if (state.phase === 'playing') this.drawCrosshair(aim);
    this.drawOffscreenLidMarker(state);
  }

  private drawRefineryEffects(state: GameState, clock: number): void {
    const pc = this.pc;
    // Gas flare.
    const flicker = Math.floor(clock * 12) % 3;
    const { x, y } = FLARE_TIP;
    pc.rect(x - 2, y - 4 - flicker, 4, 4 + flicker, COLORS.orange);
    pc.rect(x - 1, y - 7 - flicker, 2, 4, COLORS.fire);
    pc.rect(x - 1, y - 2, 2, 2, COLORS.fireCore);
    if (Math.floor(clock * 1.5) % 2 === 0) {
      AVIATION_LIGHTS.forEach((l) => pc.pixel(l.x, l.y, COLORS.red));
    }
    for (const fire of state.fires) {
      const h = 2 + (Math.floor(clock * 10 + fire.seed) % 3);
      pc.rect(fire.pos.x - 2, fire.pos.y - h + 1, 4, h, COLORS.orange);
      pc.rect(fire.pos.x - 1, fire.pos.y - h, 2, h, COLORS.fire);
      pc.pixel(fire.pos.x, fire.pos.y, COLORS.fireCore);
    }
  }

  private drawDrone(drone: Drone): void {
    const frame = Math.floor(drone.age * 20) % 2;
    if (drone.kind === 'quad') {
      const sprite = QUAD_FRAMES[frame];
      if (drone.mode === 'falling') this.pc.spriteRotated(sprite, drone.pos.x, drone.pos.y, drone.angle);
      else this.pc.spriteCentered(sprite, drone.pos.x, drone.pos.y);
      return;
    }
    if (drone.mode === 'cruise') {
      const frames = drone.vel.x >= 0 ? WING_FRAMES.right : WING_FRAMES.left;
      this.pc.spriteCentered(frames[frame], drone.pos.x, drone.pos.y);
      return;
    }
    const heading = drone.mode === 'falling' ? drone.angle : Math.atan2(drone.vel.y, drone.vel.x);
    this.pc.spriteRotated(WING_FRAMES.right[frame], drone.pos.x, drone.pos.y, heading);
  }

  private drawPickup(pickup: Pickup, clock: number): void {
    const blinking = pickup.landed && pickup.ttl < PICKUPS.blinkTime;
    if (blinking && Math.floor(clock * 8) % 2 === 0) return;
    const crate = pickup.kind === 'ammo' ? AMMO_CRATE : ROCKET_CRATE;
    const x = Math.round(pickup.pos.x);
    const y = Math.round(pickup.pos.y);
    this.pc.spriteCentered(crate, x, y);
    if (!pickup.landed) {
      const sway = Math.round(Math.sin(clock * 3 + pickup.id) * 1);
      this.pc.sprite(PARACHUTE, x - 5 + sway, y - 2 - PARACHUTE.height);
    }
  }

  private drawRockets(state: GameState, clock: number): void {
    for (const rocket of state.rockets) {
      this.pc.spriteRotated(ROCKET, rocket.pos.x, rocket.pos.y, rocket.angle);
      const back = 4 + (Math.floor(clock * 30) % 2);
      this.pc.pixel(
        rocket.pos.x - Math.cos(rocket.angle) * back,
        rocket.pos.y - Math.sin(rocket.angle) * back,
        COLORS.fire,
      );
    }
  }

  private drawBullets(state: GameState): void {
    for (const b of state.bullets) {
      this.pc.line(b.pos.x, b.pos.y, b.pos.x - b.vel.x * 0.012, b.pos.y - b.vel.y * 0.012, COLORS.yellow);
    }
  }

  private drawTurret(state: GameState): void {
    const { turret } = state;
    const pivot = turretPivot(turret);
    const muzzle = muzzlePosition(turret);
    // Twin barrels, offset perpendicular to the aim direction.
    const nx = -Math.sin(turret.angle);
    const ny = Math.cos(turret.angle);
    for (const side of [-1.5, 1.5]) {
      const ox = Math.round(nx * side);
      const oy = Math.round(ny * side);
      this.pc.line(pivot.x + ox, pivot.y + oy, muzzle.x + ox, muzzle.y + oy, COLORS.black);
    }
    this.pc.line(pivot.x, pivot.y, pivot.x + (muzzle.x - pivot.x) * 0.6, pivot.y + (muzzle.y - pivot.y) * 0.6, COLORS.oliveDark);
    this.pc.sprite(TURRET_BASE, turret.x - Math.floor(TURRET_BASE.width / 2), WORLD.groundY - TURRET_BASE.height + 1);
  }

  private drawParticle(p: Particle): void {
    const color = particleColor(p);
    if (p.kind === 'flash') {
      const r = Math.max(1, Math.round(p.size * (p.life / p.maxLife)));
      this.pc.rect(p.pos.x - r, p.pos.y - r + 1, r * 2, r * 2 - 2, color);
      this.pc.rect(p.pos.x - r + 1, p.pos.y - r, r * 2 - 2, r * 2, color);
      return;
    }
    this.pc.rect(p.pos.x, p.pos.y, p.size, p.size, color);
  }

  private drawFloater(floater: Floater): void {
    const color = floater.kind === 'ammo' ? COLORS.yellow : COLORS.red;
    const icon = floater.kind === 'ammo' ? AMMO_CRATE : ROCKET_CRATE;
    const text = `+${floater.amount}`;
    this.pc.text(text, floater.pos.x - 3, floater.pos.y, color, COLORS.black);
    this.pc.spriteCentered(icon, floater.pos.x + textWidth(text) / 2 + 2, floater.pos.y + 2);
  }

  private drawCrosshair(aim: Vec2): void {
    const x = Math.round(aim.x);
    const y = Math.round(aim.y);
    const c = COLORS.white;
    this.pc.rect(x - 4, y, 3, 1, c);
    this.pc.rect(x + 2, y, 3, 1, c);
    this.pc.rect(x, y - 4, 1, 3, c);
    this.pc.rect(x, y + 2, 1, 3, c);
  }

  /** Small arrow at the top edge while the flying lid is above the screen. */
  private drawOffscreenLidMarker(state: GameState): void {
    const lid = state.collapse?.lid;
    if (!lid || lid.pos.y > 0) return;
    const x = Math.round(lid.pos.x);
    this.pc.pixel(x, 1, COLORS.yellow);
    this.pc.rect(x - 1, 2, 3, 1, COLORS.yellow);
    this.pc.rect(x - 2, 3, 5, 1, COLORS.yellow);
  }
}
