/**
 * Catmull-Rom keyframe interpolation for scenario curves.
 *
 * Keyframes are sparse (5-10 per face per scenario). Between them:
 * - Cubic hermite for smooth easing (no sudden pops)
 * - Tangents auto-computed from neighboring keyframes (Catmull-Rom)
 * - First/last keyframes hold (flat extrapolation)
 */

import type { ScenarioKeyframe, InterpolatedState } from './types';

/**
 * Hermite basis functions for cubic interpolation.
 * Given t ∈ [0,1], returns the four basis weights.
 */
function hermiteBasis(t: number): [number, number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    2 * t3 - 3 * t2 + 1,      // h00: value at start
    t3 - 2 * t2 + t,          // h10: tangent at start
    -2 * t3 + 3 * t2,         // h01: value at end
    t3 - t2,                   // h11: tangent at end
  ];
}

/**
 * Compute Catmull-Rom tangent at keyframe[i] for a given field.
 * Uses central difference from neighbors, scaled by time intervals.
 */
function catmullRomTangent(
  keyframes: ScenarioKeyframe[],
  i: number,
  field: 'tension' | 'valence',
): number {
  if (keyframes.length < 2) return 0;
  if (i === 0) {
    // Forward difference
    const dt = keyframes[1].t - keyframes[0].t;
    return dt > 0 ? (keyframes[1][field] - keyframes[0][field]) / dt * dt : 0;
  }
  if (i === keyframes.length - 1) {
    // Backward difference
    const dt = keyframes[i].t - keyframes[i - 1].t;
    return dt > 0 ? (keyframes[i][field] - keyframes[i - 1][field]) / dt * dt : 0;
  }
  // Central difference (Catmull-Rom: average of adjacent secants)
  const dt = keyframes[i + 1].t - keyframes[i - 1].t;
  return dt > 0 ? (keyframes[i + 1][field] - keyframes[i - 1][field]) / dt
    * (keyframes[i + 1].t - keyframes[i].t) : 0;
}

function catmullRomTangentOpt(
  keyframes: ScenarioKeyframe[],
  i: number,
  getValue: (kf: ScenarioKeyframe) => number,
): number {
  if (keyframes.length < 2) return 0;
  if (i === 0) {
    const dt = keyframes[1].t - keyframes[0].t;
    return dt > 0 ? (getValue(keyframes[1]) - getValue(keyframes[0])) / dt * dt : 0;
  }
  if (i === keyframes.length - 1) {
    const dt = keyframes[i].t - keyframes[i - 1].t;
    return dt > 0 ? (getValue(keyframes[i]) - getValue(keyframes[i - 1])) / dt * dt : 0;
  }
  const dt = keyframes[i + 1].t - keyframes[i - 1].t;
  return dt > 0 ? (getValue(keyframes[i + 1]) - getValue(keyframes[i - 1])) / dt
    * (keyframes[i + 1].t - keyframes[i].t) : 0;
}

/**
 * Hermite interpolation of a single scalar between two keyframes.
 */
function hermiteScalar(
  v0: number, m0: number,
  v1: number, m1: number,
  t: number,
): number {
  const [h00, h10, h01, h11] = hermiteBasis(t);
  return h00 * v0 + h10 * m0 + h01 * v1 + h11 * m1;
}

/**
 * Interpolate an optional numeric field via cubic hermite.
 * If both segment endpoints have the value: cubic hermite.
 * If only one does: hold that value. If neither: undefined.
 */
function interpolateOptionalField(
  keyframes: ScenarioKeyframe[],
  segIdx: number,
  localT: number,
  getValue: (kf: ScenarioKeyframe) => number | undefined,
): number | undefined {
  const v0 = getValue(keyframes[segIdx]);
  const v1 = getValue(keyframes[segIdx + 1]);
  if (v0 !== undefined && v1 !== undefined) {
    const m0 = catmullRomTangentOpt(keyframes, segIdx, kf => getValue(kf) ?? 0);
    const m1 = catmullRomTangentOpt(keyframes, segIdx + 1, kf => getValue(kf) ?? 0);
    return hermiteScalar(v0, m0, v1, m1, localT);
  }
  if (v0 !== undefined) return v0;
  if (v1 !== undefined) return v1;
  return undefined;
}

/**
 * Find the segment index for time t in sorted keyframes.
 * Returns the index of the keyframe just before or at t.
 */
