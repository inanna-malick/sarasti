import { describe, it, expect } from 'vitest';
import { computeDatasetStats } from '../stats';
import { makeTestDataset } from '../../../test-utils/fixtures';

describe('computeDatasetStats', () => {
  const dataset = makeTestDataset();
  const stats = computeDatasetStats(dataset);

  it('returns stats for each ticker', () => {
    expect(stats.size).toBe(dataset.tickers.length);
    for (const ticker of dataset.tickers) {
      expect(stats.has(ticker.id)).toBe(true);
    }
  });

  it('each ticker has all signal stats', () => {
    const ts = stats.get('TEST_A')!;
    expect(ts).toBeDefined();
    const signals = ['deviation', 'velocity', 'volatility', 'drawdown', 'momentum', 'mean_reversion_z', 'beta'] as const;
    for (const key of signals) {
      expect(ts[key]).toHaveProperty('min');
      expect(ts[key]).toHaveProperty('max');
      expect(ts[key]).toHaveProperty('mean');
      expect(ts[key]).toHaveProperty('std');
    }
  });

  it('min <= mean <= max (within float tolerance)', () => {
    for (const [, ts] of stats) {
      const signals = ['deviation', 'velocity', 'volatility', 'drawdown', 'momentum', 'mean_reversion_z', 'beta'] as const;
      for (const key of signals) {
        const s = ts[key];
        expect(s.min).toBeLessThanOrEqual(s.mean + 1e-10);
        expect(s.mean).toBeLessThanOrEqual(s.max + 1e-10);
      }
    }
  });

  it('std is non-negative', () => {
    for (const [, ts] of stats) {
      const signals = ['deviation', 'velocity', 'volatility', 'drawdown', 'momentum', 'mean_reversion_z', 'beta'] as const;
      for (const key of signals) {
        expect(ts[key].std).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('TEST_A deviation spans a range (crisis ramp)', () => {
    const ts = stats.get('TEST_A')!;
    // Test dataset ramps deviation from 0 to -2 over 10 frames
    expect(ts.deviation.min).toBeLessThan(-1);
    expect(ts.deviation.max).toBeCloseTo(0, 1);
    expect(ts.deviation.std).toBeGreaterThan(0);
  });
});
