/**
 * Shared axis definitions for FLAME parameter mapping.
 * Single source of truth — both explorer and binding import from here.
 *
 * Expression axes: tension (tense↔placid), mood (euphoric↔grief) — Russell circumplex.
 * Shape axes: dominance (Soyboi↔Chad), stature (Heavy↔Gaunt) — additive, EMA-smoothed.
 *
 * Component catalog (FLAME 2023 Open PCA ordering):
 *   ψ0: jaw drop            ψ1: smile/frown (ASYMMETRIC) ψ2: brow raise
 *   ψ3: brow furrow         ψ4: lip pucker               ψ5: upper lip raiser
 *   ψ6: lower lip depressor ψ7: eyelid close             ψ8: nose wrinkler
 *   ψ9: cheek puffer
 *
 *   β0: global width/neck   β1: face length    β2: chin projection
 *   β3: mandibular width    β4: brow ridge     β5: nasal bridge
 *   β6: cheekbone prominence β8: mouth size
 *
 * ψ1 is ASYMMETRIC — banned from bilateral expression axes.
 * Safe symmetric set: ψ0, ψ2, ψ3, ψ4, ψ5, ψ6, ψ7, ψ8, ψ9.
 */

// Expression axes — for the library API (resolveFromAxes).
// Positive value = tense pole / euphoric pole. Negative = placid / grief.
// Each entry is [ψ_index, weight].
export const EXPR_AXES = {
  // Tension (+): brow up + jaw + nose wrinkle + eyes open + snarl + lip part
  tension: [[2, 2.5], [0, 1.0], [8, 1.5], [7, -1.5], [5, 0.8], [4, -0.5]] as const,
  // Mood (+): ψ1 (zygomaticus major — actual smile) + Duchenne crinkle
  // ψ1 is slightly asymmetric in PCA but it's the correct smile muscle
  mood:    [[1, 2.5], [7, 1.5], [0, 0.3], [8, 0.5]] as const,
} as const;

// Shape axes — each entry is [β_index, weight]
// Zero component overlap between axes.
// Mid-frequency components have higher weights to compensate for lower displacement.
export const SHAPE_AXES = {
  // Dominance (Chad+/Soyboi-): jaw, chin, neck, brow + mid-freq refinement
  dominance:  [[3, 3.0], [2, 2.0], [0, 2.0], [4, 1.5], [7, 1.0], [18, 3.0], [23, 3.0], [13, 2.5], [48, 2.5]] as const,
  // Stature (Heavy+/Gaunt-): face length, cheekbone, nasal, mouth + skull detail
  stature:    [[1, 3.0], [6, 2.0], [5, 1.5], [8, 1.2], [32, 3.0], [15, 2.5], [49, 2.5]] as const,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['tension', 'mood'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['dominance', 'stature'];

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
