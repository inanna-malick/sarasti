/**
 * Chord Architecture — 2-axis expression + 1-axis shape.
 *
 * Expression: Alarm (alarmed↔euphoric) × Fatigue (wired↔exhausted).
 * Shape: Dominance (soyboi↔chad).
 *
 * Channel separation:
 *   Alarm    → alarmed: upper face (ψ8, ψ6, ψ2) / euphoric: lower face (ψ9, ψ11, ψ12, ψ7)
 *   Fatigue  → mid-face tone + assessment (ψ3–ψ5, ψ7, ψ8) + gaze
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
}

export interface ChordActivations {
  /** Alarm axis: +1 (alarmed) to -1 (euphoric) ← vol×|vel| − deviation */
  alarm: number;
  /** Fatigue axis: -1 (exhausted) to +1 (wired) ← -(dd_z + exchFatigue) + mean_reversion_z */
  fatigue: number;
  /** Aggression axis: +1 (aggressive) to -1 (yielding) ← -momentum × velocity_sign */
  aggression: number;
  /** Shape: dominance (soyboi↔chad) ← momentum */
  dominance: number;
  /** Shape: maturity (young↔weathered) ← tenor/duration mapping */
  maturity: number;
  /** Shape: sharpness (angular/lean↔puffy/soft) ← volatility regime */
  sharpness: number;
  /** Expression: smirk (+1 = deceptive/untrustworthy, -1 = sincere/transparent) */
  smirk: number;
}

// ─── Chord Recipes ───────────────────────────────────

/** ALARM ALARMED (+): acute volatility × |velocity| snap response.
 * Primary channel: ψ8 (shocked) — THE startle component.
 * ψ6- adds surprise. ψ2 adds open-mouth intensity. */
export const ALARM_ALARMED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [8, 2.5, 1.3],  // ψ8: shocked — LATE ONSET [w10: subtle at low, dramatic at high]
    [6, -0.6],      // ψ6: surprise
    [2, 0.6, 1.5],  // ψ2: open mouth — LATE ONSET [w10: prevents uncanny at low alarm]
    [0, 0.4, 1.5],  // ψ0: mouth aperture — LATE ONSET [w10: mouth opens only at high alarm]
    [5, 1.0],   // ψ5: frown/tightening — jaw tension
    [3, -0.7],  // ψ3: brow pinch — reduced [w8: free brow for other axes]
    [16, 0.8],  // ψ16: focused intensity — furrowed brows [w7: alarmed ≠ surprised]
    [24, -0.8], // ψ24: concerned brow tilt — outer brow corners down [w5: census]
    [20, -0.6], // ψ20: visceral fear — lip pull, primal flinch [w7: census breadth]
    [15, 0.5],  // ψ15: vulnerability — narrow/anxious jaw posture [w7: census breadth]
    [26, -1.0], // ψ26: retracted chin — LOUDER [w8: alarm lives in lower face now]
  ],
  pose: {},  // pose zeroed — focus on expression geometry
  gaze: {},
  texture: { flush: -0.8 },  // [w14: was -0.4 — ALL 3 w13 critics: still too warm, clusters with neutral at thumbnail. doubled.]
};

/** ALARM EUPHORIC (−): positive deviation, low volatility → warm glow, smile.
 * Primary channel: lower face (mouth + cheeks).
 * Proven recipes from explorer testing. */
export const ALARM_EUPHORIC_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 1.2],   // ψ0: open-mouth smile — reduced [w11: less jaw drop, more cheek]
    [9, 2.0],   // ψ9: smile — reduced [w11: was 2.5, still squinting at high]
    [11, 3.0],  // ψ11: left mouth corner — LOUDER [w11: primary smile driver]
    [12, 3.0],  // ψ12: right mouth corner — LOUDER [w11: primary smile driver]
    [4, -1.0],  // ψ4: mouth widens — open, relaxed [w11: NEW, replaces ψ7]
    [8, 0.4, 0.6],  // ψ8: bright eyes — EARLY ONSET [w11: replaces ψ7, eyes OPEN not closed]
    [19, 1.2],  // ψ19: full cheeks — LOUDER [w11: cheek lift IS the smile, not eye squint]
    [24, 0.7],  // ψ24: confident brow tilt — lifted outer brows
    [26, 0.5],  // ψ26: prominent chin — confident, decisive
    [15, -0.5], // ψ15: toughness/wide jaw — expansive
  ],
  pose: { pitch: -0.05 },  // chin up — open/happy [w11: NEW]
  gaze: {},
  texture: { flush: 0.4 },  // warmer glow [w11: louder flush for euphoria]
};

