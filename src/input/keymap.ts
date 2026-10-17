export type Action = 'left' | 'right' | 'fire' | 'rocket' | 'start' | 'pause' | 'mute';

/** Keyboard bindings by `KeyboardEvent.code` (layout independent — works with ЙЦУКЕН too). */
export const KEYMAP: Readonly<Record<string, readonly Action[]>> = {
  ArrowLeft: ['left'],
  KeyA: ['left'],
  ArrowRight: ['right'],
  KeyD: ['right'],
  Space: ['rocket', 'start'],
  KeyW: ['rocket'],
  ArrowUp: ['rocket'],
  KeyF: ['fire'],
  Enter: ['start'],
  KeyP: ['pause'],
  Escape: ['pause'],
  KeyM: ['mute'],
};

export const actionsFor = (code: string): readonly Action[] => KEYMAP[code] ?? [];
