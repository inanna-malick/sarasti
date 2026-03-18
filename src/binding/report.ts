/**
 * Binding Report — reviewable intermediate representation.
 *
 * Traces every output parameter back to its input sources.
 * For each non-zero component in shape/expression, records which
 * mapping steps contributed and how much.
 */

import type { TickerConfig, TickerFrame, TickerStatic, FaceParams } from '../types';
import type { BindingConfig } from './types';
import { emptyShape, emptyExpression } from './types';
import { DEFAULT_BINDING_CONFIG, TEXTURE_CONFIG } from './config';
import { N_SHAPE, N_EXPR } from '../constants';
import { mapCrisisToExpression } from './expression/crisis';
import { mapDynamicsToExpression } from './expression/dynamics';
import { applyCurve, applySymmetricCurve } from './curves';
import {
  getTable,
  getIdentityBasis,
  interpolateLUT,
  computeIdentityOffset,
} from './directions';
import type { TextureAccumulator } from './texture/accumulator';
import { accumulatorToTexture, createTextureAccumulator } from './texture/accumulator';

// ─── Types ──────────────────────────────────────────

export interface BindingContribution {
  /** Source mapping step, e.g. 'semantify:age', 'crisis:distress', 'statics:avg_volume' */
  source: string;
  /** Raw input value fed to this step */
  input: number;
  /** Value after curve/LUT mapping */
  mapped: number;
  /** Weight applied (register weight, tier intensity, etc.) */
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

// ─── Constants (mirrored from resolve.ts) ───────────

/** @internal Asset class → build semantic score */
const CLASS_BUILD_SCORES: Record<string, number> = {
  energy: 1.5, commodity: 1.0, fear: -1.5,
  currency: -0.5, equity: 0.5, media: -2.0,
};

const SEMANTIFY_EXPR_INTENSITY = 6.97;

// ─── Report Generation ──────────────────────────────

/**
 * Generate a BindingReport that traces every output param back to its inputs.
 *
 * Replays the binding logic to attribute each output component to its sources.
 * Call alongside resolve() — the report is a read-only diagnostic, not a side effect.
 */
export function generateReport(
  ticker: TickerConfig,
  frame: TickerFrame,
  params: FaceParams,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
  statics?: TickerStatic,
  accumulator?: TextureAccumulator,
): BindingReport {
  return {
    tickerId: ticker.id,
    shape: traceShape(ticker, config, statics),
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
  config: BindingConfig,
  statics?: TickerStatic,
): BindingEntry[] {
  // Collect per-source contribution vectors
  const sources: { name: string; vec: Float32Array; input: number }[] = [];

  const ageTable = getTable('age');
  if (ageTable) {
    const ageScore = ((ticker.age - 20) / 40) * 6 - 3;
    sources.push({
      name: 'semantify:age',
      vec: interpolateLUT(ageTable, ageScore),
      input: ticker.age,
    });
  }

  const buildTable = getTable('build');
  if (buildTable) {
    const buildScore = CLASS_BUILD_SCORES[ticker.class] ?? 0;
    sources.push({
      name: 'semantify:build',
      vec: interpolateLUT(buildTable, buildScore),
      input: buildScore,
    });
  }

  const identityBasis = getIdentityBasis();
  if (identityBasis) {
    sources.push({
      name: 'semantify:identity',
      vec: computeIdentityOffset(identityBasis, ticker.id),
      input: 0,
    });
  }

  // Statics: compute on a zero vector to isolate contribution
  if (statics) {
    const staticsContrib = traceStaticsShape(statics, config);
    for (const s of staticsContrib) {
      sources.push(s);
    }
  }

  // Build entries for each component that has any contribution
  const entries: BindingEntry[] = [];
  for (let i = 0; i < N_SHAPE; i++) {
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
      entries.push({ param: 'shape', index: i, value, contributions });
    }
  }

  return entries;
}

function traceStaticsShape(
  statics: TickerStatic,
  config: BindingConfig,
): { name: string; vec: Float32Array; input: number }[] {
  const results: { name: string; vec: Float32Array; input: number }[] = [];
  const [_, t2, t3] = config.tier_intensities || [1.0, 0.5, 0.2, 1.0];

  const addCurveSource = (
    name: string,
    input: number | undefined,
    curve: typeof config.avg_volume_curve,
    indices: number[] | undefined,
    tierIntensity: number,
  ) => {
    if (input === undefined || !curve || !indices) return;
    const mapped = applyCurve(curve, input) * tierIntensity;
    const vec = new Float32Array(N_SHAPE);
    for (const idx of indices) {
      if (idx < N_SHAPE) vec[idx] = mapped;
    }
    results.push({ name: `statics:${name}`, vec, input });
  };

  addCurveSource('avg_volume', statics.avg_volume, config.avg_volume_curve, config.shape.volume_indices, t2);
  addCurveSource('hist_volatility', statics.hist_volatility, config.hist_vol_curve, config.shape.hist_vol_indices, t2);
  addCurveSource('corr_to_brent', statics.corr_to_brent, config.corr_brent_curve, config.shape.corr_brent_indices, t2);
  addCurveSource('corr_to_spy', statics.corr_to_spy, config.corr_spy_curve, config.shape.corr_spy_indices, t3);
  addCurveSource('spread_from_family', statics.spread_from_family, config.spread_curve, config.shape.spread_indices, t3);
  addCurveSource('skewness', statics.skewness, config.skewness_curve, config.shape.skewness_indices, t3);

  if (statics.shape_residuals) {
    const vec = new Float32Array(N_SHAPE);
    const start = 50;
    for (let i = 0; i < statics.shape_residuals.length && (start + i) < N_SHAPE; i++) {
      vec[start + i] = statics.shape_residuals[i];
    }
    results.push({ name: 'statics:residuals', vec, input: 0 });
  }

  return results;
}

// ─── Expression Tracing ─────────────────────────────

function traceExpression(
  frame: TickerFrame,
  config: BindingConfig,
): BindingEntry[] {
  // Step 1: Crisis contribution
  const crisisResult = mapCrisisToExpression(frame.deviation, config);
  const crisisVec = new Float32Array(crisisResult.expression);

  // Step 2: Dynamics contribution (delta from crisis)
  const dynamicsResult = mapDynamicsToExpression(
    crisisResult.expression, frame.velocity, frame.volatility, config,
  );
  const dynamicsVec = new Float32Array(N_EXPR);
  for (let i = 0; i < N_EXPR; i++) {
    dynamicsVec[i] = dynamicsResult.expression[i] - crisisVec[i];
  }

  // Step 3: Semantify valence contribution
  const valenceVec = new Float32Array(N_EXPR);
  const valenceTable = getTable('valence');
  const semantifyIntensity = config.semantify_expr_intensity ?? SEMANTIFY_EXPR_INTENSITY;
  let valenceInput = 0;
  if (valenceTable) {
    valenceInput = applyCurve(config.deviation_curve, frame.deviation) * 3;
    const valenceParams = interpolateLUT(valenceTable, valenceInput);
    for (let i = 0; i < Math.min(N_EXPR, valenceParams.length); i++) {
      valenceVec[i] = valenceParams[i] * semantifyIntensity;
    }
  }

  // Step 4: Semantify aperture contribution
  const apertureVec = new Float32Array(N_EXPR);
  const apertureTable = getTable('aperture');
  let apertureInput = 0;
  if (apertureTable) {
    apertureInput = applyCurve(config.volatility_curve, frame.volatility) * 3;
    const apertureParams = interpolateLUT(apertureTable, apertureInput);
    for (let i = 0; i < Math.min(N_EXPR, apertureParams.length); i++) {
      apertureVec[i] = apertureParams[i] * semantifyIntensity;
    }
  }

  // Step 5: Enriched tier 2/3 contribution (run on zero vector to isolate)
  const enrichedVec = new Float32Array(N_EXPR);
  traceEnrichedExpression(enrichedVec, frame, config);

  // Assemble per-component entries
  const sources = [
    { name: 'crisis', vec: crisisVec, input: frame.deviation },
    { name: 'dynamics', vec: dynamicsVec, input: frame.velocity },
    { name: 'semantify:valence', vec: valenceVec, input: valenceInput },
    { name: 'semantify:aperture', vec: apertureVec, input: apertureInput },
    { name: 'enriched', vec: enrichedVec, input: 0 },
  ];

  const entries: BindingEntry[] = [];
  for (let i = 0; i < N_EXPR; i++) {
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
      entries.push({ param: 'expression', index: i, value, contributions });
    }
  }

