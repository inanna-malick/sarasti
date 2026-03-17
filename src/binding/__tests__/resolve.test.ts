import { describe, it, expect } from 'vitest';
import { resolve, createShapeResolver, createExpressionResolver, createResolver } from '../resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { TICKERS } from '../../tickers';
import { DEFAULT_BINDING_CONFIG } from '../config';
import type { TickerStatic } from '../../types';
import { vi } from 'vitest';

// Mock directions so baseline tests have non-zero results
vi.mock('../directions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../directions')>();
  return {
    ...actual,
    getTable: (axis: string) => ({
      axis,
      space: axis === 'age' || axis === 'build' ? 'shape' : 'expression',
      dims: 100,
      points: [
        { t: -3, params: new Array(100).fill(0).map((_, i) => (i === 0 && axis === 'age') || (i === 1 && axis === 'build') ? -1 : 0) },
        { t: 3, params: new Array(100).fill(0).map((_, i) => (i === 0 && axis === 'age') || (i === 1 && axis === 'build') ? 1 : 0) },
      ],
    }),
    getIdentityBasis: () => ({
      dims: 100,
      n_basis: 10,
      vectors: new Array(10).fill(0).map((_, b) => 
        new Array(100).fill(0).map((_, i) => i === 10 + b ? 1 : 0)
      ),
    }),
  };
});

describe('resolve', () => {
  it('zero deviation → near-zero expression', () => {
    const ticker = TEST_TICKERS[0]; // energy, age 20
    const frame = makeTickerFrame({ deviation: 0, velocity: 0, volatility: 1 });
    const result = resolve(ticker, frame);

    expect(result.expression.length).toBe(N_EXPR);
    // All expression components should be near zero for zero deviation
    const maxExpr = Math.max(...Array.from(result.expression).map(Math.abs));
    expect(maxExpr).toBeLessThan(0.1);
  });

  it('high negative deviation → nonzero expression', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -2.5, velocity: -1, volatility: 3 });
    const result = resolve(ticker, frame);

    const maxExpr = Math.max(...Array.from(result.expression).map(Math.abs));
    expect(maxExpr).toBeGreaterThan(0.1);
  });

  it('shape differs by age', () => {
    const young = TEST_TICKERS[0]; // age 20
    const old = TEST_TICKERS[2];   // age 60
    const frame = makeTickerFrame();

    const resultYoung = resolve(young, frame);
    const resultOld = resolve(old, frame);

    // Shape should differ
    let shapeDist = 0;
    for (let i = 0; i < N_SHAPE; i++) {
      shapeDist += (resultYoung.shape[i] - resultOld.shape[i]) ** 2;
    }
    shapeDist = Math.sqrt(shapeDist);
    expect(shapeDist).toBeGreaterThan(0.5);
  });

  it('shape differs by asset class', () => {
    const energy = TEST_TICKERS[0]; // class: energy
    const fear = TEST_TICKERS[1];   // class: fear

    const resultA = resolve(energy, makeTickerFrame());
    const resultB = resolve(fear, makeTickerFrame());

    let shapeDist = 0;
    for (let i = 0; i < N_SHAPE; i++) {
      shapeDist += (resultA.shape[i] - resultB.shape[i]) ** 2;
    }
    shapeDist = Math.sqrt(shapeDist);
    expect(shapeDist).toBeGreaterThan(0.3);
  });

  it('expression changes with deviation', () => {
    const ticker = TEST_TICKERS[0];
    const calm = resolve(ticker, makeTickerFrame({ deviation: 0 }));
    const crisis = resolve(ticker, makeTickerFrame({ deviation: -2.5 }));

    let exprDist = 0;
    for (let i = 0; i < N_EXPR; i++) {
      exprDist += (calm.expression[i] - crisis.expression[i]) ** 2;
    }
    exprDist = Math.sqrt(exprDist);
    expect(exprDist).toBeGreaterThan(0.3);
  });

  it('returns correct array lengths', () => {
    const result = resolve(TEST_TICKERS[0], makeTickerFrame());
    expect(result.shape.length).toBe(N_SHAPE);
    expect(result.expression.length).toBe(N_EXPR);
  });
});