function findSegment(keyframes: ScenarioKeyframe[], t: number): number {
  // Binary search for efficiency (though keyframes are small)
  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (keyframes[mid].t <= t) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

/**
 * Interpolate a scenario keyframe curve at time t.
 * Returns the interpolated state for one face.
 */
export function interpolateKeyframes(
  keyframes: ScenarioKeyframe[],
  t: number,
): InterpolatedState {
  if (keyframes.length === 0) {
    return { tension: 0, valence: 0, stature: 0 };
  }

  // Before first keyframe: hold
  if (t <= keyframes[0].t) {
    const kf = keyframes[0];
    return {
      tension: kf.tension,
      valence: kf.valence,
      stature: kf.stature ?? 0,
      flush: kf.flush,
      fatigue: kf.fatigue,
      pitch: kf.pitch,
      yaw: kf.yaw,
      roll: kf.roll,
      gazeH: kf.gazeH,
      gazeV: kf.gazeV,
      gazeTarget: kf.gazeTarget,
      gazeBlend: 1,
    };
  }

  // After last keyframe: hold
  const last = keyframes[keyframes.length - 1];
  if (t >= last.t) {
    return {
      tension: last.tension,
      valence: last.valence,
      stature: last.stature ?? 0,
      flush: last.flush,
      fatigue: last.fatigue,
      pitch: last.pitch,
      yaw: last.yaw,
      roll: last.roll,
      gazeH: last.gazeH,
      gazeV: last.gazeV,
      gazeTarget: last.gazeTarget,
      gazeBlend: 1,
    };
  }

  // Find segment
  const i = findSegment(keyframes, t);
  const kf0 = keyframes[i];
  const kf1 = keyframes[i + 1];
  const segDuration = kf1.t - kf0.t;
  const localT = segDuration > 0 ? (t - kf0.t) / segDuration : 0;

  // Interpolate tension (cubic hermite)
  const tensionM0 = catmullRomTangent(keyframes, i, 'tension');
  const tensionM1 = catmullRomTangent(keyframes, i + 1, 'tension');
  const tension = hermiteScalar(kf0.tension, tensionM0, kf1.tension, tensionM1, localT);

  // Interpolate valence (cubic hermite)
  const valenceM0 = catmullRomTangent(keyframes, i, 'valence');
  const valenceM1 = catmullRomTangent(keyframes, i + 1, 'valence');
  const valence = hermiteScalar(kf0.valence, valenceM0, kf1.valence, valenceM1, localT);

  // Interpolate stature (cubic hermite via optional getter)
  const getStature = (kf: ScenarioKeyframe) => kf.stature ?? 0;
  const statureM0 = catmullRomTangentOpt(keyframes, i, getStature);
  const statureM1 = catmullRomTangentOpt(keyframes, i + 1, getStature);
  const stature = hermiteScalar(getStature(kf0), statureM0, getStature(kf1), statureM1, localT);

  // Flush: linear interpolation (simpler — it's a texture overlay)
  let flush: number | undefined;
  if (kf0.flush !== undefined && kf1.flush !== undefined) {
    flush = kf0.flush * (1 - localT) + kf1.flush * localT;
  } else if (kf0.flush !== undefined) {
    flush = kf0.flush;
  } else if (kf1.flush !== undefined) {
    flush = kf1.flush;
  }

  // Interpolate optional override fields (cubic hermite when both endpoints defined)
  const fatigue = interpolateOptionalField(keyframes, i, localT, kf => kf.fatigue);
  const pitch = interpolateOptionalField(keyframes, i, localT, kf => kf.pitch);
  const yaw = interpolateOptionalField(keyframes, i, localT, kf => kf.yaw);
  const roll = interpolateOptionalField(keyframes, i, localT, kf => kf.roll);
  const gazeH = interpolateOptionalField(keyframes, i, localT, kf => kf.gazeH);
  const gazeV = interpolateOptionalField(keyframes, i, localT, kf => kf.gazeV);

  // Gaze target: use the target from the current segment, blend = localT for transition
  const gazeTarget = localT < 0.5 ? kf0.gazeTarget : kf1.gazeTarget;
  const gazeBlend = kf0.gazeTarget === kf1.gazeTarget ? 1 : (localT < 0.5 ? 1 - localT * 2 : (localT - 0.5) * 2);

  return {
    tension: Math.max(-1, Math.min(1, tension)),
    valence: Math.max(-1, Math.min(1, valence)),
    stature: Math.max(-1, Math.min(1, stature)),
    flush,
    fatigue,
    pitch,
    yaw,
    roll,
    gazeH,
    gazeV,
    gazeTarget,
    gazeBlend,
  };
}
