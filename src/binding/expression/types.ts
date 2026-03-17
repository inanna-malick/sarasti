import type { ExpressionAllocation, ResponseCurve } from '../types';

/**
 * Expression param allocation table — empirically tuned.
 *
 * Each register drives MULTIPLE high-variance FLAME expression components
 * simultaneously. Components can appear in multiple registers (with different
 * sign/weight) — this is intentional. The dynamics modulator blends registers,
 * and overlapping indices create rich cross-register interference.
 *
 * FLAME 2023 Open expression component catalog (empirical, ±5 sweep):
 *   ψ0: jaw open + smile (strongest axis)
 *   ψ1: smile/frown (cheeks raise vs corners drop)
 *   ψ2: mouth open extreme open vs lips pressed
 *   ψ3: lip parting / protrusion
 *   ψ4: brow raise / lower
 *   ψ5: lip pursing forward / back
 *   ψ6: jaw lateral shift
 *   ψ7: head shape modifier
 *   ψ8: subtle lip/nose
 *   ψ9: eye/cheek region (squint vs widen)
 *
 * Register design (negative weights = negative direction on that axis):
 *   significant drawdown: frown(ψ1-), jaw clench(ψ0-), brow furrow(ψ4-), lips press(ψ2-), lips retract(ψ5-)
 *   shock:    jaw drop(ψ0+), mouth open(ψ2+), brow raise(ψ4+), lips spread(ψ1+), lip part(ψ3+)
 *   recovery:   smile(ψ1+), jaw relax(ψ0+), cheek raise(ψ9+), brow lift(ψ4+)
 *   sustained volatility:    lips press(ψ2-), downturn(ψ1-), jaw clench(ψ0-), lips retract(ψ5-), jaw lateral(ψ6+)
 */
export const EXPRESSION_ALLOCATION: ExpressionAllocation = {
  distress: {
    indices: [1, 0, 9, 4, 5, 2, 7],
    weights: [-1.0, -0.6, 0.8, 0.5, 0.6, -0.5, 0.4],
  },
  shock: {
    indices: [0, 2, 1, 3, 4, 9],
    weights: [1.0, 0.9, 0.3, 0.5, -0.5, -0.4],
  },
  relief: {
    indices: [1, 0, 4, 5, 9],
    weights: [1.0, 0.4, -0.3, -0.2, -0.3],
  },
  dread: {
    indices: [1, 2, 0, 9, 7, 4, 6],
    weights: [-0.9, -0.8, -0.5, 0.7, 0.5, 0.4, 0.3],
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
