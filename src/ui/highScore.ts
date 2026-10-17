const KEY = 'kapotnya.best';

/** Best score persistence; tolerates missing or blocked storage (private mode, etc). */
export class HighScore {
  private best: number;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
    this.best = this.read();
  }

  get value(): number {
    return this.best;
  }

  /** Records a finished run; returns true when it set a new record. */
  submit(score: number): boolean {
    if (score <= this.best) return false;
    this.best = score;
    try {
      this.storage?.setItem(KEY, String(score));
    } catch {
      // Storage may be full or disabled — the record still lives for this session.
    }
    return true;
  }

  private read(): number {
    try {
      const parsed = Number.parseInt(this.storage?.getItem(KEY) ?? '', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }
}

export const browserStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
