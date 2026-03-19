/**
 * Chord Architecture — 5-axis consolidation.
 *
 * 3 expression chords (alarm, valence, arousal) compete via temperature-controlled softmax.
 * 2 shape axes (dominance, stature) are additive with EMA smoothing.
 *
 * Each expression chord orchestrates expression ψ + pose + gaze + texture simultaneously.
 */

import type { TickerFrame } from '../types';
import type { DatasetStats, TickerStats, SignalStats } from '../data/stats';
import { computeExchangeFatigue } from './exchange';
import type { Exchange } from '../types';
import { SOFTMAX_TEMPERATURE, PSI7_CLAMP, BETA3_CLAMP, N_EXPR, N_SHAPE } from '../constants';

// ─── Types ───────────────────────────────────────────

export interface ExpressionChordRecipe {
  /** ψ component mappings: [index, weight] */
  expression: readonly (readonly [number, number])[];
  /** Pose offsets scaled by chord activation */
  pose: {
    pitch?: number;
    yaw?: number;
    roll?: number;
    jaw?: number;
  };
  /** Gaze offsets scaled by chord activation */
  gaze: {
    gazeH?: number;
    gazeV?: number;
  };
  /** Texture contributions scaled by chord activation */
  texture: {
    flush?: number;
    fatigue?: number;
  };
}

export interface ShapeChordRecipe {
  /** β component mappings: [index, weight] */
  shape: readonly (readonly [number, number])[];
  /** Resting pose offsets (identity posture) */
  pose?: {
    pitch?: number;
    yaw?: number;
    roll?: number;
  };
}

export interface ChordActivations {
  /** Raw chord activations before softmax */
  rawAlarm: number;
  rawValence: number;
  rawArousal: number;
  /** Softmax weights (sum to 1) */
  wAlarm: number;
  wValence: number;
  wArousal: number;
  /** Signs for bipolar chords (all three are now bipolar) */
  alarmSign: number;
  valenceSign: number;
  arousalSign: number;
  /** Shape axis values (not softmaxed) */
  dominance: number;
  stature: number;
}

// ─── Chord Recipes ───────────────────────────────────

/** ALARM ← volatility × |velocity| (bipolar: placid ↔ alarm) */
export const ALARM_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 1.0],  // ψ0: jaw seasoning (heavy lifting via pose jaw)
    [2, 2.0],  // ψ2: brow rockets up
    [8, 1.5],  // ψ8: nose wrinkle
  ],
  pose: { jaw: 0.3, pitch: -0.08 },
  gaze: { gazeV: 0.12 },
  texture: { flush: 0.3 },
};

export const ALARM_PLACID_RECIPE: ExpressionChordRecipe = {
  expression: [
    [7, 1.0],   // ψ7: slight eyelid relax (soft eyes)
    [2, -0.5],  // ψ2: brow settles down
    [3, -0.3],  // ψ3: glabella smooths
  ],
  pose: { pitch: 0.03 },
  gaze: {},
  texture: { fatigue: 0.1 },
};

/** VALENCE ← deviation (bipolar, -1 to +1) */
// ψ1 is ANTISYMMETRIC (self-reflection = -0.898) — banned.
// Smile: ψ0 (jaw open) + ψ9 (cheek puff, symmetric at 0.937) + ψ7 (Duchenne crinkle).
// Grief: ψ3 (brow furrow) + ψ6 (lower lip sag) + ψ7 (droop).
export const VALENCE_EUPHORIA_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 1.5],   // ψ0: jaw opens slightly (smile aperture)
    [9, 3.0],   // ψ9: cheek puff — lifts cheeks, reads as smile
    [7, 1.5],   // ψ7: Duchenne crinkle (positive = partial close)
    [8, 0.5],   // ψ8: light nose wrinkle — genuine smile microexpression
  ],
  pose: { pitch: 0.06, yaw: 0.04 },
  gaze: { gazeH: 0.08 },
  texture: { flush: 0.15 },
};

