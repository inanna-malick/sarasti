/**
 * JSON schema types for market-history.json.
 *
 * This is the contract between Python pull scripts (producers) and
 * the TypeScript loader (consumer). Both sides must agree on this shape.
 *
 * The JSON file is an array of hourly snapshots. Each snapshot has a
 * timestamp and a record of ticker values. The loader transforms this
 * into a TimelineDataset with pre-indexed frames.
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
  // ─── Tier 2/3 per-frame fields (binding refinement) ──
  volume_anomaly?: number;
  corr_breakdown?: number;
  term_slope?: number;
  cross_contagion?: number;
  high_low_ratio?: number;
  /** Sarasti residual: per-frame dynamic PCA components */
  expr_residuals?: number[];
}

/** Pre-computed static metadata per ticker (pre-crisis baseline) */
export interface RawTickerStatic {
  avg_volume: number;
  hist_volatility: number;
  corr_to_brent: number;
  corr_to_spy: number;
  skewness: number;
  spread_from_family: number;
  /** Sarasti residual: static PCA components for shape */
  shape_residuals?: number[];
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
  /** Pre-computed static metadata per ticker (binding refinement). Keyed by ticker id. */
  statics?: Record<string, RawTickerStatic>;
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
