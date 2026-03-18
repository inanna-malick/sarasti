import type { TimelineDataset, Frame, TickerFrame, TickerConfig } from '../types';
import type { RawMarketHistory } from './schema';

/**
 * Fetch and parse market-history.json into TimelineDataset.
 */
export async function loadDataset(url: string, expectedTickers: TickerConfig[]): Promise<TimelineDataset> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch dataset: ${resp.status} ${resp.statusText}`);
  const raw: RawMarketHistory = await resp.json();
  return parseDataset(raw, expectedTickers);
}

/**
 * Parse raw JSON into TimelineDataset. Exported for testing.
 */
export function parseDataset(raw: RawMarketHistory, expectedTickers: TickerConfig[]): TimelineDataset {
  const timestamps = raw.frames.map(f => f.timestamp);

  const presentIds = new Set<string>();
  for (const frame of raw.frames) {
    for (const id of Object.keys(frame.values)) {
      presentIds.add(id);
    }
  }
  const tickers = expectedTickers.filter(t => {
    const isPresent = presentIds.has(t.id);
    if (!isPresent) {
      console.warn(`Ticker data mismatch: ${t.id} in expected list but missing from frame data.`);
    }
    return isPresent;
  });

  const frames: Frame[] = raw.frames.map(rf => ({
    timestamp: rf.timestamp,
    values: rf.values as Record<string, TickerFrame>,
  }));

  return {
    tickers,
    frames,
    timestamps,
    baseline_timestamp: raw.baseline_timestamp,
  };
}

/**
 * Get frame by index. Clamps to valid range.
 */
export function getFrame(dataset: TimelineDataset, index: number): Frame {
  const clamped = Math.max(0, Math.min(index, dataset.frames.length - 1));
  return dataset.frames[clamped];
}

/**
 * Get frame nearest to ISO timestamp via binary search.
 */
export function getFrameAtTime(dataset: TimelineDataset, isoString: string): Frame {
  const target = new Date(isoString).getTime();
  const timestamps = dataset.timestamps;

  if (timestamps.length === 0) throw new Error('Empty dataset');
  if (timestamps.length === 1) return dataset.frames[0];

  let lo = 0;
  let hi = timestamps.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const midTime = new Date(timestamps[mid]).getTime();
    if (midTime < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  if (lo === 0) return dataset.frames[0];
  const prevDist = Math.abs(target - new Date(timestamps[lo - 1]).getTime());
  const currDist = Math.abs(target - new Date(timestamps[lo]).getTime());
  return dataset.frames[prevDist <= currDist ? lo - 1 : lo];
}

/**
 * Get full timeseries for a single ticker across all frames.
 */
export function getTickerTimeseries(
  dataset: TimelineDataset,
  tickerId: string,
): (TickerFrame | undefined)[] {
  return dataset.frames.map(f => f.values[tickerId]);
}
