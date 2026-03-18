import type { TickerConfig, TickerFrame, FaceParams } from '../types';
import { zeroPose } from '../types';
import { createPoseResolver } from './pose';
import { createGazeResolver } from './gaze';
import type { ShapeResolver, ExpressionResolver, BindingConfig } from './types';
import { emptyShape, emptyExpression } from './types';
import { EXPR_AXES, SHAPE_AXES, applyMapping } from './axes';
import { DEFAULT_BINDING_CONFIG, TEXTURE_CONFIG } from './config';
import { applyCurve, applySymmetricCurve } from './curves';
import {
  createTextureAccumulator,
  updateAccumulator,
  accumulatorToTexture,
  TextureAccumulator,
} from './texture/accumulator';
import { hashToScalars } from './identity';

// ─── Expression Resolver ────────────────────────────

/**
 * Creates an ExpressionResolver using the Emotion Quartet axes.
 * Each market data dimension drives one axis.
 */
export function createExpressionResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): ExpressionResolver {
  return {
    resolve(frame: TickerFrame): Float32Array {
      const expression = emptyExpression();

      // deviation → joy (±): outperforming = joy, underperforming = grief
      const joyValue = applySymmetricCurve(config.deviation_curve, frame.deviation);
      applyMapping(expression, EXPR_AXES.joy, joyValue);

      // |velocity| → surprise (+): fast moves = surprise, slow = calm
      const surpriseValue = applyCurve(config.velocity_curve, Math.abs(frame.velocity));
      applyMapping(expression, EXPR_AXES.surprise, surpriseValue);

      // volatility → tension (+): high chaos = tense, low = slack
      const tensionValue = applyCurve(config.volatility_curve, frame.volatility);
      applyMapping(expression, EXPR_AXES.tension, tensionValue);

      // drawdown → anguish (±): distance from peak = structural damage
      const anguishValue = applyCurve(config.drawdown_curve, frame.drawdown);
      applyMapping(expression, EXPR_AXES.anguish, anguishValue);

      return expression;
    },
  };
}

// ─── Shape Resolver ─────────────────────────────────

/**
 * Creates a ShapeResolver using the Shape Triad axes.
 * Shape is now fully data-driven — changes each frame.
 */
export function createShapeResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): ShapeResolver {
  return {
    resolve(frame: TickerFrame): Float32Array {
      const shape = emptyShape();

      // momentum → stature: rising trend = heavy, falling = gaunt
      const statureValue = applySymmetricCurve(config.momentum_curve, frame.momentum);
      applyMapping(shape, SHAPE_AXES.stature, statureValue);

      // |mean_reversion_z| → proportion: stretched = elongated, normal = compact
      const proportionValue = applyCurve(
        config.mean_reversion_z_curve,
        Math.abs(frame.mean_reversion_z),
      );
      // Preserve sign: positive z = overextended up → elongated, negative = overextended down → also elongated
      // Actually we want magnitude only — overextension in either direction = elongated
      applyMapping(shape, SHAPE_AXES.proportion, proportionValue);

      // |1 - beta| → angularity: herd-breaking = chiseled, conforming = soft
      const betaDeviation = Math.abs(1 - frame.beta);
      const angularityValue = applyCurve(config.beta_curve, betaDeviation);
      applyMapping(shape, SHAPE_AXES.angularity, angularityValue);

      return shape;
    },
  };
}

// ─── Per-ticker identity noise ──────────────────────

/**
 * Add small deterministic noise on unused β components (β11-β19).
 * Gives each ticker a unique face fingerprint without affecting axis-controlled components.
 */
function addIdentityNoise(shape: Float32Array, tickerId: string): void {
  const scalars = hashToScalars(tickerId, 9);
  for (let i = 0; i < 9; i++) {
    shape[11 + i] += scalars[i] * 0.5; // small perturbation
  }
}

// ─── Unified Resolver ───────────────────────────────

/**
 * One-shot resolve: TickerConfig + TickerFrame → FaceParams.
 */
export function resolve(
  ticker: TickerConfig,
  frame: TickerFrame,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): FaceParams {
  if (!frame) {
    return {
      shape: emptyShape(),
      expression: emptyExpression(),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0,
    };
  }

  const shapeResolver = createShapeResolver(config);
  const exprResolver = createExpressionResolver(config);
  const poseResolver = createPoseResolver(config.poseConfig);
  const gazeResolver = createGazeResolver(config.gazeConfig);

  const shape = shapeResolver.resolve(frame);
  addIdentityNoise(shape, ticker.id);

  const poseResult = poseResolver.resolve(ticker.id, frame);
  const gazeResult = gazeResolver.resolve(ticker.id, frame);

  return {
    shape,
    expression: exprResolver.resolve(frame),
    pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
    flush: 0,
    fatigue: 0,
  };
}

/**
 * Create a cached resolver with EMA accumulators for flush/fatigue.
 * Shape is now per-frame (no shape cache), but accumulators persist.
 */
export function createResolver(config: BindingConfig = DEFAULT_BINDING_CONFIG) {
  const shapeResolver = createShapeResolver(config);
  const exprResolver = createExpressionResolver(config);
  const poseResolver = createPoseResolver(config.poseConfig);
  const gazeResolver = createGazeResolver(config.gazeConfig);
  const accumulatorMap = new Map<string, TextureAccumulator>();

  return {
    resolve(ticker: TickerConfig, frame: TickerFrame): FaceParams {
      if (!frame) {
        return {
          shape: emptyShape(),
          expression: emptyExpression(),
          pose: zeroPose(),
          flush: 0,
          fatigue: 0,
        };
      }

      const shape = shapeResolver.resolve(frame);
      addIdentityNoise(shape, ticker.id);

      // Texture accumulation: update EMA for flush/fatigue
      let acc = accumulatorMap.get(ticker.id);
      if (!acc) {
        acc = createTextureAccumulator();
      }
      acc = updateAccumulator(acc, frame, TEXTURE_CONFIG.ema_alpha);
      accumulatorMap.set(ticker.id, acc);

      const { flush, fatigue } = accumulatorToTexture(acc);

      const poseResult = poseResolver.resolve(ticker.id, frame);
      const gazeResult = gazeResolver.resolve(ticker.id, frame);

      return {
        shape,
        expression: exprResolver.resolve(frame),
        pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
        flush,
        fatigue,
      };
    },

    /**
     * Resolve without advancing EMA accumulators (for interpolation target frames).
     */
    resolveNoAccumulate(ticker: TickerConfig, frame: TickerFrame): FaceParams {
      if (!frame) {
        return {
          shape: emptyShape(),
          expression: emptyExpression(),
          pose: zeroPose(),
          flush: 0,
          fatigue: 0,
        };
      }

      const shape = shapeResolver.resolve(frame);
      addIdentityNoise(shape, ticker.id);

      const acc = accumulatorMap.get(ticker.id) ?? createTextureAccumulator();
      const { flush, fatigue } = accumulatorToTexture(acc);

      const poseResult = poseResolver.resolve(ticker.id, frame);
      const gazeResult = gazeResolver.resolve(ticker.id, frame);

      return {
        shape,
        expression: exprResolver.resolve(frame),
        pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
        flush,
        fatigue,
      };
    },

    resetAccumulators(): void {
      accumulatorMap.clear();
      poseResolver.reset();
      gazeResolver.reset();
    },

    /** Get current accumulator state snapshot for a ticker. */
    getAccumulator(tickerId: string): TextureAccumulator | undefined {
      const acc = accumulatorMap.get(tickerId);
      return acc ? { ...acc } : undefined;
    },
  };
}
