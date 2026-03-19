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
  // Expression axes (Russell circumplex, bipolar ±)
  tension:    { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
  mood:       { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
  // Shape (bipolar ±)
  dominance:  { type: 'sigmoid', input_min: -1, input_max: 1, output_min: -3, output_max: 3, steepness: 2 },
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
  fatigue:    { type: 'linear',  input_min: -1, input_max: 1, output_min: -1, output_max: 1, steepness: 1 },
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
    warm_red: 0.20,
    warm_green: -0.04,
    warm_blue: -0.06,
    cold_red: -0.08,
    cold_green: -0.03,
    cold_blue: 0.06,
    cheek_radius: 0.035,
    sigmoid_center: 0.15,
    sigmoid_steepness: 4,
    sigmoid_range: [0, 0.3] as [number, number],
  },
  fatigue: {
    components: [5, 8],
    weights: [1.5, -1.0],
    sigmoid_center: 1.25,
    sigmoid_steepness: 3,
    sigmoid_range: [0.5, 2.0] as [number, number],
  },
};
