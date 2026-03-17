import type { TickerConfig, TickerFrame, TickerStatic, AssetClass } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';

// ─── Resolver Interfaces ────────────────────────────

/**
 * Resolves a TickerConfig to the shape portion of FaceParams.
 * Shape is structural identity — fixed per face, determined by
 * age, asset class, and family.
 */
export interface ShapeResolver {
  resolve(ticker: TickerConfig, statics?: TickerStatic): Float32Array; // length = N_SHAPE
}

/**
 * Resolves a TickerFrame to the expression portion of FaceParams.
 * Expression is crisis dynamics — changes each frame, determined by
 * deviation, velocity, and volatility.
 */
export interface ExpressionResolver {
  resolve(frame: TickerFrame): Float32Array; // length = N_EXPR
}

// ─── Shape Param Allocation ─────────────────────────
// Which β indices are controlled by which mapper.
// Devs fill in the actual FLAME component indices after empirical exploration.

export interface ShapeAllocation {
  /** Tier 1: β indices controlled by age (e.g., jaw weight, skin tightness, brow prominence) */
  age_indices: number[];
  /** Tier 2: β indices controlled by asset class (gross morphology) */
  class_indices: number[];
  /** Tier 2: β indices controlled by family (family resemblance) */
  family_indices: number[];
  /** Tier 2: β indices controlled by avg volume (heavier = broader) */
  volume_indices?: number[];
  /** Tier 2: β indices controlled by historical volatility (angular, tense) */
  hist_vol_indices?: number[];
  /** Tier 2: β indices for correlation to Brent (morphological similarity) */
  corr_brent_indices?: number[];
  /** Tier 3: β indices for correlation to SPY (equity-likeness) */
  corr_spy_indices?: number[];
  /** Tier 3: β indices for market cap / notional weight */
  market_cap_indices?: number[];
  /** Tier 3: β indices for spread from family mean */
  spread_indices?: number[];
  /** Tier 3: β indices for skewness (asymmetric face structure) */
  skewness_indices?: number[];
  /** Sarasti: β₅₁₋₁₀₀ for shape residuals (PCA of unexplained variance) */
  residual_indices?: number[];
}

// ─── Expression Param Allocation ────────────────────
// Which ψ indices map to which emotional register.
// Devs fill in after empirical exploration of FLAME expression basis.

export interface ExpressionRegister {
  /** ψ indices for this register */
  indices: number[];
  /** per-index weights (how strongly each component contributes) */
  weights: number[];
}

export interface ExpressionAllocation {
  // ─── Tier 1 (ψ₁₋₅): deviation ──────────────────
  /** Distress: brow furrow + mouth downturn (negative deviation) */
  distress: ExpressionRegister;
  /** Shock: brow raise + mouth open (sudden moves) */
  shock: ExpressionRegister;
  /** Relief: slight smile + brow relax (positive deviation) */
  relief: ExpressionRegister;
  /** Dread: sustained negative (velocity-modulated distress) */
  dread: ExpressionRegister;
  // ─── Tier 2 (ψ₁₆₋₂₀): volume anomaly ─────────
  /** Alertness: widened eyes, flared nostrils (volume surge) */
  alertness?: ExpressionRegister;
  /** Exhaustion: drooping, slack (volume collapse) */
  exhaustion?: ExpressionRegister;
  // ─── Tier 3 (ψ₂₁₋₄₀): structural expressions ─
  /** Correlation breakdown register (ψ₂₁₋₂₅) */
  corr_breakdown?: ExpressionRegister;
  /** Term structure register (ψ₂₆₋₃₀) */
  term_structure?: ExpressionRegister;
  /** Cross-asset contagion register (ψ₃₁₋₃₅) */
  contagion?: ExpressionRegister;
  /** Spread/strain register (ψ₃₆₋₄₀) */
  strain?: ExpressionRegister;
}

// ─── Response Curves ────────────────────────────────

export type CurveType = 'linear' | 'exponential' | 'sigmoid';

export interface ResponseCurve {
  type: CurveType;
  /** Input range: values outside are clamped */
  input_min: number;
  input_max: number;
  /** Output range */
  output_min: number;
  output_max: number;
  /** Steepness for exponential/sigmoid curves */
  steepness: number;
}

// ─── Binding Config ─────────────────────────────────
// Full binding configuration. The artist's hand is here.

export interface BindingConfig {
  shape: ShapeAllocation;
  expression: ExpressionAllocation;
  /** How deviation maps to expression intensity */
  deviation_curve: ResponseCurve;
  /** How velocity modulates expression type */
  velocity_curve: ResponseCurve;
  /** How volatility modulates expression complexity */
  volatility_curve: ResponseCurve;
  /** Intensity scaling per tier: [tier1, tier2, tier3, sarasti] */
  tier_intensities?: [number, number, number, number];
  /** Global expression intensity multiplier (0-1) */
  expression_intensity: number;
  /** Per-class shape profiles: class → array of [index, value] pairs */
  class_profiles: Record<AssetClass, [number, number][]>;
  /** Per-family shape perturbations: family → array of [index, value] pairs */
  family_profiles: Record<string, [number, number][]>;
  // ─── Tier 2/3 response curves (binding refinement) ──
  /** How volume anomaly maps to alertness/exhaustion expression */
  volume_anomaly_curve?: ResponseCurve;
  /** How corr_breakdown maps to tier 3 expression */
  corr_breakdown_curve?: ResponseCurve;
  /** How term_slope maps to tier 3 expression */
  term_slope_curve?: ResponseCurve;
  /** How cross_contagion maps to tier 3 expression */
  cross_contagion_curve?: ResponseCurve;
  /** How high_low_ratio maps to tier 3 strain expression */
  high_low_ratio_curve?: ResponseCurve;
  // ─── Tier 2/3 shape response curves (binding refinement) ──
  /** How avg_volume maps to shape perturbation */
  avg_volume_curve?: ResponseCurve;
  /** How hist_volatility maps to shape perturbation */
  hist_vol_curve?: ResponseCurve;
  /** How corr_to_brent maps to shape perturbation */
  corr_brent_curve?: ResponseCurve;
  /** How corr_to_spy maps to shape perturbation */
  corr_spy_curve?: ResponseCurve;
  /** How market_cap/spread maps to shape perturbation */
  spread_curve?: ResponseCurve;
  /** How skewness maps to shape perturbation */
  skewness_curve?: ResponseCurve;
}

// ─── Helpers ────────────────────────────────────────

export function emptyShape(): Float32Array {
  return new Float32Array(N_SHAPE);
}

export function emptyExpression(): Float32Array {
  return new Float32Array(N_EXPR);
}
