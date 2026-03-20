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
  computeChordActivations,
  computeMetaAxes,
  metaToChordActivations,
  computeExchangeFatigueForTension,
  resolveExpressionChords,
  resolveShapeChords,
} from './chords';
import type { ChordActivations } from './chords';
import { computeExchangeFatigue } from './exchange';
import type { Exchange } from '../types';

// ─── Per-ticker identity noise ──────────────────────

const noiseCache = new Map<string, Float32Array>();

/**
 * Add small deterministic noise on unused β components (β33-β41).
 * Gives each ticker a unique face fingerprint without affecting axis-controlled components.
 * Dominance uses β{0,2,3,4,7,13,16,18,19,23,48}. Stature uses β{1,5,6,8,15,32,49}.
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
 * Uses chord architecture for all binding.
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

  const meta = computeMetaAxes(frame, stats, ticker.id, undefined, ticker);
  const activations = metaToChordActivations(meta, ticker);
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
    flush: Math.max(-1, Math.min(1, chordResult.flush + meta.distress * -0.35 + meta.vitality * 0.3)),
    fatigue: chordResult.fatigue,
    skinAge: shapeResult.skinAge,
  };
}

/**
 * Create a cached resolver with EMA accumulators for flush/fatigue.
 * Shape EMA smoothing preserved (α=0.03).
 */
const SHAPE_SMOOTHING_ALPHA = 0.03;

export function createResolver(
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  stats?: DatasetStats,
) {
  const poseResolver = createPoseResolver(config.poseConfig);
  const gazeResolver = createGazeResolver(config.gazeConfig);
  const accumulatorMap = new Map<string, TextureAccumulator>();
  const shapeStateMap = new Map<string, Float32Array>();

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

    // Compute meta-axes → mixing matrix → chord activations
    const meta = computeMetaAxes(frame, stats, ticker.id, timestamp, ticker);
    const activations = metaToChordActivations(meta, ticker);
    const chordResult = resolveExpressionChords(activations);

    // Shape with EMA smoothing
    const shapeResult = resolveShapeChords(activations);
    addIdentityNoise(shapeResult.shape, ticker.id);

    let shape: Float32Array;
    if (accumulate) {
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
    } else {
      shape = shapeStateMap.get(ticker.id) ?? shapeResult.shape;
      shape = new Float32Array(shape);
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
      // w21: EMA flush scaled down to prevent blue/yellow saturation stacking
      flush = tex.flush * 0.4 + chordResult.flush;
      fatigue = blendFatigue(tex.fatigue + chordResult.fatigue, ticker.exchange, timestamp);
    } else {
      const acc = accumulatorMap.get(ticker.id) ?? createTextureAccumulator();
      const tex = accumulatorToTexture(acc);
      flush = tex.flush + chordResult.flush;
      fatigue = blendFatigue(tex.fatigue + chordResult.fatigue, ticker.exchange, timestamp);
    }

    // Meta-level flush boost for thumbnail readability.
    // Distress → pallor, vitality → warmth — on top of recipe contributions.
    // w21: reduced from -0.5/0.4 to -0.3/0.25 to prevent blue/yellow saturation
    // when stacking with EMA accumulator + chord recipe flush.
    flush += meta.distress * -0.35 + meta.vitality * 0.3;

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
      expression: chordResult.expression,
      pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
      flush: Math.max(-1, Math.min(1, flush)),
      fatigue: Math.max(-1, Math.min(1, fatigue)),
      skinAge: shapeResult.skinAge,
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
  // Expression axes (2-axis)
  alarm?: number;
  fatigue?: number;
  // Shape
  dominance?: number;
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

  // Expression axes (2-axis)
  if (values.alarm !== undefined) applyMapping(expression, EXPR_AXES.alarm, values.alarm);
  if (values.fatigue !== undefined) applyMapping(expression, EXPR_AXES.fatigue, values.fatigue);

  // Shape axes
  if (values.dominance !== undefined) applyMapping(shape, SHAPE_AXES.dominance, values.dominance);

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
