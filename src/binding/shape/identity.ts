import type { AssetClass } from '../../types';
import type { IdentityShapeResult } from './types';
import type { BindingConfig } from '../types';
import { DEFAULT_BINDING_CONFIG } from '../config';

/**
 * Maps AssetClass → class shape entries, family → family shape entries.
 * Uses the profiles from BindingConfig.
 *
 * Each class gets a fixed morphology profile.
 * Each family gets a small perturbation from the class profile.
 * Within a family, all members are identical (age is the only difference).
 */
export function mapIdentityToShape(
  assetClass: AssetClass,
  family: string,
  config: BindingConfig = DEFAULT_BINDING_CONFIG,
): IdentityShapeResult {
  const class_entries = config.class_profiles[assetClass] ?? [];
  const family_entries = config.family_profiles[family] ?? [];

  return { class_entries, family_entries };
}
