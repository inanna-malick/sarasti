/**
 * Maps deviation → FLAME expression intensity.
 * Negative deviation → distress, positive → shock/manic, near-zero → neutral.
 */
export function mapCrisisToExpression(_deviation: number): Float32Array {
  throw new Error('Not implemented — see binding/expression/crisis-mapper worktree');
}
