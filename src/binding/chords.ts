/**
 * Chord Architecture — 2-axis expression circumplex + 2 shape axes.
 *
 * Expression: Tension (tense↔placid) × Mood (euphoric↔grief) — Russell circumplex.
 * Shape: Dominance (soyboi↔chad) × Stature (heavy↔gaunt) — additive with EMA smoothing.
 *
 * No softmax — the two expression axes are orthogonal. Component overlap (ψ0, ψ3, ψ4, ψ5, ψ7, ψ8)
 * produces natural circumplex blending. Max ψ7 overlap at both axes full: ~3.5, within ±4 clamp.
 *
 * Texture ownership: Tension→fatigue (exclusive), Mood→flush (exclusive).
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
  /** Tension axis: -1 (placid) to +1 (tense) */
  tension: number;
  /** Mood axis: -1 (grief) to +1 (euphoric) */
  mood: number;
  /** Shape axis values (not softmaxed) */
  dominance: number;
  stature: number;
}

// ─── Chord Recipes ───────────────────────────────────

/** TENSION TENSE (+): acute volatility × |velocity| + chronic drawdown
 * Wide eyes + jaw + brow up = alarm/scream when mood is low.
 * When stacked with positive mood, ψ11+ψ12 from mood recipe turn this
 * into an adrenaline grin (wide eyes + smile + jaw = manic). */
export const TENSION_TENSE_RECIPE: ExpressionChordRecipe = {
  expression: [
    [2, 2.5],   // ψ2: brow rockets up
    [8, 1.5],   // ψ8: nose wrinkle
    [7, -1.5],  // ψ7: eyes snap WIDE open
    [11, 0.8],  // ψ11+ψ12: slight smile that reads as grin when mood adds more
    [12, 0.8],
  ],
  pose: { jaw: 0.08, pitch: -0.06 },
  gaze: { gazeV: 0.10 },
  texture: { fatigue: -0.3 },  // wired, not fatigued
};

/** TENSION PLACID (−): zen / contemplative / peaceful equilibrium
 * Heavy lids + Mona Lisa smile + strong downward gaze = meditation posture.
 * Differentiates from exhaustion via: smile (not furrow), clear skin (not fatigued),
 * downcast gaze (contemplative, not head-sag). ψ3 strictly 0 — no glabella tension. */
export const TENSION_PLACID_RECIPE: ExpressionChordRecipe = {
  expression: [
    [7, 2.5],   // ψ7: heavy half-shut lids — low alertness, meditative
    [11, 0.5],  // ψ11+ψ12: bilateral Mona Lisa — serene, not lopsided
    [12, 0.5],
    [2, -1.0],  // ψ2: gentle brow relaxation — smooth, unbothered
  ],
  pose: { jaw: 0.04, pitch: -0.05 },  // unclenched jaw + slight mindful bow
  gaze: { gazeV: -0.20 },  // eyes cast down — primary contemplation anchor
  texture: { fatigue: 0.0 },  // clear skin — rested, NOT exhausted
};

/** MOOD EUPHORIC (+): positive deviation → warm glow, bilateral smile
 * ψ11+ψ12 are the unilateral smile conjugate pair (left + right mouth corner).
 * Combined at equal weight they produce a bilateral smile.
 * ψ1 adds overall smile shape but is asymmetric (-0.898) — used at lower weight.
 * Weights ≤2.5 so slider extreme (3.0) stays ≤7.5σ — no mesh inversion. */
export const MOOD_EUPHORIA_RECIPE: ExpressionChordRecipe = {
  expression: [
    [11, 2.0],  // ψ11: left mouth corner raise — half of bilateral smile
    [12, 2.0],  // ψ12: right mouth corner raise — other half
    [1, 1.0],   // ψ1: overall smile shape (asymmetric, so low weight)
    [7, 1.5],   // ψ7: Duchenne eye crinkle — genuine smile tell
    [0, 0.3],   // ψ0: minimal jaw
    [8, 0.5],   // ψ8: nose wrinkle — subtle
  ],
  pose: { pitch: 0.08, yaw: 0.04 },
  gaze: { gazeH: 0.08 },
  texture: { flush: 0.4 },  // strong warm glow
};

/** MOOD GRIEF (−): negative deviation → pallid */
export const MOOD_GRIEF_RECIPE: ExpressionChordRecipe = {
  expression: [
    [3, 2.0],   // ψ3: brow furrow — sadness knit
    [6, 2.5],   // ψ6: lower lip sag
    [7, 1.0],   // ψ7: eyelid droop — weary
    [4, 0.8],   // ψ4: lip pucker — grief purse
  ],
  pose: { pitch: -0.10, roll: -0.04 },
  gaze: { gazeV: -0.08 },
  texture: { flush: -0.2 },  // pallid — negative flush
};

