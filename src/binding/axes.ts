/**
 * Direct FLAME parameter mappings for data-viz.
 * Each semantic axis maps to specific ψ/β components with weights.
 * These are hand-tuned for dramatic, legible deformation — not photorealism.
 */

// Expression axes — each entry is [ψ_index, weight]
export const EXPR_AXES = {
  // Joy (+) / Grief (-): jaw-dominant with eye opening. Lower face + eyes.
  joy: [[0, 2.0], [5, -1.5], [7, -0.7]] as [number, number][],
  // Anguish (+) / Serenity (-): brow furrow + nose wrinkle + upper lip snarl. Mid-face.
  anguish: [[3, 2.3], [8, 1.5], [5, 1.2]] as [number, number][],
  // Surprise (+) / Calm (-): brow rockets + jaw drops + eyes snap open. Classic surprise.
  surprise: [[2, 2.3], [0, 1.5], [7, -1.5]] as [number, number][],
  // Tension (+) / Slack (-): lips pucker + lower lip tenses + nose sets. Mouth-region clench.
  tension: [[4, 2.0], [6, 1.5], [8, 1.0]] as [number, number][],
} as const;

// Shape axes — each entry is [β_index, weight]
export const SHAPE_AXES = {
  // Heavy (+) / Gaunt (-): overall mass and presence.
  stature: [[0, 2.5], [3, 1.5], [2, 1.0]] as [number, number][],
  // Elongated (+) / Compact (-): vertical distribution of mass.
  proportion: [[1, 2.5], [4, -1.5], [6, -1.0]] as [number, number][],
  // Chiseled (+) / Soft (-): sharpness of features.
  angularity: [[10, 1.5], [8, -1.2], [5, -1.0]] as [number, number][],
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;

/**
 * Apply a mapping (array of [index, weight] pairs) to a target Float32Array.
 */
export function applyMapping(target: Float32Array, mapping: readonly [number, number][], value: number): void {
  for (const [idx, weight] of mapping) {
    if (idx < target.length) {
      target[idx] += weight * value;
    }
  }
}
