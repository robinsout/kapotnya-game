import { WORLD } from '../config';
import type { InputState } from '../game/types';
import { clientToWorld } from './coords';
import type { Action } from './keymap';
import { actionsFor } from './keymap';

type CommandListener = (command: 'pause' | 'mute') => void;

/**
 * Collects keyboard/pointer state. Edge-triggered actions (rocket, start) stay
 * pending until a simulation step consumes them, so no press is lost between frames.
 */
export class InputController {
  private readonly held = new Set<Action>();
  /** Pointers (mouse button or fingers) currently holding fire on the canvas. */
  private readonly firingPointers = new Set<number>();
  private pendingRocket = false;
  private pendingStart = false;
  private readonly aim = { x: WORLD.width / 2, y: 40 };
  private readonly listeners: CommandListener[] = [];
  private readonly disposers: Array<() => void> = [];

  constructor(private readonly canvas: HTMLCanvasElement) {}

  attach(target: Window = window): void {
    this.listen(target, 'keydown', (e) => this.onKey(e as KeyboardEvent, true));
    this.listen(target, 'keyup', (e) => this.onKey(e as KeyboardEvent, false));
    this.listen(target, 'blur', () => this.releaseAll());
    this.listen(this.canvas, 'pointermove', (e) => this.onPointerMove(e as PointerEvent));
    this.listen(this.canvas, 'pointerdown', (e) => this.onPointerDown(e as PointerEvent));
    // Pointers are captured on press, so release always arrives at the canvas.
    this.listen(this.canvas, 'pointerup', (e) => this.releasePointer(e as PointerEvent));
    this.listen(this.canvas, 'pointercancel', (e) => this.releasePointer(e as PointerEvent));
    this.listen(this.canvas, 'lostpointercapture', (e) => this.releasePointer(e as PointerEvent));
    this.listen(this.canvas, 'contextmenu', (e) => e.preventDefault());
  }

  detach(): void {
    this.disposers.splice(0).forEach((dispose) => dispose());
  }

  onCommand(listener: CommandListener): void {
    this.listeners.push(listener);
  }

  /** Used by on-screen touch buttons. */
  press(action: Action, down: boolean): void {
    this.setAction(action, down);
  }

  sample(): InputState {
    const left = this.held.has('left') ? 1 : 0;
    const right = this.held.has('right') ? 1 : 0;
    return {
      moveX: right - left,
      aim: { ...this.aim },
      fire: this.firingPointers.size > 0 || this.held.has('fire'),
      rocket: this.pendingRocket,
      start: this.pendingStart,
    };
  }

  /** Call after a simulation step has seen the current edge-triggered input. */
  consumeEdges(): void {
    this.pendingRocket = false;
    this.pendingStart = false;
  }

  get aimPoint(): Readonly<{ x: number; y: number }> {
    return this.aim;
  }

  private listen(target: EventTarget, type: string, handler: (e: Event) => void): void {
    target.addEventListener(type, handler);
    this.disposers.push(() => target.removeEventListener(type, handler));
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    const actions = actionsFor(e.code);
    if (actions.length === 0) return;
    e.preventDefault();
    if (down && e.repeat) return;
    actions.forEach((action) => this.setAction(action, down));
  }

  private setAction(action: Action, down: boolean): void {
    if (action === 'pause' || action === 'mute') {
      if (down) this.listeners.forEach((l) => l(action));
      return;
    }
    if (down) {
      if (action === 'rocket') this.pendingRocket = true;
      if (action === 'start') this.pendingStart = true;
      this.held.add(action);
    } else {
      this.held.delete(action);
    }
  }

  private updateAim(e: PointerEvent): void {
    const point = clientToWorld(e.clientX, e.clientY, this.canvas.getBoundingClientRect(), WORLD.width, WORLD.height);
    this.aim.x = point.x;
    this.aim.y = point.y;
  }

  private onPointerMove(e: PointerEvent): void {
    // A finger only aims while it is down; a mouse aims just by hovering.
    if (e.pointerType === 'touch' && !this.firingPointers.has(e.pointerId)) return;
    this.updateAim(e);
  }

  private onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.updateAim(e);
    this.pendingStart = true;
    if (e.button === 2) {
      this.pendingRocket = true;
      return;
    }
    this.firingPointers.add(e.pointerId);
    try {
      this.canvas.setPointerCapture?.(e.pointerId);
    } catch {
      // Synthetic events (tests, some browsers) can't be captured — release still works.
    }
  }

  private releasePointer(e: PointerEvent): void {
    this.firingPointers.delete(e.pointerId);
  }

  private releaseAll(): void {
    this.held.clear();
    this.firingPointers.clear();
  }
}
