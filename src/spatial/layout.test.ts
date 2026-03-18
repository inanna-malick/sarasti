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

      it('produces a rectangular grid with uniform spacing', () => {
        const result = computeLayout(TICKERS, strategy);
        const positions = Array.from(result.positions.values());
        const xs = [...new Set(positions.map(p => Math.round(p[0] * 1000) / 1000))].sort((a, b) => a - b);
        const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => a - b);

        // X spacing is uniform
        if (xs.length > 1) {
          const xStep = xs[1] - xs[0];
          for (let i = 2; i < xs.length; i++) {
            expect(xs[i] - xs[i - 1]).toBeCloseTo(xStep);
          }
        }
        // Y spacing is uniform
        if (ys.length > 1) {
          const yStep = ys[1] - ys[0];
          for (let i = 2; i < ys.length; i++) {
            expect(ys[i] - ys[i - 1]).toBeCloseTo(yStep);
          }
        }
      });

      it('all rows have same width except possibly the last', () => {
        const result = computeLayout(TICKERS, strategy);
        const positions = Array.from(result.positions.values());
        const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);

        const rowWidths = ys.map(y => {
          const rowPositions = positions.filter(p => Math.round(p[1] * 1000) / 1000 === y);
          const rowXs = rowPositions.map(p => p[0]);
          return Math.max(...rowXs) - Math.min(...rowXs);
        });

        // All non-last rows should have the same width
        for (let i = 1; i < rowWidths.length - 1; i++) {
          expect(rowWidths[i]).toBeCloseTo(rowWidths[0]);
        }
      });

      it('all columns have same height', () => {
        const result = computeLayout(TICKERS, strategy);
        const positions = Array.from(result.positions.values());
        // Exclude last row (may have fewer items) for column height check
        const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);
        if (ys.length <= 1) return;

        // All full rows share the same set of X positions
        const fullRowY = ys[0]; // top row is always full
        const fullRowXs = positions
          .filter(p => Math.round(p[1] * 1000) / 1000 === fullRowY)
          .map(p => Math.round(p[0] * 1000) / 1000)
          .sort((a, b) => a - b);

        // Every non-last row should have the same column count
        for (let i = 0; i < ys.length - 1; i++) {
          const rowXs = positions
            .filter(p => Math.round(p[1] * 1000) / 1000 === ys[i])
            .map(p => Math.round(p[0] * 1000) / 1000)
            .sort((a, b) => a - b);
          expect(rowXs.length).toBe(fullRowXs.length);
        }
      });
    });
  });

  describe('viewport aspect ratio', () => {
    it('portrait produces more rows than columns', () => {
      const result = computeLayout(TICKERS, { kind: 'family-rows' }, 9 / 16);
      const positions = Array.from(result.positions.values());
      const cols = new Set(positions.map(p => Math.round(p[0] * 1000) / 1000)).size;
      const rows = new Set(positions.map(p => Math.round(p[1] * 1000) / 1000)).size;
      expect(rows).toBeGreaterThanOrEqual(cols);
    });

    it('landscape produces more columns than rows', () => {
      const result = computeLayout(TICKERS, { kind: 'family-rows' }, 21 / 9);
      const positions = Array.from(result.positions.values());
      const cols = new Set(positions.map(p => Math.round(p[0] * 1000) / 1000)).size;
      const rows = new Set(positions.map(p => Math.round(p[1] * 1000) / 1000)).size;
      expect(cols).toBeGreaterThanOrEqual(rows);
    });
  });

  describe('last row centering', () => {
    it('last row is centered when it has fewer items', () => {
      const result = computeLayout(TICKERS, { kind: 'family-rows' });
      const positions = Array.from(result.positions.values());
      const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);

      if (ys.length < 2) return;

      const lastRowY = ys[ys.length - 1];
      const firstRowY = ys[0];
      const lastRow = positions.filter(p => Math.round(p[1] * 1000) / 1000 === lastRowY);
      const firstRow = positions.filter(p => Math.round(p[0] * 1000) / 1000 === Math.round(positions[0][0] * 1000) / 1000);

      // Last row center-of-mass X should be close to 0 (centered)
      const lastRowCenterX = lastRow.reduce((s, p) => s + p[0], 0) / lastRow.length;
      const firstRowCenterX = positions
        .filter(p => Math.round(p[1] * 1000) / 1000 === firstRowY)
        .reduce((s, p) => s + p[0], 0) / positions.filter(p => Math.round(p[1] * 1000) / 1000 === firstRowY).length;

      expect(lastRowCenterX).toBeCloseTo(firstRowCenterX, 1);
    });
  });
});
