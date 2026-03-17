import type { TickerConfig, TickerFrame, TickerStatic, FaceParams } from '../types';
import type { ShapeResolver, ExpressionResolver, BindingConfig } from './types';
import { emptyShape, emptyExpression } from './types';
import { N_SHAPE, N_EXPR } from '../constants';
import { mapAgeToShape } from './shape/age';
import { mapIdentityToShape } from './shape/identity';
import { mapCrisisToExpression } from './expression/crisis';
import { mapDynamicsToExpression } from './expression/dynamics';
import { DEFAULT_BINDING_CONFIG } from './config';

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
  _config: BindingConfig,
): void {
  // Sarasti residual: direct injection if present
  if (statics.shape_residuals) {
    const residualStart = 50; // β₅₁₋₁₀₀
    for (let i = 0; i < statics.shape_residuals.length && (residualStart + i) < N_SHAPE; i++) {
      shape[residualStart + i] = statics.shape_residuals[i];
    }
  }
  // Tier 2/3 named bindings: stub — shape-enrichment dev fills this in
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
  _config: BindingConfig,
): void {
  // Sarasti residual: direct injection if present
  if (frame.expr_residuals) {
    const residualStart = 40; // ψ₄₁₋₁₀₀
    for (let i = 0; i < frame.expr_residuals.length && (residualStart + i) < N_EXPR; i++) {
      expression[residualStart + i] = frame.expr_residuals[i];
    }
  }
  // Tier 2/3 named bindings: stub — expression-enrichment dev fills this in
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

  return {
    resolve(ticker: TickerConfig, frame: TickerFrame, statics?: TickerStatic): FaceParams {
      let shape = shapeCache.get(ticker.id);
      if (!shape) {
        shape = shapeResolver.resolve(ticker, statics);
        shapeCache.set(ticker.id, shape);
      }

      return {
        shape,
        expression: exprResolver.resolve(frame),
      };
    },

    clearCache(): void {
      shapeCache.clear();
    },
  };
}
