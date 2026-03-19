/**
 * Chord Architecture — 4-axis expression + 2-axis shape.
 *
 * Expression: Alarm × Mood × Fatigue × Vigilance — channel-separated.
 * Shape: Dominance (soyboi↔chad) × Feast/Famine (full↔gaunt).
 *
 * Each expression axis expresses through a different spatial channel:
 *   Alarm    → upper face (ψ8 shocked, ψ6 surprise)
 *   Mood     → lower face (ψ9/ψ11/ψ12 smile, ψ0 frown-smile)
 *   Fatigue  → mid-face tone (ψ5 frown, ψ4 engagement, ψ7 happy/disappointed)
 *   Vigilance→ gaze + head pose + light ψ3 (curiosity/disgust)
 *
 * ψ component actual visual reads (from explorer testing):
 *   ψ0: pursed↔frown-smile    ψ1: frown↔lopsided smile (ANTI)
 *   ψ2: —↔open angry mouth    ψ3: disgust↔open curiosity
 *   ψ4: boredom↔engagement    ψ5: uninterested↔frown
 *   ψ6: surprise↔angry        ψ7: disappointed↔happy
 *   ψ8: flat/bored↔shocked    ψ9: frown↔smile
 *   ψ11+ψ12: bilateral smile (conjugate pair)
 */

import type { TickerFrame } from '../types';
import type { DatasetStats, TickerStats, SignalStats } from '../data/stats';
import { computeExchangeFatigue } from './exchange';
import type { Exchange } from '../types';
import { PSI7_CLAMP, BETA3_CLAMP, BETA_GENERAL_CLAMP, N_EXPR, N_SHAPE } from '../constants';

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
  /** Alarm axis: -1 (calm) to +1 (alarmed) ← vol_z × |vel_z| */
  alarm: number;
  /** Mood axis: -1 (grief) to +1 (euphoric) ← deviation_z */
  mood: number;
  /** Fatigue axis: -1 (exhausted) to +1 (wired) ← -(dd_z + exchFatigue) */
  fatigue: number;
  /** Vigilance axis: -1 (oblivious) to +1 (suspicious) ← mean_reversion_z */
  vigilance: number;
  /** Shape: dominance (soyboi↔chad) ← momentum */
  dominance: number;
  /** Shape: feast/famine (full↔gaunt) ← |1-beta| × sign(dev) */
  feastFamine: number;
}

// ─── Chord Recipes ───────────────────────────────────

/** ALARM ALARMED (+): acute volatility × |velocity| snap response.
 * Primary channel: ψ8 (shocked) — THE startle component.
 * ψ6- adds surprise. ψ2 adds open-mouth intensity. */
export const ALARM_ALARMED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [8, 2.0],   // ψ8: shocked (PRIMARY — whole-face startle)
    [6, -1.5],  // ψ6: surprise (negative = surprise, not angry)
    [2, 1.0],   // ψ2: open mouth intensity
  ],
  pose: { pitch: -0.08 },  // recoil
  gaze: { gazeV: 0.10 },   // scanning up
  texture: {},
};

/** ALARM CALM (−): low acute activity → flat, settled.
 * ψ8- = flat/bored (anti-shocked). ψ7+ = happy/relaxed. */
export const ALARM_CALM_RECIPE: ExpressionChordRecipe = {
  expression: [
    [8, -0.8],  // ψ8: flat/bored (opposite of shocked)
    [7, 0.6],   // ψ7: happy — gentle relaxation
  ],
  pose: { pitch: 0.03 },   // settled
  gaze: { gazeV: -0.05 },  // eyes drift down
  texture: {},
};

/** MOOD EUPHORIC (+): positive deviation → warm glow, smile.
 * Primary channel: lower face (mouth + cheeks).
 * Proven recipes from explorer testing — kept as-is. */
export const MOOD_EUPHORIA_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 0.75],  // ψ0: frown-smile — light smile
    [9, 2.5],   // ψ9: smile — reinforces smile character
    [11, 2.5],  // ψ11: left mouth corner — knowing smirk
    [12, 2.5],  // ψ12: right mouth corner — knowing smirk
    [1, 1.25],  // ψ1: overall smile shape (asymmetric, low weight)
    [7, 1.9],   // ψ7: happy eyes — genuine joy
  ],
  pose: { pitch: 0.10, yaw: 0.05 },
  gaze: { gazeH: 0.10 },
  texture: { flush: 0.3 },  // warm glow
};

/** MOOD GRIEF (−): negative deviation → pallid.
 * Proven recipes from explorer testing — kept as-is. */
