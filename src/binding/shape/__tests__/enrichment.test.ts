import { describe, it, expect } from 'vitest';
import { createShapeResolver } from '../../resolve';
import { DEFAULT_BINDING_CONFIG } from '../../config';
import { TICKERS } from '../../../tickers';
import { N_SHAPE } from '../../../constants';
import type { TickerStatic } from '../../../types';

describe('Shape Enrichment (Tier 2/3 + Sarasti)', () => {
  const resolver = createShapeResolver();

  const mockStatics: TickerStatic = {
    avg_volume: 150000,
    hist_volatility: 0.03,
    corr_to_brent: 0.9,
    corr_to_spy: 0.2,
    skewness: -0.5,
    spread_from_family: 0.05,
    shape_residuals: new Array(50).fill(0.1),
  };

  it('enriched shapes use more non-zero β dimensions than basic shapes', () => {
    const ticker = TICKERS[0];
    const basicShape = resolver.resolve(ticker);
    const enrichedShape = resolver.resolve(ticker, mockStatics);

    const basicNonZero = basicShape.filter(v => Math.abs(v) > 0.0001).length;
    const enrichedNonZero = enrichedShape.filter(v => Math.abs(v) > 0.0001).length;

    expect(enrichedNonZero).toBeGreaterThan(basicNonZero);
    // Basic shape uses β₀₋₈ (9 components). Enriched should use significantly more.
    expect(basicNonZero).toBeLessThanOrEqual(9);
    expect(enrichedNonZero).toBeGreaterThan(15);
  });

  it('different statics produce different shapes for the same ticker', () => {
    const ticker = TICKERS[0];
    const staticsA: TickerStatic = { ...mockStatics, avg_volume: 50000 };
    const staticsB: TickerStatic = { ...mockStatics, avg_volume: 150000 };

    const shapeA = resolver.resolve(ticker, staticsA);
    const shapeB = resolver.resolve(ticker, staticsB);

    let diff = 0;
    for (let i = 0; i < N_SHAPE; i++) {
      diff += Math.abs(shapeA[i] - shapeB[i]);
    }
    expect(diff).toBeGreaterThan(0.01);
  });

  it('Sarasti residuals are correctly injected into β₅₁₋₁₀₀', () => {
    const ticker = TICKERS[0];
    const residuals = new Array(50).fill(0).map((_, i) => i * 0.01);
    const statics: TickerStatic = { ...mockStatics, shape_residuals: residuals };

    const shape = resolver.resolve(ticker, statics);

    for (let i = 0; i < 50; i++) {
      // residual_indices start at 51 (β₅₁) but mapStaticsToShape uses index 50 (β₅₀)
      // Wait, let's check resolve.ts: const residualStart = 50; // β₅₁₋₁₀₀
      // In JS array, index 50 is β₅₀. FLAME indices are 0-based.
      // β₀ is index 0. β₅₀ is index 50.
      expect(shape[50 + i]).toBeCloseTo(residuals[i]);
    }
  });

  it('tier intensities scale the perturbations correctly', () => {
    const ticker = TICKERS[0];
    const statics: TickerStatic = { ...mockStatics, shape_residuals: undefined };
    
    // Custom tier intensities: zero out tier 2 and 3
    const resolverZero = createShapeResolver({
      ...DEFAULT_BINDING_CONFIG,
      tier_intensities: [1.0, 0, 0, 1.0],
    });

    const shapeZero = resolverZero.resolve(ticker, statics);

    // Indices for tier 2 and 3 should be zero in the result if they were zero before
    // (Note: some might be used by class/family identity, but the statics ones specifically should be zero)
    // Actually, we can check the difference between with and without statics when intensity is zero.
    const shapeNoStatics = resolverZero.resolve(ticker);

    for (let i = 0; i < N_SHAPE; i++) {
      expect(shapeZero[i]).toBe(shapeNoStatics[i]);
    }
  });
});
