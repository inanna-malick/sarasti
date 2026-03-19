import type { TimelineDataset, TickerFrame } from '../types';

export interface SignalStats {
  min: number;
  max: number;
  mean: number;
  std: number;
}

export interface TickerStats {
  deviation: SignalStats;
  velocity: SignalStats;
  volatility: SignalStats;
  drawdown: SignalStats;
  momentum: SignalStats;
  mean_reversion_z: SignalStats;
  beta: SignalStats;
}

export type DatasetStats = Map<string, TickerStats>;

const SIGNAL_KEYS: (keyof TickerStats)[] = [
  'deviation', 'velocity', 'volatility', 'drawdown',
  'momentum', 'mean_reversion_z', 'beta',
];

function computeSignalStats(values: number[]): SignalStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, std: 1 };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / values.length;

  let sumSqDiff = 0;
  for (const v of values) {
    const d = v - mean;
    sumSqDiff += d * d;
  }
  const std = Math.sqrt(sumSqDiff / values.length);

  return { min, max, mean, std };
}

/**
 * Compute per-ticker, per-signal statistics across all frames.
 * Called once at dataset load time.
 */
export function computeDatasetStats(dataset: TimelineDataset): DatasetStats {
  const stats: DatasetStats = new Map();

  for (const ticker of dataset.tickers) {
    const accum: Record<string, number[]> = {};
    for (const key of SIGNAL_KEYS) {
      accum[key] = [];
    }

    for (const frame of dataset.frames) {
      const tf: TickerFrame | undefined = frame.values[ticker.id];
      if (!tf) continue;
      for (const key of SIGNAL_KEYS) {
        accum[key].push(tf[key]);
      }
    }

    const tickerStats: TickerStats = {
      deviation: computeSignalStats(accum.deviation),
      velocity: computeSignalStats(accum.velocity),
      volatility: computeSignalStats(accum.volatility),
      drawdown: computeSignalStats(accum.drawdown),
      momentum: computeSignalStats(accum.momentum),
      mean_reversion_z: computeSignalStats(accum.mean_reversion_z),
      beta: computeSignalStats(accum.beta),
    };

    stats.set(ticker.id, tickerStats);
  }

  return stats;
}
