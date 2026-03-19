/**
 * Shared axis definitions for FLAME parameter mapping.
 * Shape axes are derived from chord recipes (chords.ts is the single source of truth).
 *
 * Expression axes: alarm (alarmed↔euphoric), fatigue (wired↔exhausted).
 * Shape axes: dominance (Soyboi↔Chad), maturity (Young↔Weathered), sharpness (Angular↔Puffy).
 */

import {
  DOMINANCE_RECIPE,
  MATURITY_RECIPE,
  SHARPNESS_RECIPE,
} from './chords';

// Expression axes — for the library API (resolveFromAxes).
// Positive value = alarmed / wired pole.
// Each entry is [ψ_index, weight] — positive-pole weights only.
export const EXPR_AXES = {
  // Alarm (+): ψ8 shocked + ψ6- surprise + ψ2 open mouth
  alarm:     [[8, 2.0], [6, -1.5], [2, 1.0]] as const,
  // Fatigue (+): curiosity (ψ3) + engagement (ψ4) + tightness (ψ5) + alert (ψ8)
  fatigue:   [[3, 1.5], [4, 1.2], [5, 1.2], [8, 0.6]] as const,
} as const;

// Shape axes — derived from chord recipes for single source of truth
export const SHAPE_AXES = {
  dominance: DOMINANCE_RECIPE.shape,
  maturity: MATURITY_RECIPE.shape,
  sharpness: SHARPNESS_RECIPE.shape,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['alarm', 'fatigue'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['dominance', 'maturity', 'sharpness'];

/**
 * Apply a mapping: target[idx] += weight * value for each [idx, weight].
 */
export function applyMapping(target: Float32Array, mapping: AxisMapping, value: number): void {
  for (const [idx, weight] of mapping) {
    if (idx < target.length) {
      target[idx] += weight * value;
    }
  }
}
