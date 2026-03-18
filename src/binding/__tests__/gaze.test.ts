import { describe, it, expect, beforeEach } from 'vitest';
import { createGazeResolver, DEFAULT_GAZE_CONFIG } from '../gaze';
import type { TickerFrame } from '../../types';

describe('Gaze Binding Module', () => {
  let resolver: ReturnType<typeof createGazeResolver>;

  beforeEach(() => {
    resolver = createGazeResolver();
  });

  const baseFrame: TickerFrame = {
    close: 100,
    volume: 1000,
    deviation: 0,
    velocity: 0,
    volatility: 1, // Neutral volatility: (1 - 1) * 0.5 = 0
    drawdown: 0,
    momentum: 0,
    mean_reversion_z: 0,
    beta: 1,
  };

  it('Zero velocity + neutral volatility -> eyes centered (0, 0)', () => {
    const { leftEye, rightEye } = resolver.resolve('AAPL', baseFrame);
    expect(leftEye).toEqual([0, 0]);
    expect(rightEye).toEqual([0, 0]);
  });

  it('Positive velocity -> eyes look right (positive horizontal)', () => {
    const frame = { ...baseFrame, velocity: 0.1 };
    const { leftEye } = resolver.resolve('AAPL', frame);
    // 0.1 * 2.0 = 0.2
    expect(leftEye[0]).toBeGreaterThan(0);
    expect(leftEye[0]).toBeCloseTo(0.2, 5);
    expect(leftEye[1]).toBe(0);
  });

  it('Negative velocity -> eyes look left (negative horizontal)', () => {
    const frame = { ...baseFrame, velocity: -0.1 };
    const { leftEye } = resolver.resolve('AAPL', frame);
    // -0.1 * 2.0 = -0.2
    expect(leftEye[0]).toBeLessThan(0);
    expect(leftEye[0]).toBeCloseTo(-0.2, 5);
  });

  it('High volatility -> eyes look up (positive vertical)', () => {
    const frame = { ...baseFrame, volatility: 1.5 };
    const { leftEye } = resolver.resolve('AAPL', frame);
    // (1.5 - 1.0) * 0.5 = 0.25
    expect(leftEye[1]).toBeGreaterThan(0);
    expect(leftEye[1]).toBeCloseTo(0.25, 5);
  });

  it('Low volatility -> eyes look down (negative vertical)', () => {
    const frame = { ...baseFrame, volatility: 0.5 };
    const { leftEye } = resolver.resolve('AAPL', frame);
    // (0.5 - 1.0) * 0.5 = -0.25
    expect(leftEye[1]).toBeLessThan(0);
    expect(leftEye[1]).toBeCloseTo(-0.25, 5);
  });

  it("Clamping: extreme values don't exceed max ranges", () => {
    const extremeFrame: TickerFrame = {
      ...baseFrame,
      velocity: 10, // 20.0 (too large)
      volatility: 10, // 4.5 (too large)
    };
    const { leftEye } = resolver.resolve('AAPL', extremeFrame);
    expect(leftEye[0]).toBeLessThanOrEqual(DEFAULT_GAZE_CONFIG.maxHorizontal);
    expect(leftEye[1]).toBeLessThanOrEqual(DEFAULT_GAZE_CONFIG.maxVertical);
    expect(leftEye[0]).toBe(DEFAULT_GAZE_CONFIG.maxHorizontal);
    expect(leftEye[1]).toBe(DEFAULT_GAZE_CONFIG.maxVertical);
  });

  it('Smoothing: rapid changes are dampened', () => {
    // 1st frame: velocity 0 -> horizontal 0
    resolver.resolve('AAPL', baseFrame);
    
    // 2nd frame: sudden jump to velocity 0.1 -> target 0.2
    const frame2 = { ...baseFrame, velocity: 0.1 };
    const { leftEye } = resolver.resolve('AAPL', frame2);
    
    // alpha = 0.15
    // smoothed = 0.15 * 0.2 + (1 - 0.15) * 0 = 0.03
    expect(leftEye[0]).toBeCloseTo(0.03, 5);
  });

  it('Different tickers maintain independent smoothing state', () => {
    resolver.resolve('AAPL', baseFrame); // AAPL currentH = 0
    
    const frameMSFT = { ...baseFrame, velocity: 0.1 }; // MSFT targetH = 0.2
    const resMSFT = resolver.resolve('MSFT', frameMSFT);
    // MSFT is first time, so it jumps to target or should it smooth from 0?
    // My implementation: if !state, it sets it directly.
    expect(resMSFT.leftEye[0]).toBeCloseTo(0.2, 5);
    
    const frameAAPL = { ...baseFrame, velocity: 0.1 }; // AAPL targetH = 0.2
    const resAAPL = resolver.resolve('AAPL', frameAAPL);
    // AAPL was 0, now target 0.2, alpha 0.15 -> 0.03
    expect(resAAPL.leftEye[0]).toBeCloseTo(0.03, 5);
  });

  it('reset() clears all state', () => {
    resolver.resolve('AAPL', baseFrame); // AAPL state initialized to 0
    resolver.reset();
    
    const frameAAPL = { ...baseFrame, velocity: 0.1 };
    const { leftEye } = resolver.resolve('AAPL', frameAAPL);
    // After reset, it should behave like a first call (jump to target)
    expect(leftEye[0]).toBeCloseTo(0.2, 5);
  });

  it('Conjugate gaze: both eyes move together', () => {
    const frame = { ...baseFrame, velocity: 0.1, volatility: 1.2 };
    const { leftEye, rightEye } = resolver.resolve('AAPL', frame);
    expect(leftEye).toEqual(rightEye);
  });
});