/** DOMINANCE (Soyboi↔Chad) ← momentum (bipolar) */
export const DOMINANCE_RECIPE: ShapeChordRecipe = {
  shape: [
    [3, 3.0],   // β3: jaw width (primary — biggest visual impact)
    [2, 2.0],   // β2: chin projection
    [0, 2.0],   // β0: neck thickness / global width
    [4, 1.5],   // β4: brow ridge prominence
    [7, 1.0],   // β7: mid-face width (SYM 0.94)
    [18, 3.0],  // β18: localized structure refinement (SYM 0.886)
    [23, 3.0],  // β23: bone structure detail (SYM 0.856)
    [13, 2.5],  // β13: facial structure detail (mixed 0.671)
    [48, 2.5],  // β48: high-freq skull refinement (mixed 0.780)
  ],
  // No pose link — dominance chin tuck interferes with expression (e.g. the scream)
};

/** STATURE (Heavy↔Gaunt) ← |1-beta| with sign from deviation */
export const STATURE_RECIPE: ShapeChordRecipe = {
  shape: [
    [1, 3.0],   // β1: face length (primary)
    [6, 2.0],   // β6: cheekbone prominence
    [5, 1.5],   // β5: nasal bridge
    [8, 1.2],   // β8: mouth size (SYM 0.862)
    [32, 3.0],  // β32: skull surface detail (SYM 0.938)
    [15, 2.5],  // β15: mid-freq bone structure (mixed 0.704)
    [49, 2.5],  // β49: high-freq surface detail (mixed 0.761)
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

  // Exchange fatigue (for tension chronic component)
  let exchFatigue = 0;
  // Exchange fatigue blended in resolve.ts via texture accumulator

  // ─── Tension: acute + chronic blend ────────────
  // Acute: volatility × |velocity| (high vol×|vel| → tense)
  // Chronic: -(drawdown + exchangeFatigue) (deep drawdown → placid/exhausted)
  const acute = symmetricSigmoid(vol_z * Math.abs(vel_z) - 0.5, 6);
  const chronic = symmetricSigmoid(-(dd_z + exchFatigue), 6);
  const tension = 0.6 * acute + 0.4 * chronic;

  // ─── Mood: deviation (bipolar) ─────────────────
  const mood = symmetricSigmoid(dev_z, 6);

  // ─── Shape axes (independent) ──────────────────
  const dominance = symmetricSigmoid(mom_z, 6);
  const statureSign = dev_z >= 0 ? 1 : -1;
  const stature = sigmoid(Math.abs(beta_z), 6) * statureSign;

  return { tension, mood, dominance, stature };
}

/**
 * Compute exchange fatigue for tension chord input.
 * Returns fatigue value to add to drawdown_z for tension computation.
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
 * Apply expression chord recipes — 2-axis circumplex, no softmax.
 * Tension and Mood are orthogonal; component overlap produces natural blending.
 */
export function resolveExpressionChords(activations: ChordActivations): ChordResult {
  const expression = new Float32Array(N_EXPR);
  let pitch = 0, yaw = 0, roll = 0, jaw = 0;
  let gazeH = 0, gazeV = 0;
  let flush = 0, fatigue = 0;

  // Helper: apply a recipe scaled by magnitude
  function applyRecipe(recipe: ExpressionChordRecipe, magnitude: number) {
    for (const [idx, w] of recipe.expression) {
      expression[idx] += w * magnitude;
    }
    if (recipe.pose.pitch) pitch += recipe.pose.pitch * magnitude;
    if (recipe.pose.yaw) yaw += recipe.pose.yaw * magnitude;
    if (recipe.pose.roll) roll += recipe.pose.roll * magnitude;
    if (recipe.pose.jaw) jaw += recipe.pose.jaw * Math.abs(magnitude); // jaw always positive
    if (recipe.gaze.gazeH) gazeH += recipe.gaze.gazeH * magnitude;
    if (recipe.gaze.gazeV) gazeV += recipe.gaze.gazeV * magnitude;
    if (recipe.texture.flush) flush += recipe.texture.flush * magnitude;
    if (recipe.texture.fatigue) fatigue += recipe.texture.fatigue * magnitude;
  }

  // TENSION (bipolar: positive = tense, negative = placid)
  if (activations.tension >= 0) {
    applyRecipe(TENSION_TENSE_RECIPE, activations.tension);
  } else {
    applyRecipe(TENSION_PLACID_RECIPE, Math.abs(activations.tension));
  }

  // MOOD (bipolar: positive = euphoric, negative = grief)
  if (activations.mood >= 0) {
    applyRecipe(MOOD_EUPHORIA_RECIPE, activations.mood);
  } else {
    applyRecipe(MOOD_GRIEF_RECIPE, Math.abs(activations.mood));
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

  // Per-component safety clamps
  // β3 has tighter clamp (jaw collapse at -4σ)
  shape[3] = Math.max(-BETA3_CLAMP, Math.min(BETA3_CLAMP, shape[3]));
  // General clamp: artifacts begin ~±5σ, mesh inversion by ~±10σ
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) { // β3 already clamped tighter
      shape[i] = Math.max(-BETA_GENERAL_CLAMP, Math.min(BETA_GENERAL_CLAMP, shape[i]));
    }
  }

  return { shape, pose: { pitch, yaw, roll } };
}
