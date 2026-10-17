// @vitest-environment jsdom
import type { Action } from '../../src/input/keymap';
import type { TouchCommand } from '../../src/ui/touchControls';
import { bindTouchControls } from '../../src/ui/touchControls';

const pointer = (type: string): MouseEvent => {
  const event = new MouseEvent(type, { cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
};

describe('bindTouchControls', () => {
  const presses: Array<[Action, boolean]> = [];
  const commands: TouchCommand[] = [];
  let root: HTMLElement;

  beforeEach(() => {
    presses.length = 0;
    commands.length = 0;
    root = document.createElement('div');
    root.innerHTML = `
      <button data-action="left"></button>
      <button data-command="pause"></button>`;
    bindTouchControls(root, {
      press: (action, down) => presses.push([action, down]),
      command: (command) => commands.push(command),
    });
  });

  it('holds an action while the button is pressed', () => {
    const button = root.querySelector<HTMLElement>('[data-action]')!;
    button.dispatchEvent(pointer('pointerdown'));
    expect(button.classList.contains('pressed')).toBe(true);
    button.dispatchEvent(pointer('pointerup'));
    expect(presses).toEqual([
      ['left', true],
      ['left', false],
    ]);
    expect(button.classList.contains('pressed')).toBe(false);
  });

  it('releases on cancel too (e.g. an incoming call)', () => {
    const button = root.querySelector<HTMLElement>('[data-action]')!;
    button.dispatchEvent(pointer('pointerdown'));
    button.dispatchEvent(pointer('pointercancel'));
    expect(presses.at(-1)).toEqual(['left', false]);
  });

  it('fires commands on tap', () => {
    root.querySelector<HTMLElement>('[data-command]')!.dispatchEvent(pointer('pointerdown'));
    expect(commands).toEqual(['pause']);
  });
});
