/**
 * Shared axis definitions for FLAME parameter mapping.
 * Single source of truth — both explorer and binding import from here.
 *
 * Expression axes: alarm (alarmed↔calm), mood (euphoric↔grief),
 *   fatigue (wired↔exhausted), vigilance (suspicious↔oblivious).
 * Shape axes: dominance (Soyboi↔Chad), feastFamine (heavy↔gaunt).
 *
 * Each expression axis expresses through a different spatial channel:
 *   Alarm    → upper face (brow + eyelids)
 *   Mood     → lower face (mouth + cheeks)
 *   Fatigue  → mid-face (muscle tone)
 *   Vigilance→ gaze + head pose
 */

// Expression axes — for the library API (resolveFromAxes).
// Positive value = alarmed / euphoric / wired / suspicious pole.
// Each entry is [ψ_index, weight] — positive-pole weights only.
export const EXPR_AXES = {
  // Alarm (+): ψ8 shocked + ψ6- surprise + ψ2 open mouth
  alarm:     [[8, 2.0], [6, -1.5], [2, 1.0]] as const,
  // Mood (+): smile (ψ9+ψ11+ψ12) + frown-smile (ψ0) + happy eyes (ψ7)
  mood:      [[0, 0.75], [9, 2.5], [11, 2.5], [12, 2.5], [1, 1.25], [7, 1.9]] as const,
  // Fatigue (+): frown (ψ5) + engagement (ψ4) + curiosity (ψ3)
  fatigue:   [[5, 1.2], [4, 0.8], [3, 0.6]] as const,
  // Vigilance (+): curiosity (ψ3) + engagement (ψ4)
  vigilance: [[3, 0.8], [4, 0.5]] as const,
} as const;

// Shape axes — each entry is [β_index, weight]
export const SHAPE_AXES = {
  // Dominance (Soyboi↔Chad): jaw width, chin, thickness, brow, bone detail
  dominance: [[3, 3.75], [2, 2.5], [0, 2.5], [4, 1.9], [7, 1.25], [18, 3.75], [23, 3.75], [13, 3.1], [48, 3.1], [16, 1.9], [19, -1.9]] as const,
  // Feast/Famine (full↔gaunt): portly, thicc, tall, skull, body mass
  feastFamine:   [[5, 2.5], [6, 2.0], [1, 2.0], [9, 1.5], [8, 1.2], [15, 2.0], [32, 2.0], [49, 2.0]] as const,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['alarm', 'mood', 'fatigue', 'vigilance'];
export const SHAPE_AXIS_NAMES: ShapeAxis[] = ['dominance', 'feastFamine'];

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