export const VALENCE_GRIEF_RECIPE: ExpressionChordRecipe = {
  expression: [
    [3, 2.0],  // ψ3: brow furrow — sadness knit
    [6, 2.5],  // ψ6: lower lip depressor — mouth sags
    [7, 1.0],  // ψ7: slight eyelid droop — weary sadness
  ],
  pose: { pitch: -0.10, roll: -0.04 },
  gaze: { gazeV: -0.08 },
  texture: { fatigue: 0.25 },
};

/** AROUSAL ← -(drawdown + exchangeFatigue) (bipolar, -1 to +1) */
// Weights scaled so geometry stays clean through full ±3 slider range.
// Max ψ2 at slider=3: 3.0 × 3.0 = 9.0 (within ±10 artifact threshold).
export const AROUSAL_ALERT_RECIPE: ExpressionChordRecipe = {
  expression: [
    [2, 3.0],   // ψ2: brow raise (was 7.0 — broke geometry)
    [7, -1.5],  // ψ7: eyes snap open (was -3.0)
  ],
  pose: { pitch: 0.04 },
  gaze: { gazeV: 0.06 },
  texture: { flush: 0.1 },
};

export const AROUSAL_EXHAUSTED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [2, -2.5],  // ψ2: brow sags (was -5.0)
    [7, 2.0],   // ψ7: eyelid droop (was 4.0)
    [3, 1.0],   // ψ3: brow furrow (was 2.0)
  ],
  pose: { pitch: -0.12 },
  gaze: { gazeV: -0.10 },
  texture: { fatigue: 0.4 },
};

/** DOMINANCE (Soyboi↔Chad) ← momentum (bipolar) */
export const DOMINANCE_RECIPE: ShapeChordRecipe = {
  shape: [
    [3, 3.0],   // β3: jaw width (primary — biggest visual impact)
    [2, 2.0],   // β2: chin projection
    [0, 2.0],   // β0: neck thickness / global width
    [4, 1.5],   // β4: brow ridge prominence
    [7, 1.0],   // β7: mid-face width (SYM 0.94)
    [18, 3.0],  // β18: localized structure refinement (SYM 0.886, needs higher weight — low displacement)
    [23, 3.0],  // β23: bone structure detail (SYM 0.856, same)
  ],
  /** Pose identity: chad = head thrown back, soyboi = chin tucked */
  pose: { pitch: 0.06 },
};

/** STATURE (Heavy↔Gaunt) ← |1-beta| with sign from deviation */
export const STATURE_RECIPE: ShapeChordRecipe = {
  shape: [
    [1, 3.0],   // β1: face length (primary)
    [6, 2.0],   // β6: cheekbone prominence
    [5, 1.5],   // β5: nasal bridge
    [8, 1.2],   // β8: mouth size (SYM 0.862)
    [32, 3.0],  // β32: skull surface detail (SYM 0.938, needs higher weight — low displacement)
  ],
  /** Pose identity: heavy = chin slightly up (commanding), gaunt = head slightly forward */
  pose: { pitch: 0.03 },
};

// ─── Math Utilities ──────────────────────────────────

/** Sigmoid squash: maps any real number to (0, 1). Steepness controls slope. */
export function sigmoid(x: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * x));
}

/** Symmetric sigmoid: maps any real number to (-1, 1). */
export function symmetricSigmoid(x: number, steepness: number): number {
  return 2 * sigmoid(x, steepness) - 1;
}

