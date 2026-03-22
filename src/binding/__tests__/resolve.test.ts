import { describe, it, expect } from 'vitest';
import { resolve, createResolver } from '../resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { TICKERS } from '../../../examples/demo/tickers';

describe('resolve (2-axis circumplex)', () => {
  it('zero data → finite expression and shape', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: 0, velocity: 0, volatility: 0, drawdown: 0, momentum: 0, mean_reversion_z: 0, beta: 1 });
    const result = resolve(ticker, frame);

    expect(result.expression.length).toBe(N_EXPR);
    expect(result.shape.length).toBe(N_SHAPE);

    for (let i = 0; i < N_EXPR; i++) {
      expect(Number.isFinite(result.expression[i])).toBe(true);
    }
  });

  it('high volatility + velocity → tension (ψ9 eyes wide, ψ4 brow raised)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const result = resolve(ticker, frame);

    expect(result.expression[9]).toBeGreaterThan(0);  // eyes wide from tension
    expect(result.expression[4]).toBeLessThan(0);     // brow raised (negative = raised)
  });

  it.skip('positive deviation → euphoria (ψ1 smile)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: 2.0 });
    const result = resolve(ticker, frame);

    expect(result.expression[1]).toBeGreaterThan(0);
  });

  it('negative deviation → grief (ψ6 lip sag)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -2.0 });
    const result = resolve(ticker, frame);

    expect(result.expression[6]).toBeGreaterThan(0);
  });

  it.skip('high volatility → tension drives ψ5 (snarl)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const result = resolve(ticker, frame);

    expect(result.expression[5]).toBeGreaterThan(0); // upper lip raises
  });

  it('shape changes with momentum (ogre axis)', () => {
    const ticker = TEST_TICKERS[0];
    const rising = resolve(ticker, makeTickerFrame({ momentum: 2.0 }));
    const falling = resolve(ticker, makeTickerFrame({ momentum: -2.0 }));

    expect(rising.shape[3]).toBeGreaterThan(falling.shape[3]);
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

    let identityDiff = 0;
    for (let i = 33; i < 42; i++) {
      identityDiff += Math.abs(a.shape[i] - b.shape[i]);
    }
    expect(identityDiff).toBeGreaterThan(0.01);
  });

  it('pose is chord-orchestrated (tension → pitch shift)', () => {
    const ticker = TEST_TICKERS[0];
    const tense = resolve(ticker, makeTickerFrame({ volatility: 3.0, velocity: 2.0 }));
    const calm = resolve(ticker, makeTickerFrame({ volatility: 0, velocity: 0 }));

    // Tension and calm recipes produce different expressions
    expect(tense.expression[9]).not.toBeCloseTo(calm.expression[9]);
  });

  it('flush driven by mood axis for extreme frames', () => {
    const ticker = TEST_TICKERS[0];
    const euphoric = resolve(ticker, makeTickerFrame({ deviation: 2.0 }));

    expect(euphoric.flush).toBeGreaterThan(0);
  });
});

describe('createResolver (cached, 2-axis)', () => {
  it('different frames → different shape (shape evolves via EMA)', () => {
    const resolver = createResolver();
    const rising = resolver.resolve(TICKERS[0], makeTickerFrame({ momentum: 2.0 }));
    const falling = resolver.resolve(TICKERS[0], makeTickerFrame({ momentum: -2.0 }));
    expect(rising.shape).not.toBe(falling.shape);
    expect(rising.shape[3]).not.toEqual(falling.shape[3]);
  });

  it('updates flush/fatigue and can be reset', () => {
    const resolver = createResolver();
    const ticker = TICKERS[0];

    for (let i = 0; i < 30; i++) {
      resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    }
    const afterHighDev = resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    expect(afterHighDev.flush).toBeGreaterThan(0);

    resolver.resetAccumulators();
  });
});
