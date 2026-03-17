import type { TickerConfig, TickerFrame, TickerStatic, FaceParams } from '../types';
import type { ShapeResolver, ExpressionResolver, BindingConfig } from './types';
import { emptyShape, emptyExpression } from './types';
import { N_SHAPE, N_EXPR } from '../constants';
import { mapAgeToShape } from './shape/age';
import { mapIdentityToShape } from './shape/identity';
import { mapCrisisToExpression } from './expression/crisis';
import { mapDynamicsToExpression } from './expression/dynamics';
import { DEFAULT_BINDING_CONFIG, TEXTURE_CONFIG } from './config';
import { applyCurve } from './curves';
import {
  createTextureAccumulator,
  updateAccumulator,
  accumulatorToTexture,
  TextureAccumulator
} from './texture/accumulator';

// ─── Shape Resolver ─────────────────────────────────

/**
 * Creates a ShapeResolver that combines age + identity mapping.
 * Shape is structural identity — computed once per face, not per frame.
 */
export function createShapeResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): ShapeResolver {
  return {
    resolve(ticker: TickerConfig, statics?: TickerStatic): Float32Array {
      const shape = emptyShape();

      // Tier 1: Age mapping (β₀₋₂)
      const ageResult = mapAgeToShape(ticker.age);
      for (const [idx, value] of ageResult.entries) {
        if (idx < N_SHAPE) shape[idx] = value;
      }

      // Tier 2: Identity mapping — class (β₃₋₅) + family (β₆₋₉)
      const identityResult = mapIdentityToShape(ticker.class, ticker.family, config);
      for (const [idx, value] of identityResult.class_entries) {
        if (idx < N_SHAPE) shape[idx] = value;
      }
      for (const [idx, value] of identityResult.family_entries) {
        if (idx < N_SHAPE) shape[idx] += value; // additive perturbation
      }

      // Tier 2/3 + Sarasti: enriched shape from static metadata
      // Implemented by shape-enrichment dev — see mapStaticsToShape()
      if (statics) {
        mapStaticsToShape(shape, statics, config);
      }

      return shape;
    },
  };
}

/**
 * Tier 2/3 + Sarasti shape enrichment from static metadata.
 * Stub — implemented by shape-enrichment dev.
 * Maps: avg_volume, hist_volatility, corr_to_brent → β₁₁₋₂₀ (tier 2)
 *       corr_to_spy, spread_from_family, skewness → β₂₁₋₄₀ (tier 3)
 *       shape_residuals → β₅₁₋₁₀₀ (Sarasti residual)
 */
