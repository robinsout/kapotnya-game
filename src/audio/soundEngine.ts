import type { GameEvent } from '../game/types';
import type { NoiseSpec, SoundSpec, ToneSpec } from './sounds';
import { MIN_INTERVAL, SOUND_RECIPES } from './sounds';

/** Synthesises every sound on the fly with WebAudio — no asset files needed. */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly lastPlayed = new Map<GameEvent, number>();
  muted = false;

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.createNoiseBuffer(this.ctx);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  play(events: readonly GameEvent[]): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || events.length === 0) return;
    const now = ctx.currentTime;
    for (const event of new Set(events)) {
      const minInterval = MIN_INTERVAL[event] ?? 0;
      if (now - (this.lastPlayed.get(event) ?? -Infinity) < minInterval) continue;
      this.lastPlayed.set(event, now);
      SOUND_RECIPES[event].forEach((spec) => this.playSpec(ctx, spec, now));
    }
  }

  private playSpec(ctx: AudioContext, spec: SoundSpec, at: number): void {
    if (spec.type === 'tone') this.playTone(ctx, spec, at);
    else this.playNoise(ctx, spec, at);
  }

  private envelope(ctx: AudioContext, volume: number, duration: number, at: number): GainNode {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    gain.connect(this.master!);
    return gain;
  }

  private playTone(ctx: AudioContext, spec: ToneSpec, at: number): void {
    const osc = ctx.createOscillator();
    osc.type = spec.wave;
    osc.frequency.setValueAtTime(spec.from, at);
    osc.frequency.exponentialRampToValueAtTime(spec.to, at + spec.duration);
    osc.connect(this.envelope(ctx, spec.volume, spec.duration, at));
    osc.start(at);
    osc.stop(at + spec.duration);
  }

  private playNoise(ctx: AudioContext, spec: NoiseSpec, at: number): void {
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spec.cutoff;
    source.connect(filter);
    filter.connect(this.envelope(ctx, spec.volume, spec.duration, at));
    source.start(at);
    source.stop(at + spec.duration);
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
