/**
 * Circumplex Architecture — 2-axis expression + 1-axis shape.
 *
 * Expression: Tension (calm↔tense, upper face) × Valence (bad↔good, lower face).
 * Shape: Stature (sprite↔titan).
 *
 * CRITICAL INVARIANT: Zero ψ overlap between Tension and Valence.
 *   TENSION owns: ψ2, ψ4, ψ5, ψ9, ψ20, ψ21, ψ24, ψ25, ψ28  (jaw is URGENCY)
 *   VALENCE owns: ψ0, ψ3, ψ6, ψ7, ψ16, ψ26, ψ45
 *
 * Quadrants emerge from composition:
 *   Tense + Good = MANIC   (wide eyes + smile)
 *   Tense + Bad  = PANICKED (wide eyes + frown)
 *   Calm + Good  = CONTENT  (soft eyes + smile)
 *   Calm + Bad   = DEPRESSED (droopy + frown)
 */

import type { TickerFrame } from '../types';
import type { DatasetStats, TickerStats, SignalStats } from '../data/stats';
import { PSI7_CLAMP, BETA3_CLAMP, BETA_GENERAL_CLAMP, N_EXPR, N_SHAPE } from '../constants';

// ─── Types ───────────────────────────────────────────

export interface ExpressionChordRecipe {
  /** ψ component mappings: [index, weight] or [index, weight, power]
   * power controls per-component onset curve:
   *   power < 1: early onset (concave) — subtle cues visible at low activation
   *   power = 1: linear (default)
   *   power > 1: late onset (convex) — dramatic features only at high activation
   * Final value: weight × sign(mag) × |mag|^power */
  expression: readonly (readonly [number, number] | readonly [number, number, number])[];
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
  /** Texture contributions scaled by shape activation */
  texture?: {
    skinAge?: number;  // [-1, 1] — weathered(+) vs youthful(−)
  };
}

export interface CircumplexActivations {
  /** Tension: [-1,+1] calm(−) ↔ tense(+). Drives upper face (eyes, brow). */
  tension: number;
  /** Valence: [-1,+1] bad(−) ↔ good(+). Drives lower face (mouth, jaw). */
  valence: number;
  /** Stature: [-1,+1] sprite(−) ↔ titan(+). Drives shape (bone structure). */
  stature: number;
}

// ─── Expression Recipes (face-region ownership) ─────

/** TENSION TENSE (+) — upper face: wide eyes, raised brow, alert, nose flare.
 * ψ components: 9(eyes), 21(alertness), 4(brow), 24(brow outer), 25(focus), 5(nose), 20(sneer), 28(Duchenne squint)
 * w2: expanded pose (chin DOWN = Kubrick stare), added ψ28, reduced ψ4 to avoid "startled" read */
export const TENSION_TENSE_RECIPE: ExpressionChordRecipe = {
  expression: [
    [2, 3.5, 1.5],    // ψ2: jaw OPENS with tension — late onset prevents pop
    [9, 5.0, 0.4],    // ψ9: eyes wide open — softened onset (was 0.3, eye "pop" at t=0.3)
    [21, 5.0, 0.4],   // ψ21: alert/awake — matched to ψ9 onset
    [4, -3.5, 0.6],   // ψ4: brow RAISED — split the difference for panic readability
    [24, -3.0, 0.5],  // ψ24: brow outer corners DOWN — worried
    [25, -2.5],        // ψ25: squint+focus intensity
    [5, 2.0, 0.7],    // ψ5: upper lip snarl/nostril flare
    [20, -2.0],        // ψ20: visceral sneer — nasolabial
    [28, 1.5, 0.5],   // ψ28: Duchenne squint — focus intensity, prevents "vacant stare"
  ],
  pose: { pitch: -0.20, yaw: 0.05 },  // w3: reduced from -0.30 (too menacing, F regression)
  gaze: { gazeV: 0.20 },              // w3: matched to pitch reduction
  texture: { fatigue: -0.5 },
};

/** TENSION CALM (−) — upper face: soft eyes, relaxed brow, sleepy.
 * w2: dramatically expanded — calm was invisible in blind test (B,G,K,O all read as neutral).
 * Bold pose (head sagging), more fatigue texture, ψ28 for eye weight. */
