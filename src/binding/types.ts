import type { TickerConfig, TickerFrame, AssetClass } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';

// ─── Resolver Interfaces ────────────────────────────

/**
 * Resolves a TickerConfig to the shape portion of FaceParams.
 * Shape is structural identity — fixed per face, determined by
 * age, asset class, and family.
 */
export interface ShapeResolver {
  resolve(ticker: TickerConfig): Float32Array; // length = N_SHAPE
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
  /** β indices controlled by age (e.g., jaw weight, skin tightness, brow prominence) */
  age_indices: number[];
  /** β indices controlled by asset class (gross morphology) */
  class_indices: number[];
  /** β indices controlled by family (family resemblance) */
  family_indices: number[];
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
  /** Distress: brow furrow + mouth downturn (negative deviation) */
  distress: ExpressionRegister;
  /** Shock: brow raise + mouth open (sudden moves) */
  shock: ExpressionRegister;
  /** Relief: slight smile + brow relax (positive deviation) */
  relief: ExpressionRegister;
  /** Dread: sustained negative (velocity-modulated distress) */
  dread: ExpressionRegister;
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
  /** Global expression intensity multiplier (0-1) */
  expression_intensity: number;
  /** Per-class shape profiles: class → array of [index, value] pairs */
  class_profiles: Record<AssetClass, [number, number][]>;
  /** Per-family shape perturbations: family → array of [index, value] pairs */
  family_profiles: Record<string, [number, number][]>;
}

// ─── Helpers ────────────────────────────────────────

export function emptyShape(): Float32Array {
  return new Float32Array(N_SHAPE);
}

export function emptyExpression(): Float32Array {
  return new Float32Array(N_EXPR);
}
