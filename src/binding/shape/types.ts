import type { TickerConfig, AssetClass } from '../../types';
import type { ShapeAllocation } from '../types';

/**
 * Shape param allocation table.
 * Documents which β indices each mapper controls.
 *
 * The FLAME model has 100 shape components (β₀₋₉₉).
 * We use indices 0-9 for our binding; the rest stay at zero.
 *
 * Empirical mapping (FLAME 2023 Open component sweep):
 *   β0: head width (narrow vs wide)
 *   β1: head height (short vs elongated)
 *   β2: jaw shape (pointed vs square)
 *   β3: nose size/shape
 *   β4: cheekbone prominence
 *   β5: eye shape/distance
 *   β6: chin shape
 *   β7: brow ridge / socket depth
 *   β8: lip fullness
 *   β9: neck/head proportions
 *
 * Allocation:
 *   β₀₋₂:  age (width, height, jaw — strongest axes)
 *   β₀,₃,₄: class morphology (width + nose + cheekbones)
 *   β₅₋₈:  family resemblance (eyes, chin, brow, lips)
 *   β₉₋₉₉: reserved (zero)
 *
 * Note: β0 appears in both age and class allocations. The age mapper
 * sets it first, then class profile values are ADDED on top.
 */
export const SHAPE_ALLOCATION: ShapeAllocation = {
  age_indices: [0, 1, 2],
  class_indices: [0, 3, 4],
  family_indices: [5, 6, 7, 8],

  // Tier 2 (β₁₁₋₂₀)
  volume_indices: [11, 12, 13],
  hist_vol_indices: [14, 15, 16],
  corr_brent_indices: [17, 18, 19],

  // Tier 3 (β₂₁₋₅₀)
  corr_spy_indices: [21, 22, 23, 24, 25],
  market_cap_indices: [26, 27, 28, 29, 30],
  spread_indices: [31, 32, 33, 34, 35],
  skewness_indices: [36, 37, 38, 39, 40],

  // Sarasti (β₅₁₋₁₀₀)
  residual_indices: Array.from({ length: 50 }, (_, i) => 50 + i),
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
