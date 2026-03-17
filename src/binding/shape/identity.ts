import type { AssetClass } from '../../types';

/**
 * Maps AssetClass → β₄₋₆ (gross morphology) and family → β₇₋₁₀ (family resemblance).
 */
export function mapIdentityToShape(_assetClass: AssetClass, _family: string): Float32Array {
  throw new Error('Not implemented — see binding/shape/identity-mapper worktree');
}
