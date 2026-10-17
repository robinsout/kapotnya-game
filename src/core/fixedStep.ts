/**
 * Accumulates variable frame time and reports how many fixed simulation steps to run.
 * Caps the backlog so a backgrounded tab doesn't trigger a "spiral of death".
 */
export class FixedStep {
  private accumulator = 0;

  constructor(
    readonly stepSeconds: number,
    private readonly maxStepsPerFrame = 5,
  ) {}

  advance(frameSeconds: number): number {
    this.accumulator += Math.max(0, frameSeconds);
    let steps = Math.floor(this.accumulator / this.stepSeconds);
    if (steps > this.maxStepsPerFrame) {
      steps = this.maxStepsPerFrame;
      this.accumulator = 0;
    } else {
      this.accumulator -= steps * this.stepSeconds;
    }
    return steps;
  }
}
