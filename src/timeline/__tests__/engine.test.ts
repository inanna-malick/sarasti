import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimelineEngine } from '../engine';

describe('TimelineEngine', () => {
  let engine: TimelineEngine;
  const frameCount = 100;

  beforeEach(() => {
    vi.useFakeTimers();
    // performance.now() returns milliseconds
    let now = 0;
    vi.stubGlobal('performance', { now: () => now });
    
    (global as any).advanceTime = (ms: number) => {
      now += ms;
      vi.advanceTimersByTime(ms);
    };
    
    // requestAnimationFrame mock
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16) as any;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: any) => {
      clearTimeout(id);
    });

    engine = new TimelineEngine(frameCount);
  });

  afterEach(() => {
    engine.dispose();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    expect(engine.state).toEqual({
      current_index: 0,
      playing: false,
      speed: 1,
      loop: true,
    });
    expect(engine.frameCount).toBe(frameCount);
  });

  it('seeks and clamps index', () => {
    engine.seek(50);
    expect(engine.state.current_index).toBe(50);

    engine.seek(-10);
    expect(engine.state.current_index).toBe(0);

    engine.seek(200);
    expect(engine.state.current_index).toBe(99);
  });

  it('notifies listeners on frame change', () => {
    const cb = vi.fn();
    engine.onFrameChange(cb);

    engine.seek(10);
    expect(cb).toHaveBeenCalledWith(10);

    engine.seek(10); // same index, no notify
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('plays and advances frames', () => {
    const cb = vi.fn();
    engine.onFrameChange(cb);
    engine.setSpeed(1); // 1 sec per frame

    engine.play();
    expect(engine.state.playing).toBe(true);

    // Advance 1 second
    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(1);
    expect(cb).toHaveBeenCalledWith(1);

    // Advance 2.5 seconds
    (global as any).advanceTime(2500);
    expect(engine.state.current_index).toBe(3);
    expect(cb).toHaveBeenLastCalledWith(3);
  });

  it('pauses playback', () => {
    engine.play();
    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(1);

    engine.pause();
    expect(engine.state.playing).toBe(false);

    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(1);
  });

  it('handles loop wrapping', () => {
    engine.seek(99);
    engine.setLoop(true);
    engine.setSpeed(1);
    engine.play();

    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(0);
  });

  it('stops at end when loop is false', () => {
    engine.seek(98);
    engine.setLoop(false);
    engine.setSpeed(1);
    engine.play();

    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(99);
    expect(engine.state.playing).toBe(true);

    (global as any).advanceTime(1000);
    expect(engine.state.current_index).toBe(99);
    expect(engine.state.playing).toBe(false);
  });

  it('handles high speed (skipping frames)', () => {
    engine.setSpeed(10); // 10 frames per second (interval = 0.1s)
    engine.play();

    (global as any).advanceTime(500); // 0.5s = 5 frames
    expect(engine.state.current_index).toBe(5);
  });

  it('handles multiple listeners', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    engine.onFrameChange(cb1);
    engine.onFrameChange(cb2);

    engine.seek(5);
    expect(cb1).toHaveBeenCalledWith(5);
    expect(cb2).toHaveBeenCalledWith(5);
  });

  it('disposes and stops rAF', () => {
    engine.play();
    const rafSpy = vi.spyOn(global, 'cancelAnimationFrame');
    engine.dispose();
    expect(engine.state.playing).toBe(false);
    expect(rafSpy).toHaveBeenCalled();
  });
});
