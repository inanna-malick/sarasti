import { describe, it, expect } from 'vitest';
import { createShapeResolver } from '../../resolve';
import { TICKERS } from '../../../tickers';
import { N_SHAPE } from '../../../constants';

describe('ShapeResolver integration', () => {
  const resolver = createShapeResolver();

  it('resolves all 25 tickers to valid shape vectors', () => {
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

  it('age gradient within Brent family', () => {
    const brent = TICKERS.filter(t => t.family === 'brent')
      .sort((a, b) => a.age - b.age);
    expect(brent.length).toBe(3);

    const shapes = brent.map(t => resolver.resolve(t));

    // Adjacent faces should differ (age changes shape)
    for (let i = 1; i < shapes.length; i++) {
      let dist = 0;
      for (let j = 0; j < N_SHAPE; j++) {
        dist += (shapes[i][j] - shapes[i - 1][j]) ** 2;
      }
      expect(Math.sqrt(dist)).toBeGreaterThan(0.1);
    }
  });

  it('Brent and WTI at same age are closer than Brent and VIX', () => {
    const brentSpot = TICKERS.find(t => t.id === 'BZ=F')!;
    const wtiSpot = TICKERS.find(t => t.id === 'CL=F')!;
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
