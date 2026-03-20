import type { BindingConfig, AxisCurveConfig } from './types';
import {
  MAX_NECK_PITCH,
  MAX_NECK_YAW,
  MAX_NECK_ROLL,
  MAX_JAW_OPEN,
  MAX_EYE_HORIZONTAL,
  MAX_EYE_VERTICAL,
} from '../constants';

/** Default curves for generic [-1, 1] input range (library API) */
export const DEFAULT_AXIS_CURVES: AxisCurveConfig = {
  // Expression axes (circumplex, bipolar ±)
  tension:    { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
  valence:    { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
  // Shape (bipolar ±)
  stature:    { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
  // Pose (all bipolar, small output range in radians)
  pitch:      { type: 'linear',  input_min: -1, input_max: 1, output_min: -MAX_NECK_PITCH, output_max: MAX_NECK_PITCH, steepness: 1 },
  yaw:        { type: 'linear',  input_min: -1, input_max: 1, output_min: -MAX_NECK_YAW,   output_max: MAX_NECK_YAW,   steepness: 1 },
  roll:       { type: 'linear',  input_min: -1, input_max: 1, output_min: -MAX_NECK_ROLL,  output_max: MAX_NECK_ROLL,  steepness: 1 },
  jaw:        { type: 'linear',  input_min: 0,  input_max: 1, output_min: 0,              output_max: MAX_JAW_OPEN,   steepness: 1 },
  // Gaze (bipolar, small output range)
  gazeH:      { type: 'linear',  input_min: -1, input_max: 1, output_min: -MAX_EYE_HORIZONTAL, output_max: MAX_EYE_HORIZONTAL, steepness: 1 },
  gazeV:      { type: 'linear',  input_min: -1, input_max: 1, output_min: -MAX_EYE_VERTICAL,   output_max: MAX_EYE_VERTICAL,   steepness: 1 },
  // Texture (bipolar)
  flush:      { type: 'linear',  input_min: -1, input_max: 1, output_min: -1, output_max: 1, steepness: 1 },
};

/**
 * Chord-based binding config.
 * Expression and shape are now computed by the chord engine (chords.ts).
 * This config only holds pose/gaze overrides.
 */
export const DEFAULT_BINDING_CONFIG: BindingConfig = {};

export const TEXTURE_CONFIG = {
  ema_window: 20,
  ema_alpha: 2 / (20 + 1),
  flush: {
    warm_red: 0.25,    // [w15: was 0.35 — user: "red tones look like pinkeye". reduced + tighter cheek radius]
    warm_green: -0.03,  // [w14: was -0.08 — makeup artist: "bronzed/fake tan". less green drain = pink-red not orange]
    warm_blue: -0.04,   // [w14: was -0.10 — less blue drain shifts hue from orange toward rosy-pink]
    cold_red: -0.18,    // [w12: was -0.08 — invisible, need 2x+ for pallor signal]
    cold_green: -0.06,  // [w12: was -0.03 — slight green drain for sickly look]
    cold_blue: 0.12,    // [w12: was 0.06 — more blue for cold/deoxygenated read]
    cheek_radius: 0.032, // [w15: was 0.042 — flush bleeding into eye area causing "pinkeye". tighter + lower centers]
    sigmoid_center: 0.15,
    sigmoid_steepness: 4,
    sigmoid_range: [0, 0.3] as [number, number],
  },
  fatigue: {
    components: [5, 8],
    weights: [3.0, -2.0],  // [w12: was [1.5, -1.0] — invisible, doubled for visibility]
    sigmoid_center: 1.25,
    sigmoid_steepness: 3,
    sigmoid_range: [0.5, 2.0] as [number, number],
  },
};
