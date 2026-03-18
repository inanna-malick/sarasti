/**
 * Shared axis definitions for FLAME parameter mapping.
 * Single source of truth — both explorer and binding import from here.
 *
 * Expression axes: Emotion Quartet — 4 bipolar axes, symmetric-only components.
 * Shape axes: Shape Triad — 3 bipolar axes, zero component overlap.
 *
 * Component catalog (FLAME 2023 Open PCA ordering):
 *   ψ0: jaw drop            ψ1: smile/frown (ASYMMETRIC)  ψ2: brow raise
 *   ψ3: brow furrow         ψ4: lip pucker                ψ5: upper lip raiser
 *   ψ6: lower lip depressor ψ7: eyelid close              ψ8: nose wrinkler
 *   ψ9: cheek puffer (ASYMMETRIC)
 *
 *   β0: global width         β1: face length         β2: sagittal depth
 *   β3: mandibular width     β4: brow ridge          β5: nasal bridge
 *   β6: cheekbone prominence β8: mouth size           β10: chin projection
 *
 * ψ1 (smile) and ψ9 (cheek puff) are ASYMMETRIC — banned from expression axes.
 */

// Expression axes — each entry is [ψ_index, weight]
// Weights target raw ψ values up to ~7 at slider extremes (cartoon-level).
export const EXPR_AXES = {
  // Joy (+) / Grief (-): jaw-dominant + eye opening. Lower face + eyes.
  joy:      [[0, 2.0], [5, -1.5], [7, -0.7]] as const,
  // Anguish (+) / Serenity (-): brow furrow + nose wrinkle + upper lip snarl. Mid-face.
  anguish:  [[3, 2.3], [8, 1.5], [5, 1.2]] as const,
  // Surprise (+) / Calm (-): brow rockets + jaw drops + eyes snap open.
  surprise: [[2, 2.3], [0, 1.5], [7, -1.5]] as const,
  // Tension (+) / Slack (-): lips pucker + lower lip tenses + nose sets. Mouth clench.
  tension:  [[4, 2.0], [6, 1.5], [8, 1.0]] as const,
} as const;

// Shape axes — each entry is [β_index, weight]
// Zero component overlap between axes.
export const SHAPE_AXES = {
  // Heavy (+) / Gaunt (-): overall mass and presence.
  stature:    [[0, 2.5], [3, 1.5], [2, 1.0]] as const,
  // Elongated (+) / Compact (-): vertical mass distribution.
  proportion: [[1, 2.5], [4, -1.5], [6, -1.0]] as const,
  // Chiseled (+) / Soft (-): feature sharpness.
  angularity: [[10, 1.5], [8, -1.2], [5, -1.0]] as const,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['joy', 'anguish', 'surprise', 'tension'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['stature', 'proportion', 'angularity'];

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
