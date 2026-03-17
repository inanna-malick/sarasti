import type { BindingConfig } from './types';
import { EXPRESSION_INTENSITY_DEFAULT, MAX_DEVIATION_SIGMA } from '../constants';

/**
 * Default binding configuration.
 *
 * Shape allocation and expression allocation use PLACEHOLDER indices.
 * The shape and expression Devs will determine the actual FLAME component
 * indices empirically by rendering faces with individual components varied.
 *
 * The structure is fixed; the values are the artist's hand.
 */
export const DEFAULT_BINDING_CONFIG: BindingConfig = {
  shape: {
    // Placeholder: first 3 shape components for age
    // Devs will identify which β actually affect perceived age
    age_indices: [0, 1, 2],
    // Next 3 for class morphology
    class_indices: [3, 4, 5],
    // Next 4 for family resemblance
    family_indices: [6, 7, 8, 9],
  },

  expression: {
    distress: {
      // Placeholder: Devs identify which ψ produce brow furrow + mouth downturn
      indices: [0, 1, 2, 3],
      weights: [1.0, 0.8, 0.6, 0.4],
    },
    shock: {
      // Placeholder: which ψ produce brow raise + mouth open
      indices: [4, 5, 6, 7],
      weights: [1.0, 0.8, 0.6, 0.4],
    },
    relief: {
      // Placeholder: which ψ produce slight smile + brow relax
      indices: [8, 9, 10, 11],
      weights: [1.0, 0.7, 0.5, 0.3],
    },
    dread: {
      // Placeholder: sustained negative — mix of distress + tension
      indices: [0, 1, 12, 13],
      weights: [0.7, 0.5, 1.0, 0.8],
    },
  },

  deviation_curve: {
    type: 'sigmoid',
    input_min: -MAX_DEVIATION_SIGMA,
    input_max: MAX_DEVIATION_SIGMA,
    output_min: -1,
    output_max: 1,
    steepness: 6,
  },

  velocity_curve: {
    type: 'exponential',
    input_min: -MAX_DEVIATION_SIGMA,
    input_max: MAX_DEVIATION_SIGMA,
    output_min: -1,
    output_max: 1,
    steepness: 3,
  },

  volatility_curve: {
    type: 'linear',
    input_min: 0,
    input_max: 5,
    output_min: 0,
    output_max: 1,
    steepness: 1,
  },

  expression_intensity: EXPRESSION_INTENSITY_DEFAULT,

  // Per-class shape profiles: [β_index, value] pairs
  // Devs will determine which components produce the desired morphology
  class_profiles: {
    energy:   [[3, 0.8], [4, 0.3], [5, -0.2]],   // wider face, heavier jaw
    fear:     [[3, -0.6], [4, 0.5], [5, 0.4]],    // narrower, sharper features
    currency: [[3, 0.0], [4, 0.0], [5, 0.0]],     // medium proportions
    equity:   [[3, 0.3], [4, -0.4], [5, -0.3]],   // rounder, softer
    media:    [[3, -0.8], [4, 0.7], [5, 0.6]],    // most angular, alien
  },

  // Per-family perturbations from class profile
  family_profiles: {
    brent:    [[6, 0.2], [7, -0.1]],    // narrow jaw, high brow
    wti:      [[6, 0.3], [7, 0.1]],     // broader jaw — Brent's cousin
    natgas:   [[6, -0.3], [7, 0.2]],
    distill:  [[6, 0.1], [7, -0.2]],
    consumer: [[6, -0.1], [7, 0.3]],
    vol:      [[8, 0.4], [9, -0.2]],
    haven:    [[8, -0.2], [9, 0.3]],
    currency: [[8, 0.1], [9, 0.1]],
    rates:    [[8, -0.3], [9, -0.1]],
    sector:   [[6, 0.2], [7, 0.1]],
    broad:    [[6, 0.0], [7, 0.0]],
    gdelt:    [[6, -0.4], [7, 0.5], [8, 0.3], [9, -0.3]],
  },
};
