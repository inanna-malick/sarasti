/**
 * Deterministic identity hash for per-ticker noise.
 * Uses FNV-1a variant seeded per-index for independence.
 */
export function hashToScalars(str: string, count: number): number[] {
  const scalars: number[] = [];
  for (let idx = 0; idx < count; idx++) {
    let h = 0x811c9dc5 ^ (idx * 0x01000193); // FNV offset basis XOR seed
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    // Map to [-0.5, 0.5]
    scalars.push(((h >>> 0) / 0xffffffff) - 0.5);
  }
  return scalars;
}
