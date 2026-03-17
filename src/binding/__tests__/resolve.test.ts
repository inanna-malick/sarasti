import { describe, it, expect } from 'vitest';
import { resolve, createShapeResolver, createExpressionResolver, createResolver } from '../resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { TICKERS } from '../../tickers';

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
  it('resolves all 25 tickers without error', () => {
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
});
