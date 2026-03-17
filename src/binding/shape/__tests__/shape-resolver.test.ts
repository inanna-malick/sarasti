import { describe, it, expect } from 'vitest';
import { createShapeResolver } from '../../resolve';
import { TICKERS } from '../../../tickers';
import { N_SHAPE } from '../../../constants';

describe('ShapeResolver integration', () => {
  const resolver = createShapeResolver();

  it('resolves all 14 tickers to valid shape vectors', () => {
    for (const ticker of TICKERS) {
      const shape = resolver.resolve(ticker);
      expect(shape.length).toBe(N_SHAPE);
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Number.isFinite(shape[i])).toBe(true);
      }
    }
  });

  it('deterministic: same ticker → same shape', () => {
    for (const ticker of TICKERS) {
      const a = resolver.resolve(ticker);
      const b = resolver.resolve(ticker);
      for (let i = 0; i < N_SHAPE; i++) {
        expect(a[i]).toBe(b[i]);
      }
    }
  });

  it('Brent and WTI at same age are closer than Brent and VIX', () => {
    const brentSpot = TICKERS.find(t => t.id === 'BRENT')!;
    const wtiSpot = TICKERS.find(t => t.id === 'WTI')!;
    const vix = TICKERS.find(t => t.id === '^VIX')!;

    const brentShape = resolver.resolve(brentSpot);
    const wtiShape = resolver.resolve(wtiSpot);
    const vixShape = resolver.resolve(vix);

    function l2(a: Float32Array, b: Float32Array): number {
      let sum = 0;
      for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
      return Math.sqrt(sum);
    }

    const brentWtiDist = l2(brentShape, wtiShape);
    const brentVixDist = l2(brentShape, vixShape);

    // Same class (energy) should be closer than different class
    // Note: BRENT and WTI both have age 20 and class 'energy', but different family 'brent' vs 'wti'
    // VIX has class 'fear' and age 20.
    expect(brentWtiDist).toBeLessThan(brentVixDist);
  });

  it('shape values stay within reasonable bounds (±5σ)', () => {
    for (const ticker of TICKERS) {
      const shape = resolver.resolve(ticker);
      for (let i = 0; i < N_SHAPE; i++) {
        expect(Math.abs(shape[i])).toBeLessThan(5);
      }
    }
  });

  it('unused components (β₁₀₋₉₉) are zero', () => {
    for (const ticker of TICKERS) {
      const shape = resolver.resolve(ticker);
      for (let i = 10; i < N_SHAPE; i++) {
        expect(shape[i]).toBe(0);
      }
    }
  });
});
