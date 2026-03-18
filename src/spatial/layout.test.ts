import { describe, it, expect } from 'vitest';
import { TICKERS } from '../tickers';
import { gridLayout } from './layout';

describe('gridLayout', () => {
  const landscape = gridLayout(TICKERS, 16 / 9);
  const portrait = gridLayout(TICKERS, 9 / 16);

  describe.each([
    ['landscape', landscape, 16 / 9],
    ['portrait', portrait, 9 / 16],
  ])('%s', (_name, result) => {
    it(`assigns positions to all ${TICKERS.length} tickers`, () => {
      expect(result.positions.size).toBe(TICKERS.length);
      TICKERS.forEach(t => {
        expect(result.positions.has(t.id)).toBe(true);
      });
    });

    it('has no position overlaps (min distance > 1.0)', () => {
      const posArray = Array.from(result.positions.values());
      for (let i = 0; i < posArray.length; i++) {
        for (let j = i + 1; j < posArray.length; j++) {
          const dist = Math.sqrt(
            (posArray[i][0] - posArray[j][0]) ** 2 +
            (posArray[i][1] - posArray[j][1]) ** 2 +
            (posArray[i][2] - posArray[j][2]) ** 2
          );
          expect(dist).toBeGreaterThan(1.0);
        }
      }
    });

    it('all Z coordinates are zero', () => {
      for (const pos of result.positions.values()) {
        expect(pos[2]).toBe(0);
      }
    });

    it('produces a rectangular grid with uniform spacing', () => {
      const positions = Array.from(result.positions.values());
      const xs = [...new Set(positions.map(p => Math.round(p[0] * 1000) / 1000))].sort((a, b) => a - b);
      const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => a - b);

      if (xs.length > 1) {
        const xStep = xs[1] - xs[0];
        for (let i = 2; i < xs.length; i++) {
          expect(xs[i] - xs[i - 1]).toBeCloseTo(xStep);
        }
      }
      if (ys.length > 1) {
        const yStep = ys[1] - ys[0];
        for (let i = 2; i < ys.length; i++) {
          expect(ys[i] - ys[i - 1]).toBeCloseTo(yStep);
        }
      }
    });

    it('all rows have same width except possibly the last', () => {
      const positions = Array.from(result.positions.values());
      const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);

      const rowWidths = ys.map(y => {
        const rowPositions = positions.filter(p => Math.round(p[1] * 1000) / 1000 === y);
        const rowXs = rowPositions.map(p => p[0]);
        return Math.max(...rowXs) - Math.min(...rowXs);
      });

      for (let i = 1; i < rowWidths.length - 1; i++) {
        expect(rowWidths[i]).toBeCloseTo(rowWidths[0]);
      }
    });

    it('all full rows have same column count', () => {
      const positions = Array.from(result.positions.values());
      const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);
      if (ys.length <= 1) return;

      const fullRowY = ys[0];
      const fullRowCount = positions.filter(p => Math.round(p[1] * 1000) / 1000 === fullRowY).length;

      for (let i = 0; i < ys.length - 1; i++) {
        const rowCount = positions.filter(p => Math.round(p[1] * 1000) / 1000 === ys[i]).length;
        expect(rowCount).toBe(fullRowCount);
      }
    });
  });

  it('portrait: more rows than columns', () => {
    const positions = Array.from(portrait.positions.values());
    const cols = new Set(positions.map(p => Math.round(p[0] * 1000) / 1000)).size;
    const rows = new Set(positions.map(p => Math.round(p[1] * 1000) / 1000)).size;
    expect(rows).toBeGreaterThanOrEqual(cols);
  });

  it('landscape: more columns than rows', () => {
    const positions = Array.from(landscape.positions.values());
    const cols = new Set(positions.map(p => Math.round(p[0] * 1000) / 1000)).size;
    const rows = new Set(positions.map(p => Math.round(p[1] * 1000) / 1000)).size;
    expect(cols).toBeGreaterThanOrEqual(rows);
  });

  it('portrait: grid is taller than wide', () => {
    const allPos = Array.from(portrait.positions.values());
    const xs = allPos.map(p => p[0]);
    const ys = allPos.map(p => p[1]);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect(height).toBeGreaterThan(width);
  });

  it('last row is centered', () => {
    const positions = Array.from(landscape.positions.values());
    const ys = [...new Set(positions.map(p => Math.round(p[1] * 1000) / 1000))].sort((a, b) => b - a);
    if (ys.length < 2) return;

    const lastRowY = ys[ys.length - 1];
    const firstRowY = ys[0];
    const lastRowPositions = positions.filter(p => Math.round(p[1] * 1000) / 1000 === lastRowY);
    const firstRowPositions = positions.filter(p => Math.round(p[1] * 1000) / 1000 === firstRowY);

    const lastRowCenterX = lastRowPositions.reduce((s, p) => s + p[0], 0) / lastRowPositions.length;
    const firstRowCenterX = firstRowPositions.reduce((s, p) => s + p[0], 0) / firstRowPositions.length;

    expect(lastRowCenterX).toBeCloseTo(firstRowCenterX, 1);
  });
});
