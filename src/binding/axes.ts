/**
 * Shared axis definitions for FLAME parameter mapping.
 * Single source of truth — both explorer and binding import from here.
 *
 * Expression axes: tension (tense↔placid), mood (euphoric↔grief) — Russell circumplex.
 * Shape axes: ogre (Ogre↔Elf), predator (Predator↔Herbivore) — additive, EMA-smoothed.
 *
 * FLAME ψ components — actual visual reads (from explorer testing):
 *   ψ0: pursed↔frown-smile    ψ1: frown↔lopsided smile (ANTI)  ψ2: —↔open angry mouth
 *   ψ3: disgust↔open curiosity ψ4: boredom↔engagement           ψ5: uninterested↔frown
 *   ψ6: surprise↔angry         ψ7: disappointed↔happy            ψ8: flat/bored↔shocked
 *   ψ9: frown↔smile            ψ11+ψ12: bilateral smile (conjugate pair)
 *
 * FLAME β components — actual visual reads:
 *   β0: encephalic elfin↔ogre thick     β1: squat↔tall         β2: compressed↔elongated
 *   β5: elfin↔portly                     β6: pencilneck↔thicc   β7: observing↔intent
 *   β8: brawler closely-spaced↔cowlike    β9: small cranium↔big skull
 *   β16: soft jaw↔defined jaw             β19: jutting chin(-5)↔recessed(+5)
 */

// Expression axes — for the library API (resolveFromAxes).
// Positive value = tense pole / euphoric pole. Negative = placid / grief.
// Each entry is [ψ_index, weight].
export const EXPR_AXES = {
  // Tension (+): wide eyes + open angry mouth + sneer + shocked + adrenaline smile base
  tension: [[7, -2.0], [2, 2.0], [3, 1.5], [5, 1.5], [8, 1.5], [11, 0.6], [12, 0.6]] as const,
  // Mood (+): smile (ψ0+ψ9) + knowing smirk (ψ11+ψ12+ψ1) + happy eyes (ψ7) + warm
  mood:    [[0, 1.5], [9, 2.0], [11, 2.0], [12, 2.0], [1, 1.0], [7, 1.5]] as const,
} as const;

// Shape axes — each entry is [β_index, weight]
export const SHAPE_AXES = {
  // Dominance (Soyboi↔Chad): jaw width, chin, thickness, brow, bone detail + explorer jaw/chin
  dominance: [[3, 3.0], [2, 2.0], [0, 2.0], [4, 1.5], [7, 1.0], [18, 3.0], [23, 3.0], [16, 1.5], [19, -1.5]] as const,
} as const;

export type ExprAxis = keyof typeof EXPR_AXES;
export type ShapeAxis = keyof typeof SHAPE_AXES;
export type AxisMapping = readonly (readonly [number, number])[];

export const EXPR_AXIS_NAMES: ExprAxis[] = ['tension', 'mood'];
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
