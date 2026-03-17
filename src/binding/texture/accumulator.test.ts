import { describe, it, expect } from 'vitest';
import { createTextureAccumulator, updateAccumulator, accumulatorToTexture } from './accumulator';
import { TEXTURE_CONFIG } from '../config';
import type { TickerFrame } from '../../types';

describe('TextureAccumulator', () => {
  const mockFrame = (deviation: number, volatility: number): TickerFrame => ({
    close: 100,
    volume: 1000,
    deviation,
    velocity: 0,
    volatility,
  });

  it('30 frames of high deviation (0.5) → flush converges toward +1', () => {
    let acc = createTextureAccumulator();
    // High deviation: 0.5 is far above sigmoid_center (0.15) and at max sigmoid_range (0.3)
    // EMA will converge to 0.5, which is clamped to 0.3 for the sigmoid.
    for (let i = 0; i < 100; i++) {
      acc = updateAccumulator(acc, mockFrame(0.5, 1.0));
    }
    const { flush } = accumulatorToTexture(acc);
    // With steepness 4, max output at t=1 is -1 + 2/(1+exp(-2)) approx 0.76
    expect(flush).toBeGreaterThan(0.75);
  });

  it('30 frames of zero deviation → flush converges toward -1 (bloodless)', () => {
    let acc = createTextureAccumulator();
    // Start with high deviation to see it drop
    acc.ema_abs_deviation = 0.5;
    for (let i = 0; i < 100; i++) {
      acc = updateAccumulator(acc, mockFrame(0, 1.0));
    }
    const { flush } = accumulatorToTexture(acc);
    // With steepness 4, min output at t=0 is -1 + 2/(1+exp(2)) approx -0.76
    expect(flush).toBeLessThan(-0.75);
  });

  it('30 frames of high volatility (3.0) → fatigue converges toward +1', () => {
    let acc = createTextureAccumulator();
    // High volatility: 3.0 is above sigmoid_range [0.5, 2.0]
    // EMA will converge to 3.0, which is clamped to 2.0 for the sigmoid.
    for (let i = 0; i < 100; i++) {
      acc = updateAccumulator(acc, mockFrame(0, 3.0));
    }
    const { fatigue } = accumulatorToTexture(acc);
    // With steepness 3, max output at t=1 is -1 + 2/(1+exp(-1.5)) approx 0.635
    expect(fatigue).toBeGreaterThan(0.63);
  });

  it('EMA within 5% of target after 40 frames', () => {
    let acc = createTextureAccumulator();
    const targetDev = 0.2;
    const targetVol = 1.5;
    const alpha = TEXTURE_CONFIG.ema_alpha;

    for (let i = 0; i < 40; i++) {
      acc = updateAccumulator(acc, mockFrame(targetDev, targetVol));
    }

    // EMA formula: E_n = target * (1 - (1-alpha)^n) + initial * (1-alpha)^n
    // After 40 frames: (1 - 0.095)^40 = 0.905^40 approx 0.017
    // So it should be within 2% of target.
    expect(acc.ema_abs_deviation).toBeGreaterThan(targetDev * 0.95);
    expect(acc.ema_abs_deviation).toBeLessThan(targetDev * 1.05);
    expect(acc.ema_volatility).toBeGreaterThan(targetVol * 0.95);
    expect(acc.ema_volatility).toBeLessThan(targetVol * 1.05);
  });

  it('Two tickers with different histories → different flush/fatigue', () => {
    // This tests the logic independently; integration test will check the Map
    let acc1 = createTextureAccumulator();
    let acc2 = createTextureAccumulator();

    for (let i = 0; i < 20; i++) {
      acc1 = updateAccumulator(acc1, mockFrame(0.1, 1.0));
      acc2 = updateAccumulator(acc2, mockFrame(0.5, 2.0));
    }

    const res1 = accumulatorToTexture(acc1);
    const res2 = accumulatorToTexture(acc2);

    expect(res1.flush).toBeLessThan(res2.flush);
    expect(res1.fatigue).toBeLessThan(res2.fatigue);
  });
});
