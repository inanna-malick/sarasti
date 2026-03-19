import type { TickerFrame, Accessor, FaceDatum } from '../types';
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

/** Accessor-based axes configuration for the library API */
export interface AxesConfig<T extends FaceDatum = FaceDatum> {
  // Expression axes (Russell circumplex)
  tension?: Accessor<T>;
  mood?: Accessor<T>;
  // Shape axes
  dominance?: Accessor<T>;
  predator?: Accessor<T>;
  // Pose axes
  pitch?: Accessor<T>;
  yaw?: Accessor<T>;
  roll?: Accessor<T>;
  jaw?: Accessor<T>;
  // Gaze axes
  gazeH?: Accessor<T>;
  gazeV?: Accessor<T>;
  // Texture axes
  flush?: Accessor<T>;
  fatigue?: Accessor<T>;
}

/** Per-axis curve overrides */
export type AxisCurveConfig = Partial<Record<keyof AxesConfig, ResponseCurve>>;

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
