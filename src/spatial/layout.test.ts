import { describe, it, expect } from 'vitest';
import { TICKERS } from '../tickers';
import { computeLayout } from './layout';
import { LayoutStrategy } from '../types';

describe('computeLayout', () => {
  const getDistance = (p1: [number, number, number], p2: [number, number, number]) => {
    return Math.sqrt(
      Math.pow(p1[0] - p2[0], 2) +
      Math.pow(p1[1] - p2[1], 2) +
      Math.pow(p1[2] - p2[2], 2)
    );
  };

  const strategies: LayoutStrategy[] = [
    { kind: 'family-rows' },
    { kind: 'class-clusters' },
    { kind: 'reactivity-sweep' }
  ];

  strategies.forEach((strategy) => {
    describe(strategy.kind, () => {
      it(`assigns positions to all ${TICKERS.length} tickers`, () => {
        const result = computeLayout(TICKERS, strategy);
        expect(result.positions.size).toBe(TICKERS.length);
        TICKERS.forEach(t => {
          expect(result.positions.has(t.id)).toBe(true);
        });
      });

      it('has no position overlaps (min distance > 1.0)', () => {
        const result = computeLayout(TICKERS, strategy);
        const posArray = Array.from(result.positions.values());

        for (let i = 0; i < posArray.length; i++) {
          for (let j = i + 1; j < posArray.length; j++) {
            const dist = getDistance(posArray[i], posArray[j]);
            expect(dist).toBeGreaterThan(1.0);
          }
        }
      });

      it('all Z coordinates are zero', () => {
        const result = computeLayout(TICKERS, strategy);
        for (const pos of result.positions.values()) {
          expect(pos[2]).toBe(0);
        }
      });

      it('produces a rectangular grid', () => {
        const result = computeLayout(TICKERS, strategy);
        const positions = Array.from(result.positions.values());
        // All positions should snap to a grid — unique X and Y values
        // should be evenly spaced
        const xs = [...new Set(positions.map(p => Math.round(p[0] * 1000) / 1000))].sort((a, b) => a - b);
        const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => a - b);

        // Check X spacing is uniform
        if (xs.length > 1) {
          const xStep = xs[1] - xs[0];
          for (let i = 2; i < xs.length; i++) {
            expect(xs[i] - xs[i - 1]).toBeCloseTo(xStep);
          }
        }
        // Check Y spacing is uniform
        if (ys.length > 1) {
          const yStep = ys[1] - ys[0];
          for (let i = 2; i < ys.length; i++) {
            expect(ys[i] - ys[i - 1]).toBeCloseTo(yStep);
          }
        }
      });
    });
  });
});