export const MOOD_GRIEF_RECIPE: ExpressionChordRecipe = {
  expression: [
    [3, 2.5],   // ψ3: open curiosity at this weight reads as distress
    [6, 3.1],   // ψ6: angry — the edge of grief
    [7, 1.25],  // ψ7: happy — at low weight with ψ6 reads as pained
    [4, 1.0],   // ψ4: engagement — grief is not passive
  ],
  pose: { pitch: 0.08, roll: -0.05 },  // chin UP — sky-gazing
  gaze: { gazeV: 0.12 },  // eyes UP — searching
  texture: { flush: -0.25 },  // pallid
};

/** FATIGUE WIRED (+): caffeinated, tight, engaged.
 * Primary channel: mid-face tone.
 * ψ5+ = frown (tightness), ψ4+ = engagement (wired alertness),
 * ψ3+ = open curiosity (scanning, amped). */
export const FATIGUE_WIRED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [5, 1.2],   // ψ5: frown — tight, clenched
    [4, 0.8],   // ψ4: engagement — wired alertness
    [3, 0.6],   // ψ3: open curiosity — scanning, amped
  ],
  pose: { pitch: 0.04 },  // leaning forward
  gaze: {},
  texture: { fatigue: -0.4 },  // wired — negative fatigue texture
};

/** FATIGUE EXHAUSTED (−): 3am face — everything droops.
 * Primary channel: mid-face tone.
 * ψ7- = disappointed (droopy, depleted). ψ4- = boredom (shutdown).
 * ψ5- = uninterested (slack). */
export const FATIGUE_EXHAUSTED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [7, -2.0],  // ψ7: disappointed — PRIMARY exhaustion (droopy, depleted)
    [4, -1.0],  // ψ4: boredom — shutdown, disengaged
    [5, -0.8],  // ψ5: uninterested — slack face
  ],
  pose: { pitch: -0.10, roll: -0.04 },  // head drops, listing
  gaze: { gazeV: -0.12 },  // eyes sag down
  texture: { fatigue: 0.5 },  // bags, pallor
};

/** VIGILANCE SUSPICIOUS (+): mean_reversion_z high → evaluating.
 * Primary channel: gaze + head pose. Light ψ3 for curiosity/assessment. */
export const VIGILANCE_SUSPICIOUS_RECIPE: ExpressionChordRecipe = {
  expression: [
    [3, 0.8],   // ψ3: open curiosity — evaluating, assessing
    [4, 0.5],   // ψ4: engagement — paying attention
  ],
  pose: { yaw: 0.08, roll: 0.04 },  // head turned + cock
  gaze: { gazeH: 0.12 },  // eyes tracking lateral
  texture: {},
};

/** VIGILANCE OBLIVIOUS (−): nothing to see here.
 * Primary channel: minimal facial, gaze drifts. */
export const VIGILANCE_OBLIVIOUS_RECIPE: ExpressionChordRecipe = {
  expression: [
    [4, -0.4],  // ψ4: boredom — not paying attention
  ],
  pose: {},
  gaze: { gazeV: -0.05 },  // eyes drift down
  texture: {},
};

/** DOMINANCE (Soyboi↔Chad) ← momentum (bipolar)
 * β{0,2,3,4,7,13,16,18,19,23,48} */
export const DOMINANCE_RECIPE: ShapeChordRecipe = {
  shape: [
    [3, 3.75],  // β3: jaw width
    [2, 2.5],   // β2: chin projection
    [0, 2.5],   // β0: neck thickness
    [4, 1.9],   // β4: brow ridge
    [7, 1.25],  // β7: mid-face width
    [18, 3.75], // β18: structure refinement
    [23, 3.75], // β23: bone structure detail
    [13, 3.1],  // β13: facial structure
    [48, 3.1],  // β48: skull refinement
    [16, 1.9],  // β16: defined jaw
    [19, -1.9], // β19: jutting chin (inverted)
  ],
  pose: { pitch: 0.075 },
};

/** FEAST/FAMINE (full↔gaunt) ← |1-beta| × sign(deviation)
 * β{1,5,6,8,9,15,32,49} — zero overlap with dominance ✓ */
