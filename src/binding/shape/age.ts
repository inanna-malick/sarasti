import type { AgeMapping, AgeShapeResult } from './types';
import { SHAPE_ALLOCATION } from './types';

/**
 * Default age mapping: linear interpolation from young→old values.
 * PLACEHOLDER values — the Dev will determine real FLAME components
 * that affect perceived age by empirical exploration.
 */
export const DEFAULT_AGE_MAPPING: AgeMapping = {
  indices: SHAPE_ALLOCATION.age_indices,
  young_values: [-2.0, -1.0, -0.5],
  old_values:   [2.0,   1.0,  0.5],
};

/**
 * Maps TickerConfig.age (20-60) → shape component entries.
 * Linear interpolation: age 20 → young_values, age 60 → old_values.
 */
export function mapAgeToShape(
  age: number,
  mapping: AgeMapping = DEFAULT_AGE_MAPPING,
): AgeShapeResult {
  // Normalize age to [0, 1]
  const t = Math.max(0, Math.min(1, (age - 20) / 40));

  const entries: [number, number][] = mapping.indices.map((idx, i) => {
    const value = mapping.young_values[i] + t * (mapping.old_values[i] - mapping.young_values[i]);
    return [idx, value];
  });

  return { entries };
}
