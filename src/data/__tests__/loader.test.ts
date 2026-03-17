import { describe, it, expect } from 'vitest';
import { parseDataset, getFrame, getFrameAtTime, getTickerTimeseries } from '../loader';
import { interpolateFrame } from '../interpolator';
import type { RawMarketHistory } from '../schema';
import fixture from '../../../test-utils/data-fixture.json';

const raw = fixture as unknown as RawMarketHistory;

describe('parseDataset', () => {
  it('parses fixture into TimelineDataset', () => {
    const ds = parseDataset(raw);
    expect(ds.frames).toHaveLength(5);
    expect(ds.timestamps).toHaveLength(5);
    expect(ds.baseline_timestamp).toBe('2026-02-25T00:00:00.000Z');
  });

  it('includes only tickers present in data', () => {
    const ds = parseDataset(raw);
    const ids = ds.tickers.map(t => t.id);
    // BZ=F and CL=F are in the fixture, but they are NOT in the consolidated TICKERS list anymore.
    // However, parseDataset filters TICKERS based on what's in the data.
    // Our consolidated TICKERS list has 'BRENT' and 'WTI', but the fixture has 'BZ=F' and 'CL=F'.
    // So ds.tickers will NOT include BRENT or WTI because they are not in the fixture.
    // It will include '^VIX' and 'GDELT:iran' because they ARE in both.
    // NOTE: This fixture will need updating when the pipeline is re-run with BRENT/WTI.
    expect(ids).toHaveLength(2);
    expect(ids).toContain('^VIX');
    expect(ids).toContain('GDELT:iran');
    expect(ids).not.toContain('BRENT');
    expect(ids).not.toContain('WTI');
  });
});

describe('getFrame', () => {
  it('returns frame at index', () => {
    const ds = parseDataset(raw);
    const f = getFrame(ds, 2);
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
    expect(f.values['BZ=F'].close).toBeCloseTo(75.60);
  });

  it('clamps to bounds', () => {
    const ds = parseDataset(raw);
    expect(getFrame(ds, -1).timestamp).toBe(ds.timestamps[0]);
    expect(getFrame(ds, 999).timestamp).toBe(ds.timestamps[ds.timestamps.length - 1]);
  });
});

describe('getFrameAtTime', () => {
  it('finds exact timestamp', () => {
    const ds = parseDataset(raw);
    const f = getFrameAtTime(ds, '2026-02-25T02:00:00.000Z');
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
  });

  it('snaps to nearest timestamp', () => {
    const ds = parseDataset(raw);
    // 01:40 is closer to 02:00 than 01:00
    const f = getFrameAtTime(ds, '2026-02-25T01:40:00.000Z');
    expect(f.timestamp).toBe('2026-02-25T02:00:00.000Z');
  });

  it('returns first frame for time before range', () => {
    const ds = parseDataset(raw);
    const f = getFrameAtTime(ds, '2026-02-24T00:00:00.000Z');
    expect(f.timestamp).toBe(ds.timestamps[0]);
  });
});

describe('getTickerTimeseries', () => {
  it('returns all frames for a ticker', () => {
    const ds = parseDataset(raw);
    const series = getTickerTimeseries(ds, 'BZ=F');
    expect(series).toHaveLength(5);
    expect(series[0]?.close).toBeCloseTo(74.50);
    expect(series[4]?.close).toBeCloseTo(78.00);
  });

  it('returns undefined for missing ticker', () => {
    const ds = parseDataset(raw);
    const series = getTickerTimeseries(ds, 'NONEXISTENT');
    expect(series.every(v => v === undefined)).toBe(true);
  });
});

describe('interpolateFrame', () => {
  it('alpha=0 returns f0', () => {
    const ds = parseDataset(raw);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 0);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.50);
  });

  it('alpha=1 returns f1', () => {
    const ds = parseDataset(raw);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 1);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.80);
  });

  it('alpha=0.5 returns midpoint', () => {
    const ds = parseDataset(raw);
    const blended = interpolateFrame(ds.frames[0], ds.frames[1], 0.5);
    expect(blended.values['BZ=F'].close).toBeCloseTo(74.65);
  });

  it('clamps alpha to [0,1]', () => {
    const ds = parseDataset(raw);
    const below = interpolateFrame(ds.frames[0], ds.frames[1], -5);
    expect(below.values['BZ=F'].close).toBeCloseTo(74.50);
    const above = interpolateFrame(ds.frames[0], ds.frames[1], 10);
    expect(above.values['BZ=F'].close).toBeCloseTo(74.80);
  });
});
