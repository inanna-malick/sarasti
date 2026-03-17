import type { TickerFrame } from '../../types';
import { TEXTURE_CONFIG } from '../config';
import { applyCurve } from '../curves';

/**
 * EMA accumulator per ticker for texture-related parameters (flush, fatigue).
 */
export interface TextureAccumulator {
  /** EMA of |frame.deviation| */
  ema_abs_deviation: number;
  /** EMA of frame.volatility */
  ema_volatility: number;
}

/**
 * Creates a fresh TextureAccumulator with baseline values.
 */
export function createTextureAccumulator(): TextureAccumulator {
  return {
    ema_abs_deviation: 0,
    ema_volatility: 1, // baseline volatility is 1.0
  };
}

/**
 * Updates the accumulator with a new frame using Exponential Moving Average.
 * ema = alpha * value + (1 - alpha) * ema
 */
export function updateAccumulator(
  acc: TextureAccumulator,
  frame: TickerFrame,
  alpha: number = TEXTURE_CONFIG.ema_alpha
): TextureAccumulator {
  const absDev = Math.abs(frame.deviation);
  const vol = frame.volatility;

  return {
    ema_abs_deviation: alpha * absDev + (1 - alpha) * acc.ema_abs_deviation,
    ema_volatility: alpha * vol + (1 - alpha) * acc.ema_volatility,
  };
}

/**
 * Maps EMA values to flush and fatigue scalars in [-1, 1] via sigmoid curves.
 */
export function accumulatorToTexture(acc: TextureAccumulator): { flush: number; fatigue: number } {
  const flush = applyCurve({
    type: 'sigmoid',
    input_min: TEXTURE_CONFIG.flush.sigmoid_range[0],
    input_max: TEXTURE_CONFIG.flush.sigmoid_range[1],
    output_min: -1,
    output_max: 1,
    steepness: TEXTURE_CONFIG.flush.sigmoid_steepness,
  }, acc.ema_abs_deviation);

  const fatigue = applyCurve({
    type: 'sigmoid',
    input_min: TEXTURE_CONFIG.fatigue.sigmoid_range[0],
    input_max: TEXTURE_CONFIG.fatigue.sigmoid_range[1],
    output_min: -1,
    output_max: 1,
    steepness: TEXTURE_CONFIG.fatigue.sigmoid_steepness,
  }, acc.ema_volatility);

  return { flush, fatigue };
}
