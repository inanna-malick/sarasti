import type { PlaybackState } from '../types';

export type FrameChangeCallback = (index: number) => void;

/**
 * Manages PlaybackState and requestAnimationFrame loop.
 *
 * Responsibilities:
 * - Owns the rAF loop: when playing, advances current_index based on speed.
 * - speed = seconds of wall-clock per hour of data (1 = 1sec/hr).
 *   The dataset has ~1hr resolution, so speed≈1 means ~1 frame/sec.
 * - Fires onFrameChange(index) whenever current_index changes.
 * - Supports play(), pause(), seek(index), seekToTime(isoString), setSpeed(), setLoop().
 * - Clamps index to [0, frameCount-1]. If loop=true, wraps around.
 *
 * The engine does NOT know about rendering, data loading, or binding.
 * It only manages frame index progression and notifies listeners.
 *
 * Usage:
 *   const engine = new TimelineEngine(dataset.frames.length);
 *   engine.onFrameChange((index) => { ... });
 *   engine.play();
 *   // in cleanup:
 *   engine.dispose();
 *
 * Integration with store:
 *   The frame driver or App should sync engine state → store.
 *   Engine is the source of truth for playback timing.
 *   Store is the source of truth for UI display.
 */
export class TimelineEngine {
  private _state: PlaybackState;
  private _frameCount: number;
  private _listeners: FrameChangeCallback[] = [];
  private _rafId: number | null = null;
  private _lastTimestamp: number = 0;
  private _accumulator: number = 0;

  constructor(frameCount: number) {
    this._frameCount = frameCount;
    this._state = {
      current_index: 0,
      playing: false,
      speed: 1,
      loop: true,
    };
  }

  get state(): PlaybackState {
    return { ...this._state };
  }

  get frameCount(): number {
    return this._frameCount;
  }

  onFrameChange(cb: FrameChangeCallback): void {
    this._listeners.push(cb);
  }

  play(): void {
    if (this._state.playing) return;
    this._state.playing = true;
    this._lastTimestamp = performance.now();
    this._accumulator = 0;
    this._tick();
  }

  pause(): void {
    this._state.playing = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  seek(index: number): void {
    const clamped = Math.max(0, Math.min(index, this._frameCount - 1));
    if (clamped !== this._state.current_index) {
      this._state.current_index = clamped;
      this._notifyListeners();
    }
  }

  setSpeed(speed: number): void {
    this._state.speed = speed;
  }

  setLoop(loop: boolean): void {
    this._state.loop = loop;
  }

  dispose(): void {
    this.pause();
    this._listeners = [];
  }

  private _tick = (): void => {
    if (!this._state.playing) return;

    const now = performance.now();
    const dt = (now - this._lastTimestamp) / 1000; // seconds
    this._lastTimestamp = now;

    // speed = seconds of wall-clock per hour of data
    // Each frame ≈ 1 hour of data.
    // So interval between frames = speed seconds.
    const interval = this._state.speed;
    this._accumulator += dt;

    if (this._accumulator >= interval) {
      // Advance by however many frames accumulated (handles lag)
      const steps = Math.floor(this._accumulator / interval);
      this._accumulator -= steps * interval;

      let newIndex = this._state.current_index + steps;

      if (newIndex >= this._frameCount) {
        if (this._state.loop) {
          newIndex = newIndex % this._frameCount;
        } else {
          newIndex = this._frameCount - 1;
          this.pause();
        }
      }

      if (newIndex !== this._state.current_index) {
        this._state.current_index = newIndex;
        this._notifyListeners();
      }
    }

    this._rafId = requestAnimationFrame(this._tick);
  };

  private _notifyListeners(): void {
    for (const cb of this._listeners) {
      cb(this._state.current_index);
    }
  }
}
