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
import type { BindingConfig } from './types';
import { emptyShape, emptyExpression } from './types';
import { EXPR_AXES, SHAPE_AXES, applyMapping } from './axes';
import { DEFAULT_BINDING_CONFIG, TEXTURE_CONFIG } from './config';
import {
  createTextureAccumulator,
  updateAccumulator,
  accumulatorToTexture,
  TextureAccumulator,
} from './texture/accumulator';
import { hashToScalars } from './identity';
import type { DatasetStats } from '../data/stats';
import {
  computeCircumplex,
  resolveExpressionChords,
  resolveShapeChords,
} from './chords';
import { computeExchangeFatigue } from './exchange';
import type { Exchange } from '../types';

// ─── Per-ticker identity noise ──────────────────────

const noiseCache = new Map<string, Float32Array>();

/**
 * Add small deterministic noise on unused β components (β33-β41).
 * Gives each ticker a unique face fingerprint without affecting axis-controlled components.
 */
function addIdentityNoise(shape: Float32Array, tickerId: string): void {
  let noise = noiseCache.get(tickerId);
  if (!noise) {
    const scalars = hashToScalars(tickerId, 9);
    noise = new Float32Array(N_SHAPE);
    for (let i = 0; i < 9; i++) {
      noise[33 + i] = scalars[i] * 0.5; // small perturbation
    }
    noiseCache.set(tickerId, noise);
  }

  for (let i = 33; i < 42; i++) {
    shape[i] += noise[i];
  }
}

// ─── Unified Resolver ───────────────────────────────

/**
 * One-shot resolve: TickerConfig + TickerFrame → FaceParams.
 * Uses circumplex architecture for all binding.
 */
export function resolve(
  ticker: TickerConfig,
  frame: TickerFrame,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  stats?: DatasetStats,
): FaceParams {
  if (!frame) {
    return {
      shape: emptyShape(),
      expression: emptyExpression(),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0,
      skinAge: 0,
    };
  }

  const activations = computeCircumplex(frame, stats, ticker.id);
  const chordResult = resolveExpressionChords(activations);
  const shapeResult = resolveShapeChords(activations);
  addIdentityNoise(shapeResult.shape, ticker.id);

  const poseResolver = createPoseResolver(config.poseConfig);
  const gazeResolver = createGazeResolver(config.gazeConfig);

  // Combine expression chord pose + shape identity pose
  const combinedPose = {
    pitch: chordResult.pose.pitch + shapeResult.pose.pitch,
    yaw: chordResult.pose.yaw + shapeResult.pose.yaw,
    roll: chordResult.pose.roll + shapeResult.pose.roll,
    jaw: chordResult.pose.jaw,
  };
  const poseResult = poseResolver.resolve(ticker.id, combinedPose);
  const gazeResult = gazeResolver.resolve(ticker.id, chordResult.gaze);

  return {
    shape: shapeResult.shape,
    expression: chordResult.expression,
    pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
    flush: Math.max(-1, Math.min(1, chordResult.flush)),
    fatigue: chordResult.fatigue,
    skinAge: 0,
  };
}

/**
 * Create a cached resolver with EMA accumulators for flush/fatigue.
 * Shape EMA smoothing preserved (α=0.03).
 */
const SHAPE_SMOOTHING_ALPHA = 0.03;
/** Expression EMA: faces morph between states rather than snapping.
 * α=0.15 → ~5 frames to 50% transition (narrative-readable at 1x–8x speed). */
const EXPR_SMOOTHING_ALPHA = 0.15;

