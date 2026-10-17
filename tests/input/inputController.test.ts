// @vitest-environment jsdom
import { InputController } from '../../src/input/inputController';

/** jsdom lacks PointerEvent, so decorate a MouseEvent with pointer fields. */
const pointer = (
  type: string,
  init: MouseEventInit & { pointerId?: number; pointerType?: string } = {},
): MouseEvent => {
  const event = new MouseEvent(type, { cancelable: true, ...init });
  Object.defineProperty(event, 'pointerId', { value: init.pointerId ?? 1 });
  Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' });
  return event;
};

const key = (type: 'keydown' | 'keyup', code: string, repeat = false) =>
  new KeyboardEvent(type, { code, repeat, cancelable: true });

describe('InputController', () => {
  let canvas: HTMLCanvasElement;
  let controller: InputController;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 360 }) as DOMRect;
    controller = new InputController(canvas);
    controller.attach(window);
  });

  afterEach(() => controller.detach());

  it('combines held movement keys', () => {
    window.dispatchEvent(key('keydown', 'KeyD'));
    expect(controller.sample().moveX).toBe(1);
    window.dispatchEvent(key('keydown', 'ArrowLeft'));
    expect(controller.sample().moveX).toBe(0);
    window.dispatchEvent(key('keyup', 'KeyD'));
    expect(controller.sample().moveX).toBe(-1);
  });

  it('keeps edge-triggered actions until consumed', () => {
    window.dispatchEvent(key('keydown', 'Space'));
    window.dispatchEvent(key('keyup', 'Space'));
    expect(controller.sample()).toMatchObject({ rocket: true, start: true });
    expect(controller.sample().rocket).toBe(true);
    controller.consumeEdges();
    expect(controller.sample()).toMatchObject({ rocket: false, start: false });
  });

  it('ignores key auto-repeat for edge actions', () => {
    window.dispatchEvent(key('keydown', 'Enter', true));
    expect(controller.sample().start).toBe(false);
  });

  it('aims and fires with the pointer', () => {
    canvas.dispatchEvent(pointer('pointermove', { clientX: 320, clientY: 90 }));
    expect(controller.sample().aim).toEqual({ x: 160, y: 45 });

    canvas.dispatchEvent(pointer('pointerdown', { button: 0, clientX: 0, clientY: 0 }));
    expect(controller.sample()).toMatchObject({ fire: true, start: true, rocket: false });
    canvas.dispatchEvent(pointer('pointerup', { button: 0 }));
    expect(controller.sample().fire).toBe(false);
  });

  it('launches a rocket with the right mouse button', () => {
    canvas.dispatchEvent(pointer('pointerdown', { button: 2 }));
    expect(controller.sample()).toMatchObject({ fire: false, rocket: true });
  });

  it('tracks several fingers independently', () => {
    canvas.dispatchEvent(pointer('pointerdown', { pointerId: 7, pointerType: 'touch' }));
    canvas.dispatchEvent(pointer('pointerdown', { pointerId: 8, pointerType: 'touch' }));
    canvas.dispatchEvent(pointer('pointerup', { pointerId: 7, pointerType: 'touch' }));
    expect(controller.sample().fire).toBe(true);
    canvas.dispatchEvent(pointer('pointercancel', { pointerId: 8, pointerType: 'touch' }));
    expect(controller.sample().fire).toBe(false);
  });

  it('keeps firing while an on-screen button is released elsewhere', () => {
    canvas.dispatchEvent(pointer('pointerdown', { pointerId: 3, pointerType: 'touch' }));
    controller.press('left', true);
    window.dispatchEvent(pointer('pointerup', { pointerId: 4, pointerType: 'touch' }));
    controller.press('left', false);
    expect(controller.sample().fire).toBe(true);
  });

  it('aims with a finger only while it is touching', () => {
    canvas.dispatchEvent(pointer('pointermove', { clientX: 320, clientY: 90, pointerType: 'touch', pointerId: 5 }));
    expect(controller.sample().aim).not.toEqual({ x: 160, y: 45 });
    canvas.dispatchEvent(pointer('pointerdown', { clientX: 0, clientY: 0, pointerType: 'touch', pointerId: 5 }));
    canvas.dispatchEvent(pointer('pointermove', { clientX: 320, clientY: 90, pointerType: 'touch', pointerId: 5 }));
    expect(controller.sample().aim).toEqual({ x: 160, y: 45 });
  });

  it('notifies about pause and mute commands', () => {
    const commands: string[] = [];
    controller.onCommand((c) => commands.push(c));
    window.dispatchEvent(key('keydown', 'KeyP'));
    window.dispatchEvent(key('keydown', 'KeyM'));
    expect(commands).toEqual(['pause', 'mute']);
  });

  it('releases everything when the window loses focus', () => {
    window.dispatchEvent(key('keydown', 'KeyA'));
    window.dispatchEvent(new Event('blur'));
    expect(controller.sample().moveX).toBe(0);
  });

  it('supports on-screen buttons', () => {
    controller.press('right', true);
    expect(controller.sample().moveX).toBe(1);
    controller.press('right', false);
    expect(controller.sample().moveX).toBe(0);
  });

  it('stops listening after detach', () => {
    controller.detach();
    window.dispatchEvent(key('keydown', 'KeyD'));
    expect(controller.sample().moveX).toBe(0);
  });
});