/** FATIGUE WIRED (+): caffeinated, scanning, eyes-wide-open energy.
 * [w9] MAJOR REWORK — valence collapse fix. Old recipe read as "defeated/zombie"
 * because frown components (ψ5,ψ9,ψ6) overwhelmed the engagement signal.
 * New recipe: curiosity + alertness + engagement. Less frown, more open eyes. */
export const FATIGUE_WIRED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [3, 0.5],   // ψ3: open curiosity — scanning [w9: was -0.7 "disgust" → FLIPPED]
    [4, 1.8],   // ψ4: engagement — lips part, active processing
    [8, 0.6, 0.7],  // ψ8: alert eyes — less weight, less saturation [w11: was 0.8/0.5, "dazed" at 2.0]
    [7, 0.4],   // ψ7: energized eyes — LINEAR now [w11: was 0.5/0.7, simplify]
    [5, 0.6],   // ψ5: frown/tight — reduced [w9: was 1.8 "too much frown"]
    [9, -0.3],  // ψ9: slight frown anchor — reduced [w9: was -0.8 "too negative"]
    [6, 0.5, 1.3],  // ψ6: brow narrow — LATE ONSET [w11: was 0.3 linear, now scales in at high]
    [0, 0.4],   // ψ0: slight mouth open — breathing through mouth
    [16, 1.0],  // ψ16: focus/intensity — reduced [w11: was 1.5, too much squint at high values]
    [25, -0.6], // ψ25: lower eyelid tension — reduced [w11: was -0.9, daze-contributing]
    [13, -0.4], // ψ13: skepticism — mouth corners, suspicious scanning
    [20, 0.4],  // ψ20: stoic suppression — holding it together
  ],
  pose: {},
  gaze: {},
  texture: { fatigue: -0.6 },  // wired skin tone
};

/** FATIGUE EXHAUSTED (−): depleted, heavy, everything melts downward.
 * [w9] Reduced ψ7 extremity (clipping at -4.0 was unpredictable).
 * More boredom, less mouth opening (was reading as "speaking/present"). */
export const FATIGUE_EXHAUSTED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [7, -2.0],  // ψ7: disappointed/heavy eyelids — reduced [w9: was -2.8, clipping issues]
    [4, -2.0],  // ψ4: boredom — deeper shutdown [w9: was -1.5]
    [5, -0.8],  // ψ5: uninterested — slack face
    [3, -0.8],  // ψ3: disgust/"whatever" — checked out [w9: was -0.6]
    [0, 0.3],   // ψ0: slight slack jaw — reduced [w9: was 0.6 "read as speaking"]
    [9, -0.6],  // ψ9: slight frown — sadness/depletion [w9: NEW]
    [19, -1.0], // ψ19: sunken cheeks — physical toll [w9: deeper]
    [24, -0.4], // ψ24: brow droop — outer corners heavy [w9: restored from w8 reduction]
    [20, -0.4], // ψ20: slight pain grimace — everything hurts
    [13, 0.3],  // ψ13: subtle engagement — not dead, just beaten
  ],
  pose: {},
  gaze: {},
  texture: { fatigue: 1.0 },  // max bags/pallor [w9: louder texture]
};

/** AGGRESSION AGGRESSIVE (+): sustained directional force — attacking, combative.
 * Primary channel: ψ6+ (angry stare) + ψ2 (confrontational mouth).
 * The "fighting for survival" face — narrowed eyes, set jaw, forward intent. */
export const AGGRESSION_AGGRESSIVE_RECIPE: ExpressionChordRecipe = {
  expression: [
    [6, 2.5],   // ψ6: angry — PRIMARY. Narrowed brows, confrontational stare
    [2, 1.5],   // ψ2: confrontational mouth — bared-teeth [w7: was 1.2, more open]
    [3, -1.8],  // ψ3: disgust/nasal crinkle — nostril flare, nasolabial depth
    [9, -1.0],  // ψ9: frown — downturned mouth, lip curl
    [5, 1.2],   // ψ5: tight frown — jaw clench, lip tension
    [0, 0.8],   // ψ0: jaw parting — snarl opening [w7: was 0, "too closed"]
    [16, 1.5],  // ψ16: focus/intensity — squinted hunting eyes [w5: census]
    [20, -2.0], // ψ20: visceral snarl — LOUDER [w8: key differentiator from wired]
    [26, 1.3],  // ψ26: chin resolve — forward "charging" [w8: per director at aggr_2.0]
    [25, -0.6], // ψ25: intense aggressive focus — thinned lips, squint [w7: census breadth]
    [15, -0.6], // ψ15: toughness — wide jaw, determined set [w7: census breadth]
  ],
  pose: {},
  gaze: {},
  texture: { flush: 0.3 },  // blood rushing
};

