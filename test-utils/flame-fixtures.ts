/**
 * Synthetic FLAME model fixtures for testing.
 *
 * Uses a tiny 4-vertex, 4-face tetrahedron as the "face mesh."
 * Shape/expression basis vectors are simple axis-aligned perturbations
 * so deformation results are analytically predictable.
 *
 * Real FLAME: ~5023 vertices, ~9976 faces, 300 shape, 100 expr components.
 * We truncate to N_SHAPE=100, N_EXPR=100 per project convention.
 */

import { N_SHAPE, N_EXPR } from '../src/constants';
import type { FlameModel, FlameMeta } from '../src/renderer/flame/types';

// ─── Dimensions ─────────────────────────────────────

export const MOCK_N_VERTICES = 4;
export const MOCK_N_FACES = 4;
export const MOCK_N_ALBEDO = 10;

// ─── Template: regular tetrahedron centered at origin ──

export function makeMockTemplate(): Float32Array {
  // 4 vertices × 3 coords = 12 floats
  return new Float32Array([
    0,    0.943,  0,       // top
   -0.816, -0.333, -0.471, // base left
    0.816, -0.333, -0.471, // base right
    0,    -0.333,  0.943,  // base front
  ]);
}

// ─── Faces: 4 triangles ────────────────────────────

export function makeMockFaces(): Uint32Array {
  return new Uint32Array([
    0, 1, 2,  // front-left-right
    0, 2, 3,  // front-right-front
    0, 3, 1,  // front-front-left
    1, 3, 2,  // base
  ]);
}

// ─── Shape basis: each component moves one vertex along one axis ──

export function makeMockShapedirs(): Float32Array {
  // [N_VERTICES * 3 * N_SHAPE] — column-major: shapedirs[v*3+d][c]
  // For testing: component c moves vertex (c % 4) along axis (c % 3) by 1.0
  // All other entries zero. This makes deformation analytically predictable.
  const data = new Float32Array(MOCK_N_VERTICES * 3 * N_SHAPE);
  for (let c = 0; c < N_SHAPE; c++) {
    const vertex = c % MOCK_N_VERTICES;
    const axis = c % 3;
    const idx = c * MOCK_N_VERTICES * 3 + vertex * 3 + axis;
    data[idx] = 1.0;
  }
  return data;
}

// ─── Expression basis: same pattern, different assignment ──

export function makeMockExprdirs(): Float32Array {
  const data = new Float32Array(MOCK_N_VERTICES * 3 * N_EXPR);
  for (let c = 0; c < N_EXPR; c++) {
    // Offset by 1 to avoid overlapping with shape basis pattern
    const vertex = (c + 1) % MOCK_N_VERTICES;
    const axis = (c + 1) % 3;
    const idx = c * MOCK_N_VERTICES * 3 + vertex * 3 + axis;
    data[idx] = 1.0;
  }
  return data;
}

// ─── Albedo basis and mean ──────────────────────────

export function makeMockAlbedoMean(): Float32Array {
  return new Float32Array(MOCK_N_VERTICES * 3).fill(0.5);
}

export function makeMockAlbedoBasis(): Float32Array {
  return new Float32Array(MOCK_N_VERTICES * 3 * MOCK_N_ALBEDO).fill(0.01);
}

// ─── Complete mock model ────────────────────────────

export function makeMockFlameModel(): FlameModel {
  return {
    template: makeMockTemplate(),
    faces: makeMockFaces(),
    shapedirs: makeMockShapedirs(),
    exprdirs: makeMockExprdirs(),
    albedoMean: makeMockAlbedoMean(),
    albedoBasis: makeMockAlbedoBasis(),
    n_vertices: MOCK_N_VERTICES,
    n_faces: MOCK_N_FACES,
    n_shape: N_SHAPE,
    n_expr: N_EXPR,
    n_albedo_components: MOCK_N_ALBEDO,
  };
}

// ─── Mock metadata (matches what extract_flame.py produces) ──

export function makeMockFlameMeta(): FlameMeta {
  return {
    n_vertices: MOCK_N_VERTICES,
    n_faces: MOCK_N_FACES,
    n_shape: N_SHAPE,
    n_expr: N_EXPR,
    n_albedo_components: MOCK_N_ALBEDO,
    files: {
      template: 'flame_template.bin',
      faces: 'flame_faces.bin',
      shapedirs: 'flame_shapedirs.bin',
      exprdirs: 'flame_exprdirs.bin',
      albedo_mean: 'flame_albedo_mean.bin',
      albedo_basis: 'flame_albedo_basis.bin',
    },
  };
}

// ─── Binary file generation (for loader tests) ─────

export function mockModelToFiles(): Map<string, ArrayBuffer> {
  const model = makeMockFlameModel();
  const meta = makeMockFlameMeta();
  const files = new Map<string, ArrayBuffer>();
  files.set('flame_template.bin', model.template.buffer as ArrayBuffer);
  files.set('flame_faces.bin', model.faces.buffer as ArrayBuffer);
  files.set('flame_shapedirs.bin', model.shapedirs.buffer as ArrayBuffer);
  files.set('flame_exprdirs.bin', model.exprdirs.buffer as ArrayBuffer);
  files.set('flame_albedo_mean.bin', model.albedoMean.buffer as ArrayBuffer);
  files.set('flame_albedo_basis.bin', model.albedoBasis.buffer as ArrayBuffer);
  files.set('flame_meta.json', new TextEncoder().encode(JSON.stringify(meta)).buffer as ArrayBuffer);
  return files;
}
