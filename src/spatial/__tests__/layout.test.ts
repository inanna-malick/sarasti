import { describe, it, expect } from 'vitest';
import { gridLayout, computeLayout } from '../layout';

describe('gridLayout', () => {
  it('empty items → empty positions', () => {
    const result = gridLayout([]);
    expect(result.positions.size).toBe(0);
  });

  it('single item → positioned at origin', () => {
    const result = gridLayout([{ id: 'a' }]);
    expect(result.positions.get('a')).toEqual([0, 0, 0]);
  });

  it('items with explicit positions → uses them', () => {
    const items = [
      { id: 'a', position: [1, 2, 3] as [number, number, number] },
      { id: 'b', position: [-1, 0, 0] as [number, number, number] },
    ];
    const result = gridLayout(items);
    expect(result.positions.get('a')).toEqual([1, 2, 3]);
    expect(result.positions.get('b')).toEqual([-1, 0, 0]);
  });

  it('mix of explicit and auto positions', () => {
    const items = [
      { id: 'fixed', position: [10, 10, 0] as [number, number, number] },
      { id: 'auto1' },
      { id: 'auto2' },
    ];
    const result = gridLayout(items);
    expect(result.positions.get('fixed')).toEqual([10, 10, 0]);
    expect(result.positions.has('auto1')).toBe(true);
    expect(result.positions.has('auto2')).toBe(true);
    // Auto items should NOT be at [10, 10, 0]
    expect(result.positions.get('auto1')).not.toEqual([10, 10, 0]);
  });

  it('respects custom cols option', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ id: `item-${i}` }));
    const result = gridLayout(items, { cols: 3 });
    // 6 items in 3 cols = 2 rows
    const positions = Array.from(result.positions.values());
    const ys = [...new Set(positions.map(p => p[1]))];
    expect(ys.length).toBe(2);
  });

  it('respects custom spacing', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    const wide = gridLayout(items, { spacing: 10 });
    const narrow = gridLayout(items, { spacing: 1 });
    const wideGap = Math.abs(wide.positions.get('a')![0] - wide.positions.get('b')![0]);
    const narrowGap = Math.abs(narrow.positions.get('a')![0] - narrow.positions.get('b')![0]);
    expect(wideGap).toBeGreaterThan(narrowGap);
  });

  it('all items get positions', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `t${i}` }));
    const result = gridLayout(items);
    expect(result.positions.size).toBe(25);
    for (const item of items) {
      expect(result.positions.has(item.id)).toBe(true);
    }
  });

  it('grid is centered at origin', () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}` }));
    const result = gridLayout(items, { cols: 3 });
    const xs = Array.from(result.positions.values()).map(p => p[0]);
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(Math.abs(avgX)).toBeLessThan(0.1);
  });
});

describe('computeLayout (compat)', () => {
  it('sorts by class order then age', () => {
    const tickers = [
      { id: 'equity1', class: 'equity', age: 30 },
      { id: 'energy1', class: 'energy', age: 10 },
      { id: 'fear1', class: 'fear', age: 20 },
    ];
    const result = computeLayout(tickers);
    const ids = Array.from(result.positions.keys());
    // Energy should come first (class order), then fear, then equity
    expect(ids[0]).toBe('energy1');
    expect(ids[1]).toBe('fear1');
    expect(ids[2]).toBe('equity1');
  });

  it('handles all items', () => {
    const tickers = Array.from({ length: 25 }, (_, i) => ({
      id: `t${i}`,
      class: 'energy' as const,
      age: i,
    }));
    const result = computeLayout(tickers);
    expect(result.positions.size).toBe(25);
  });
});
