/**
 * Chord Architecture — 2-axis expression + 1-axis shape.
 *
 * Expression: Alarm (alarmed↔euphoric) × Fatigue (wired↔exhausted).
 * Shape: Dominance (soyboi↔chad).
 *
 * ψ component MECHANICAL reads (multi-angle census, wave16d):
 *   ψ0: mouth pursed ↔ broad smile       ψ1: asym lip corner L↔R (ANTI)
 *   ψ2: jaw clenched ↔ jaw dropped        ψ3: mouth wide ↔ lip pucker
 *   ψ4: brow raised/eyes wide ↔ brow furrow   ψ5: upper lip snarl ↔ lip tuck
 *   ψ6: rounded mouth "Oh" ↔ horiz stretch    ψ7: corners down ↔ corners up
 *   ψ8: LATERAL JAW SHIFT (not emotional)      ψ9: eye squint ↔ eye wide open
 *   ψ11: mouth stretch ↔ pucker  ψ12: upper lip down ↔ up
 *   ψ20: visceral sneer ↔ stoic  ψ21: sleepy lids ↔ alert eyes
 *   ψ25: squint+wide mouth ↔ relaxed  ψ26: chin retracted ↔ protruded
 */

import type { TickerFrame, TickerConfig } from '../types';
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
  /** Texture contributions scaled by shape activation */
  texture?: {
    skinAge?: number;  // [-1, 1] — weathered(+) vs youthful(−)
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
}

// ─── Chord Recipes ───────────────────────────────────

/** ALARM ALARMED (+): acute volatility × |velocity| snap response.
 * [w16e] MECHANICAL AUDIT: ψ8 was lateral jaw shift, not "shocked" — worked from front
 * by accident but breaks under rotation. Replaced with mechanically correct components:
 * ψ4(-) brow raise + ψ9(+) eyes wide + ψ2(+) jaw drop = alarm from every angle. */
export const ALARM_ALARMED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [4, -3.0],      // ψ4: brow RAISED / eyes wide — PRIMARY alarm signal (neg = brow up)
    [9, 2.5],       // ψ9: eyes wide open — sclera visible, startled gaze
    [2, 1.5],       // ψ2: jaw dropped — mouth opens in shock
    [6, -1.5],      // ψ6: rounded "Oh" mouth — alarm shape
    [5, 1.2],       // ψ5: upper lip snarl — nostril flare, tension
    [20, -1.5],     // ψ20: visceral sneer — nasolabial crunch, distress texture
  ],
  pose: {},
  gaze: {},
  texture: { flush: -0.8 },
};

/** ALARM EUPHORIC (−): positive deviation, low volatility → warm glow, smile.
 * [w16f] PUSH HARDER: acting coach says "still polite, not bursting." Boost smile components,
 * add ψ2(+) jaw drop for open-mouth joy (different from alarm — corners UP here).
 * ψ0(+) at 2.0 is confirmed Duchenne (cheek raise + broad smile from census). */
export const ALARM_EUPHORIC_RECIPE: ExpressionChordRecipe = {
  expression: [
    [0, 2.5],   // ψ0: broad smile — PRIMARY. Cheek raise, Duchenne (boosted from 1.5)
    [7, 3.0],   // ψ7: mouth corners UP — big warm smile (boosted from 2.5)
    [9, 1.5],   // ψ9: eyes wide — bright, alert joy
    [2, 0.8],   // ψ2: slight jaw drop — mouth opens in joyful exclamation
    [21, 1.5],  // ψ21: alert/awake eyes — energized
    [4, -0.8],  // ψ4: brows slightly raised — pleasant, open
    [25, 1.0],  // ψ25: relaxed/soft — calm pleasure, not tense
  ],
  pose: { pitch: -0.05 },
  gaze: {},
  texture: { flush: 0.6 },  // warmer flush (boosted from 0.5)
};

/** FATIGUE WIRED (+): caffeinated, scanning, eyes-wide-open energy.
 * [w16f] BOOST: v5 was 3/5 blind, 2/5 thumbnail. Eyes wide + brow furrow invisible at 48px.
 * Strategy: MOUTH is the thumbnail signal. Add tight grimace (ψ6+, ψ3-) for visible
 * lip tension + keep wide eyes (ψ9+) for closeup/detail. Texture is last thumbnail resort. */
/** FATIGUE WIRED (+): overcaffeinated, teeth-grinding, can't-blink intensity.
 * [w16h] THUMBNAIL FIX: v7 blind=5/5 but thumbnail=2/5. Closed grimace invisible at 48px.
 * Blind test proves the FACE is readable — it's purely a scale problem.
 * Strategy: widen the mouth stretch to change FACE WIDTH at thumbnail. The horizontal
 * stretch of ψ6+ψ3 should make lower face visibly wider than neutral. Add pitch forward
 * to compress silhouette (chin tucks toward camera = shorter face = different from alarmed). */