/** AGGRESSION YIELDING (−): active retreat, submission, turning away from the fight.
 * DISTINCT FROM FATIGUE: yielding = looking away, flinching. Fatigue = melting, drooping.
 * No ψ7 (that's fatigue's heavy-lid territory). Yielding has OPEN eyes that are AVERTED. */
export const AGGRESSION_YIELDING_RECIPE: ExpressionChordRecipe = {
  expression: [
    [6, -1.0],  // ψ6: surprise/soft brows — vulnerability, NOT anger
    [4, -0.6],  // ψ4: disengagement — pulling back
    [0, -0.5],  // ψ0: pursed/closed — small mouth, flinching
    [9, -0.4],  // ψ9: slight frown — not happy but not devastated
    [15, 1.0],  // ψ15: vulnerability/narrow jaw — delicate [w9: was 0.8]
    [26, -1.0], // ψ26: strong chin retraction — pulling back [w9: was -0.6]
    [24, -0.8], // ψ24: worried brow — deep worry
    [19, 0.3],  // ψ19: slightly full cheeks — NOT emaciated (distinct from exhaustion)
    [20, 0.3],  // ψ20: stoic suppression — holding back, not fighting
  ],
  pose: {},
  gaze: {},
  texture: { flush: 0.3 },  // [w14: was 0.15 — makeup artist: "missed opportunity", invisible at thumbnail. doubled.]
};

/** SMIRK/DECEPTION (+): the market is lying — asymmetric, untrustworthy.
 * INTENTIONALLY uses ψ1 (antisymmetric lopsided smile) — the ONE component
 * we banned for bilateral expression. Here asymmetry IS the signal.
 * Smirk(+): one-sided smile, squinted eyes, "I know something you don't"
 * Sincere(-): open, symmetric, "what you see is what you get" */
export const SMIRK_RECIPE: ExpressionChordRecipe = {
  expression: [
    [1, 2.0],       // ψ1: lopsided smile — THE asymmetry signal
    [7, 0.8, 0.7],  // ψ7: slight eye squint — knowing look, early onset
    [3, -0.5],      // ψ3: brow pinch — calculating
    [9, 0.6],       // ψ9: slight smile — but only on one side via ψ1
    [13, -0.4],     // ψ13: mouth corner pull — smug
    [25, -0.3],     // ψ25: eye narrowing — sizing you up
  ],
  pose: {},
  gaze: {},
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
  pose: {},  // pose zeroed — focus on shape geometry
};

/** MATURITY (Young↔Weathered) ← instrument tenor/duration
 * Young = round, smooth, naive (short-term, newly issued)
 * Weathered = elongated, bony, aged (long-dated bonds, legacy instruments)
 * β{1,15,17,24} — ZERO overlap with dominance ✓ */
export const MATURITY_RECIPE: ShapeChordRecipe = {
  shape: [
    [1, -1.5],  // β1: vertical scaling — stately/long(-) vs youthful/round(+)
    [15, -1.5], // β15: midface projection — weathered/haggard(-) vs vital/prominent(+)
    [17, 2.0],  // β17: nose length — stubby/youthful(-) vs long-nosed/mature(+)
    [24, 2.0],  // β24: philtrum length — youthful/innocent(-) vs aged/sullen(+)
  ],
  pose: {},
};

/** SHARPNESS (Angular/Lean↔Puffy/Soft) ← volatility regime
 * Sharp(+) = emaciated, razor cheekbones, hungry — high vol / efficiency / desperate
 * Puffy(-) = adipose, hidden bones, bloated — complacency / stagnation / overleveraged
 * β{6,9,10,21,22,28} — ZERO overlap with dominance or maturity ✓ */
