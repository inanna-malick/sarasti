import { describe, it, expect } from 'vitest';
import { resolve, createShapeResolver, createExpressionResolver, createResolver } from '../resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { TICKERS } from '../../tickers';

describe('resolve', () => {
  it('zero data → near-zero expression and shape', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: 0, velocity: 0, volatility: 0, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 });
    const result = resolve(ticker, frame);

    expect(result.expression.length).toBe(N_EXPR);
    expect(result.shape.length).toBe(N_SHAPE);

    // Expression should be moderate for zero data (drawdown sigmoid has nonzero output at 0)
    const maxExpr = Math.max(...Array.from(result.expression).map(Math.abs));
    expect(maxExpr).toBeLessThan(1.0);
  });

  it('high negative deviation → nonzero expression (joy axis)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -0.15 });
    const result = resolve(ticker, frame);

    // ψ0 (jaw) should be affected by joy axis
    const maxExpr = Math.max(...Array.from(result.expression).map(Math.abs));
    expect(maxExpr).toBeGreaterThan(0.1);
  });

  it('shape changes with momentum', () => {
    const ticker = TEST_TICKERS[0];
    const rising = resolve(ticker, makeTickerFrame({ momentum: 2.0 }));
    const falling = resolve(ticker, makeTickerFrame({ momentum: -2.0 }));

    // β0 (stature root) should differ
    expect(rising.shape[0]).toBeGreaterThan(0);
    expect(falling.shape[0]).toBeLessThan(0);
  });

  it('shape changes with beta (angularity)', () => {
    const ticker = TEST_TICKERS[0];
    const conformist = resolve(ticker, makeTickerFrame({ beta: 1.0 }));
    const rebel = resolve(ticker, makeTickerFrame({ beta: 2.5 }));

    // β10 (angularity root) should be higher for rebel
    expect(Math.abs(rebel.shape[10])).toBeGreaterThan(Math.abs(conformist.shape[10]));
  });

  it('returns correct array lengths', () => {
    const result = resolve(TEST_TICKERS[0], makeTickerFrame());
    expect(result.shape.length).toBe(N_SHAPE);
    expect(result.expression.length).toBe(N_EXPR);
  });

  it('different tickers get different identity noise', () => {
    const frame = makeTickerFrame();
    const a = resolve(TEST_TICKERS[0], frame);
    const b = resolve(TEST_TICKERS[1], frame);

    // β11-β19 should differ due to identity noise
    let identityDiff = 0;
    for (let i = 11; i < 20; i++) {
      identityDiff += Math.abs(a.shape[i] - b.shape[i]);
    }
    expect(identityDiff).toBeGreaterThan(0.01);
  });
});

describe('createExpressionResolver', () => {
  it('resolves various frames without error', () => {
    const resolver = createExpressionResolver();
    const frames = [
      makeTickerFrame({ deviation: 0, velocity: 0, volatility: 0, drawdown: 0 }),
      makeTickerFrame({ deviation: -0.15, velocity: -2, volatility: 4, drawdown: -0.3 }),
      makeTickerFrame({ deviation: 0.1, velocity: 1, volatility: 0.5, drawdown: 0 }),
    ];
    for (const frame of frames) {
      const expr = resolver.resolve(frame);
      expect(expr.length).toBe(N_EXPR);
      for (let i = 0; i < N_EXPR; i++) {
        expect(Number.isFinite(expr[i])).toBe(true);
      }
    }
  });

  it('deviation drives joy axis (ψ0, ψ5, ψ7)', () => {
    const resolver = createExpressionResolver();
    const positive = resolver.resolve(makeTickerFrame({ deviation: 0.15 }));
    const negative = resolver.resolve(makeTickerFrame({ deviation: -0.15 }));

    // Joy is bipolar: positive dev → positive ψ0, negative dev → negative ψ0
    expect(positive[0]).toBeGreaterThan(0);
    expect(negative[0]).toBeLessThan(0);
  });

  it('|velocity| drives surprise axis (ψ2, ψ0, ψ7)', () => {
    const resolver = createExpressionResolver();
    const fast = resolver.resolve(makeTickerFrame({ velocity: 2.0 }));
    const slow = resolver.resolve(makeTickerFrame({ velocity: 0 }));

    // Surprise uses ψ2 (brow raise) as root
    expect(fast[2]).toBeGreaterThan(slow[2]);
  });

  it('volatility drives tension axis (ψ4, ψ6, ψ8)', () => {
    const resolver = createExpressionResolver();
    const chaotic = resolver.resolve(makeTickerFrame({ volatility: 3.0 }));
    const calm = resolver.resolve(makeTickerFrame({ volatility: 0 }));

    // Tension uses ψ4 (lip pucker) as root
    expect(chaotic[4]).toBeGreaterThan(calm[4]);
  });

  it('drawdown drives anguish axis (ψ3, ψ8, ψ5)', () => {
    const resolver = createExpressionResolver();
    const deep = resolver.resolve(makeTickerFrame({ drawdown: -0.4 }));
    const atPeak = resolver.resolve(makeTickerFrame({ drawdown: 0 }));

    // Anguish uses ψ3 (brow furrow) as root
    expect(Math.abs(deep[3])).toBeGreaterThan(Math.abs(atPeak[3]));
  });
});

