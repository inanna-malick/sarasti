/**
 * Binding Report — traces 3-axis expression + 1-axis shape activations.
 */

import type { TickerConfig, TickerFrame, FaceParams } from '../types';
import { N_SHAPE, N_EXPR } from '../constants';
import { EXPR_AXES, SHAPE_AXES, applyMapping } from './axes';
import { hashToScalars } from './identity';
import type { TextureAccumulator } from './texture/accumulator';
import { accumulatorToTexture, createTextureAccumulator } from './texture/accumulator';
import {
  computeChordActivations,
  resolveExpressionChords,
  resolveShapeChords,
} from './chords';
import type { ChordActivations } from './chords';
import type { DatasetStats } from '../data/stats';

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

export interface ChordEntry {
  name: string;
  rawActivation: number;
  sign: number;
}

export interface BindingReport {
  tickerId: string;
  chords: ChordEntry[];
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
  _config?: unknown,
  accumulator?: TextureAccumulator,
  stats?: DatasetStats,
): BindingReport {
  const activations = computeChordActivations(frame, stats, ticker.id);
  const chordResult = resolveExpressionChords(activations);

  return {
    tickerId: ticker.id,
    chords: traceChords(activations),
    shape: traceShape(ticker, activations),
    expression: traceExpression(chordResult.expression),
    pose: tracePose(chordResult, params),
    gaze: traceGaze(chordResult, params),
    flush: traceFlush(params, accumulator),
    fatigue: traceFatigue(params, accumulator),
  };
}

// ─── Chord Tracing ───────────────────────────────────

function traceChords(activations: ChordActivations): ChordEntry[] {
  return [
    {
      name: 'alarm',
      rawActivation: activations.alarm,
      sign: Math.sign(activations.alarm) || 1,
    },
    {
      name: 'mood',
      rawActivation: activations.mood,
      sign: Math.sign(activations.mood) || 1,
    },
    {
      name: 'fatigue',
      rawActivation: activations.fatigue,
      sign: Math.sign(activations.fatigue) || 1,
    },
  ];
}

// ─── Shape Tracing ──────────────────────────────────

function traceShape(
  ticker: TickerConfig,
  activations: ChordActivations,
): BindingEntry[] {
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  // Dominance
  const domVec = new Float32Array(N_SHAPE);
  for (const [idx, weight] of SHAPE_AXES.dominance) {
    domVec[idx] = weight * activations.dominance;
  }
  sources.push({ name: 'chord:dominance←momentum', vec: domVec, input: activations.dominance });

  // Identity noise
  const identityVec = new Float32Array(N_SHAPE);
  const scalars = hashToScalars(ticker.id, 9);
  for (let i = 0; i < 9; i++) {
    identityVec[33 + i] = scalars[i] * 0.5;
  }
  sources.push({ name: 'identity_noise', vec: identityVec, input: 0 });

  return buildEntries('shape', N_SHAPE, sources);
}

// ─── Expression Tracing ─────────────────────────────

function traceExpression(expression: Float32Array): BindingEntry[] {
  const entries: BindingEntry[] = [];
  for (let i = 0; i < N_EXPR; i++) {
    if (Math.abs(expression[i]) > 0.001) {
      entries.push({
        param: 'expression',
        index: i,
        value: expression[i],
        contributions: [{
          source: 'chord_blend',
          input: expression[i],
          mapped: expression[i],
          weight: 1.0,
          contribution: expression[i],
        }],
      });
    }
  }
  return entries;
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
  chordResult: { pose: { pitch: number; yaw: number; roll: number; jaw: number } },
  params: FaceParams,
): BindingReport['pose'] {
  return {
    pitch: {
      param: 'pose', index: 0,
      value: params.pose.neck[0],
      contributions: [{
        source: 'chord_blend', input: chordResult.pose.pitch,
        mapped: chordResult.pose.pitch, weight: 1.0,
        contribution: params.pose.neck[0],
      }],
    },
    yaw: {
      param: 'pose', index: 1,
      value: params.pose.neck[1],
      contributions: params.pose.neck[1] !== 0 ? [{
        source: 'chord_blend', input: chordResult.pose.yaw,
        mapped: chordResult.pose.yaw, weight: 1.0,
        contribution: params.pose.neck[1],
      }] : [],
    },
    roll: {
      param: 'pose', index: 2,
      value: params.pose.neck[2],
      contributions: params.pose.neck[2] !== 0 ? [{
        source: 'chord_blend', input: chordResult.pose.roll,
        mapped: chordResult.pose.roll, weight: 1.0,
        contribution: params.pose.neck[2],
      }] : [],
    },
    jaw: {
      param: 'pose', index: 3,
      value: params.pose.jaw,
      contributions: params.pose.jaw !== 0 ? [{
        source: 'chord_blend', input: chordResult.pose.jaw,
        mapped: chordResult.pose.jaw, weight: 1.0,
        contribution: params.pose.jaw,
      }] : [],
    },
  };
}

// ─── Gaze Tracing ───────────────────────────────────

function traceGaze(
  chordResult: { gaze: { gazeH: number; gazeV: number } },
  params: FaceParams,
): BindingReport['gaze'] {
  return {
    horizontal: {
      param: 'gaze', index: 0,
      value: params.pose.leftEye[0],
      contributions: [{
        source: 'chord_blend', input: chordResult.gaze.gazeH,
        mapped: chordResult.gaze.gazeH, weight: 1.0,
        contribution: params.pose.leftEye[0],
      }],
    },
    vertical: {
      param: 'gaze', index: 1,
      value: params.pose.leftEye[1],
      contributions: [{
        source: 'chord_blend', input: chordResult.gaze.gazeV,
        mapped: chordResult.gaze.gazeV, weight: 1.0,
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
      source: 'ema_abs_deviation+chord',
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
      source: 'ema_volatility+chord',
      input: acc.ema_volatility,
      mapped: derived,
      weight: 1.0,
      contribution: params.fatigue,
    }],
  };
}