function mapStaticsToShape(
  shape: Float32Array,
  statics: TickerStatic,
  config: BindingConfig,
): void {
  // Sarasti residual: direct injection if present
  if (statics.shape_residuals) {
    const residualStart = 50; // β₅₁₋₁₀₀
    for (let i = 0; i < statics.shape_residuals.length && (residualStart + i) < N_SHAPE; i++) {
      shape[residualStart + i] = statics.shape_residuals[i];
    }
  }

  // Tier 2/3 intensities
  const [_, t2_intensity, t3_intensity] = config.tier_intensities || [1.0, 0.5, 0.2, 1.0];

  // Tier 2 named bindings: β₁₁₋₂₀
  // β₁₁₋₁₃ ← avg_volume
  if (statics.avg_volume !== undefined && config.avg_volume_curve && config.shape.volume_indices) {
    const val = applyCurve(config.avg_volume_curve, statics.avg_volume) * t2_intensity;
    for (const idx of config.shape.volume_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // β₁₄₋₁₆ ← hist_volatility
  if (statics.hist_volatility !== undefined && config.hist_vol_curve && config.shape.hist_vol_indices) {
    const val = applyCurve(config.hist_vol_curve, statics.hist_volatility) * t2_intensity;
    for (const idx of config.shape.hist_vol_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // β₁₇₋₂₀ ← corr_to_brent
  if (statics.corr_to_brent !== undefined && config.corr_brent_curve && config.shape.corr_brent_indices) {
    const val = applyCurve(config.corr_brent_curve, statics.corr_to_brent) * t2_intensity;
    for (const idx of config.shape.corr_brent_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // Tier 3 named bindings: β₂₁₋₅₀
  // β₂₁₋₂₅ ← corr_to_spy
  if (statics.corr_to_spy !== undefined && config.corr_spy_curve && config.shape.corr_spy_indices) {
    const val = applyCurve(config.corr_spy_curve, statics.corr_to_spy) * t3_intensity;
    for (const idx of config.shape.corr_spy_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // β₂₆₋₃₀ ← market_cap (proxy: spread_from_family)
  if (statics.spread_from_family !== undefined && config.spread_curve && config.shape.market_cap_indices) {
    const val = applyCurve(config.spread_curve, statics.spread_from_family) * t3_intensity;
    for (const idx of config.shape.market_cap_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // β₃₁₋₃₅ ← spread_from_family
  if (statics.spread_from_family !== undefined && config.spread_curve && config.shape.spread_indices) {
    const val = applyCurve(config.spread_curve, statics.spread_from_family) * t3_intensity;
    for (const idx of config.shape.spread_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }

  // β₃₆₋₄₀ ← skewness
  if (statics.skewness !== undefined && config.skewness_curve && config.shape.skewness_indices) {
    const val = applyCurve(config.skewness_curve, statics.skewness) * t3_intensity;
    for (const idx of config.shape.skewness_indices) {
      if (idx < N_SHAPE) shape[idx] += val;
    }
  }
}

// ─── Expression Resolver ────────────────────────────

/**
 * Creates an ExpressionResolver that combines crisis + dynamics mapping.
 * Expression is crisis dynamics — recomputed each frame.
 */
export function createExpressionResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): ExpressionResolver {
  return {
    resolve(frame: TickerFrame): Float32Array {
      // Tier 1: Base expression from deviation (ψ₁₋₅)
      const crisisResult = mapCrisisToExpression(frame.deviation, config);

      // Tier 2: Modulate with velocity and volatility (ψ₆₋₁₅)
      const dynamicsResult = mapDynamicsToExpression(
        crisisResult.expression,
        frame.velocity,
        frame.volatility,
        config,
      );

      const expression = dynamicsResult.expression;

      // Tier 2/3 + Sarasti: enriched expression from per-frame fields
      // Implemented by expression-enrichment dev — see mapEnrichedToExpression()
      mapEnrichedToExpression(expression, frame, config);

      return expression;
    },
  };
}

/**
 * Tier 2/3 + Sarasti expression enrichment from per-frame fields.
 * Stub — implemented by expression-enrichment dev.
 * Maps: volume_anomaly → ψ₁₆₋₂₀ (tier 2: alertness/exhaustion)
 *       corr_breakdown → ψ₂₁₋₂₅ (tier 3)
 *       term_slope → ψ₂₆₋₃₀ (tier 3)
 *       cross_contagion → ψ₃₁₋₃₅ (tier 3)
 *       high_low_ratio → ψ₃₆₋₄₀ (tier 3)
 *       expr_residuals → ψ₄₁₋₁₀₀ (Sarasti residual)
 */
function mapEnrichedToExpression(
  expression: Float32Array,
  frame: TickerFrame,
  config: BindingConfig,
): void {
  const tiers = config.tier_intensities || [1.0, 0.5, 0.2, 0.1];
  const t1Intensity = config.expression_intensity;

  // Tier 2: volume_anomaly → ψ₁₆₋₂₀ (alertness/exhaustion)
  if (frame.volume_anomaly !== undefined && config.volume_anomaly_curve) {
    const volMapped = applyCurve(config.volume_anomaly_curve, frame.volume_anomaly);
    const tier2Intensity = t1Intensity * tiers[1];

    if (volMapped > 0 && config.expression.alertness) {
      // Surge → Alertness
      blendRegister(expression, config.expression.alertness, volMapped * tier2Intensity);
    } else if (volMapped < 0 && config.expression.exhaustion) {
      // Collapse → Exhaustion
      blendRegister(expression, config.expression.exhaustion, Math.abs(volMapped) * tier2Intensity);
    }
  }

  // Tier 3: structural expressions (ψ₂₁₋₄₀)
  const tier3Intensity = t1Intensity * tiers[2];

  // Correlation breakdown (ψ₂₁₋₂₅)
  if (frame.corr_breakdown !== undefined && config.corr_breakdown_curve && config.expression.corr_breakdown) {
    const val = applyCurve(config.corr_breakdown_curve, frame.corr_breakdown);
    blendRegister(expression, config.expression.corr_breakdown, val * tier3Intensity);
  }

  // Term structure slope (ψ₂₆₋₃₀)
  if (frame.term_slope !== undefined && config.term_slope_curve && config.expression.term_structure) {
    const val = applyCurve(config.term_slope_curve, frame.term_slope);
    blendRegister(expression, config.expression.term_structure, val * tier3Intensity);
  }

  // Cross-asset contagion (ψ₃₁₋₃₅)
  if (frame.cross_contagion !== undefined && config.cross_contagion_curve && config.expression.contagion) {
    const val = applyCurve(config.cross_contagion_curve, frame.cross_contagion);
    blendRegister(expression, config.expression.contagion, val * tier3Intensity);
  }

  // High-low ratio (strain) (ψ₃₆₋₄₀)
  if (frame.high_low_ratio !== undefined && config.high_low_ratio_curve && config.expression.strain) {
    const val = applyCurve(config.high_low_ratio_curve, frame.high_low_ratio);
    blendRegister(expression, config.expression.strain, val * tier3Intensity);
  }

  // Sarasti residual: direct injection if present
  if (frame.expr_residuals) {
    const residualStart = 40; // ψ₄₁₋₁₀₀
    const residualIntensity = tiers[3]; // residuals are already scaled in pre-computation usually, but we use the tier scale
    for (let i = 0; i < frame.expr_residuals.length && (residualStart + i) < N_EXPR; i++) {
      expression[residualStart + i] = frame.expr_residuals[i] * residualIntensity;
    }
  }
}

/**
 * Additively blend a register into an expression vector.
 * Shared logic with mapDynamicsToExpression.
 */
function blendRegister(
  expression: Float32Array,
  register: { indices: number[]; weights: number[] },
  strength: number,
): void {
  for (let i = 0; i < register.indices.length; i++) {
    const idx = register.indices[i];
    if (idx < expression.length) {
      expression[idx] += register.weights[i] * strength;
    }
  }
}

// ─── Unified Resolver ───────────────────────────────

/**
 * Unified binding: TickerConfig + TickerFrame → FaceParams.
 * Wires shape (age + identity) and expression (crisis + dynamics) resolvers.
 */
export function resolve(
  ticker: TickerConfig,
  frame: TickerFrame,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): FaceParams {
  const shapeResolver = createShapeResolver(config);
  const exprResolver = createExpressionResolver(config);

  return {
    shape: shapeResolver.resolve(ticker),
    expression: exprResolver.resolve(frame),
    flush: 0,
    fatigue: 0,
  };
}

/**
 * Create a cached resolver that reuses shape for repeated calls with same ticker.
 * Shape is structural identity — only needs computing once per ticker.
 */
export function createResolver(config: BindingConfig = DEFAULT_BINDING_CONFIG) {
  const shapeResolver = createShapeResolver(config);
  const exprResolver = createExpressionResolver(config);
  const shapeCache = new Map<string, Float32Array>();
  const accumulatorMap = new Map<string, TextureAccumulator>();

  return {
    resolve(ticker: TickerConfig, frame: TickerFrame, statics?: TickerStatic): FaceParams {
      let shape = shapeCache.get(ticker.id);
      if (!shape) {
        shape = shapeResolver.resolve(ticker, statics);
        shapeCache.set(ticker.id, shape);
      }

      // Texture accumulation: update EMA for flush/fatigue
      let acc = accumulatorMap.get(ticker.id);
      if (!acc) {
        acc = createTextureAccumulator();
      }
      acc = updateAccumulator(acc, frame, TEXTURE_CONFIG.ema_alpha);
      accumulatorMap.set(ticker.id, acc);

      const { flush, fatigue } = accumulatorToTexture(acc);

      return {
        shape,
        expression: exprResolver.resolve(frame),
        flush,
        fatigue,
      };
    },

    clearCache(): void {
      shapeCache.clear();
    },

    resetAccumulators(): void {
      accumulatorMap.clear();
    },
  };
}
