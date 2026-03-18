/**
 * JSON schema types for market-history.json.
 *
 * This is the contract between Python pull scripts (producers) and
 * the TypeScript loader (consumer). Both sides must agree on this shape.
 */

/** Shape of a single ticker's data point in the JSON file */
export interface RawTickerValue {
  close: number;
  volume: number;
  /** (close - baseline_close) / baseline_close */
  deviation: number;
  /** Δclose/Δt normalized to stddev units */
  velocity: number;
  /** Rolling 6hr stddev, normalized to pre-crisis stddev */
  volatility: number;
  /** Distance from rolling max. 0 = at peak, negative = in drawdown. */
  drawdown: number;
  /** Rate of change over longer window (structural trend). */
  momentum: number;
  /** deviation / volatility. How abnormal is this abnormality? */
  mean_reversion_z: number;
  /** Rolling beta to market. 1 = with herd. */
  beta: number;
}

/** Shape of one hourly snapshot in the JSON file */
export interface RawFrame {
  /** ISO 8601 timestamp, e.g. "2026-02-25T00:00:00Z" */
  timestamp: string;
  /** Keyed by ticker id (e.g. "BZ=F", "GDELT:iran") */
  values: Record<string, RawTickerValue>;
}

/** Top-level shape of market-history.json */
export interface RawMarketHistory {
  /** ISO timestamp of the pre-crisis baseline (first frame) */
  baseline_timestamp: string;
  /** Ordered chronologically, 1hr apart */
  frames: RawFrame[];
}

/**
 * Shape of individual pull script output files.
 * market-pull outputs market-data.json, gdelt-pull outputs gdelt-data.json.
 * The integration step merges them into market-history.json.
 */
export interface RawPullOutput {
  /** Which tickers are included in this file */
  ticker_ids: string[];
  /** Same baseline as the final merged file */
  baseline_timestamp: string;
  /** Frames — may have gaps; merger aligns timestamps */
  frames: RawFrame[];
}
