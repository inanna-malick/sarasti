import type { AgeMapping, AgeShapeResult } from './types';
import { SHAPE_ALLOCATION } from './types';

/**
 * Age mapping — empirically tuned from FLAME 2023 Open component sweep.
 *
 * β0: face width (young = narrower, old = wider)
 * β1: face height (young = rounder/shorter, old = elongated)
 * β2: jaw shape (young = soft pointed chin, old = square heavy jaw)
 */
export const DEFAULT_AGE_MAPPING: AgeMapping = {
  indices: SHAPE_ALLOCATION.age_indices,
  young_values: [-1.5, -1.0, -1.5],  // narrow, round, soft chin
  old_values:   [1.5,   1.0,  1.5],  // wide, elongated, square jaw
};

/**
 * Maps TickerConfig.age (20-60) → shape component entries.
 * Linear interpolation: age 20 → young_values, age 60 → old_values.
 */
export function mapAgeToShape(
  age: number,
  mapping: AgeMapping = DEFAULT_AGE_MAPPING,
): AgeShapeResult {
  // Normalize age to [0, 1]. Default to 0.5 (middle age) if age is NaN.
  let t = (age - 20) / 40;
  if (Number.isNaN(t)) t = 0.5;
  t = Math.max(0, Math.min(1, t));

  const entries: [number, number][] = mapping.indices.map((idx, i) => {
    const value = mapping.young_values[i] + t * (mapping.old_values[i] - mapping.young_values[i]);
    return [idx, value];
  });

  return { entries };
}

/**
 * Validates that age mapping indices don't overlap with family indices.
 * Note: overlap with class_indices is ALLOWED — age sets base values
 * and class profiles add on top (e.g. β0 = head width used by both).
 */
export function validateAgeMapping(mapping: AgeMapping): boolean {
  const familyIndices = new Set(SHAPE_ALLOCATION.family_indices);
  return !mapping.indices.some((idx) => familyIndices.has(idx));
}

/**
 * Returns a human-readable description for debugging/tooltips.
 */
export function getAgeDescription(age: number): string {
  if (age < 30) return `young (${age})`;
  if (age < 45) return `middle-aged (${age})`;
  if (age < 55) return `adult (${age})`;
  return `elder (${age})`;
}