export const TENSION_CALM_RECIPE: ExpressionChordRecipe = {
  expression: [
    [2, -1.0, 0.5],   // ψ2: jaw CLENCHED — early onset for calm-end payoff
    [9, -4.5, 0.5],   // ψ9: eyes closing — heavy (was -4.0)
    [21, -5.0],        // ψ21: sleepy/droopy lids — deepened (was -4.5)
    [4, 2.5],          // ψ4: brow heavy/furrowed (was 2.0)
    [24, 2.5],         // ψ24: brow outer corners UP — relaxed (was 2.0)
    [25, 3.0],         // ψ25: relaxed/soft — zero focus (was 2.5)
    [28, -1.5],        // ψ28: wide flat eyes — "blank" resignation (new)
  ],
  pose: { pitch: 0.25, roll: 0.08 },  // w3: reduced from 0.35 (up-the-nose at high calm)
  gaze: { gazeV: -0.45 },             // w2: eyes looking down (was -0.40)
  texture: { fatigue: 1.0 },           // w2: max fatigue wash (was 0.8)
};

/** VALENCE GOOD (+) — lower face: smile, teeth, corners up, warm flush.
 * ψ components: 0(smile), 7(corners), 2(jaw), 3(mouth width), 6(mouth shape), 26(chin) */
/** w3: boosted early-onset smile for mild positive valence visibility.
 * J (t=0.70, v=0.30) was reading as negative — tension cues overwhelm weak smile.
 * Early-onset ψ7 ensures mouth corners UP is visible even at v=0.30. */
export const VALENCE_GOOD_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 3.0, 0.7],     // ψ0: broad smile — slightly early onset (was linear)
    [7, 4.0, 0.5],     // ψ7: mouth corners UP — early onset, boosted (was 3.5 linear)
    [3, -1.5],          // ψ3: mouth widens
    [6, -1.0],          // ψ6: horizontal stretch
    [26, 1.0],          // ψ26: chin forward — confident
  ],
  pose: { pitch: -0.04 },
  gaze: {},
  texture: { flush: 0.30 },  // w3: slightly more warmth (was 0.25)
};

/** VALENCE BAD (−) — lower face: frown, slack jaw, corners down, pallor.
 * w2: boosted moderate-level frown visibility. Moderate negative valence (-0.25 to -0.61)
 * was reading as neutral in blind test. Added ψ45 (mentalis chin pout) for emotional weight,
 * early-onset frown (power 0.5), stronger pallor. */
export const VALENCE_BAD_RECIPE: ExpressionChordRecipe = {
  expression: [
    [7, -4.0, 0.5],     // ψ7: mouth corners DOWN — early onset, deep frown (was -3.5, linear)
    [0, 1.0, 1.5],      // ψ0: slack mouth — late onset
    [3, 1.5],            // ψ3: lip pucker/compress
    [6, 1.5],            // ψ6: rounded mouth shape
    [16, 1.0],           // ψ16: mouth narrow
    [26, -2.5],          // ψ26: chin retracted — deep
    [45, 2.0, 0.5],     // ψ45: mentalis chin pout — grief weight, early onset (new)
  ],
  pose: { pitch: 0.08, roll: 0.06 },  // w2: slightly more head tilt
  gaze: { gazeV: -0.25 },             // w2: looking down more (was -0.20)
  texture: { flush: -0.55 },           // w2: stronger pallor (was -0.45)
};

// ─── Shape Recipe ───────────────────────────────────

/** STATURE (Sprite↔Titan) — single shape axis.
 * Titan(+): wide jaw, sharp cheeks, elongated, bony.
 * Sprite(−): narrow jaw, soft cheeks, rounded, smooth. */