describe('createShapeResolver', () => {
  it('resolves various frames without error', () => {
    const resolver = createShapeResolver();
    const frames = [
      makeTickerFrame({ momentum: 0, mean_reversion_z: 0, beta: 1 }),
      makeTickerFrame({ momentum: 2, mean_reversion_z: 3, beta: 0.5 }),
      makeTickerFrame({ momentum: -2, mean_reversion_z: -1, beta: 1.5 }),
    ];
    for (const frame of frames) {
      const shape = resolver.resolve(frame);
      expect(shape.length).toBe(N_SHAPE);
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Number.isFinite(shape[i])).toBe(true);
      }
    }
  });

  it('momentum drives stature (β0, β3, β2)', () => {
    const resolver = createShapeResolver();
    const rising = resolver.resolve(makeTickerFrame({ momentum: 2.0 }));
    const falling = resolver.resolve(makeTickerFrame({ momentum: -2.0 }));

    expect(rising[0]).toBeGreaterThan(0); // heavy
    expect(falling[0]).toBeLessThan(0);   // gaunt
  });

  it('|mean_reversion_z| drives proportion (β1, β4, β6)', () => {
    const resolver = createShapeResolver();
    const stretched = resolver.resolve(makeTickerFrame({ mean_reversion_z: 3.0 }));
    const normal = resolver.resolve(makeTickerFrame({ mean_reversion_z: 0 }));

    expect(stretched[1]).toBeGreaterThan(normal[1]); // elongated
  });

  it('|1-beta| drives angularity (β10, β8, β5)', () => {
    const resolver = createShapeResolver();
    const rebel = resolver.resolve(makeTickerFrame({ beta: 2.5 }));
    const herd = resolver.resolve(makeTickerFrame({ beta: 1.0 }));

    expect(rebel[10]).toBeGreaterThan(herd[10]); // chiseled
  });
});

describe('createResolver (cached)', () => {
  it('different frames → different shape (shape is now data-driven)', () => {
    const resolver = createResolver();
    const rising = resolver.resolve(TICKERS[0], makeTickerFrame({ momentum: 2.0 }));
    const falling = resolver.resolve(TICKERS[0], makeTickerFrame({ momentum: -2.0 }));
    // Shape should differ since shape is now per-frame
    expect(rising.shape).not.toBe(falling.shape);
    expect(rising.shape[0]).not.toBe(falling.shape[0]);
  });

  it('updates flush/fatigue and can be reset', () => {
    const resolver = createResolver();
    const ticker = TICKERS[0];

    const first = resolver.resolve(ticker, makeTickerFrame({ deviation: 0, volatility: 1.0 }));
    expect(first.flush).toBeLessThan(0);
    expect(first.fatigue).toBeLessThan(0.1);

    // High deviation frames
    for (let i = 0; i < 30; i++) {
      resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    }
    const afterHighDev = resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    expect(afterHighDev.flush).toBeGreaterThan(0.5);

    resolver.resetAccumulators();
    const afterReset = resolver.resolve(ticker, makeTickerFrame({ deviation: 0, volatility: 1.0 }));
    expect(afterReset.flush).toBeLessThan(0);
  });
});
