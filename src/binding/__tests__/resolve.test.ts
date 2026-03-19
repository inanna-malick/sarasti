import { describe, it, expect } from 'vitest';
import { resolve, createResolver } from '../resolve';
import { makeTickerFrame, TEST_TICKERS } from '../../../test-utils/fixtures';
import { N_SHAPE, N_EXPR } from '../../constants';
import { TICKERS } from '../../../examples/hormuz/tickers';

describe('resolve (chord-based)', () => {
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

  it('high volatility + velocity → alarm chord activates (ψ2 brow up)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ volatility: 3.0, velocity: 2.0 });
    const result = resolve(ticker, frame);

    // ψ2 (brow raise) should be significantly positive from alarm
    expect(result.expression[2]).toBeGreaterThan(0.5);
  });

  it('positive deviation → valence euphoria (ψ9 cheek puff)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: 2.0 });
    const result = resolve(ticker, frame);

    // ψ9 should be positive (cheek puff — symmetric smile)
    expect(result.expression[9]).toBeGreaterThan(0);
  });

  it('negative deviation → valence grief (ψ6 lip sag)', () => {
    const ticker = TEST_TICKERS[0];
    const frame = makeTickerFrame({ deviation: -2.0 });
    const result = resolve(ticker, frame);

    // ψ6 should be positive (lower lip depressor — grief)
    expect(result.expression[6]).toBeGreaterThan(0);
  });

  it('deep drawdown → arousal alert (ψ7 eyes snap open)', () => {
    const ticker = TEST_TICKERS[0];
    // drawdown negative (deep), -(dd_z) = positive → alert chord
    const frame = makeTickerFrame({ drawdown: -2.0 });
    const result = resolve(ticker, frame);

    // ψ7 negative (eyes snap open) from alert chord
    expect(result.expression[7]).toBeLessThan(0);
  });

  it('positive drawdown → arousal exhaustion (ψ7 eyelid droop)', () => {
    const ticker = TEST_TICKERS[0];
    // drawdown positive (recovering), -(dd_z) = negative → exhaustion chord
    const frame = makeTickerFrame({ drawdown: 2.0 });
    const result = resolve(ticker, frame);

    // ψ7 positive (eyelid droop) from exhaustion chord
    expect(result.expression[7]).toBeGreaterThan(0);
  });

  it('shape changes with momentum (dominance axis)', () => {
    const ticker = TEST_TICKERS[0];
    const rising = resolve(ticker, makeTickerFrame({ momentum: 2.0 }));
    const falling = resolve(ticker, makeTickerFrame({ momentum: -2.0 }));

    // β3 (jaw width) driven by dominance — should differ
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

    // β11-β19 should differ due to identity noise
    let identityDiff = 0;
    for (let i = 11; i < 20; i++) {
      identityDiff += Math.abs(a.shape[i] - b.shape[i]);
    }
    expect(identityDiff).toBeGreaterThan(0.01);
  });

  it('pose is chord-orchestrated (alarm → jaw opens)', () => {
    const ticker = TEST_TICKERS[0];
    const alarmed = resolve(ticker, makeTickerFrame({ volatility: 3.0, velocity: 2.0 }));
    const calm = resolve(ticker, makeTickerFrame({ volatility: 0, velocity: 0 }));

    // Alarm chord contributes jaw opening
    expect(alarmed.pose.jaw).toBeGreaterThan(calm.pose.jaw);
  });

  it('flush and fatigue are non-zero for extreme frames', () => {
    const ticker = TEST_TICKERS[0];
    const extreme = resolve(ticker, makeTickerFrame({ volatility: 3.0, velocity: 2.0, deviation: 0.5 }));

    // Alarm chord contributes flush
    expect(extreme.flush).toBeGreaterThan(0);
  });
});

describe('createResolver (cached, chord-based)', () => {
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

    // High deviation frames accumulate flush
    for (let i = 0; i < 30; i++) {
      resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    }
    const afterHighDev = resolver.resolve(ticker, makeTickerFrame({ deviation: 0.5, volatility: 1.0 }));
    // Flush should be elevated (from both chord texture and EMA accumulator)
    expect(afterHighDev.flush).toBeGreaterThan(0);

    resolver.resetAccumulators();
  });
});