export const STATURE_RECIPE: ShapeChordRecipe = {
  shape: [
    [3, 3.0],   // β3: jaw width (×1.5)
    [2, 2.25],  // β2: chin projection (×1.5)
    [0, 1.5],   // β0: neck thickness (×1.5)
    [28, -3.0], // β28: jaw angularity (×1.5)
    [27, -2.25],// β27: deep-set eyes (×1.5)
    [10, -2.25],// β10: V-shape lean skull (×1.5)
    [22, 2.25], // β22: chin angularity (×1.5)
    [9, -2.25], // β9: lip thinning (×1.5)
    [4, 1.5],   // β4: brow ridge (×1.5)
    [7, 1.2],   // β7: mid-face width (×1.5)
    [18, 2.25], // β18: structure (×1.5)
    [23, 2.25], // β23: bone structure (×1.5)
    [13, 1.8],  // β13: facial structure (×1.5)
  ],
  pose: {},
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

/** Front-load activation: small inputs produce proportionally larger output.
 * power < 1 makes low activations more visible (0.4 → 0.63 at power=0.6).
 * Preserves sign and endpoints (0→0, ±1→±1). */
function activationCurve(x: number, power: number): number {
  return Math.sign(x) * Math.pow(Math.abs(x), power);
}

/** Soft-clip extreme activations to preserve facial nuance.
 * Below knee, passthrough. Above knee, smoothly compress toward 1.0.
 * Prevents "frozen panic" look where all components are maxed. */
function softClip(x: number, knee = 0.85): number {
  const ax = Math.abs(x);
  if (ax <= knee) return x;
  const overshoot = ax - knee;
  const headroom = 1.0 - knee;
  const compressed = knee + headroom * (1 - Math.exp(-overshoot / headroom));
  return Math.sign(x) * compressed;
}

/** Z-score normalize a value against its ticker's history, clamped to ±3. */
function zScore(value: number, stats: SignalStats): number {
  const z = (value - stats.mean) / Math.max(stats.std, 1e-6);
  return Math.max(-3, Math.min(3, z));
}

// ─── Circumplex Computation ─────────────────────────

/**
 * Compute circumplex activations from a TickerFrame.
 * When stats/tickerId are provided, inputs are z-score normalized first.
 */
export function computeCircumplex(
  frame: TickerFrame,
  stats?: DatasetStats,
  tickerId?: string,
): CircumplexActivations {
  const ts: TickerStats | undefined = stats && tickerId ? stats.get(tickerId) : undefined;

  const vol_z = ts ? zScore(frame.volatility, ts.volatility) : frame.volatility;
  const vel_z = ts ? zScore(frame.velocity, ts.velocity) : frame.velocity;
  const dev_z = ts ? zScore(frame.deviation, ts.deviation) : frame.deviation;
  const dd_z = ts ? zScore(frame.drawdown, ts.drawdown) : frame.drawdown;
  const mom_z = ts ? zScore(frame.momentum, ts.momentum) : frame.momentum;
  const mr_z = ts ? zScore(frame.mean_reversion_z, ts.mean_reversion_z) : frame.mean_reversion_z;

  // Tension: vol × |vel| + |drawdown| — crisis = tense
  const tension = symmetricSigmoid(
    vol_z * Math.abs(vel_z) + Math.abs(dd_z) - 0.8, 1.0,
  );

  // Valence: deviation + momentum — good position = good mood
  const valence = symmetricSigmoid(dev_z + 0.5 * mom_z, 1.5);

  // Stature: momentum + vol regime blend
  const stature = symmetricSigmoid(mom_z + Math.abs(mr_z) - 0.3, 1.0);

  return { tension, valence, stature };
}

// ─── Circumplex Debug (full signal pipeline) ─────────

export interface CircumplexDebug extends CircumplexActivations {
  zScores: {
    vol_z: number; vel_z: number; dev_z: number;
    dd_z: number; mom_z: number; mr_z: number;
  };
  inputs: {
    tension: number;  // vol_z × |vel_z| + |dd_z| − 0.8
    valence: number;  // dev_z + 0.5 × mom_z
    stature: number;  // mom_z + |mr_z| − 0.3
  };
}

/**
 * Like computeCircumplex but returns full debug info:
 * z-scores, raw inputs, and final sigmoid outputs.
 */
export function computeCircumplexDebug(
  frame: TickerFrame,
  stats?: DatasetStats,
  tickerId?: string,
): CircumplexDebug {
  const ts: TickerStats | undefined = stats && tickerId ? stats.get(tickerId) : undefined;

  const vol_z = ts ? zScore(frame.volatility, ts.volatility) : frame.volatility;
  const vel_z = ts ? zScore(frame.velocity, ts.velocity) : frame.velocity;
  const dev_z = ts ? zScore(frame.deviation, ts.deviation) : frame.deviation;
  const dd_z = ts ? zScore(frame.drawdown, ts.drawdown) : frame.drawdown;
  const mom_z = ts ? zScore(frame.momentum, ts.momentum) : frame.momentum;
  const mr_z = ts ? zScore(frame.mean_reversion_z, ts.mean_reversion_z) : frame.mean_reversion_z;

  const tensionInput = vol_z * Math.abs(vel_z) + Math.abs(dd_z) - 0.8;
  const valenceInput = dev_z + 0.5 * mom_z;
  const statureInput = mom_z + Math.abs(mr_z) - 0.3;

  return {
    tension: symmetricSigmoid(tensionInput, 1.0),
    valence: symmetricSigmoid(valenceInput, 1.5),
    stature: symmetricSigmoid(statureInput, 1.0),
    zScores: { vol_z, vel_z, dev_z, dd_z, mom_z, mr_z },
    inputs: { tension: tensionInput, valence: valenceInput, stature: statureInput },
  };
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
 * Apply expression chord recipes — 2-axis circumplex.
 * Tension drives upper face, Valence drives lower face. Zero ψ overlap.
 */
export function resolveExpressionChords(activations: CircumplexActivations): ChordResult {
  const expression = new Float32Array(N_EXPR);
  let pitch = 0, yaw = 0, roll = 0, jaw = 0;
  let gazeH = 0, gazeV = 0;
  let flush = 0, fatigue = 0;

  function applyRecipe(recipe: ExpressionChordRecipe, magnitude: number) {
    for (const entry of recipe.expression) {
      const idx = entry[0];
      const w = entry[1];
      const power = entry.length > 2 ? (entry as readonly [number, number, number])[2] : 1;
      const effectiveMag = power === 1 ? magnitude : Math.sign(magnitude) * Math.pow(Math.abs(magnitude), power);
      expression[idx] += w * effectiveMag;
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

  // Front-load activation curves
  const EXPR_CURVE = 0.5;
  const tensionMag = softClip(activationCurve(activations.tension, EXPR_CURVE));
  const valenceMag = activationCurve(activations.valence, EXPR_CURVE);

  // TENSION (tense ↔ calm) — upper face
  if (tensionMag >= 0) {
    applyRecipe(TENSION_TENSE_RECIPE, tensionMag);
  } else {
    applyRecipe(TENSION_CALM_RECIPE, Math.abs(tensionMag));
  }

  // VALENCE (good ↔ bad) — lower face
  if (valenceMag >= 0) {
    applyRecipe(VALENCE_GOOD_RECIPE, valenceMag);
  } else {
    applyRecipe(VALENCE_BAD_RECIPE, Math.abs(valenceMag));
  }

  // Per-component safety clamp — prevents mesh distortion from recipe stacking
  const PSI_CLAMP = 5.0;
  for (let i = 0; i < expression.length; i++) {
    expression[i] = Math.max(-PSI_CLAMP, Math.min(PSI_CLAMP, expression[i]));
  }
  // ψ7 tighter clamp (eyelid clips through eyeball)
  expression[7] = Math.max(-PSI7_CLAMP, Math.min(PSI7_CLAMP, expression[7]));

  return { expression, pose: { pitch, yaw, roll, jaw }, gaze: { gazeH, gazeV }, flush, fatigue };
}

export interface ShapeResult {
  shape: Float32Array;
  pose: { pitch: number; yaw: number; roll: number };
  skinAge: number;
}

/**
 * Apply shape chord recipes — single stature axis.
 */
export function resolveShapeChords(activations: CircumplexActivations): ShapeResult {
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

  applyShape(STATURE_RECIPE, activations.stature);

  // Per-component safety clamps
  shape[3] = Math.max(-BETA3_CLAMP, Math.min(BETA3_CLAMP, shape[3]));
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) {
      shape[i] = Math.max(-BETA_GENERAL_CLAMP, Math.min(BETA_GENERAL_CLAMP, shape[i]));
    }
  }

  return { shape, pose: { pitch, yaw, roll }, skinAge: 0 };
}