export const FATIGUE_WIRED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [6, 4.0],    // ψ6: horizontal lip stretch — MAXED, changes face width at thumbnail
    [3, -3.0],   // ψ3: mouth WIDE — widens lower face silhouette (boosted)
    [5, 2.5],    // ψ5: upper lip SNARL — nostril flare, intensity
    [0, -1.0],   // ψ0: mouth pursed/clenched — jaw TENSION
    [9, 2.0],    // ψ9: eyes wide — secondary signal
    [4, 2.5],    // ψ4: brow FURROWED hard — corrugator crunch (boosted from 2.0)
    [20, -1.5],  // ψ20: visceral nasolabial crunch
    [21, 2.0],   // ψ21: alert/awake eyes
  ],
  pose: { pitch: -0.08 },  // chin FORWARD hard — leaning in, compressed silhouette
  gaze: {},
  texture: { fatigue: -1.0 },
};

/** FATIGUE EXHAUSTED (−): depleted, heavy, everything melts downward.
 * [w16f] BOOST: v5 scored 4/5 thumbnail but critic wants "heavier eyelids + slack jaw".
 * ψ9(-) squint is our eyelid proxy. ψ7(-) frown adds mouth weight. Add ψ2(+) slight
 * jaw drop for slack-jawed exhaustion (different from alarm — no brow raise here). */
/** FATIGUE EXHAUSTED (−): depleted, melting, barely conscious.
 * [w16h] SEMANTIC FIX: v7 blind guesser read this as "shock/panic" due to big jaw drop.
 * The ψ2(2.0) jaw drop was too sharp — reads as reactive shock, not passive exhaustion.
 * Strategy: reduce jaw drop, increase FROWN (ψ7) to make the open mouth sag DOWN not gape.
 * The mouth should look like it's falling open from gravity, not opening from surprise.
 * More head sag + list to reinforce "melting" rather than "reacting." */
export const FATIGUE_EXHAUSTED_RECIPE: ExpressionChordRecipe = {
  expression: [
    [9, -3.5],   // ψ9: eyes closing — MAXED exhaustion (near-shut lids)
    [7, -4.0],   // ψ7: mouth corners DOWN — MAXED frown, gravity pulling face down
    [2, 1.2],    // ψ2: jaw drop — reduced from 2.0, just enough for visible slack mouth
    [21, -3.0],  // ψ21: sleepy/droopy — heavy, depleted
    [0, 0.5],    // ψ0: broad/loose — mouth slack, no tension
    [25, 2.0],   // ψ25: relaxed/vacant — zero focus (boosted)
    [24, -2.0],  // ψ24: brow outer corners DOWN — tired brow tilt (boosted)
    [6, -1.0],   // ψ6: rounded mouth — sag shape, not grimace (NEW)
  ],
  pose: { pitch: 0.10, roll: 0.08 },  // head sags MAXIMUM + lists hard
  gaze: { gazeV: -0.35 },  // eyes down maximum — not looking at anything
  texture: { fatigue: 1.0 },
};

/** AGGRESSION AGGRESSIVE (+): sustained directional force — attacking, combative.
 * [w16e] MECHANICAL AUDIT: ψ7(+) is mouth corners UP (smile), NOT eye squint — removed.
 * ψ9(-) IS eye squint — kept. ψ6(+) is lip stretch (tension). ψ3(-) is mouth wide (grimace).
 * ψ20(-) visceral sneer CONFIRMED. ψ26(+) chin protrusion CONFIRMED. ψ25(-) squint CONFIRMED. */
export const AGGRESSION_AGGRESSIVE_RECIPE: ExpressionChordRecipe = {
  expression: [
    [6, 3.0],    // ψ6: horizontal lip stretch — tense, bared-teeth grimace
    [3, -2.0],   // ψ3: mouth wide — snarl, grimace width
    [9, -2.0],   // ψ9: eye SQUINT — focused, predatory gaze (was -1.5, boosted)
    [5, 1.8],    // ψ5: upper lip snarl — nostril flare, bared upper teeth
    [4, 1.5],    // ψ4: brow FURROWED — corrugator, angry V-shape
    [0, -0.6],   // ψ0: mouth pursed/clenched — jaw tension
    [20, -2.0],  // ψ20: visceral sneer — nasolabial crunch, primal
    [26, 1.3],   // ψ26: chin protruded — jaw forward, charging
    [25, -1.0],  // ψ25: squint + wide mouth — intense focus
    [16, 1.5],   // ψ16: mouth narrow/pointed — lip compression
  ],
  pose: { pitch: 0.05 },
  gaze: {},
  texture: { flush: -0.6 },  // cold — controlled rage, blood drains from face
};