export const FEAST_FAMINE_RECIPE: ShapeChordRecipe = {
  shape: [
    [5, 2.5],   // β5: elfin↔portly (PRIMARY fullness)
    [6, 2.0],   // β6: pencilneck↔thicc
    [1, 2.0],   // β1: squat↔tall
    [9, 1.5],   // β9: small cranium↔big skull
    [8, 1.2],   // β8: closely-spaced↔wide
    [15, 2.0],  // β15: structural mass
    [32, 2.0],  // β32: body mass detail
    [49, 2.0],  // β49: high-freq mass
  ],
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

/** Z-score normalize a value against its ticker's history, clamped to ±3. */
function zScore(value: number, stats: SignalStats): number {
  const z = (value - stats.mean) / Math.max(stats.std, 1e-6);
  return Math.max(-3, Math.min(3, z));
}

// ─── Chord Computation ──────────────────────────────

/**
 * Compute chord activations from a TickerFrame.
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
  const mr_z = ts ? zScore(frame.mean_reversion_z, ts.mean_reversion_z) : frame.mean_reversion_z;

  // Exchange fatigue (for fatigue chronic component)
  let exchFatigue = 0;

  // ─── Alarm: acute snap response ──────────────
  const alarm = symmetricSigmoid(vol_z * Math.abs(vel_z) - 0.5, 6);

  // ─── Mood: deviation (bipolar) ───────────────
  const mood = symmetricSigmoid(dev_z, 6);

  // ─── Fatigue: chronic toll ───────────────────
  const fatigue = symmetricSigmoid(-(dd_z + exchFatigue), 6);

  // ─── Vigilance: mean reversion ───────────────
  const vigilance = symmetricSigmoid(mr_z, 6);

  // ─── Shape axes ──────────────────────────────
  const dominance = symmetricSigmoid(mom_z, 6);
  const feastFamine = sigmoid(Math.abs(beta_z), 6) * (Math.sign(dev_z) || 0);

  return { alarm, mood, fatigue, vigilance, dominance, feastFamine };
}

/**
 * Compute exchange fatigue for fatigue chord input.
 */
export function computeExchangeFatigueForTension(
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
 * Apply expression chord recipes — 4-axis, channel-separated.
 */
export function resolveExpressionChords(activations: ChordActivations): ChordResult {
  const expression = new Float32Array(N_EXPR);
  let pitch = 0, yaw = 0, roll = 0, jaw = 0;
  let gazeH = 0, gazeV = 0;
  let flush = 0, fatigue = 0;

  function applyRecipe(recipe: ExpressionChordRecipe, magnitude: number) {
    for (const [idx, w] of recipe.expression) {
      expression[idx] += w * magnitude;
    }
    if (recipe.pose.pitch) pitch += recipe.pose.pitch * magnitude;
    if (recipe.pose.yaw) yaw += recipe.pose.yaw * magnitude;
    if (recipe.pose.roll) roll += recipe.pose.roll * magnitude;
    if (recipe.pose.jaw) jaw += recipe.pose.jaw * Math.abs(magnitude);
    if (recipe.gaze.gazeH) gazeH += recipe.gaze.gazeH * magnitude;
    if (recipe.gaze.gazeV) gazeV += recipe.gaze.gazeV * magnitude;
    if (recipe.texture.flush) flush += recipe.texture.flush * magnitude;
    if (recipe.texture.fatigue) fatigue += recipe.texture.fatigue * magnitude;
  }

  // ALARM
  if (activations.alarm >= 0) {
    applyRecipe(ALARM_ALARMED_RECIPE, activations.alarm);
  } else {
    applyRecipe(ALARM_CALM_RECIPE, Math.abs(activations.alarm));
  }

  // MOOD
  if (activations.mood >= 0) {
    applyRecipe(MOOD_EUPHORIA_RECIPE, activations.mood);
  } else {
    applyRecipe(MOOD_GRIEF_RECIPE, Math.abs(activations.mood));
  }

  // FATIGUE
  if (activations.fatigue >= 0) {
    applyRecipe(FATIGUE_WIRED_RECIPE, activations.fatigue);
  } else {
    applyRecipe(FATIGUE_EXHAUSTED_RECIPE, Math.abs(activations.fatigue));
  }

  // VIGILANCE
  if (activations.vigilance >= 0) {
    applyRecipe(VIGILANCE_SUSPICIOUS_RECIPE, activations.vigilance);
  } else {
    applyRecipe(VIGILANCE_OBLIVIOUS_RECIPE, Math.abs(activations.vigilance));
  }

  // ψ7 safety clamp
  expression[7] = Math.max(-PSI7_CLAMP, Math.min(PSI7_CLAMP, expression[7]));

  return { expression, pose: { pitch, yaw, roll, jaw }, gaze: { gazeH, gazeV }, flush, fatigue };
}

export interface ShapeResult {
  shape: Float32Array;
  pose: { pitch: number; yaw: number; roll: number };
}

/**
 * Apply shape chord recipes — 2 axes, zero β overlap.
 */
export function resolveShapeChords(activations: ChordActivations): ShapeResult {
  const shape = new Float32Array(N_SHAPE);
  let pitch = 0, yaw = 0, roll = 0;

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

  applyShape(DOMINANCE_RECIPE, activations.dominance);
  applyShape(FEAST_FAMINE_RECIPE, activations.feastFamine);

  // Per-component safety clamps
  shape[3] = Math.max(-BETA3_CLAMP, Math.min(BETA3_CLAMP, shape[3]));
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) {
      shape[i] = Math.max(-BETA_GENERAL_CLAMP, Math.min(BETA_GENERAL_CLAMP, shape[i]));
    }
  }

  return { shape, pose: { pitch, yaw, roll } };
}
