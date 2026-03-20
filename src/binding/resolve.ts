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
  type CircumplexActivations,
} from './chords';
import { computeExchangeFatigue } from './exchange';
import type { Exchange } from '../types';

// ─── Per-ticker identity noise ──────────────────────

const noiseCache = new Map<string, Float32Array>();

/**
 * Identity fingerprint — high-impact β components for per-ticker visual diversity.
 *
 * Two tiers of noise:
 *   PRIMARY (±1.5): β1(face width), β11(nose/midface), β20(cheekbone), β14(jaw profile), β5(jaw squareness)
 *     These create immediately visible "different person" silhouettes. Selected by beta scout (w23 wave 1)
 *     to avoid overlap with stature recipe (β0,2,3,4,7,9,10,13,18,22,23,27,28).
 *   SECONDARY (±0.8): β15(eye depth), β17(eye spacing), β25(jawline), β30(nose bridge)
 *     Subtle refinements for face variety.
 *   TERTIARY (±0.5): β33-β41 — micro-perturbation as before.
 */
const IDENTITY_PRIMARY: readonly [number, number][] = [
  [1, 1.5],   // face width / build — most visible identity component
  [11, 1.5],  // nose & midface character
  [20, 1.5],  // cheekbone prominence
  [14, 1.2],  // jaw projection / profile
  [5, 1.0],   // jaw squareness
];

const IDENTITY_SECONDARY: readonly [number, number][] = [
  [15, 0.8],  // eye & brow prominence
  [17, 0.6],  // interocular distance
  [25, 0.8],  // jawline definition
  [30, 0.6],  // nose bridge refinement
];

function addIdentityNoise(shape: Float32Array, tickerId: string): void {
  let noise = noiseCache.get(tickerId);
  if (!noise) {
    const totalSlots = IDENTITY_PRIMARY.length + IDENTITY_SECONDARY.length + 9; // +9 for β33-41
    const scalars = hashToScalars(tickerId, totalSlots);
    noise = new Float32Array(N_SHAPE);
    let si = 0;
    for (const [idx, scale] of IDENTITY_PRIMARY) {
      noise[idx] = scalars[si++] * 2 * scale; // scalars are [-0.5,0.5], ×2 → [-1,1], ×scale
    }
    for (const [idx, scale] of IDENTITY_SECONDARY) {
      noise[idx] = scalars[si++] * 2 * scale;
    }
    for (let i = 0; i < 9; i++) {
      noise[33 + i] = scalars[si++] * 0.5; // tertiary micro-perturbation
    }
    noiseCache.set(tickerId, noise);
  }

  for (const [idx] of IDENTITY_PRIMARY) shape[idx] += noise[idx];
  for (const [idx] of IDENTITY_SECONDARY) shape[idx] += noise[idx];
  for (let i = 33; i < 42; i++) shape[i] += noise[i];
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
/** Per-asset-class expression EMA alpha — drives wave propagation.
 * Higher α = faster reaction. Fear/VIX snaps first, equities follow, commodities lag.
 * This creates visible "wave" across the face field during a crash.
 * α=0.30 → ~2 frames to 50%, α=0.10 → ~7 frames to 50%. */
const EXPR_ALPHA_BY_CLASS: Record<string, number> = {
  fear:      0.30,  // VIX, gold — instant reactor (sentinel)
  equity:    0.20,  // SPY, QQQ — fast follower
  currency:  0.15,  // forex — moderate
  energy:    0.12,  // oil, natgas — deliberate
  commodity: 0.10,  // metals, ags — laggard
  media:     0.15,  // news — moderate
};
const EXPR_SMOOTHING_ALPHA_DEFAULT = 0.15;

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

      // Expression EMA — per-class alpha for wave propagation
      let prevExpr = exprStateMap.get(ticker.id);
      if (!prevExpr) {
        prevExpr = new Float32Array(chordResult.expression);
        exprStateMap.set(ticker.id, prevExpr);
      } else {
        const a = EXPR_ALPHA_BY_CLASS[ticker.class] ?? EXPR_SMOOTHING_ALPHA_DEFAULT;
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
      flush = tex.flush * 0.2 + chordResult.flush;
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

// ─── Scenario API ────────────────────────────────────

/** Override fields for scenario-driven resolution */
export interface CircumplexOverrides {
  flush?: number;
  fatigue?: number;
  gazeH?: number;
  gazeV?: number;
  /** Additive pose overrides (on top of chord-derived pose) */
  pitch?: number;
  yaw?: number;
  roll?: number;
}

/**
 * Resolve circumplex activations → full FaceParams via chord recipes.
 * Used by scenario driver: takes pre-authored {tension, valence, stature}
 * and produces the same rich output as the market data path (pose, gaze,
 * flush, fatigue from recipes + identity noise).
 *
 * Optional overrides: flush, fatigue, gazeH/gazeV, pitch/yaw/roll.
 * Pose overrides are additive on chord pose. Fatigue/flush replace chord values when set.
 */
export function resolveFromCircumplex(
  activations: CircumplexActivations,
  faceId: string,
  overrides?: CircumplexOverrides,
): FaceParams {
  const chordResult = resolveExpressionChords(activations);
  const shapeResult = resolveShapeChords(activations);
  addIdentityNoise(shapeResult.shape, faceId);

  const poseResolver = createPoseResolver();
  const gazeResolver = createGazeResolver();

  // Combine expression chord pose + shape identity pose + scenario pose overrides
  const combinedPose = {
    pitch: chordResult.pose.pitch + shapeResult.pose.pitch + (overrides?.pitch ?? 0),
    yaw: chordResult.pose.yaw + shapeResult.pose.yaw + (overrides?.yaw ?? 0),
    roll: chordResult.pose.roll + shapeResult.pose.roll + (overrides?.roll ?? 0),
    jaw: chordResult.pose.jaw,
  };
  const poseResult = poseResolver.resolve(faceId, combinedPose);

  // Gaze: use override (from gaze tracking) or chord gaze
  const gazeInput = {
    gazeH: overrides?.gazeH ?? chordResult.gaze.gazeH,
    gazeV: overrides?.gazeV ?? chordResult.gaze.gazeV,
  };
  const gazeResult = gazeResolver.resolve(faceId, gazeInput);

  // Flush: override if provided (scenario-authored), else from chord recipe
  const flush = overrides?.flush !== undefined
    ? Math.max(-1, Math.min(1, overrides.flush))
    : Math.max(-1, Math.min(1, chordResult.flush));

  // Fatigue: override if provided, else from chord recipe
  const fatigue = overrides?.fatigue !== undefined
    ? Math.max(-1, Math.min(1, overrides.fatigue))
    : chordResult.fatigue;

  return {
    shape: shapeResult.shape,
    expression: chordResult.expression,
    pose: { ...poseResult, leftEye: gazeResult.leftEye, rightEye: gazeResult.rightEye },
    flush,
    fatigue,
    skinAge: 0,
  };
}
