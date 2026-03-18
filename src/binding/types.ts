import type { TickerFrame } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';

// ─── Resolver Interfaces ────────────────────────────

/**
 * Resolves a TickerFrame to the shape portion of FaceParams.
 * Shape is now fully data-driven — changes each frame.
 */
export interface ShapeResolver {
  resolve(frame: TickerFrame): Float32Array; // length = N_SHAPE
}

/**
 * Resolves a TickerFrame to the expression portion of FaceParams.
 * Expression is crisis dynamics — changes each frame.
 */
export interface ExpressionResolver {
  resolve(frame: TickerFrame): Float32Array; // length = N_EXPR
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

export interface BindingConfig {
  /** How deviation maps to joy axis (±3 output) */
  deviation_curve: ResponseCurve;
  /** How |velocity| maps to surprise axis (0..3 output) */
  velocity_curve: ResponseCurve;
  /** How volatility maps to tension axis (0..3 output) */
  volatility_curve: ResponseCurve;
  /** How drawdown maps to anguish axis (±3 output) */
  drawdown_curve: ResponseCurve;
  /** How momentum maps to stature axis (±3 output) */
  momentum_curve: ResponseCurve;
  /** How mean_reversion_z maps to proportion axis (±3 output) */
  mean_reversion_z_curve: ResponseCurve;
  /** How beta maps to angularity axis (±3 output) */
  beta_curve: ResponseCurve;
  /** Optional pose resolver config overrides */
  poseConfig?: Partial<import('./pose').PoseConfig>;
  /** Optional gaze resolver config overrides */
  gazeConfig?: Partial<import('./gaze').GazeConfig>;
}

// ─── Helpers ────────────────────────────────────────

export function emptyShape(): Float32Array {
  return new Float32Array(N_SHAPE);
}

export function emptyExpression(): Float32Array {
  return new Float32Array(N_EXPR);
}
