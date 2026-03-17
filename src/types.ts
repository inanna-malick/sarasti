// ─── Data ───────────────────────────────────────────

export type AssetClass = 'energy' | 'commodity' | 'fear' | 'currency' | 'equity' | 'media';

export interface TickerConfig {
  id: string;
  name: string;
  class: AssetClass;
  family: string;
  age: number;
  tenor_months?: number;
}

export interface TickerFrame {
  close: number;
  volume: number;
  deviation: number;
  velocity: number;
  volatility: number;
  // ─── Tier 2 per-frame fields (binding refinement) ──
  /** Current volume / baseline avg volume. >1 = surge, <1 = capitulation. */
  volume_anomaly?: number;
  /** |rolling_corr_to_brent - baseline_corr_to_brent|. Spikes when correlations break. */
  corr_breakdown?: number;
  /** For futures: slope of term structure (contango/backwardation steepness). */
  term_slope?: number;
  /** Rolling correlation to other asset classes. Spikes = contagion. */
  cross_contagion?: number;
  /** (high - low) / close. Bid-ask spread proxy. */
  high_low_ratio?: number;
  // ─── Sarasti residual (per-frame dynamic) ──────────
  /** PCA residual components for expression binding (ψ₄₁₋₁₀₀). */
  expr_residuals?: number[];
}

/** Pre-computed static metadata per ticker (computed from pre-crisis baseline). */
export interface TickerStatic {
  /** Average daily volume during pre-crisis window. */
  avg_volume: number;
  /** Historical volatility (pct_change stddev, pre-crisis). */
  hist_volatility: number;
  /** Pre-crisis correlation to Brent. */
  corr_to_brent: number;
  /** Pre-crisis correlation to SPY. */
  corr_to_spy: number;
  /** Skewness of returns (pre-crisis). */
  skewness: number;
  /** Deviation from family mean price level (pre-crisis). */
  spread_from_family: number;
  /** PCA residual components for shape binding (β₅₁₋₁₀₀). */
  shape_residuals?: number[];
}

export interface Frame {
  timestamp: string;
  values: Record<string, TickerFrame>;
}

export interface TimelineDataset {
  tickers: TickerConfig[];
  frames: Frame[];
  timestamps: string[];
  baseline_timestamp: string;
  /** Pre-computed static metadata per ticker. Keyed by ticker id. */
  statics?: Record<string, TickerStatic>;
}

// ─── Face ───────────────────────────────────────────

export interface FaceParams {
  shape: Float32Array;
  expression: Float32Array;
  flush: number;      // [-1, 1] — -1 bloodless, 0 baseline, +1 flushed
  fatigue: number;    // [-1, 1] — -1 alert, 0 baseline, +1 fatigued
}

export interface FaceInstance {
  id: string;
  params: FaceParams;
  position: [number, number, number];
  ticker: TickerConfig;
  frame: TickerFrame;
}

// ─── Renderer ───────────────────────────────────────

export interface FaceRenderer {
  init(container: HTMLElement): Promise<void>;
  setInstances(instances: FaceInstance[]): void;
  highlightInstance(id: string | null): void;
  getInstanceAtScreenPos(x: number, y: number): string | null;
  setCameraTarget(pos: [number, number, number]): void;
  dispose(): void;
}

// ─── Layout ─────────────────────────────────────────

export type LayoutStrategy =
  | { kind: 'family-rows' }
  | { kind: 'class-clusters' }
  | { kind: 'reactivity-sweep' };

export interface LayoutResult {
  positions: Map<string, [number, number, number]>;
}

// ─── Binding ────────────────────────────────────────

export interface ExpressionMap {
  indices: number[];
  weights: number[];
  curve: 'linear' | 'exponential' | 'sigmoid';
}

export interface TidalBinding {
  age_shape_components: number[];
  class_shape_components: number[];
  family_shape_components: number[];
  deviation_expr_map: ExpressionMap;
  velocity_expr_map: ExpressionMap;
  volatility_expr_map: ExpressionMap;
  expression_intensity: number;
}

// ─── Timeline ───────────────────────────────────────

export interface PlaybackState {
  current_index: number;
  playing: boolean;
  speed: number;
  loop: boolean;
}
