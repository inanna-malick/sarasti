/**
 * Semantic direction lookup tables for FLAME parameter space.
 *
 * Four axes: age, build (shape space), valence, aperture (expression space).
 * Each is a 20-point lookup table sampling [-3σ, +3σ] of a CLIP-trained
 * semantic direction. Runtime interpolates between sample points — the
 * nonlinearity is captured in the table, runtime is just lerp.
 *
 * Plus an identity basis: 10 vectors in the nullspace of shape directions,
 * used to give each ticker a unique face without affecting semantic axes.
 */

import { N_SHAPE, N_EXPR } from '../constants';

// ─── Types ────────────────────────────────────────────

export interface DirectionPoint {
  /** Semantic score, range [-3, 3] */
  t: number;
  /** Full FLAME parameter vector, length = dims */
  params: number[];
}

export interface DirectionTable {
  axis: string;
  space: 'shape' | 'expression';
  dims: number;
  /** Sorted by t ascending, length 20 */
  points: DirectionPoint[];
}

export interface IdentityBasis {
  dims: number;
  n_basis: number;
  /** n_basis × dims, orthogonal to age + build directions */
  vectors: number[][];
}

// ─── Loader ───────────────────────────────────────────

let _tables: Map<string, DirectionTable> | null = null;
let _identity: IdentityBasis | null = null;

export async function loadDirectionTables(
  basePath = '/data/directions',
): Promise<void> {
  const axes = ['age', 'build', 'valence', 'aperture'];
  _tables = new Map();
  const results = await Promise.all(
    axes.map(async (axis) => {
      const resp = await fetch(`${basePath}/${axis}.json`);
      return [axis, (await resp.json()) as DirectionTable] as const;
    }),
  );
  for (const [axis, table] of results) {
    _tables.set(axis, table);
  }

  const identityResp = await fetch(`${basePath}/identity_basis.json`);
  _identity = (await identityResp.json()) as IdentityBasis;
}

export function getTable(axis: string): DirectionTable | undefined {
  return _tables?.get(axis);
}

export function getIdentityBasis(): IdentityBasis | null {
  return _identity;
}

// ─── LUT Interpolation ───────────────────────────────

/**
 * Interpolate a direction lookup table at a given semantic score.
 * Uses binary search to find bracketing points, then linear lerp.
 *
 * @param table - Direction table with sorted points
 * @param t - Semantic score (clamped to table range)
 * @returns Float32Array of FLAME parameters (length = table.dims)
 */
export function interpolateLUT(table: DirectionTable, t: number): Float32Array {
  const { points, dims } = table;
  const n = points.length;
  const out = new Float32Array(dims);

  if (n === 0) return out;

  // Clamp to table range
  const tMin = points[0].t;
  const tMax = points[n - 1].t;
  const tc = Math.max(tMin, Math.min(tMax, t));

  // Edge cases: at or beyond bounds
  if (tc <= tMin) {
    for (let i = 0; i < dims; i++) out[i] = points[0].params[i];
    return out;
  }
  if (tc >= tMax) {
    for (let i = 0; i < dims; i++) out[i] = points[n - 1].params[i];
    return out;
  }

  // Binary search for bracketing interval
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t <= tc) lo = mid;
    else hi = mid;
  }

  // Lerp between points[lo] and points[hi]
  const tLo = points[lo].t;
  const tHi = points[hi].t;
  const alpha = (tc - tLo) / (tHi - tLo);
  const pLo = points[lo].params;
  const pHi = points[hi].params;

  for (let i = 0; i < dims; i++) {
    out[i] = pLo[i] * (1 - alpha) + pHi[i] * alpha;
  }

  return out;
}

// ─── Identity Offset ─────────────────────────────────

/**
 * Compute a deterministic identity offset for a ticker.
 * The offset is a linear combination of nullspace basis vectors,
 * with coefficients derived from hashing the ticker ID.
 *
 * By construction, this offset is orthogonal to the age and build
 * directions — it CANNOT change perceived age or build.
 *
 * @param basis - Identity basis (10 × 100 nullspace vectors)
 * @param tickerId - Ticker identifier string
 * @returns Float32Array shape offset (length = basis.dims)
 */
export function computeIdentityOffset(
  basis: IdentityBasis,
  tickerId: string,
): Float32Array {
  const out = new Float32Array(basis.dims);

  // Generate deterministic pseudo-random scalars from ticker ID hash
  const scalars = hashToScalars(tickerId, basis.n_basis);

  for (let b = 0; b < basis.n_basis; b++) {
    const vec = basis.vectors[b];
    const s = scalars[b];
    for (let i = 0; i < basis.dims; i++) {
      out[i] += vec[i] * s;
    }
  }

  return out;
}

/**
 * Simple string hash → array of deterministic pseudo-random floats in [-0.5, 0.5].
 * Uses FNV-1a variant seeded per-index for independence.
 */
function hashToScalars(str: string, count: number): number[] {
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

// ─── Resolve ──────────────────────────────────────────

export interface DirectionScores {
  age: number;
  build: number;
  valence: number;
  aperture: number;
}

/**
 * Resolve semantic direction scores to FLAME parameters.
 * This is the high-level API: given four axis scores and a ticker ID,
 * produce shape (β) and expression (ψ) parameter vectors.
 *
 * Cost: 4 table lookups + 1 identity hash + 5 vector additions. Microseconds.
 */
export function resolveDirections(
  scores: DirectionScores,
  tickerId: string,
): { shape: Float32Array; expression: Float32Array } {
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);

  if (!_tables || !_identity) {
    return { shape, expression };
  }

  // Shape axes
  const ageTable = _tables.get('age');
  const buildTable = _tables.get('build');
  if (ageTable) addVec(shape, interpolateLUT(ageTable, scores.age));
  if (buildTable) addVec(shape, interpolateLUT(buildTable, scores.build));

  // Identity offset (orthogonal to age + build by construction)
  addVec(shape, computeIdentityOffset(_identity, tickerId));

  // Expression axes
  const valenceTable = _tables.get('valence');
  const apertureTable = _tables.get('aperture');
  if (valenceTable) addVec(expression, interpolateLUT(valenceTable, scores.valence));
  if (apertureTable) addVec(expression, interpolateLUT(apertureTable, scores.aperture));

  return { shape, expression };
}

// ─── Vector Utils ─────────────────────────────────────

function addVec(target: Float32Array, source: Float32Array): void {
  const len = Math.min(target.length, source.length);
  for (let i = 0; i < len; i++) {
    target[i] += source[i];
  }
}

// Exported for testing
export { hashToScalars as _hashToScalars };