/** AGGRESSION YIELDING (−): flinching, wincing, "I can't look" submission.
 * [w16i] EYES CLOSED: the thumbnail breakthrough. Raised brows + closed eyes = FLINCH.
 * This is a binary thumbnail signal (dark eye area vs light sclera in other expressions).
 * Differentiated from exhausted by: raised brows (not drooped), head tilt (not sag),
 * pursed mouth (not slack), and maximum pallor (not gray fatigue). */
export const AGGRESSION_YIELDING_RECIPE: ExpressionChordRecipe = {
  expression: [
    [9, -3.5],   // ψ9: eyes CLOSED — PRIMARY: "I can't look" / wincing / flinch
    [4, -3.0],   // ψ4: brows RAISED high — scared/vulnerable (flinch = raised brows + shut eyes)
    [7, -3.0],   // ψ7: mouth corners DOWN — pained frown
    [24, -2.0],  // ψ24: brow outer corners DOWN — worried, about-to-cry tilt
    [0, -1.0],   // ψ0: mouth pursed/small — tight-lipped, withdrawn
    [21, -2.0],  // ψ21: heavy lids — reinforces eye closure (boosted)
    [26, -1.5],  // ψ26: chin RETRACTED — pulling back, submission
  ],
  pose: { yaw: 0.06, pitch: 0.05, roll: -0.12 },  // head cocked sideways — submission
  gaze: { gazeH: -0.20, gazeV: -0.25 },  // eyes averted (visible when partially open at low activation)
  texture: { flush: 0.5 },  // warm/flushed — vulnerable, blood rushing, open
};

/** DOMINANCE (Soyboi↔Chad) ← momentum (bipolar)
 * [w16j] REBALANCED: user reports "too exaggerated at extremes, relies on too few components."
 * Strategy: reduce peak weights ~40% (max 3.75→2.2), spread across more β components for subtlety.
 * Add minor contributors that were previously absent for smoother deformation.
 * β{0,2,3,4,7,11,13,14,16,18,19,23,29,48} — 14 components (was 11) */
export const DOMINANCE_RECIPE: ShapeChordRecipe = {
  shape: [
    [3, 2.2],   // β3: jaw width — was 3.75, primary silhouette signal
    [2, 1.5],   // β2: chin projection — was 2.5
    [0, 1.5],   // β0: neck thickness — was 2.5
    [4, 1.2],   // β4: brow ridge — was 1.9
    [7, 0.8],   // β7: mid-face width — was 1.25
    [18, 2.2],  // β18: structure refinement — was 3.75
    [23, 2.2],  // β23: bone structure detail — was 3.75
    [13, 1.8],  // β13: facial structure — was 3.1
    [48, 1.8],  // β48: skull refinement — was 3.1
    [16, 1.2],  // β16: defined jaw — was 1.9
    [19, -1.2], // β19: jutting chin (inverted) — was -1.9
    [11, 0.8],  // β11: NEW — cheekbone width, adds to chad breadth
    [14, 0.6],  // β14: NEW — temple width, subtle skull shape
    [29, 0.5],  // β29: NEW — forehead structure, fills out overall form
  ],
  pose: {},
};

/** MATURITY (Young↔Weathered) ← instrument tenor/duration
 * [w16j] OVERHAUL: was nearly invisible (4 β, tiny weights, no texture/pose).
 * Now: 8 β components (boosted 2-3x), forward-pitch pose for aged stoop,
 * and skinAge texture channel for sallow/weathered vs pink/dewy skin.
 * Young = round, smooth, naive (short-term, newly issued)
 * Weathered = elongated, bony, aged (long-dated bonds, legacy instruments)
 * β{1,8,15,17,24,25,30,32} — ZERO overlap with dominance ✓ */
export const MATURITY_RECIPE: ShapeChordRecipe = {
  shape: [
    [1, -2.0],  // β1: vertical scaling — elongation (was -0.8, 2.5x boost)
    [15, -2.5], // β15: midface projection — bony prominence (was -1.0, 2.5x boost)
    [17, 3.0],  // β17: nose length — PRIMARY age signal (was 1.5, doubled)
    [24, 3.0],  // β24: philtrum length — face sag (was 1.5, doubled)
    [8, -1.5],  // β8: NEW — brow-to-skull ratio, reads as cranial maturity
    [25, 1.5],  // β25: NEW — nasolabial depth
    [30, -1.0], // β30: NEW — orbital depth, sunken eyes = aged
    [32, 1.2],  // β32: NEW — jowl/chin sag
  ],
  pose: { pitch: 0.04 },  // slight forward stoop for aged
  texture: { skinAge: 1.0 },  // full skinAge modulation
};

