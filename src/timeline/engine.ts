import type { PlaybackState } from '../types';

export type FrameChangeCallback = (index: number) => void;
/** Called every rAF with fractional position (e.g. 5.3 = 30% between frame 5 and 6). */
export type ContinuousCallback = (position: number) => void;

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
  private _continuousListeners: ContinuousCallback[] = [];
  private _rafId: number | null = null;
  private _lastTimestamp: number = 0;
  private _accumulator: number = 0;
  private _fractional: number = 0;

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

  /** Register a continuous callback — fires every rAF with fractional position. */
  onContinuous(cb: ContinuousCallback): void {
    this._continuousListeners.push(cb);
  }

  /** Current fractional position (e.g. 5.3). */
  get fractionalPosition(): number {
    return this._state.current_index + this._fractional;
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
      this._fractional = 0;
      this._accumulator = 0;
      this._notifyListeners();
      this._notifyContinuous();
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

    // speed = playback multiplier (1x = 1 frame/sec, 4x = 4 frames/sec)
    // interval = seconds between frames = 1/speed
    const interval = 1 / this._state.speed;
    this._accumulator += dt;

    // Compute fractional progress within current frame
    this._fractional = Math.min(this._accumulator / interval, 1);

    if (this._accumulator >= interval) {
      // Advance by however many frames accumulated (handles lag)
      const steps = Math.floor(this._accumulator / interval);
      this._accumulator -= steps * interval;
      this._fractional = this._accumulator / interval;

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

    // Always notify continuous listeners with fractional position
    this._notifyContinuous();

    this._rafId = requestAnimationFrame(this._tick);
  };

  private _notifyListeners(): void {
    for (const cb of this._listeners) {
      cb(this._state.current_index);
    }
  }

  private _notifyContinuous(): void {
    const pos = this._state.current_index + this._fractional;
    for (const cb of this._continuousListeners) {
      cb(pos);
    }
  }
}