/** Softmax with temperature parameter. */
export function softmax(values: number[], temperature: number): number[] {
  const scaled = values.map(v => v / temperature);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/** Z-score normalize a value against its ticker's history, clamped to ±3. */
function zScore(value: number, stats: SignalStats): number {
  const z = (value - stats.mean) / Math.max(stats.std, 1e-6);
  return Math.max(-3, Math.min(3, z));
}

// ─── Chord Computation ──────────────────────────────

/**
 * Compute raw chord activations from a TickerFrame.
 * When stats/tickerId are provided, inputs are z-score normalized first.
 */
export function computeChordActivations(
  frame: TickerFrame,
  stats?: DatasetStats,
  tickerId?: string,
  timestamp?: string,
): ChordActivations {
  const ts: TickerStats | undefined = stats && tickerId ? stats.get(tickerId) : undefined;

  // Z-score normalize if stats available
  const vol_z = ts ? zScore(frame.volatility, ts.volatility) : frame.volatility;
  const vel_z = ts ? zScore(frame.velocity, ts.velocity) : frame.velocity;
  const dev_z = ts ? zScore(frame.deviation, ts.deviation) : frame.deviation;
  const dd_z = ts ? zScore(frame.drawdown, ts.drawdown) : frame.drawdown;
  const mom_z = ts ? zScore(frame.momentum, ts.momentum) : frame.momentum;
  const beta_z = ts ? zScore(1 - frame.beta, ts.beta) : (1 - frame.beta);

  // Exchange fatigue
  let exchFatigue = 0;
  if (timestamp && (frame as TickerFrame & { exchange?: Exchange }).exchange) {
    // Exchange is on the ticker config, not the frame — caller may provide it separately
  }
  // For now, use drawdown alone; exchange fatigue blended in resolve.ts

  // ─── Expression chord raw activations ──────────
  // ALARM ← volatility × |velocity| (bipolar: positive = alarmed, negative = placid)
  // High vol×|vel| → alarm, low → placid
  const rawAlarm = symmetricSigmoid(vol_z * Math.abs(vel_z) - 0.5, 6);

  // VALENCE ← deviation (bipolar)
  const rawValence = symmetricSigmoid(dev_z, 6);

  // AROUSAL ← -(drawdown + exchangeFatigue) (bipolar)
  const rawArousal = symmetricSigmoid(-(dd_z + exchFatigue), 6);

  // ─── Softmax competition ──────────────────────
  const [wAlarm, wValence, wArousal] = softmax(
    [rawAlarm, Math.abs(rawValence), Math.abs(rawArousal)],
    SOFTMAX_TEMPERATURE,
  );

  // ─── Shape axes (not softmaxed) ───────────────
  // DOMINANCE ← momentum (bipolar)
  const dominance = symmetricSigmoid(mom_z, 6);

  // STATURE ← |1-beta| with sign from deviation
  const statureSign = dev_z >= 0 ? 1 : -1;
  const stature = sigmoid(Math.abs(beta_z), 6) * statureSign;

  return {
    rawAlarm,
    rawValence,
    rawArousal,
    wAlarm,
    wValence,
    wArousal,
    alarmSign: Math.sign(rawAlarm) || 1,
    valenceSign: Math.sign(rawValence) || 1,
    arousalSign: Math.sign(rawArousal) || 1,
    dominance,
    stature,
  };
}

/**
 * Compute exchange fatigue for arousal chord input.
 * Returns fatigue value to add to drawdown_z for arousal computation.
 */
export function computeExchangeFatigueForArousal(
  exchange: Exchange | undefined,
  timestamp: string | undefined,
): number {
  if (!exchange || !timestamp) return 0;
  const utcHour = new Date(timestamp).getUTCHours() + new Date(timestamp).getUTCMinutes() / 60;
  return computeExchangeFatigue(exchange, utcHour);
}

// ─── Chord Resolution ────────────────────────────────

export interface ChordResult {
  expression: Float32Array;
  pose: { pitch: number; yaw: number; roll: number; jaw: number };
  gaze: { gazeH: number; gazeV: number };
  flush: number;
  fatigue: number;
}

/**
 * Apply expression chord recipes with softmax weights.
 * Returns accumulated expression + pose + gaze + texture.
 */
export function resolveExpressionChords(activations: ChordActivations): ChordResult {
  const expression = new Float32Array(N_EXPR);
  let pitch = 0, yaw = 0, roll = 0, jaw = 0;
  let gazeH = 0, gazeV = 0;
  let flush = 0, fatigue = 0;

  // Helper: apply a recipe scaled by weight and sign
  function applyRecipe(recipe: ExpressionChordRecipe, weight: number, sign: number) {
    const s = weight * sign;
    for (const [idx, w] of recipe.expression) {
      expression[idx] += w * s;
    }
    if (recipe.pose.pitch) pitch += recipe.pose.pitch * s;
    if (recipe.pose.yaw) yaw += recipe.pose.yaw * s;
    if (recipe.pose.roll) roll += recipe.pose.roll * s;
    if (recipe.pose.jaw) jaw += recipe.pose.jaw * Math.abs(s); // jaw is always positive
    if (recipe.gaze.gazeH) gazeH += recipe.gaze.gazeH * s;
    if (recipe.gaze.gazeV) gazeV += recipe.gaze.gazeV * s;
    if (recipe.texture.flush) flush += recipe.texture.flush * Math.abs(s);
    if (recipe.texture.fatigue) fatigue += recipe.texture.fatigue * Math.abs(s);
  }

  // ALARM (bipolar — positive = alarmed, negative = placid)
  if (activations.alarmSign >= 0) {
    applyRecipe(ALARM_RECIPE, activations.wAlarm, Math.abs(activations.rawAlarm));
  } else {
    applyRecipe(ALARM_PLACID_RECIPE, activations.wAlarm, Math.abs(activations.rawAlarm));
  }

  // VALENCE (bipolar — pick recipe based on sign)
  if (activations.valenceSign >= 0) {
    applyRecipe(VALENCE_EUPHORIA_RECIPE, activations.wValence, Math.abs(activations.rawValence));
  } else {
    applyRecipe(VALENCE_GRIEF_RECIPE, activations.wValence, Math.abs(activations.rawValence));
  }

  // AROUSAL (bipolar — pick recipe based on sign)
  if (activations.arousalSign >= 0) {
    applyRecipe(AROUSAL_ALERT_RECIPE, activations.wArousal, Math.abs(activations.rawArousal));
  } else {
    applyRecipe(AROUSAL_EXHAUSTED_RECIPE, activations.wArousal, Math.abs(activations.rawArousal));
  }

  // ψ7 safety clamp
  expression[7] = Math.max(-PSI7_CLAMP, Math.min(PSI7_CLAMP, expression[7]));

  return { expression, pose: { pitch, yaw, roll, jaw }, gaze: { gazeH, gazeV }, flush, fatigue };
}

export interface ShapeResult {
  shape: Float32Array;
  /** Resting pose from shape identity (accumulated from dominance + stature) */
  pose: { pitch: number; yaw: number; roll: number };
}

/**
 * Apply shape chord recipes.
 * Returns shape parameter array + identity pose offsets.
 */
export function resolveShapeChords(activations: ChordActivations): ShapeResult {
  const shape = new Float32Array(N_SHAPE);
  let pitch = 0, yaw = 0, roll = 0;

  // Helper: apply a shape recipe
  function applyShape(recipe: ShapeChordRecipe, value: number) {
    for (const [idx, weight] of recipe.shape) {
      shape[idx] += weight * value;
    }
    if (recipe.pose) {
      if (recipe.pose.pitch) pitch += recipe.pose.pitch * value;
      if (recipe.pose.yaw) yaw += recipe.pose.yaw * value;
      if (recipe.pose.roll) roll += recipe.pose.roll * value;
    }
  }

  // DOMINANCE
  applyShape(DOMINANCE_RECIPE, activations.dominance);

  // STATURE
  applyShape(STATURE_RECIPE, activations.stature);

  // β3 safety clamp (jaw collapse prevention)
  shape[3] = Math.max(-BETA3_CLAMP, Math.min(BETA3_CLAMP, shape[3]));

  return { shape, pose: { pitch, yaw, roll } };
}
