/**
 * Binding Report — traces every output parameter back to its input sources.
 */

import type { TickerConfig, TickerFrame, FaceParams } from '../types';
import type { BindingConfig } from './types';
import { DEFAULT_BINDING_CONFIG } from './config';
import { N_SHAPE, N_EXPR } from '../constants';
import { EXPR_AXES, SHAPE_AXES, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES, applyMapping } from './axes';
import { applyCurve, applySymmetricCurve } from './curves';
import { POSE_MULTIPLIERS } from './pose';
import { GAZE_MULTIPLIERS } from './gaze';
import type { TextureAccumulator } from './texture/accumulator';
import { accumulatorToTexture, createTextureAccumulator } from './texture/accumulator';
import { hashToScalars } from './identity';

// ─── Types ──────────────────────────────────────────

export interface BindingContribution {
  source: string;
  input: number;
  mapped: number;
  weight: number;
  contribution: number;
}

export interface BindingEntry {
  param: string;
  index: number;
  value: number;
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

export function generateReport(
  ticker: TickerConfig,
  frame: TickerFrame,
  params: FaceParams,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  accumulator?: TextureAccumulator,
): BindingReport {
  return {
    tickerId: ticker.id,
    shape: traceShape(ticker, frame, config),
    expression: traceExpression(frame, config),
    pose: tracePose(frame, params),
    gaze: traceGaze(frame, params),
    flush: traceFlush(params, accumulator),
    fatigue: traceFatigue(params, accumulator),
  };
}

// ─── Shape Tracing ──────────────────────────────────

function traceShape(
  ticker: TickerConfig,
  frame: TickerFrame,
  config: BindingConfig,
): BindingEntry[] {
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  // Stature ← momentum
  const statureVec = new Float32Array(N_SHAPE);
  const statureValue = applySymmetricCurve(config.momentum_curve, frame.momentum);
  applyMapping(statureVec, SHAPE_AXES.stature, statureValue);
  sources.push({ name: 'axis:stature←momentum', vec: statureVec, input: frame.momentum });

  // Proportion ← |mean_reversion_z|
  const proportionVec = new Float32Array(N_SHAPE);
  const proportionValue = applyCurve(config.mean_reversion_z_curve, Math.abs(frame.mean_reversion_z));
  applyMapping(proportionVec, SHAPE_AXES.proportion, proportionValue);
  sources.push({ name: 'axis:proportion←mean_rev_z', vec: proportionVec, input: frame.mean_reversion_z });

  // Angularity ← |1 - beta|
  const angularityVec = new Float32Array(N_SHAPE);
  const betaDev = Math.abs(1 - frame.beta);
  const angularityValue = applyCurve(config.beta_curve, betaDev);
  applyMapping(angularityVec, SHAPE_AXES.angularity, angularityValue);
  sources.push({ name: 'axis:angularity←beta', vec: angularityVec, input: frame.beta });

  // Identity noise
  const identityVec = new Float32Array(N_SHAPE);
  const scalars = hashToScalars(ticker.id, 9);
  for (let i = 0; i < 9; i++) {
    identityVec[11 + i] = scalars[i] * 0.5;
  }
  sources.push({ name: 'identity_noise', vec: identityVec, input: 0 });

  return buildEntries('shape', N_SHAPE, sources);
}

// ─── Expression Tracing ─────────────────────────────

function traceExpression(
  frame: TickerFrame,
  config: BindingConfig,
): BindingEntry[] {
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  // Joy ← deviation
  const joyVec = new Float32Array(N_EXPR);
  const joyValue = applySymmetricCurve(config.deviation_curve, frame.deviation);
  applyMapping(joyVec, EXPR_AXES.joy, joyValue);
  sources.push({ name: 'axis:joy←deviation', vec: joyVec, input: frame.deviation });

  // Surprise ← |velocity|
  const surpriseVec = new Float32Array(N_EXPR);
  const surpriseValue = applyCurve(config.velocity_curve, Math.abs(frame.velocity));
  applyMapping(surpriseVec, EXPR_AXES.surprise, surpriseValue);
  sources.push({ name: 'axis:surprise←velocity', vec: surpriseVec, input: frame.velocity });

  // Tension ← volatility
  const tensionVec = new Float32Array(N_EXPR);
  const tensionValue = applyCurve(config.volatility_curve, frame.volatility);
  applyMapping(tensionVec, EXPR_AXES.tension, tensionValue);
  sources.push({ name: 'axis:tension←volatility', vec: tensionVec, input: frame.volatility });

  // Anguish ← drawdown
  const anguishVec = new Float32Array(N_EXPR);
  const anguishValue = applyCurve(config.drawdown_curve, frame.drawdown);
  applyMapping(anguishVec, EXPR_AXES.anguish, anguishValue);
  sources.push({ name: 'axis:anguish←drawdown', vec: anguishVec, input: frame.drawdown });

  return buildEntries('expression', N_EXPR, sources);
}

// ─── Helpers ────────────────────────────────────────

function buildEntries(
  param: string,
  dims: number,
  sources: { name: string; vec: Float32Array; input: number }[],
): BindingEntry[] {
  const entries: BindingEntry[] = [];
  for (let i = 0; i < dims; i++) {
    const contributions: BindingContribution[] = [];
    for (const src of sources) {
      if (src.vec[i] !== 0) {
        contributions.push({
          source: src.name,
          input: src.input,
          mapped: src.vec[i],
          weight: 1.0,
          contribution: src.vec[i],
        });
      }
    }
    if (contributions.length > 0) {
      const value = contributions.reduce((sum, c) => sum + c.contribution, 0);
      entries.push({ param, index: i, value, contributions });
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
        source: 'deviation', input: frame.deviation,
        mapped: frame.deviation * POSE_MULTIPLIERS.pitch, weight: 1.0,
        contribution: params.pose.neck[0],
      }],
    },
    yaw: {
      param: 'pose', index: 1,
      value: params.pose.neck[1],
      contributions: params.pose.neck[1] !== 0 ? [{
        source: 'velocity', input: frame.velocity,
        mapped: frame.velocity * POSE_MULTIPLIERS.yaw, weight: 1.0,
        contribution: params.pose.neck[1],
      }] : [],
    },
    roll: {
      param: 'pose', index: 2,
      value: params.pose.neck[2],
      contributions: params.pose.neck[2] !== 0 ? [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - POSE_MULTIPLIERS.roll_offset) * POSE_MULTIPLIERS.roll_scale, weight: 1.0,
        contribution: params.pose.neck[2],
      }] : [],
    },
    jaw: {
      param: 'pose', index: 3,
      value: params.pose.jaw,
      contributions: params.pose.jaw !== 0 ? [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - POSE_MULTIPLIERS.jaw_offset) * POSE_MULTIPLIERS.jaw_scale, weight: 1.0,
        contribution: params.pose.jaw,
      }] : [],
    },
  };
}

// ─── Gaze Tracing ───────────────────────────────────

function traceGaze(
  frame: TickerFrame,
  params: FaceParams,
): BindingReport['gaze'] {
  return {
    horizontal: {
      param: 'gaze', index: 0,
      value: params.pose.leftEye[0],
      contributions: [{
        source: 'velocity', input: frame.velocity,
        mapped: frame.velocity * GAZE_MULTIPLIERS.horizontal, weight: 1.0,
        contribution: params.pose.leftEye[0],
      }],
    },
    vertical: {
      param: 'gaze', index: 1,
      value: params.pose.leftEye[1],
      contributions: [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - GAZE_MULTIPLIERS.vertical_offset) * GAZE_MULTIPLIERS.vertical_scale, weight: 1.0,
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
