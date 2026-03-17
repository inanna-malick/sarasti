import type { FlameModel, FlameBuffers } from './types';

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

  // Apply expression deformations
  for (let c = 0; c < n_expr; c++) {
    const p = psi[c];
    if (p === 0) continue;
    const offset = c * n_vertices * 3;
    for (let i = 0; i < n_vertices * 3; i++) {
      vertices[i] += exprdirs[offset + i] * p;
    }
  }

  // Compute normals
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

    // Cross product (face normal weighted by 2 * area)
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    // Accumulate to vertex normals
    normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
    normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
    normals[i3 * 3] += nx; normals[i3 * 3 + 1] += ny; normals[i3 * 3 + 2] += nz;
  }

  // Normalize
  for (let i = 0; i < n_vertices; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0) {
      normals[i * 3] = nx / length;
      normals[i * 3 + 1] = ny / length;
      normals[i * 3 + 2] = nz / length;
    }
  }

  return { vertices, normals };
}
