/**
 * Cheek vertex identification + weight map for localized flush effect.
 *
 * Computes a per-vertex weight map from the FLAME template mesh using
 * spatial proximity to cheek center points with Gaussian falloff.
 * Weight map is computed once at mesh construction and reused every frame.
 */

/** Approximate cheek center positions in FLAME template space */
const LEFT_CHEEK_CENTER = { x: -0.05, y: -0.01, z: 0.06 };
const RIGHT_CHEEK_CENTER = { x: 0.05, y: -0.01, z: 0.06 };

/** Default Gaussian falloff radius */
const DEFAULT_CHEEK_RADIUS = 0.03;

/** Minimum radius to avoid division by zero */
const MIN_RADIUS = 1e-6;

/** Skip vertices with weight below this threshold */
export const CHEEK_WEIGHT_THRESHOLD = 0.001;

/** Sparse cheek vertex entry: index + precomputed weight */
export interface CheekVertex {
  index: number;
  weight: number;
}

/**
 * Identifies cheek-region vertices from the FLAME template mesh and returns
 * a sparse list of cheek vertices with their Gaussian-falloff weights.
 *
 * @param template - FLAME template vertex positions (Float32Array, n_vertices * 3)
 * @param nVertices - number of vertices
 * @param radius - Gaussian falloff radius (default 0.03)
 * @returns Sparse array of { index, weight } for vertices above threshold
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
