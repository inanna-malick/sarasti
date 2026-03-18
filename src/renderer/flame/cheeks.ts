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

/** Skip vertices with weight below this threshold */
const WEIGHT_THRESHOLD = 0.001;

/**
 * Identifies cheek-region vertices from the FLAME template mesh and returns
 * a per-vertex weight map with Gaussian falloff from cheek centers.
 *
 * @param template - FLAME template vertex positions (Float32Array, n_vertices * 3)
 * @param nVertices - number of vertices
 * @param radius - Gaussian falloff radius (default 0.03)
 * @returns Float32Array(nVertices) where 0.0 = not cheek, 1.0 = cheek center
 */
export function identifyCheekRegion(
  template: Float32Array,
  nVertices: number,
  radius: number = DEFAULT_CHEEK_RADIUS,
): Float32Array {
  const weights = new Float32Array(nVertices);
  const invTwoSigmaSq = 1 / (2 * radius * radius);

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

    // Clamp negligible weights to zero
    weights[v] = w < WEIGHT_THRESHOLD ? 0 : w;
  }

  return weights;
}
