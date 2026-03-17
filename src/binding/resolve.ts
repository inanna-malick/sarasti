import type { TickerConfig, TickerFrame, FaceParams } from '../types';
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
    resolve(ticker: TickerConfig): Float32Array {
      const shape = emptyShape();

      // Age mapping: β₀₋₂
      const ageResult = mapAgeToShape(ticker.age);
      for (const [idx, value] of ageResult.entries) {
        if (idx < N_SHAPE) shape[idx] = value;
      }

      // Identity mapping: β₃₋₅ (class) + β₆₋₉ (family)
      const identityResult = mapIdentityToShape(ticker.class, ticker.family, config);
      for (const [idx, value] of identityResult.class_entries) {
        if (idx < N_SHAPE) shape[idx] = value;
      }
      for (const [idx, value] of identityResult.family_entries) {
        if (idx < N_SHAPE) shape[idx] += value; // additive perturbation
      }

      return shape;
    },
  };
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
      // Base expression from deviation
      const crisisResult = mapCrisisToExpression(frame.deviation, config);

      // Modulate with velocity and volatility
      const dynamicsResult = mapDynamicsToExpression(
        crisisResult.expression,
        frame.velocity,
        frame.volatility,
        config,
      );

      return dynamicsResult.expression;
    },
  };
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
    resolve(ticker: TickerConfig, frame: TickerFrame): FaceParams {
      let shape = shapeCache.get(ticker.id);
      if (!shape) {
        shape = shapeResolver.resolve(ticker);
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
