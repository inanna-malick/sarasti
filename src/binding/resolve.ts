import type { TickerConfig, TickerFrame, FaceParams } from '../types';
import { zeroPose } from '../types';
import {
  N_SHAPE,
  N_EXPR,
  MAX_NECK_PITCH,
  MAX_NECK_YAW,
  MAX_NECK_ROLL,
  MAX_JAW_OPEN,
  MAX_EYE_HORIZONTAL,
  MAX_EYE_VERTICAL,
} from '../constants';
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
import { generateReport, type BindingReport } from './report';

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
      if (frame.drawdown !== undefined && config.drawdown_curve) {
        const anguishValue = applyCurve(config.drawdown_curve, frame.drawdown);
        applyMapping(expression, EXPR_AXES.anguish, anguishValue);
      }

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
      if (frame.momentum !== undefined && config.momentum_curve) {
        const statureValue = applySymmetricCurve(config.momentum_curve, frame.momentum);
        applyMapping(shape, SHAPE_AXES.stature, statureValue);
      }

      // |mean_reversion_z| → proportion: stretched = elongated, normal = compact
      if (frame.mean_reversion_z !== undefined && config.mean_reversion_z_curve) {
        const proportionValue = applyCurve(
          config.mean_reversion_z_curve,
          Math.abs(frame.mean_reversion_z),
        );
        applyMapping(shape, SHAPE_AXES.proportion, proportionValue);
      }

      // |1 - beta| → angularity: herd-breaking = chiseled, conforming = soft
      if (frame.beta !== undefined && config.beta_curve) {
        const betaDeviation = Math.abs(1 - frame.beta);
        const angularityValue = applyCurve(config.beta_curve, betaDeviation);
        applyMapping(shape, SHAPE_AXES.angularity, angularityValue);
      }

      return shape;
    },
  };
}

// ─── Per-ticker identity noise ──────────────────────

const noiseCache = new Map<string, Float32Array>();

/**
 * Add small deterministic noise on unused β components (β11-β19).
 * Gives each ticker a unique face fingerprint without affecting axis-controlled components.
 */
function addIdentityNoise(shape: Float32Array, tickerId: string): void {
  let noise = noiseCache.get(tickerId);
  if (!noise) {
    // Simple deterministic noise based on string hash
    const hash = tickerId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    noise = new Float32Array(N_SHAPE);
    for (let i = 0; i < 9; i++) {
      noise[11 + i] = ((hash >> i) & 1 ? 1 : -1) * 0.2; // small perturbation
    }
    noiseCache.set(tickerId, noise);
  }

  for (let i = 11; i < 20; i++) {
    shape[i] += noise[i];
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

// ─── Report-augmented resolve ───────────────────────

/**
 * Resolve FaceParams and generate a BindingReport tracing each output
 * parameter back to its input sources.
 */
export function resolveWithReport(
  ticker: TickerConfig,
  frame: TickerFrame,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  statics?: any,
  accumulator?: TextureAccumulator,
): { params: FaceParams; report: BindingReport } {
  const params = resolve(ticker, frame, config);
  const report = generateReport(ticker, frame, params, config, statics, accumulator);
  return { params, report };
}

// ─── Library API ────────────────────────────────────

/** Pre-extracted axis values — all optional, unset = 0 */
export interface AxisValues {
  // Expression
  joy?: number;
  anguish?: number;
  surprise?: number;
  tension?: number;
  // Shape
  stature?: number;
  proportion?: number;
  angularity?: number;
  // Pose
  pitch?: number;
  yaw?: number;
  roll?: number;
  jaw?: number;
  // Gaze
  gazeH?: number;
  gazeV?: number;
  // Texture
  flush?: number;
  fatigue?: number;
}

/**
 * Generic resolver: pre-extracted axis values → FaceParams.
 * Used by the library builder API. Each axis value has already been
 * extracted from the datum via an accessor and passed through a response curve.
 */
export function resolveFromAxes(values: AxisValues, datumId: string): FaceParams {
  const expression = emptyExpression();
  const shape = emptyShape();

  // Expression axes
  if (values.joy !== undefined) applyMapping(expression, EXPR_AXES.joy, values.joy);
  if (values.anguish !== undefined) applyMapping(expression, EXPR_AXES.anguish, values.anguish);
  if (values.surprise !== undefined) applyMapping(expression, EXPR_AXES.surprise, values.surprise);
  if (values.tension !== undefined) applyMapping(expression, EXPR_AXES.tension, values.tension);

  // Shape axes
  if (values.stature !== undefined) applyMapping(shape, SHAPE_AXES.stature, values.stature);
  if (values.proportion !== undefined) applyMapping(shape, SHAPE_AXES.proportion, values.proportion);
  if (values.angularity !== undefined) applyMapping(shape, SHAPE_AXES.angularity, values.angularity);

  // Identity noise on unused shape components
  addIdentityNoise(shape, datumId);

  // Pose (clamped to safe ranges)
  const pose = zeroPose();
  if (values.pitch !== undefined) {
    pose.neck[0] = Math.max(-MAX_NECK_PITCH, Math.min(MAX_NECK_PITCH, values.pitch));
  }
  if (values.yaw !== undefined) {
    pose.neck[1] = Math.max(-MAX_NECK_YAW, Math.min(MAX_NECK_YAW, values.yaw));
  }
  if (values.roll !== undefined) {
    pose.neck[2] = Math.max(-MAX_NECK_ROLL, Math.min(MAX_NECK_ROLL, values.roll));
  }
  if (values.jaw !== undefined) {
    pose.jaw = Math.max(0, Math.min(MAX_JAW_OPEN, values.jaw));
  }

  // Gaze (clamped)
  if (values.gazeH !== undefined) {
    const h = Math.max(-MAX_EYE_HORIZONTAL, Math.min(MAX_EYE_HORIZONTAL, values.gazeH));
    pose.leftEye[0] = h;
    pose.rightEye[0] = h;
  }
  if (values.gazeV !== undefined) {
    const v = Math.max(-MAX_EYE_VERTICAL, Math.min(MAX_EYE_VERTICAL, values.gazeV));
    pose.leftEye[1] = v;
    pose.rightEye[1] = v;
  }

  return {
    shape,
    expression,
    pose,
    flush: values.flush ?? 0,
    fatigue: values.fatigue ?? 0,
  };
}
