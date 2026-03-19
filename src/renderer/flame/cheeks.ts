/**
 * Flush region vertex identification + weight maps.
 *
 * Computes per-vertex weight maps from the FLAME template mesh using
 * spatial proximity to anatomical center points with Gaussian falloff.
 * Weight maps are computed once at mesh construction and reused every frame.
 *
 * Two regions: cheeks (primary flush zone) and lips (secondary, for frostbite/blush).
 */

/** Approximate cheek center positions in FLAME template space
 * [w15: lowered Y from -0.01 to -0.025 — flush was bleeding into periorbital area ("pinkeye")] */
const LEFT_CHEEK_CENTER = { x: -0.05, y: -0.025, z: 0.06 };
const RIGHT_CHEEK_CENTER = { x: 0.05, y: -0.025, z: 0.06 };

/** Approximate lip center in FLAME template space (midline, between upper and lower lip) */
const LIP_CENTER = { x: 0.0, y: -0.04, z: 0.07 };

/** Default Gaussian falloff radii */
const DEFAULT_CHEEK_RADIUS = 0.03;
const DEFAULT_LIP_RADIUS = 0.02;

/** Minimum radius to avoid division by zero */
const MIN_RADIUS = 1e-6;

/** Skip vertices with weight below this threshold */
export const CHEEK_WEIGHT_THRESHOLD = 0.001;

/** Sparse flush vertex entry: index + precomputed weight */
export interface CheekVertex {
  index: number;
  weight: number;
}

/**
 * Identifies cheek-region vertices from the FLAME template mesh and returns
 * a sparse list of cheek vertices with their Gaussian-falloff weights.
 */
export function identifyCheekRegion(
  template: Float32Array,
  nVertices: number,
  radius: number = DEFAULT_CHEEK_RADIUS,
): CheekVertex[] {
  const safeRadius = Math.max(Math.abs(radius), MIN_RADIUS);
  const invTwoSigmaSq = 1 / (2 * safeRadius * safeRadius);
  const result: CheekVertex[] = [];

  for (let v = 0; v < nVertices; v++) {
    const x = template[v * 3];
    const y = template[v * 3 + 1];
    const z = template[v * 3 + 2];

    // Distance to left cheek center
    const dxL = x - LEFT_CHEEK_CENTER.x;
    const dyL = y - LEFT_CHEEK_CENTER.y;
    const dzL = z - LEFT_CHEEK_CENTER.z;
    const distSqL = dxL * dxL + dyL * dyL + dzL * dzL;

    // Distance to right cheek center
    const dxR = x - RIGHT_CHEEK_CENTER.x;
    const dyR = y - RIGHT_CHEEK_CENTER.y;
    const dzR = z - RIGHT_CHEEK_CENTER.z;
    const distSqR = dxR * dxR + dyR * dyR + dzR * dzR;

    // Take the closer cheek center
    const distSq = Math.min(distSqL, distSqR);

    // Gaussian falloff
    const w = Math.exp(-distSq * invTwoSigmaSq);

    if (w >= CHEEK_WEIGHT_THRESHOLD) {
      result.push({ index: v, weight: w });
    }
  }

  return result;
}

/**
 * Identifies lip-region vertices using Gaussian falloff from lip center.
 * Returned weights are scaled to peak at ~0.7 (lips are secondary to cheeks).
 */
export function identifyLipRegion(
  template: Float32Array,
  nVertices: number,
  radius: number = DEFAULT_LIP_RADIUS,
): CheekVertex[] {
  const safeRadius = Math.max(Math.abs(radius), MIN_RADIUS);
  const invTwoSigmaSq = 1 / (2 * safeRadius * safeRadius);
  const result: CheekVertex[] = [];

  for (let v = 0; v < nVertices; v++) {
    const x = template[v * 3];
    const y = template[v * 3 + 1];
    const z = template[v * 3 + 2];

    const dx = x - LIP_CENTER.x;
    const dy = y - LIP_CENTER.y;
    const dz = z - LIP_CENTER.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    const w = 0.7 * Math.exp(-distSq * invTwoSigmaSq);

    if (w >= CHEEK_WEIGHT_THRESHOLD) {
      result.push({ index: v, weight: w });
    }
  }

  return result;
}
