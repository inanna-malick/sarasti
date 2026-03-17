import { describe, it, expect } from 'vitest';
import { parseDataset, getFrame, getFrameAtTime, getTickerTimeseries } from '../loader';
import { interpolateFrame } from '../interpolator';
import type { RawMarketHistory } from '../schema';
import fixture from '../../../test-utils/data-fixture-real.json';

const raw = fixture as unknown as RawMarketHistory;

describe('integration: real merged data (first 5 frames)', () => {
  it('parses the real fixture', () => {
    const ds = parseDataset(raw);
    expect(ds.frames.length).toBeGreaterThanOrEqual(5);
    expect(ds.tickers.length).toBeGreaterThanOrEqual(20);
    expect(ds.baseline_timestamp).toBeTruthy();
  });

  it('every frame has values for every listed ticker', () => {
    const ds = parseDataset(raw);
    for (const frame of ds.frames) {
      for (const ticker of ds.tickers) {
        const val = frame.values[ticker.id];
        expect(val, `Missing ${ticker.id} at ${frame.timestamp}`).toBeDefined();
        expect(typeof val.close).toBe('number');
        expect(typeof val.deviation).toBe('number');
        expect(typeof val.velocity).toBe('number');
        expect(typeof val.volatility).toBe('number');
        // No NaN values
        expect(Number.isNaN(val.close), `NaN close for ${ticker.id}`).toBe(false);
        expect(Number.isNaN(val.deviation), `NaN deviation for ${ticker.id}`).toBe(false);
      }
    }
  });

  it('includes both market and GDELT tickers', () => {
    const ds = parseDataset(raw);
    const ids = new Set(ds.tickers.map(t => t.id));
    // Market tickers
    expect(ids.has('BZ=F')).toBe(true);
    expect(ids.has('CL=F')).toBe(true);
    // GDELT tickers
    expect(ids.has('GDELT:iran')).toBe(true);
    expect(ids.has('GDELT:gulf')).toBe(true);
    expect(ids.has('GDELT:tone:iran')).toBe(true);
  });

  it('timeseries returns continuous data for BZ=F', () => {
    const ds = parseDataset(raw);
    const series = getTickerTimeseries(ds, 'BZ=F');
    expect(series.length).toBe(ds.frames.length);
    expect(series.every(v => v !== undefined)).toBe(true);
  });

  it('interpolation between real frames produces valid output', () => {
    const ds = parseDataset(raw);
    if (ds.frames.length < 2) return;
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 0.5);
    const ids = Object.keys(blended.values);
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) {
      expect(Number.isNaN(blended.values[id].close)).toBe(false);
    }
  });
});
