import type { ExpressionAllocation, ResponseCurve } from '../types';

/**
 * Expression param allocation table.
 * Documents which ψ indices map to which emotional register.
 *
 * The FLAME model has 50 expression components (ψ₀₋₄₉).
 * We use indices 0-13 across four registers; the rest stay at zero.
 *
 *   ψ₀₋₃:   distress register (brow furrow + mouth downturn)
 *   ψ₄₋₇:   shock register (brow raise + mouth open)
 *   ψ₈₋₁₁:  relief register (slight smile + brow relax)
 *   ψ₁₂₋₁₃: dread extension (tension components)
 *   ψ₁₄₋₄₉: reserved (zero)
 *
 * IMPORTANT: These are PLACEHOLDER indices. The crisis-mapper Dev
 * must empirically determine which FLAME expression components
 * produce each emotional register by rendering faces with individual
 * ψ components varied. Document findings with screenshots.
 */
export const EXPRESSION_ALLOCATION: ExpressionAllocation = {
  distress: {
    indices: [0, 1, 2, 3],
    weights: [1.0, 0.8, 0.6, 0.4],
  },
  shock: {
    indices: [4, 5, 6, 7],
    weights: [1.0, 0.8, 0.6, 0.4],
  },
  relief: {
    indices: [8, 9, 10, 11],
    weights: [1.0, 0.7, 0.5, 0.3],
  },
  dread: {
    indices: [0, 1, 12, 13],
    weights: [0.7, 0.5, 1.0, 0.8],
  },
};

/**
 * Crisis mapper output: base expression from deviation.
 */
export interface CrisisExpressionResult {
  /** Which register is primary */
  register: 'distress' | 'shock' | 'relief' | 'neutral';
  /** Intensity in [0, 1] */
  intensity: number;
  /** The raw expression vector (before dynamics modulation) */
  expression: Float32Array;
}

/**
 * Dynamics mapper config.
 */
export interface DynamicsConfig {
  /** How velocity shifts between registers */
  velocity_curve: ResponseCurve;
  /** How volatility modulates complexity */
  volatility_curve: ResponseCurve;
}

/**
 * Dynamics modulation result.
 */
export interface DynamicsResult {
  /** The modulated expression vector */
  expression: Float32Array;
  /** Complexity score (0 = clean single register, 1 = multiple active) */
  complexity: number;
}