  return entries;
}

/** Replay enriched expression logic on a zero vector to isolate its contribution. */
function traceEnrichedExpression(
  vec: Float32Array,
  frame: TickerFrame,
  config: BindingConfig,
): void {
  const tiers = config.tier_intensities || [1.0, 0.5, 0.2, 0.1];
  const t1 = config.expression_intensity;

  if (frame.volume_anomaly !== undefined && config.volume_anomaly_curve) {
    const mapped = applyCurve(config.volume_anomaly_curve, frame.volume_anomaly);
    const t2 = t1 * tiers[1];
    if (mapped > 0 && config.expression.alertness) {
      blendRegister(vec, config.expression.alertness, mapped * t2);
    } else if (mapped < 0 && config.expression.exhaustion) {
      blendRegister(vec, config.expression.exhaustion, Math.abs(mapped) * t2);
    }
  }

  const t3 = t1 * tiers[2];
  if (frame.corr_breakdown !== undefined && config.corr_breakdown_curve && config.expression.corr_breakdown) {
    blendRegister(vec, config.expression.corr_breakdown, applyCurve(config.corr_breakdown_curve, frame.corr_breakdown) * t3);
  }
  if (frame.term_slope !== undefined && config.term_slope_curve && config.expression.term_structure) {
    blendRegister(vec, config.expression.term_structure, applyCurve(config.term_slope_curve, frame.term_slope) * t3);
  }
  if (frame.cross_contagion !== undefined && config.cross_contagion_curve && config.expression.contagion) {
    blendRegister(vec, config.expression.contagion, applyCurve(config.cross_contagion_curve, frame.cross_contagion) * t3);
  }
  if (frame.high_low_ratio !== undefined && config.high_low_ratio_curve && config.expression.strain) {
    blendRegister(vec, config.expression.strain, applyCurve(config.high_low_ratio_curve, frame.high_low_ratio) * t3);
  }

  if (frame.expr_residuals) {
    const start = 40;
    const residualIntensity = tiers[3];
    for (let i = 0; i < frame.expr_residuals.length && (start + i) < N_EXPR; i++) {
      vec[start + i] = frame.expr_residuals[i] * residualIntensity;
    }
  }
}

