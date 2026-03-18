import { describe, it, expect } from 'vitest';
import { TICKERS } from '../tickers';
import { computeLayout } from './layout';
import type { AssetClass } from '../types';

describe('computeLayout', () => {
  // Landscape (default)
  const landscape = computeLayout(TICKERS, 16 / 9);
  // Portrait (phone)
  const portrait = computeLayout(TICKERS, 9 / 16);

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

    it('sorts younger faces higher (larger Y) within each class', () => {
      const groups = new Map<AssetClass, typeof TICKERS>();
      for (const t of TICKERS) {
        let arr = groups.get(t.class);
        if (!arr) {
          arr = [];
          groups.set(t.class, arr);
        }
        arr.push(t);
      }

      for (const [cls, arr] of groups) {
        if (arr.length < 2) continue;
        const sorted = [...arr].sort((a, b) => a.age - b.age);
        for (let i = 0; i < sorted.length - 1; i++) {
          const yA = result.positions.get(sorted[i].id)![1];
          const yB = result.positions.get(sorted[i + 1].id)![1];
          expect(yA, `in class '${cls}', age ${sorted[i].age} should be above age ${sorted[i + 1].age}`).toBeGreaterThanOrEqual(yB);
        }
      }
    });
  });

  it('landscape: all classes in one row (same-class faces share X)', () => {
    const classCols = new Map<AssetClass, Set<number>>();
    for (const t of TICKERS) {
      const pos = landscape.positions.get(t.id)!;
      let cols = classCols.get(t.class);
      if (!cols) {
        cols = new Set();
        classCols.set(t.class, cols);
      }
      cols.add(pos[0]);
    }
    for (const [cls, cols] of classCols) {
      expect(cols.size, `class '${cls}' should be in one column`).toBe(1);
    }
  });

  it('landscape: inter-class gap > intra-class spacing', () => {
    const classX = new Map<AssetClass, number>();
    for (const t of TICKERS) {
      if (!classX.has(t.class)) {
        classX.set(t.class, landscape.positions.get(t.id)![0]);
      }
    }

    const xValues = [...classX.values()].sort((a, b) => a - b);
    if (xValues.length < 2) return;
    const interClassGap = xValues[1] - xValues[0];

    const energyTickers = TICKERS.filter(t => t.class === 'energy');
    const yValues = energyTickers
      .map(t => landscape.positions.get(t.id)![1])
      .sort((a, b) => b - a);
    if (yValues.length < 2) return;
    const intraClassSpacing = yValues[0] - yValues[1];

    expect(interClassGap).toBeGreaterThan(intraClassSpacing);
  });

  it('portrait: wraps into fewer columns per row', () => {
    // In portrait, not all classes should share a single Y band
    const classY = new Map<AssetClass, number>();
    for (const t of TICKERS) {
      // Use the first ticker of each class to find its Y center
      if (!classY.has(t.class)) {
        classY.set(t.class, portrait.positions.get(t.id)![1]);
      }
    }
    const uniqueYBands = new Set(
      [...classY.values()].map(y => Math.round(y))
    );
    // With 5 active classes at aspect 9/16, should have > 1 row band
    expect(uniqueYBands.size).toBeGreaterThan(1);
  });

  it('portrait: grid is taller than wide', () => {
    const allPos = Array.from(portrait.positions.values());
    const xs = allPos.map(p => p[0]);
    const ys = allPos.map(p => p[1]);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect(height).toBeGreaterThan(width);
  });
});
