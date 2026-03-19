/**
 * Shared axis definitions for FLAME parameter mapping.
 * Single source of truth — both explorer and binding import from here.
 *
 * Expression axes: alarm (alarmed↔euphoric), fatigue (wired↔exhausted).
 * Shape axes: dominance (Soyboi↔Chad).
 *
 * Each expression axis expresses through a different spatial channel:
 *   Alarm    → alarmed: upper face (ψ8, ψ6, ψ2) / euphoric: lower face (ψ9, ψ11, ψ12)
 *   Fatigue  → mid-face tone + assessment (ψ3–ψ5, ψ7, ψ8) + gaze
 */

// Expression axes — for the library API (resolveFromAxes).
// Positive value = alarmed / wired pole.
// Each entry is [ψ_index, weight] — positive-pole weights only.
export const EXPR_AXES = {
  // Alarm (+): ψ8 shocked + ψ6- surprise + ψ2 open mouth
  alarm:     [[8, 2.0], [6, -1.5], [2, 1.0]] as const,
  // Fatigue (+): curiosity (ψ3) + engagement (ψ4) + tightness (ψ5) + alert (ψ8)
  fatigue:   [[3, 1.5], [4, 1.2], [5, 1.2], [8, 0.6]] as const,
} as const;

// Shape axes — each entry is [β_index, weight]
export const SHAPE_AXES = {
  // Dominance (Soyboi↔Chad): jaw width, chin, thickness, brow, bone detail
  dominance: [[3, 3.75], [2, 2.5], [0, 2.5], [4, 1.9], [7, 1.25], [18, 3.75], [23, 3.75], [13, 3.1], [48, 3.1], [16, 1.9], [19, -1.9]] as const,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['alarm', 'fatigue'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['dominance'];

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