function blendRegister(
  vec: Float32Array,
  register: { indices: number[]; weights: number[] },
  strength: number,
): void {
  for (let i = 0; i < register.indices.length; i++) {
    const idx = register.indices[i];
    if (idx < vec.length) {
      vec[idx] += register.weights[i] * strength;
    }
  }
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
        mapped: frame.deviation * 1.5, weight: 1.0,
        contribution: params.pose.neck[0],
      }],
    },
    yaw: {
      param: 'pose', index: 1,
      value: params.pose.neck[1],
      contributions: params.pose.neck[1] !== 0 ? [{
        source: 'velocity', input: frame.velocity,
        mapped: frame.velocity * 1.0, weight: 1.0,
        contribution: params.pose.neck[1],
      }] : [],
    },
    roll: {
      param: 'pose', index: 2,
      value: params.pose.neck[2],
      contributions: params.pose.neck[2] !== 0 ? [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - 1.0) * 0.3, weight: 1.0,
        contribution: params.pose.neck[2],
      }] : [],
    },
    jaw: {
      param: 'pose', index: 3,
      value: params.pose.jaw,
      contributions: params.pose.jaw !== 0 ? [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - 1.5) * 0.1, weight: 1.0,
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
        mapped: frame.velocity * 2.0, weight: 1.0,
        contribution: params.pose.leftEye[0],
      }],
    },
    vertical: {
      param: 'gaze', index: 1,
      value: params.pose.leftEye[1],
      contributions: [{
        source: 'volatility', input: frame.volatility,
        mapped: (frame.volatility - 1.0) * 0.5, weight: 1.0,
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
  return {
    param: 'flush', index: 0,
    value: params.flush,
    contributions: [{
      source: 'ema_abs_deviation',
      input: acc.ema_abs_deviation,
      mapped: params.flush,
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
  return {
    param: 'fatigue', index: 0,
    value: params.fatigue,
    contributions: [{
      source: 'ema_volatility',
      input: acc.ema_volatility,
      mapped: params.fatigue,
      weight: 1.0,
      contribution: params.fatigue,
    }],
  };
}
