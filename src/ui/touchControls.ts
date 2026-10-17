import type { Action } from '../input/keymap';

export type TouchCommand = 'pause' | 'mute' | 'fullscreen';

export interface TouchControlHandlers {
  press(action: Action, down: boolean): void;
  command(command: TouchCommand): void;
}

/** Binds on-screen buttons: `data-action` buttons are held, `data-command` buttons are tapped. */
export const bindTouchControls = (root: ParentNode, handlers: TouchControlHandlers): void => {
  root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
    const action = button.dataset.action as Action;
    const release = (): void => {
      button.classList.remove('pressed');
      handlers.press(action, false);
    };
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        button.setPointerCapture?.(e.pointerId);
      } catch {
        // Not capturable (synthetic event) — release handlers still fire on the button.
      }
      button.classList.add('pressed');
      handlers.press(action, true);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  root.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => {
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handlers.command(button.dataset.command as TouchCommand);
    });
  });
};

/** Goes fullscreen and, where allowed, locks landscape. Silently no-ops on unsupported browsers. */
export const toggleFullscreen = async (doc: Document = document): Promise<void> => {
  try {
    if (doc.fullscreenElement) {
      await doc.exitFullscreen();
      return;
    }
    await doc.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    await orientation.lock?.('landscape');
  } catch {
    // iOS Safari and some embedded browsers don't support this — the game still works.
  }
};

export const fullscreenSupported = (doc: Document = document): boolean =>
  typeof doc.documentElement.requestFullscreen === 'function';
