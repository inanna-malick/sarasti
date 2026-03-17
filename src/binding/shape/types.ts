import type { TickerConfig, AssetClass } from '../../types';
import type { ShapeAllocation } from '../types';

/**
 * Shape param allocation table.
 * Documents which β indices each mapper controls.
 *
 * The FLAME model has 100 shape components (β₀₋₉₉).
 * We use indices 0-9 for our binding; the rest stay at zero.
 *
 *   β₀₋₂:  age (age-mapper)
 *   β₃₋₅:  asset class gross morphology (identity-mapper)
 *   β₆₋₉:  family resemblance (identity-mapper)
 *   β₁₀₋₉₉: reserved (zero)
 *
 * IMPORTANT: These are PLACEHOLDER indices. The age-mapper Dev
 * must empirically determine which FLAME shape components most
 * affect perceived age. The identity-mapper Dev must determine
 * which components produce the desired class/family morphology.
 * When they discover the real mapping, they update the allocation
 * and the config together.
 */
export const SHAPE_ALLOCATION: ShapeAllocation = {
  age_indices: [0, 1, 2],
  class_indices: [3, 4, 5],
  family_indices: [6, 7, 8, 9],
};

/**
 * Age mapping parameters.
 * Maps age 20-60 to a position on each age shape component.
 */
export interface AgeMapping {
  /** Which β indices to set */
  indices: number[];
  /** Per-index: value at age=20 */
  young_values: number[];
  /** Per-index: value at age=60 */
  old_values: number[];
}

/**
 * Result of the age mapper: partial shape coefficients.
 */
export interface AgeShapeResult {
  /** [index, value] pairs to apply to the shape vector */
  entries: [number, number][];
}

/**
 * Result of the identity mapper: partial shape coefficients.
 */
export interface IdentityShapeResult {
  /** Class-level entries */
  class_entries: [number, number][];
  /** Family-level entries (perturbation from class) */
  family_entries: [number, number][];
}
