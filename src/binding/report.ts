/**
 * Binding Report — reviewable intermediate representation.
 *
 * Traces every output parameter back to its input sources.
 * For each non-zero component in shape/expression, records which
 * mapping steps contributed and how much.
 */

import type { TickerConfig, TickerFrame, FaceParams } from '../types';
import type { BindingConfig } from './types';
import { DEFAULT_BINDING_CONFIG } from './config';
import { N_SHAPE, N_EXPR, MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN, MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '../constants';
import { applyCurve, applySymmetricCurve } from './curves';
import { EXPR_AXES, SHAPE_AXES } from './axes';
import type { TextureAccumulator } from './texture/accumulator';
import { accumulatorToTexture, createTextureAccumulator } from './texture/accumulator';

// ─── Types ──────────────────────────────────────────

export interface BindingContribution {
  /** Source mapping step, e.g. 'joy', 'surprise', 'stature' */
  source: string;
  /** Raw input value fed to this step */
  input: number;
  /** Value after curve mapping */
  mapped: number;
  /** Weight applied (axis weight) */
  weight: number;
  /** Final contribution to this component = mapped * weight */
  contribution: number;
}

export interface BindingEntry {
  /** Parameter space: 'shape', 'expression', 'pose', 'gaze', 'flush', 'fatigue' */
  param: string;
  /** Component index (for arrays) or sub-index (e.g. 0=pitch for pose) */
  index: number;
  /** Final output value */
  value: number;
  /** All contributions that sum to this value */
  contributions: BindingContribution[];
}

export interface BindingReport {
  tickerId: string;
  shape: BindingEntry[];
  expression: BindingEntry[];
  pose: {
    pitch: BindingEntry;
    yaw: BindingEntry;
    roll: BindingEntry;
    jaw: BindingEntry;
  };
  gaze: {
    horizontal: BindingEntry;
    vertical: BindingEntry;
  };
  flush: BindingEntry;
  fatigue: BindingEntry;
}

// ─── Report Generation ──────────────────────────────

/**
 * Generate a BindingReport that traces every output param back to its inputs.
 */
export function generateReport(
  ticker: TickerConfig,
  frame: TickerFrame,
  params: FaceParams,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  _statics?: any,
  accumulator?: TextureAccumulator,
): BindingReport {
  return {
    tickerId: ticker.id,
    shape: traceShape(frame, config),
    expression: traceExpression(frame, config),
    pose: tracePose(frame, params),
    gaze: traceGaze(frame, params),
    flush: traceFlush(params, accumulator),
    fatigue: traceFatigue(params, accumulator),
  };
}

// ─── Shape Tracing ──────────────────────────────────

function traceShape(
  frame: TickerFrame,
  config: BindingConfig,
): BindingEntry[] {
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  if (frame.momentum !== undefined && config.momentum_curve) {
    const val = applySymmetricCurve(config.momentum_curve, frame.momentum);
    const vec = new Float32Array(N_SHAPE);
    for (const [idx, weight] of SHAPE_AXES.stature) {
      if (idx < N_SHAPE) vec[idx] = val * weight;
    }
    sources.push({ name: 'stature', vec, input: frame.momentum });
  }

  if (frame.mean_reversion_z !== undefined && config.mean_reversion_z_curve) {
    const val = applyCurve(config.mean_reversion_z_curve, Math.abs(frame.mean_reversion_z));
    const vec = new Float32Array(N_SHAPE);
    for (const [idx, weight] of SHAPE_AXES.proportion) {
      if (idx < N_SHAPE) vec[idx] = val * weight;
    }
    sources.push({ name: 'proportion', vec, input: frame.mean_reversion_z });
  }

  if (frame.beta !== undefined && config.beta_curve) {
    const val = applyCurve(config.beta_curve, Math.abs(1 - frame.beta));
    const vec = new Float32Array(N_SHAPE);
    for (const [idx, weight] of SHAPE_AXES.angularity) {
      if (idx < N_SHAPE) vec[idx] = val * weight;
    }
    sources.push({ name: 'angularity', vec, input: frame.beta });
  }

  const entries: BindingEntry[] = [];
  for (let i = 0; i < N_SHAPE; i++) {
    const contributions: BindingContribution[] = [];
    for (const src of sources) {
      if (src.vec[i] !== 0) {
        // Find the weight from SHAPE_AXES
        let weight = 0;
        if (src.name === 'stature') weight = (SHAPE_AXES.stature as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;
        if (src.name === 'proportion') weight = (SHAPE_AXES.proportion as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;
        if (src.name === 'angularity') weight = (SHAPE_AXES.angularity as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;

        contributions.push({
          source: src.name,
          input: src.input,
          mapped: src.vec[i] / (weight || 1),
          weight,
          contribution: src.vec[i],
        });
      }
    }
    if (contributions.length > 0) {
      const value = contributions.reduce((sum, c) => sum + c.contribution, 0);
      entries.push({ param: 'shape', index: i, value, contributions });
    }
  }

  return entries;
}

// ─── Expression Tracing ─────────────────────────────

function traceExpression(
  frame: TickerFrame,
  config: BindingConfig,
): BindingEntry[] {
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  const joyVal = applySymmetricCurve(config.deviation_curve, frame.deviation);
  const joyVec = new Float32Array(N_EXPR);
  for (const [idx, weight] of EXPR_AXES.joy) {
    if (idx < N_EXPR) joyVec[idx] = joyVal * weight;
  }
  sources.push({ name: 'joy', vec: joyVec, input: frame.deviation });

  const surpriseVal = applyCurve(config.velocity_curve, Math.abs(frame.velocity));
  const surpriseVec = new Float32Array(N_EXPR);
  for (const [idx, weight] of EXPR_AXES.surprise) {
    if (idx < N_EXPR) surpriseVec[idx] = surpriseVal * weight;
  }
  sources.push({ name: 'surprise', vec: surpriseVec, input: frame.velocity });

  const tensionVal = applyCurve(config.volatility_curve, frame.volatility);
  const tensionVec = new Float32Array(N_EXPR);
  for (const [idx, weight] of EXPR_AXES.tension) {
    if (idx < N_EXPR) tensionVec[idx] = tensionVal * weight;
  }
  sources.push({ name: 'tension', vec: tensionVec, input: frame.volatility });

  if (frame.drawdown !== undefined && config.drawdown_curve) {
    const anguishVal = applyCurve(config.drawdown_curve, frame.drawdown);
    const anguishVec = new Float32Array(N_EXPR);
    for (const [idx, weight] of EXPR_AXES.anguish) {
      if (idx < N_EXPR) anguishVec[idx] = anguishVal * weight;
    }
    sources.push({ name: 'anguish', vec: anguishVec, input: frame.drawdown });
  }

  const entries: BindingEntry[] = [];
  for (let i = 0; i < N_EXPR; i++) {
    const contributions: BindingContribution[] = [];
    for (const src of sources) {
      if (src.vec[i] !== 0) {
        let weight = 0;
        if (src.name === 'joy') weight = (EXPR_AXES.joy as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;
        if (src.name === 'surprise') weight = (EXPR_AXES.surprise as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;
        if (src.name === 'tension') weight = (EXPR_AXES.tension as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;
        if (src.name === 'anguish') weight = (EXPR_AXES.anguish as any).find((pair: any) => pair[0] === i)?.[1] ?? 0;

        contributions.push({
          source: src.name,
          input: src.input,
          mapped: src.vec[i] / (weight || 1),
          weight,
          contribution: src.vec[i],
        });
      }
    }
    if (contributions.length > 0) {
      const value = contributions.reduce((sum, c) => sum + c.contribution, 0);
      entries.push({ param: 'expression', index: i, value, contributions });
    }
  }

  return entries;
}

// ─── Pose Tracing ───────────────────────────────────

function tracePose(
  frame: TickerFrame,
  params: FaceParams,
): BindingReport['pose'] {
  return {
    pitch: {
      param: 'pose', index: 0,
      value: params.pose.neck[0],
      contributions: [{
        source: 'pitch', input: 0, // Simplified
        mapped: params.pose.neck[0], weight: 1.0,
        contribution: params.pose.neck[0],
      }],
    },
    yaw: {
      param: 'pose', index: 1,
      value: params.pose.neck[1],
      contributions: [{
        source: 'yaw', input: 0,
        mapped: params.pose.neck[1], weight: 1.0,
        contribution: params.pose.neck[1],
      }],
    },
    roll: {
      param: 'pose', index: 2,
      value: params.pose.neck[2],
      contributions: [{
        source: 'roll', input: 0,
        mapped: params.pose.neck[2], weight: 1.0,
        contribution: params.pose.neck[2],
      }],
    },
    jaw: {
      param: 'pose', index: 3,
      value: params.pose.jaw,
      contributions: [{
        source: 'jaw', input: 0,
        mapped: params.pose.jaw, weight: 1.0,
        contribution: params.pose.jaw,
      }],
    },
  };
}

// ─── Gaze Tracing ───────────────────────────────────

function traceGaze(
  _frame: TickerFrame,
  params: FaceParams,
): BindingReport['gaze'] {
  return {
    horizontal: {
      param: 'gaze', index: 0,
      value: params.pose.leftEye[0],
      contributions: [{
        source: 'gazeH', input: 0,
        mapped: params.pose.leftEye[0], weight: 1.0,
        contribution: params.pose.leftEye[0],
      }],
    },
    vertical: {
      param: 'gaze', index: 1,
      value: params.pose.leftEye[1],
      contributions: [{
        source: 'gazeV', input: 0,
        mapped: params.pose.leftEye[1], weight: 1.0,
        contribution: params.pose.leftEye[1],
      }],
    },
  };
}

// ─── Texture Tracing ────────────────────────────────

function traceFlush(
  params: FaceParams,
  accumulator?: TextureAccumulator,
): BindingEntry {
  const acc = accumulator ?? createTextureAccumulator();
  const { flush: derived } = accumulatorToTexture(acc);
  return {
    param: 'flush', index: 0,
    value: params.flush,
    contributions: [{
      source: 'ema_abs_deviation',
      input: acc.ema_abs_deviation,
      mapped: derived,
      weight: 1.0,
      contribution: params.flush,
    }],
  };
}

function traceFatigue(
  params: FaceParams,
  accumulator?: TextureAccumulator,
): BindingEntry {
  const acc = accumulator ?? createTextureAccumulator();
  const { fatigue: derived } = accumulatorToTexture(acc);
  return {
    param: 'fatigue', index: 0,
    value: params.fatigue,
    contributions: [{
      source: 'ema_volatility',
      input: acc.ema_volatility,
      mapped: derived,
      weight: 1.0,
      contribution: params.fatigue,
    }],
  };
}