export const SHARPNESS_RECIPE: ShapeChordRecipe = {
  shape: [
    [10, -1.0], // β10: V-shape/lean — reduced [w9: was -2.0, homogenized with dominance]
    [28, -2.5], // β28: jaw angularity — PRIMARY leanness cue [w9: was -2.0, louder]
    [9, -2.0],  // β9: lip thinning — key visual leanness [w9: was -1.5, louder]
    [6, -1.5],  // β6: nose refinement — sharp(-) vs bulbous(+)
    [21, -1.5], // β21: nostril width — sharp(-) vs wide(+)
    [22, 2.0],  // β22: chin angularity — harder [w9: was 1.5]
    [20, -1.0], // β20: philtrum tautness — taut/alert(-) vs slack(+) [w9: NEW]
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
  const mr_z = ts ? zScore(frame.mean_reversion_z, ts.mean_reversion_z) : frame.mean_reversion_z;

  // Exchange fatigue (for fatigue chronic component)
  let exchFatigue = 0;

  // ─── Alarm: vol×|vel| pushes alarmed (+), deviation pushes euphoric (−) ───
  const alarm = symmetricSigmoid(vol_z * Math.abs(vel_z) - 0.5 - dev_z, 6);

  // ─── Fatigue: chronic toll + mean reversion (merged) ───
  const fatigue = symmetricSigmoid((-(dd_z + exchFatigue) + mr_z) * 0.5, 6);

  // ─── Aggression: negative momentum with directional velocity = fighting ───
  const vel_sign = vel_z >= 0 ? 1 : -1;
  const aggression = symmetricSigmoid(-mom_z * vel_sign, 6);

  // ─── Shape axes ──────────────────────────────
  const dominance = symmetricSigmoid(mom_z, 6);

  // Maturity: static per-ticker, not derived from frame data.
  // Set to 0 here; overridden by TickerConfig.age mapping in resolve.ts
  const maturity = 0;

  // Sharpness: static per-ticker, not derived from frame data.
  // Set to 0 here; could be overridden by volatility regime mapping
  const sharpness = 0;

  // Smirk: could be derived from bid-ask spread asymmetry, order flow imbalance
  const smirk = 0;

  return { alarm, fatigue, aggression, dominance, maturity, sharpness, smirk };
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
 * Apply expression chord recipes — 2-axis.
 */
export function resolveExpressionChords(activations: ChordActivations): ChordResult {
  const expression = new Float32Array(N_EXPR);
  let pitch = 0, yaw = 0, roll = 0, jaw = 0;
  let gazeH = 0, gazeV = 0;
  let flush = 0, fatigue = 0;

  function applyRecipe(recipe: ExpressionChordRecipe, magnitude: number) {
    for (const entry of recipe.expression) {
      const idx = entry[0];
      const w = entry[1];
      const power = entry.length > 2 ? (entry as readonly [number, number, number])[2] : 1;
      // Per-component onset: |mag|^power preserves sign, controls when component kicks in
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

  // Front-load activation curves: low axis values still produce visible expression.
  // power=0.6 maps: 0.2→0.38, 0.4→0.57, 0.7→0.79, 1.0→1.0
  const EXPR_CURVE = 0.6;
  const alarmMag = activationCurve(activations.alarm, EXPR_CURVE);
  const fatigueMag = activationCurve(activations.fatigue, EXPR_CURVE);

  // ALARM (alarmed ↔ euphoric)
  if (alarmMag >= 0) {
    applyRecipe(ALARM_ALARMED_RECIPE, alarmMag);
  } else {
    applyRecipe(ALARM_EUPHORIC_RECIPE, Math.abs(alarmMag));
  }

  // FATIGUE (wired ↔ exhausted)
  if (fatigueMag >= 0) {
    applyRecipe(FATIGUE_WIRED_RECIPE, fatigueMag);
  } else {
    applyRecipe(FATIGUE_EXHAUSTED_RECIPE, Math.abs(fatigueMag));
  }

  // AGGRESSION (aggressive ↔ yielding)
  const aggrMag = activationCurve(activations.aggression, EXPR_CURVE);
  if (aggrMag >= 0) {
    applyRecipe(AGGRESSION_AGGRESSIVE_RECIPE, aggrMag);
  } else {
    applyRecipe(AGGRESSION_YIELDING_RECIPE, Math.abs(aggrMag));
  }

  // SMIRK (deceptive ↔ sincere) — asymmetric, uses ψ1
  const smirkMag = activationCurve(activations.smirk, EXPR_CURVE);
  if (smirkMag >= 0) {
    applyRecipe(SMIRK_RECIPE, smirkMag);
  }
  // Negative smirk = "sincere" = just absence of smirk, no counter-recipe needed

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
  applyShape(MATURITY_RECIPE, activations.maturity);
  applyShape(SHARPNESS_RECIPE, activations.sharpness);

  // Per-component safety clamps
  shape[3] = Math.max(-BETA3_CLAMP, Math.min(BETA3_CLAMP, shape[3]));
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) {
      shape[i] = Math.max(-BETA_GENERAL_CLAMP, Math.min(BETA_GENERAL_CLAMP, shape[i]));
    }
  }

  return { shape, pose: { pitch, yaw, roll } };
}