describe('createShapeResolver', () => {
  it('resolves all 14 tickers without error', () => {
    const resolver = createShapeResolver();
    for (const ticker of TICKERS) {
      const shape = resolver.resolve(ticker);
      expect(shape.length).toBe(N_SHAPE);
      // No NaN or Infinity
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Number.isFinite(shape[i])).toBe(true);
      }
    }
  });

  it('same ticker → same shape (deterministic)', () => {
    const resolver = createShapeResolver();
    const a = resolver.resolve(TICKERS[0]);
    const b = resolver.resolve(TICKERS[0]);
    for (let i = 0; i < N_SHAPE; i++) {
      expect(a[i]).toBe(b[i]);
    }
  });
});

describe('createExpressionResolver', () => {
  it('resolves crisis frames without error', () => {
    const resolver = createExpressionResolver();
    const frames = [
      makeTickerFrame({ deviation: 0, velocity: 0, volatility: 1 }),
      makeTickerFrame({ deviation: -3, velocity: -2, volatility: 4 }),
      makeTickerFrame({ deviation: 2, velocity: 1, volatility: 0.5 }),
    ];
    for (const frame of frames) {
      const expr = resolver.resolve(frame);
      expect(expr.length).toBe(N_EXPR);
      for (let i = 0; i < N_EXPR; i++) {
        expect(Number.isFinite(expr[i])).toBe(true);
      }
    }
  });
});

describe('createResolver (cached)', () => {
  it('caches shape per ticker', () => {
    const resolver = createResolver();
    const frame = makeTickerFrame();
    const a = resolver.resolve(TICKERS[0], frame);
    const b = resolver.resolve(TICKERS[0], frame);
    // Same shape reference (cached)
    expect(a.shape).toBe(b.shape);
  });

  it('different expression for different frames', () => {
    const resolver = createResolver();
    const calm = resolver.resolve(TICKERS[0], makeTickerFrame({ deviation: 0 }));
    const crisis = resolver.resolve(TICKERS[0], makeTickerFrame({ deviation: -2.5 }));
    // Same shape (cached), different expression
    expect(calm.shape).toBe(crisis.shape);
    expect(calm.expression).not.toBe(crisis.expression);
  });

  it('updates flush/fatigue and can be reset', () => {
    const resolver = createResolver();
    const ticker = TICKERS[0];
    
    // Initial resolve
    const first = resolver.resolve(ticker, makeTickerFrame({ deviation: 0, volatility: 1.0 }));
    expect(first.flush).toBeLessThan(0); // Near baseline
    expect(first.fatigue).toBeLessThan(0.1); // Near baseline
    
    // High deviation frames
    for (let i = 0; i < 30; i++) {
      resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    }
    const afterHighDev = resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    expect(afterHighDev.flush).toBeGreaterThan(0.5);
    
    // Reset accumulators
    resolver.resetAccumulators();
    const afterReset = resolver.resolve(ticker, makeTickerFrame({ deviation: 0, volatility: 1.0 }));
    expect(afterReset.flush).toBeLessThan(0); // Back to baseline
  });
});

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

    const basicNonZero = Array.from(basicShape).filter(v => Math.abs(v) > 0.0001).length;
    const enrichedNonZero = Array.from(enrichedShape).filter(v => Math.abs(v) > 0.0001).length;

    expect(enrichedNonZero).toBeGreaterThan(basicNonZero);
    // Basic shape uses β₀₋₈ (9 components). Enriched should use significantly more.
    expect(basicNonZero).toBeLessThanOrEqual(20);
    expect(enrichedNonZero).toBeGreaterThan(25);
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

  it('Sarasti residuals are correctly injected into β₅₀₋₉₉', () => {
    const ticker = TICKERS[0];
    const residuals = new Array(50).fill(0).map((_, i) => i * 0.01);
    const statics: TickerStatic = { ...mockStatics, shape_residuals: residuals };

    const shape = resolver.resolve(ticker, statics);

    for (let i = 0; i < 50; i++) {
      // residual_indices start at 50 (β₅₀)
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
    const shapeNoStatics = resolverZero.resolve(ticker);

    for (let i = 0; i < N_SHAPE; i++) {
      expect(shapeZero[i]).toBeCloseTo(shapeNoStatics[i], 5);
    }
  });
});
