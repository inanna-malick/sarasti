import type { BindingConfig } from './types';
import { MAX_DEVIATION_SIGMA } from '../constants';

/**
 * Data → Axis routing configuration.
 *
 * 7 axes, 7 distinct signals. Each axis gets its own data dimension.
 *
 * Expression (fast/reactive — per-frame market dynamics):
 *   deviation     → joy (±)     : outperforming = joy, underperforming = grief
 *   |velocity|    → surprise (+): fast moves = surprise, slow = calm
 *   volatility    → tension (+) : high chaos = tense, low = slack
 *   drawdown      → anguish (±) : distance from peak = structural damage
 *
 * Shape (structural — derived/cross-ticker signals):
 *   momentum      → stature     : rising trend = heavy, falling = gaunt
 *   mean_rev_z    → proportion  : stretched rubber band = elongated, normal = compact
 *   beta          → angularity  : breaking from herd = chiseled, conforming = soft
 */
export const DEFAULT_BINDING_CONFIG: BindingConfig = {
  // deviation → joy: sigmoid, steepness 1.18 (CMA-ES tuned)
  // Tight range: typical market deviations are 0.05–0.3σ
  deviation_curve: {
    type: 'sigmoid',
    input_min: -MAX_DEVIATION_SIGMA,
    input_max: MAX_DEVIATION_SIGMA,
    output_min: -3,
    output_max: 3,
    steepness: 1.18,
  },

  // |velocity| → surprise: exponential (absolute value), steepness 2.49
  velocity_curve: {
    type: 'exponential',
    input_min: 0,
    input_max: 3.0,
    output_min: 0,
    output_max: 3,
    steepness: 2.49,
  },

  // volatility → tension: linear, 0-3 range
  volatility_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 3,
    output_min: 0,
    output_max: 3,
    steepness: 1,
  },

  // drawdown → anguish: sigmoid of negative drawdown
  // drawdown is ≤0 (0 = at peak, negative = in drawdown)
  // Deep drawdown → high anguish
  drawdown_curve: {
    type: 'sigmoid',
    input_min: -0.5,
    input_max: 0,
    output_min: 3,
    output_max: -1,
    steepness: 1.5,
  },

  // momentum → stature: sigmoid, structural trend
  // Positive momentum (sustained rising) → heavy/substantial
  // Negative momentum (sustained falling) → gaunt/diminished
  momentum_curve: {
    type: 'sigmoid',
    input_min: -3,
    input_max: 3,
    output_min: -3,
    output_max: 3,
    steepness: 1.2,
  },

  // mean_reversion_z → proportion: how stretched the rubber band is
  // High |z| → elongated (overstretched). Low → compact (normal).
  mean_reversion_z_curve: {
    type: 'exponential',
    input_min: 0,
    input_max: 4,
    output_min: 0,
    output_max: 3,
    steepness: 1.5,
  },

  // beta → angularity: herd conformity
  // beta ≈ 1 (moving with market) → soft. beta far from 1 → chiseled.
  // We map |1 - beta| so deviation from herd drives angularity.
  beta_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 2,
    output_min: 0,
    output_max: 3,
    steepness: 1,
  },
};

export const TEXTURE_CONFIG = {
  ema_window: 20,
  ema_alpha: 2 / (20 + 1),
  flush: {
    warm_red: 0.45,
    warm_green: -0.18,
    warm_blue: -0.22,
    cold_red: -0.25,
    cold_green: -0.10,
    cold_blue: 0.20,
    cheek_radius: 0.035,
    sigmoid_center: 0.15,
    sigmoid_steepness: 4,
    sigmoid_range: [0, 0.3] as [number, number],
  },
  fatigue: {
    components: [5, 8],
    weights: [1.5, -1.0],
    sigmoid_center: 1.25,
    sigmoid_steepness: 3,
    sigmoid_range: [0.5, 2.0] as [number, number],
  },
};
