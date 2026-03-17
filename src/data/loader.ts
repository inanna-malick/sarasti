import type { TimelineDataset, Frame, TickerFrame, TickerStatic } from '../types';
import type { RawMarketHistory } from './schema';
import { TICKERS } from '../tickers';

/**
 * Fetch and parse market-history.json into TimelineDataset.
 *
 * @param url - URL or path to market-history.json
 * @returns Parsed and indexed dataset ready for frame access
 */
export async function loadDataset(url: string): Promise<TimelineDataset> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch dataset: ${resp.status} ${resp.statusText}`);
  const raw: RawMarketHistory = await resp.json();
  return parseDataset(raw);
}

/**
 * Parse raw JSON into TimelineDataset. Exported for testing
 * (test can pass fixture directly without fetch).
 */
export function parseDataset(raw: RawMarketHistory): TimelineDataset {
  const timestamps = raw.frames.map(f => f.timestamp);

  // Check for missing tickers and log warnings
  const presentIds = new Set<string>();
  for (const frame of raw.frames) {
    for (const id of Object.keys(frame.values)) {
      presentIds.add(id);
    }
  }
  const tickers = TICKERS.filter(t => {
    const isPresent = presentIds.has(t.id);
    if (!isPresent) {
      console.warn(`Ticker data mismatch: ${t.id} in TICKERS list but missing from frame data.`);
    }
    return isPresent;
  });

  const frames: Frame[] = raw.frames.map(rf => ({
    timestamp: rf.timestamp,
    values: rf.values as Record<string, TickerFrame>,
  }));

  // Parse static metadata if present (binding refinement)
  const statics: Record<string, TickerStatic> | undefined = raw.statics
    ? Object.fromEntries(
        Object.entries(raw.statics).map(([id, s]) => [
          id,
          {
            avg_volume: s.avg_volume,
            hist_volatility: s.hist_volatility,
            corr_to_brent: s.corr_to_brent,
            corr_to_spy: s.corr_to_spy,
            skewness: s.skewness,
            spread_from_family: s.spread_from_family,
            shape_residuals: s.shape_residuals,
          },
        ]),
      )
    : undefined;

  return {
    tickers,
    frames,
    timestamps,
    baseline_timestamp: raw.baseline_timestamp,
    statics,
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

  // lo is the first timestamp >= target. Pick nearest of lo and lo-1.
  if (lo === 0) return dataset.frames[0];
  const prevDist = Math.abs(target - new Date(timestamps[lo - 1]).getTime());
  const currDist = Math.abs(target - new Date(timestamps[lo]).getTime());
  return dataset.frames[prevDist <= currDist ? lo - 1 : lo];
}

/**
 * Get full timeseries for a single ticker across all frames.
 * Useful for sparklines in the detail panel.
 */
export function getTickerTimeseries(
  dataset: TimelineDataset,
  tickerId: string,
): (TickerFrame | undefined)[] {
  return dataset.frames.map(f => f.values[tickerId]);
}