export function createResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  stats?: DatasetStats,
) {
  const poseResolver = createPoseResolver(config.poseConfig);
  const gazeResolver = createGazeResolver(config.gazeConfig);
  const accumulatorMap = new Map<string, TextureAccumulator>();
  const shapeStateMap = new Map<string, Float32Array>();
  const exprStateMap = new Map<string, Float32Array>();

  /** Compute blended fatigue: exchange time-of-day + chord texture fatigue. */
  function blendFatigue(
    chordFatigue: number,
    exchange: Exchange | undefined,
    timestamp: string | undefined,
  ): number {
    if (!exchange || !timestamp) return chordFatigue;
    const utcHour = new Date(timestamp).getUTCHours() + new Date(timestamp).getUTCMinutes() / 60;
    const exchFatigue = computeExchangeFatigue(exchange, utcHour);
    return 0.6 * exchFatigue + 0.4 * chordFatigue;
  }

  function resolveInternal(ticker: TickerConfig, frame: TickerFrame, timestamp?: string, accumulate = true): FaceParams {
    if (!frame) {
      return {
        shape: emptyShape(),
        expression: emptyExpression(),
        pose: zeroPose(),
        flush: 0,
        fatigue: 0,
        skinAge: 0,
      };
    }

    // Compute circumplex activations directly from market data
    const activations = computeCircumplex(frame, stats, ticker.id);
    const chordResult = resolveExpressionChords(activations);

    // Shape with EMA smoothing
    const shapeResult = resolveShapeChords(activations);
    addIdentityNoise(shapeResult.shape, ticker.id);

    let shape: Float32Array;
    let expression: Float32Array;
    if (accumulate) {
      // Shape EMA (very slow α=0.03 — identity morphs glacially)
      let prevShape = shapeStateMap.get(ticker.id);
      if (!prevShape) {
        prevShape = new Float32Array(shapeResult.shape);
        shapeStateMap.set(ticker.id, prevShape);
      } else {
        const a = SHAPE_SMOOTHING_ALPHA;
        const b = 1 - a;
        for (let i = 0; i < prevShape.length; i++) {
          prevShape[i] = a * shapeResult.shape[i] + b * prevShape[i];
        }
      }
      shape = new Float32Array(prevShape);

      // Expression EMA (faster α=0.15 — narrative-speed transitions)
      let prevExpr = exprStateMap.get(ticker.id);
      if (!prevExpr) {
        prevExpr = new Float32Array(chordResult.expression);
        exprStateMap.set(ticker.id, prevExpr);
      } else {
        const a = EXPR_SMOOTHING_ALPHA;
        const b = 1 - a;
        for (let i = 0; i < prevExpr.length; i++) {
          prevExpr[i] = a * chordResult.expression[i] + b * prevExpr[i];
        }
      }
      expression = new Float32Array(prevExpr);
    } else {
      shape = shapeStateMap.get(ticker.id) ?? shapeResult.shape;
      shape = new Float32Array(shape);
      expression = exprStateMap.get(ticker.id) ?? chordResult.expression;
      expression = new Float32Array(expression);
    }

    // Texture accumulation
    let flush: number;
    let fatigue: number;
    if (accumulate) {
      let acc = accumulatorMap.get(ticker.id);
      if (!acc) {
        acc = createTextureAccumulator();
      }
      acc = updateAccumulator(acc, frame, TEXTURE_CONFIG.ema_alpha);
      accumulatorMap.set(ticker.id, acc);
      const tex = accumulatorToTexture(acc);
      // Blend chord texture with EMA texture
      flush = tex.flush * 0.4 + chordResult.flush;
      fatigue = blendFatigue(tex.fatigue + chordResult.fatigue, ticker.exchange, timestamp);
    } else {
      const acc = accumulatorMap.get(ticker.id) ?? createTextureAccumulator();
      const tex = accumulatorToTexture(acc);
      flush = tex.flush + chordResult.flush;
      fatigue = blendFatigue(tex.fatigue + chordResult.fatigue, ticker.exchange, timestamp);
    }

    // Combine expression chord pose + shape identity pose
    const combinedPose = {
      pitch: chordResult.pose.pitch + shapeResult.pose.pitch,
      yaw: chordResult.pose.yaw + shapeResult.pose.yaw,
      roll: chordResult.pose.roll + shapeResult.pose.roll,
      jaw: chordResult.pose.jaw,
    };
    const poseResult = poseResolver.resolve(ticker.id, combinedPose);
    const gazeResult = gazeResolver.resolve(ticker.id, chordResult.gaze);

    return {
      shape,
      expression,
      pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
      flush: Math.max(-1, Math.min(1, flush)),
      fatigue: Math.max(-1, Math.min(1, fatigue)),
      skinAge: 0,
    };
  }

  return {
    resolve(ticker: TickerConfig, frame: TickerFrame, timestamp?: string): FaceParams {
      return resolveInternal(ticker, frame, timestamp, true);
    },

    resolveNoAccumulate(ticker: TickerConfig, frame: TickerFrame, timestamp?: string): FaceParams {
      return resolveInternal(ticker, frame, timestamp, false);
    },

    resetAccumulators(): void {
      accumulatorMap.clear();
      shapeStateMap.clear();
      exprStateMap.clear();
      poseResolver.reset();
      gazeResolver.reset();
    },

    getAccumulator(tickerId: string): TextureAccumulator | undefined {
      const acc = accumulatorMap.get(tickerId);
      return acc ? { ...acc } : undefined;
    },
  };
}

// ─── Library API ────────────────────────────────────

/** Pre-extracted axis values — all optional, unset = 0 */
export interface AxisValues {
  // Expression axes (circumplex)
  tension?: number;
  valence?: number;
  // Shape
  stature?: number;
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
}

/**
 * Generic resolver: pre-extracted axis values → FaceParams.
 * Used by the library builder API. Each axis value has already been
 * extracted from the datum via an accessor and passed through a response curve.
 */
export function resolveFromAxes(values: AxisValues, datumId: string): FaceParams {
  const expression = emptyExpression();
  const shape = emptyShape();

  // Expression axes (circumplex)
  if (values.tension !== undefined) applyMapping(expression, EXPR_AXES.tension, values.tension);
  if (values.valence !== undefined) applyMapping(expression, EXPR_AXES.valence, values.valence);

  // Shape axes
  if (values.stature !== undefined) applyMapping(shape, SHAPE_AXES.stature, values.stature);

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
    fatigue: 0,
    skinAge: 0,
  };
}
