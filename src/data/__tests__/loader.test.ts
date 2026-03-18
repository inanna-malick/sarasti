import { describe, it, expect } from 'vitest';
import { parseDataset, getFrame, getFrameAtTime, getTickerTimeseries } from '../loader';
import { interpolateFrame } from '../interpolator';
import type { RawMarketHistory } from '../schema';
import fixture from '../../../test-utils/data-fixture.json';
import type { TickerConfig } from '../../types';

const raw = fixture as unknown as RawMarketHistory;

const mockTickers: TickerConfig[] = [
  { id: 'BZ=F', name: 'Brent', class: 'energy', family: 'brent', age: 20 },
  { id: 'CL=F', name: 'WTI', class: 'energy', family: 'wti', age: 20 },
  { id: '^VIX', name: 'VIX', class: 'fear', family: 'vol', age: 20 },
  { id: 'GDELT:iran', name: 'Iran', class: 'media', family: 'gdelt', age: 20 },
];

describe('parseDataset', () => {
  it('parses fixture into TimelineDataset', () => {
    const ds = parseDataset(raw, mockTickers);
    expect(ds.frames).toHaveLength(5);
    expect(ds.timestamps).toHaveLength(5);
    expect(ds.baseline_timestamp).toBe('2026-02-25T00:00:00.000Z');
  });

  it('includes only tickers present in data', () => {
    const ds = parseDataset(raw, mockTickers);
    const ids = ds.tickers.map(t => t.id);
    // BZ=F and CL=F are in the fixture and in our mock list.
    expect(ids).toHaveLength(4);
    expect(ids).toContain('^VIX');
    expect(ids).toContain('GDELT:iran');
    expect(ids).toContain('BZ=F');
    expect(ids).toContain('CL=F');
  });
});

describe('getFrame', () => {
  it('returns frame at index', () => {
    const ds = parseDataset(raw, mockTickers);
    const f = getFrame(ds, 2);
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
    expect(f.values['BZ=F'].close).toBeCloseTo(75.60);
  });

  it('clamps to bounds', () => {
    const ds = parseDataset(raw, mockTickers);
    expect(getFrame(ds, -1).timestamp).toBe(ds.timestamps[0]);
    expect(getFrame(ds, 999).timestamp).toBe(ds.timestamps[ds.timestamps.length - 1]);
  });

  it('handles empty frames gracefully', () => {
    const emptyDs = {
      tickers: [],
      frames: [],
      timestamps: [],
      baseline_timestamp: '',
    };
    // This would have crashed with access to frames[0] or similar
    expect(() => getFrame(emptyDs, 0)).not.toThrow();
  });
});

describe('getFrameAtTime', () => {
  it('finds exact timestamp', () => {
    const ds = parseDataset(raw, mockTickers);
    const f = getFrameAtTime(ds, '2026-02-25T02:00:00.000Z');
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
  });

  it('snaps to nearest timestamp', () => {
    const ds = parseDataset(raw, mockTickers);
    // 01:40 is closer to 02:00 than 01:00
    const f = getFrameAtTime(ds, '2026-02-25T01:40:00.000Z');
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
  });

  it('returns first frame for time before range', () => {
    const ds = parseDataset(raw, mockTickers);
    const f = getFrameAtTime(ds, '2026-02-24T00:00:00.000Z');
    expect(f.timestamp).toBe(ds.timestamps[0]);
  });
});

describe('getTickerTimeseries', () => {
  it('returns all frames for a ticker', () => {
    const ds = parseDataset(raw, mockTickers);
    const series = getTickerTimeseries(ds, 'BZ=F');
    expect(series).toHaveLength(5);
    expect(series[0]?.close).toBeCloseTo(74.50);
    expect(series[4]?.close).toBeCloseTo(78.00);
  });

  it('returns undefined for missing ticker', () => {
    const ds = parseDataset(raw, mockTickers);
    const series = getTickerTimeseries(ds, 'NONEXISTENT');
    expect(series.every(v => v === undefined)).toBe(true);
  });
});

describe('interpolateFrame', () => {
  it('alpha=0 returns f0', () => {
    const ds = parseDataset(raw, mockTickers);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 0);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.50);
  });

  it('alpha=1 returns f1', () => {
    const ds = parseDataset(raw, mockTickers);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 1);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.80);
  });

  it('alpha=0.5 returns midpoint', () => {
    const ds = parseDataset(raw, mockTickers);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 0.5);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.65);
  });

  it('clamps alpha to [0,1]', () => {
    const ds = parseDataset(raw, mockTickers);
    const below = interpolateFrame(ds.frames[0], ds.frames[1], -5);
    expect(below.values['BZ=F'].close).toBeCloseTo(74.50);
    const above = interpolateFrame(ds.frames[0], ds.frames[1], 10);
    expect(above.values['BZ=F'].close).toBeCloseTo(74.80);
  });
});