/** SHARPNESS (Angular/Lean↔Puffy/Soft) ← volatility regime
 * [w16j-b] PUSH HARDER: critics say 3/5 readability, 2/5 thumbnail. "Weakest axis."
 * Strategy: max out gauntness cues (cheek hollows, orbital depth, jaw edge),
 * and add NECK/JOWL components for puffy pole (differentiates from soyboi).
 * Sharp(+) = emaciated, razor cheekbones, hungry — high vol / efficiency / desperate
 * Puffy(-) = adipose, hidden bones, bloated — complacency / stagnation / overleveraged
 * β{5,6,9,10,12,20,21,22,26,27,28,31,35} — ZERO overlap with dominance or maturity ✓ */
export const SHARPNESS_RECIPE: ShapeChordRecipe = {
  shape: [
    [28, -3.5], // β28: jaw angularity — PRIMARY: sharp jawline vs soft jowl (maxed)
    [27, -3.0], // β27: deep-set eyes — gaunt orbital hollows (maxed, key at thumbnail)
    [10, -2.5], // β10: V-shape/lean skull — face narrows (boosted)
    [9, -3.0],  // β9: lip thinning — thin-lipped lean vs plump (boosted)
    [22, 2.0],  // β22: chin angularity — pointed chin (boosted)
    [20, -2.0], // β20: philtrum tautness — skin taut over bone (boosted)
    [6, -1.5],  // β6: nose refinement — thin nose vs bulbous
    [21, -1.5], // β21: nostril width — pinched vs wide
    [12, 2.0],  // β12: canthal tilt — alert/lean eye tilt (boosted)
    [5, -1.5],  // β5: lowered brows — intense/lean brow ridge (boosted)
    [26, -1.5], // β26: NEW — chin retraction: puffy chin sags back, sharp chin projects
    [31, -1.5], // β31: NEW — cheek hollow depth: gaunt cheeks vs filled cheeks
    [35, -1.0], // β35: NEW — neck thickness: thin neck (sharp) vs thick neck (puffy)
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
 * TickerConfig provides static identity fields (age → maturity).
 */
export function computeChordActivations(
  frame: TickerFrame,
  stats?: DatasetStats,
  tickerId?: string,
  timestamp?: string,
  ticker?: TickerConfig,
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

  // Dominance: momentum direction → jaw width (chad=strong trend, soyboi=no direction)
  const dominance = symmetricSigmoid(mom_z, 6);

  // ─── MATURITY: static identity from ticker age ───
  // Encodes WHO this instrument is: ^TNX (55) = weathered patriarch, VIX (20) = volatile youth.
  // Normalized: age 20 → −1 (youngest), age 55 → +1 (oldest), midpoint ~37.
  // Uses gentle sigmoid so the range spreads across all tickers rather than bunching at extremes.
  const ageNorm = ticker ? (ticker.age - 37) / 10 : 0;
  const maturity = symmetricSigmoid(ageNorm, 3);

  // ─── SHARPNESS: vol × displacement = regime stress ───
  // Orthogonal to alarm (vol × speed): sharpness is vol × DISTANCE from equilibrium.
  // High vol + far from mean = gaunt/sharp (stressed regime, market eating this instrument).
  // Low vol + near mean = puffy (complacent, range-bound, boring).
  // The 2× scaling ensures moderate stress activates visibly.
  const sharpness = symmetricSigmoid(vol_z * Math.abs(mr_z) * 2 - 0.3, 6);

  return { alarm, fatigue, aggression, dominance, maturity, sharpness };
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

  // ψ7 safety clamp
  expression[7] = Math.max(-PSI7_CLAMP, Math.min(PSI7_CLAMP, expression[7]));

  return { expression, pose: { pitch, yaw, roll, jaw }, gaze: { gazeH, gazeV }, flush, fatigue };
}

export interface ShapeResult {
  shape: Float32Array;
  pose: { pitch: number; yaw: number; roll: number };
  skinAge: number;
}

/**
 * Apply shape chord recipes — 2 axes, zero β overlap.
 */
export function resolveShapeChords(activations: ChordActivations): ShapeResult {
  const shape = new Float32Array(N_SHAPE);
  let pitch = 0, yaw = 0, roll = 0;
  let skinAge = 0;

  function applyShape(recipe: ShapeChordRecipe, value: number) {
    for (const [idx, weight] of recipe.shape) {
      shape[idx] += weight * value;
    }
    if (recipe.pose) {
      if (recipe.pose.pitch) pitch += recipe.pose.pitch * value;
      if (recipe.pose.yaw) yaw += recipe.pose.yaw * value;
      if (recipe.pose.roll) roll += recipe.pose.roll * value;
    }
    if (recipe.texture?.skinAge) skinAge += recipe.texture.skinAge * value;
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

  skinAge = Math.max(-1, Math.min(1, skinAge));

  return { shape, pose: { pitch, yaw, roll }, skinAge };
}

// ─── Meta-Axis Layer ─────────────────────────────────

export interface MetaAxes {
  distress: number;    // [-1, +1] calm ↔ crisis
  vitality: number;    // [-1, +1] depleted ↔ surging
  aggression: number;  // [-1, +1] yielding ↔ attacking
}

/**
 * Mixing matrix: meta-axis → low-level chord activation weights.
 * Each row: how much one meta-axis drives each low-level axis.
 * Will be refined via Gemini critique loops.
 */
export const META_MIXING: Record<keyof MetaAxes, Record<string, number>> = {
  distress:   { alarm: 0.8, fatigue: 0.2, aggression: 0.2, sharpness: 0.7 },
  vitality:   { alarm: -0.5, fatigue: 0.7, dominance: 0.7, sharpness: -0.3 },
  aggression: { alarm: 0.1, fatigue: 0.2, aggression: 0.9, dominance: 0.2, sharpness: 0.2 },
};

/**
 * Compute meta-axes from market data signals.
 * Each meta-axis combines multiple z-scored signals into a single creature-readable dimension.
 */
export function computeMetaAxes(
  frame: TickerFrame,
  stats?: DatasetStats,
  tickerId?: string,
  _timestamp?: string,
  _ticker?: TickerConfig,
): MetaAxes {
  const ts = stats && tickerId ? stats.get(tickerId) : undefined;

  const vol_z = ts ? zScore(frame.volatility, ts.volatility) : frame.volatility;
  const vel_z = ts ? zScore(frame.velocity, ts.velocity) : frame.velocity;
  const dev_z = ts ? zScore(frame.deviation, ts.deviation) : frame.deviation;
  const dd_z = ts ? zScore(frame.drawdown, ts.drawdown) : frame.drawdown;
  const mom_z = ts ? zScore(frame.momentum, ts.momentum) : frame.momentum;
  const mr_z = ts ? zScore(frame.mean_reversion_z, ts.mean_reversion_z) : frame.mean_reversion_z;

  // DISTRESS: vol×max(|vel|, |mr|) + drawdown contribution
  const distress = symmetricSigmoid(
    vol_z * Math.max(Math.abs(vel_z), Math.abs(mr_z)) + 0.3 * dd_z,
    6,
  );

  // VITALITY: deviation + momentum → life force
  const vitality = symmetricSigmoid(dev_z + 0.5 * mom_z, 6);

  // AGGRESSION: negative momentum × velocity direction = fighting
  const vel_sign = vel_z >= 0 ? 1 : -1;
  const aggression = symmetricSigmoid(-mom_z * vel_sign, 6);

  return { distress, vitality, aggression };
}

/**
 * Convert meta-axes → low-level ChordActivations via mixing matrix.
 * Maturity stays static from ticker age.
 */
export function metaToChordActivations(
  meta: MetaAxes,
  ticker?: TickerConfig,
): ChordActivations {
  const low: Record<string, number> = {
    alarm: 0, fatigue: 0, aggression: 0, dominance: 0, sharpness: 0,
  };

  // Apply mixing matrix: each meta-axis contributes to multiple low-level axes
  for (const [metaKey, weights] of Object.entries(META_MIXING)) {
    const metaVal = meta[metaKey as keyof MetaAxes];
    for (const [lowKey, weight] of Object.entries(weights)) {
      low[lowKey] += metaVal * weight;
    }
  }

  // Clamp all low-level activations to [-1, 1]
  for (const key of Object.keys(low)) {
    low[key] = Math.max(-1, Math.min(1, low[key]));
  }

  // Maturity: static identity from ticker age (not driven by meta-axes)
  const ageNorm = ticker ? (ticker.age - 37) / 10 : 0;
  const maturity = symmetricSigmoid(ageNorm, 3);

  return {
    alarm: low.alarm,
    fatigue: low.fatigue,
    aggression: low.aggression,
    dominance: low.dominance,
    maturity,
    sharpness: low.sharpness,
  };
}
