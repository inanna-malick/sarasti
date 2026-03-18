import type { FlameModel, FlameBuffers } from './types';

/** Scan a Float32Array for NaN/Infinity. Returns index of first bad value, or -1. */
function findBadValue(arr: Float32Array): number {
  for (let i = 0; i < arr.length; i++) {
    if (!isFinite(arr[i])) return i;
  }
  return -1;
}

/** Assert no NaN/Infinity in array, throw with context if found. */
function assertFinite(arr: Float32Array, label: string): void {
  const idx = findBadValue(arr);
  if (idx !== -1) {
    throw new Error(
      `NaN/Infinity in ${label} at index ${idx} (value=${arr[idx]}, length=${arr.length})`
    );
  }
}

/**
 * Compute per-vertex normals by accumulating face normals.
 */
export function computeNormals(
  vertices: Float32Array,
  faces: Uint32Array,
  n_vertices: number,
  n_faces: number,
): Float32Array {
  const normals = new Float32Array(n_vertices * 3);
  for (let f = 0; f < n_faces; f++) {
    const i1 = faces[f * 3];
    const i2 = faces[f * 3 + 1];
    const i3 = faces[f * 3 + 2];

    const v1x = vertices[i1 * 3], v1y = vertices[i1 * 3 + 1], v1z = vertices[i1 * 3 + 2];
    const v2x = vertices[i2 * 3], v2y = vertices[i2 * 3 + 1], v2z = vertices[i2 * 3 + 2];
    const v3x = vertices[i3 * 3], v3y = vertices[i3 * 3 + 1], v3z = vertices[i3 * 3 + 2];

    const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z;
    const e2x = v3x - v1x, e2y = v3y - v1y, e2z = v3z - v1z;

    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
    normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
    normals[i3 * 3] += nx; normals[i3 * 3 + 1] += ny; normals[i3 * 3 + 2] += nz;
  }
  for (let i = 0; i < n_vertices; i++) {
    const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      normals[i * 3] = nx / len;
      normals[i * 3 + 1] = ny / len;
      normals[i * 3 + 2] = nz / len;
    }
  }
  return normals;
}

/**
 * Deform FLAME mesh: output = template + shapedirs @ beta + exprdirs @ psi.
 * Computes vertex normals after deformation.
 */
export function deform(
  model: FlameModel,
  beta: Float32Array,
  psi: Float32Array,
): FlameBuffers {
  const { n_vertices, n_faces, n_shape, n_expr, template, shapedirs, exprdirs, faces } = model;

  assertFinite(beta, 'shape params (beta)');
  assertFinite(psi, 'expression params (psi)');

  const vertices = new Float32Array(template);

  // Apply shape deformations
  for (let c = 0; c < n_shape; c++) {
    const b = beta[c];
    if (b === 0) continue;
    const offset = c * n_vertices * 3;
    for (let i = 0; i < n_vertices * 3; i++) {
      vertices[i] += shapedirs[offset + i] * b;
    }
  }

  const shapeIdx = findBadValue(vertices);
  if (shapeIdx !== -1) {
    // Find which shape component introduced the NaN
    const verts2 = new Float32Array(template);
    for (let c = 0; c < n_shape; c++) {
      const b = beta[c];
      if (b === 0) continue;
      const offset = c * n_vertices * 3;
      for (let i = 0; i < n_vertices * 3; i++) {
        verts2[i] += shapedirs[offset + i] * b;
      }
      if (!isFinite(verts2[shapeIdx])) {
        throw new Error(
          `NaN after shape component ${c} (beta[${c}]=${b}, shapedirs offset=${offset + shapeIdx}, shapedir val=${shapedirs[offset + shapeIdx]})`
        );
      }
    }
    throw new Error(`NaN in vertices after shape deform at index ${shapeIdx}`);
  }

  // Apply expression deformations
  for (let c = 0; c < n_expr; c++) {
    const p = psi[c];
    if (p === 0) continue;
    const offset = c * n_vertices * 3;
    for (let i = 0; i < n_vertices * 3; i++) {
      vertices[i] += exprdirs[offset + i] * p;
    }
  }

  const exprIdx = findBadValue(vertices);
  if (exprIdx !== -1) {
    throw new Error(
      `NaN in vertices after expression deform at index ${exprIdx}. ` +
      `Check expression params: first 10 psi = [${Array.from(psi.slice(0, 10)).map(v => v.toFixed(3))}]`
    );
  }

  const normals = computeNormals(vertices, faces, n_vertices, n_faces);
  return { vertices, normals };
}
