/**
 * Shared axis definitions for FLAME parameter mapping.
 *
 * Expression axes: tension (calm↔tense), valence (bad↔good).
 * Shape axes: stature (sprite↔titan).
 *
 * Derived from circumplex recipes (chords.ts is the single source of truth).
 */

import {
  STATURE_RECIPE,
} from './chords';

// Expression axes — for the library API (resolveFromAxes).
// Simplified ψ mappings for direct axis application (no power curves).
export const EXPR_AXES = {
  // Tension (+): upper face — wide eyes, raised brow, alert
  tension:  [[9, 2.5], [21, 2.5], [4, -2.5], [24, -2.0], [25, -1.5], [5, 1.5], [20, -1.5]] as const,
  // Valence (+): lower face — smile, corners up, jaw
  valence:  [[0, 2.0], [7, 2.5], [2, 0.5], [3, -1.0], [6, -0.5], [26, 0.5]] as const,
} as const;

// Shape axes — derived from chord recipes for single source of truth
export const SHAPE_AXES = {
  stature: STATURE_RECIPE.shape,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['tension', 'valence'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['stature'];

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
