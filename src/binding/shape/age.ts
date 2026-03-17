/**
 * Maps TickerConfig.age (20-60) to FLAME shape components β₁₋₃.
 * Linear interpolation: age 20 → -2σ, age 60 → +2σ.
 */
export function mapAgeToShape(_age: number): Float32Array {
  throw new Error('Not implemented — see binding/shape/age-mapper worktree');
}
