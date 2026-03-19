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

  // Derive missing fields (momentum, drawdown, mean_reversion_z, beta)
  // from available data if the data pipeline didn't compute them.
  deriveMissingFields(frames, presentIds);

  return {
    tickers,
    frames,
    timestamps,
    baseline_timestamp: raw.baseline_timestamp,
  };
}

/**
 * Derive momentum, drawdown, mean_reversion_z, beta from available fields
 * when the data pipeline hasn't computed them.
 */
function deriveMissingFields(frames: Frame[], tickerIds: Set<string>): void {
  if (frames.length === 0) return;

  // Check if derivation is needed by sampling first ticker's first frame
  const sampleTicker = tickerIds.values().next().value;
  if (!sampleTicker) return;
  const sample = frames[0].values[sampleTicker];
  if (!sample) return;
  // If momentum already exists and is a number, data pipeline computed them
  if (typeof sample.momentum === 'number' && !isNaN(sample.momentum)) return;

  const EMA_ALPHA = 2 / (12 + 1); // 12-frame EMA for momentum (~12hr structural trend)

  for (const tickerId of tickerIds) {
    let emaVelocity = 0;
    let rollingMax = -Infinity;

    for (let i = 0; i < frames.length; i++) {
      const v = frames[i].values[tickerId];
      if (!v) continue;

      // Momentum: EMA of velocity (smoothed directional trend)
      if (i === 0) {
        emaVelocity = v.velocity;
      } else {
        emaVelocity = EMA_ALPHA * v.velocity + (1 - EMA_ALPHA) * emaVelocity;
      }
      v.momentum = emaVelocity;

      // Drawdown: distance from rolling max of close (0 = at peak, negative = in drawdown)
      rollingMax = Math.max(rollingMax, v.close);
      v.drawdown = rollingMax > 0 ? (v.close - rollingMax) / rollingMax : 0;

      // Mean reversion Z: deviation / volatility (how abnormal is this deviation?)
      v.mean_reversion_z = v.volatility > 1e-6
        ? v.deviation / v.volatility
        : v.deviation;

      // Beta: default 1 (requires cross-asset correlation, not available)
      v.beta = 1;
    }
  }
}

/**
 * Get frame by index. Clamps to valid range.
 */
export function getFrame(dataset: TimelineDataset, index: number): Frame {
  const clamped = Math.max(0, Math.min(index, dataset.frames.length - 1));
  return dataset.frames[clamped];
}

/**
 * Get frame index nearest to ISO timestamp via binary search.
 */
export function getFrameIndexAtTime(dataset: TimelineDataset, isoString: string): number {
  const target = new Date(isoString).getTime();
  const timestamps = dataset.timestamps;

  if (timestamps.length === 0) return 0;
  if (timestamps.length === 1) return 0;

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

  if (lo === 0) return 0;
  const prevDist = Math.abs(target - new Date(timestamps[lo - 1]).getTime());
  const currDist = Math.abs(target - new Date(timestamps[lo]).getTime());
  return prevDist <= currDist ? lo - 1 : lo;
}

/**
 * Get frame nearest to ISO timestamp via binary search.
 */
export function getFrameAtTime(dataset: TimelineDataset, isoString: string): Frame {
  const index = getFrameIndexAtTime(dataset, isoString);
  return dataset.frames[index];
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
