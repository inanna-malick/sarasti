import { describe, it, expect, beforeEach } from 'vitest';
import { createGazeResolver, DEFAULT_GAZE_CONFIG } from '../gaze';

describe('Gaze Binding Module (chord-based)', () => {
  let resolver: ReturnType<typeof createGazeResolver>;

  beforeEach(() => {
    resolver = createGazeResolver();
  });

  const zeroGaze = { gazeH: 0, gazeV: 0 };

  it('zero chord gaze → eyes centered (0, 0)', () => {
    const { leftEye, rightEye } = resolver.resolve('AAPL', zeroGaze);
    expect(leftEye).toEqual([0, 0]);
    expect(rightEye).toEqual([0, 0]);
  });

  it('positive gazeH → eyes look right', () => {
    const { leftEye } = resolver.resolve('AAPL', { gazeH: 0.1, gazeV: 0 });
    expect(leftEye[0]).toBeGreaterThan(0);
    expect(leftEye[0]).toBeCloseTo(0.1, 5);
    expect(leftEye[1]).toBe(0);
  });

  it('negative gazeH → eyes look left', () => {
    const { leftEye } = resolver.resolve('AAPL', { gazeH: -0.1, gazeV: 0 });
    expect(leftEye[0]).toBeLessThan(0);
    expect(leftEye[0]).toBeCloseTo(-0.1, 5);
  });

  it('positive gazeV → eyes look up', () => {
    const { leftEye } = resolver.resolve('AAPL', { gazeH: 0, gazeV: 0.1 });
    expect(leftEye[1]).toBeGreaterThan(0);
    expect(leftEye[1]).toBeCloseTo(0.1, 5);
  });

  it('negative gazeV → eyes look down', () => {
    const { leftEye } = resolver.resolve('AAPL', { gazeH: 0, gazeV: -0.1 });
    expect(leftEye[1]).toBeLessThan(0);
  });

  it('clamping: extreme values don\'t exceed max ranges', () => {
    const { leftEye } = resolver.resolve('AAPL', { gazeH: 10, gazeV: 10 });
    expect(leftEye[0]).toBeLessThanOrEqual(DEFAULT_GAZE_CONFIG.maxHorizontal);
    expect(leftEye[1]).toBeLessThanOrEqual(DEFAULT_GAZE_CONFIG.maxVertical);
  });

  it('smoothing: rapid changes are dampened', () => {
    resolver.resolve('AAPL', zeroGaze);

    const { leftEye } = resolver.resolve('AAPL', { gazeH: 0.2, gazeV: 0 });

    // alpha = 0.15, smoothed = 0.15 * 0.2 + 0.85 * 0 = 0.03
    expect(leftEye[0]).toBeCloseTo(0.03, 5);
  });

  it('different tickers maintain independent smoothing state', () => {
    resolver.resolve('AAPL', zeroGaze);

    const resMSFT = resolver.resolve('MSFT', { gazeH: 0.2, gazeV: 0 });
    expect(resMSFT.leftEye[0]).toBeCloseTo(0.2, 5); // first call, jumps to target

    const resAAPL = resolver.resolve('AAPL', { gazeH: 0.2, gazeV: 0 });
    expect(resAAPL.leftEye[0]).toBeCloseTo(0.03, 5); // smoothed from 0
  });

  it('reset() clears all state', () => {
    resolver.resolve('AAPL', zeroGaze);
    resolver.reset();

    const { leftEye } = resolver.resolve('AAPL', { gazeH: 0.2, gazeV: 0 });
    expect(leftEye[0]).toBeCloseTo(0.2, 5); // after reset, jumps to target
  });

  it('conjugate gaze: both eyes move together', () => {
    const { leftEye, rightEye } = resolver.resolve('AAPL', { gazeH: 0.1, gazeV: 0.05 });
    expect(leftEye).toEqual(rightEye);
  });
});
