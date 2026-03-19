import { describe, it, expect } from 'vitest';
import type { FlameModel } from '../types';
import type { ExtendedFlameModel } from './types';
import { extendModelWithMouth } from './extend-model';

const N_JOINTS = 5;
const N_SHAPE = 2;
const N_EXPR = 2;
const N_POSE_FEATURES = (N_JOINTS - 1) * 9; // 36
const N_ALBEDO = 2;

/**
 * Build a minimal FlameModel with lip vertices that extractMouthMeasurements can find.
 * Vertices 0–4 are face vertices, 5–9 are lip boundary vertices (jaw weight in [0.3, 0.7]).
 */
function mockFlameModel(): FlameModel {
  const nVerts = 10;
  const nFaces = 6;

  // Template: place face vertices, lip vertices near mouth region
  const template = new Float32Array(nVerts * 3);
  // Non-lip vertices (scattered around face)
  template.set([0, 0.05, 0.05], 0 * 3);   // v0
  template.set([0.04, 0.02, 0.05], 1 * 3); // v1
  template.set([-0.04, 0.02, 0.05], 2 * 3); // v2
  template.set([0, 0.04, 0.03], 3 * 3);     // v3
  template.set([0, -0.08, 0.02], 4 * 3);    // v4 (chin)

  // Lip vertices: clustered around mouth, jaw weight in [0.3, 0.7]
  template.set([-0.015, -0.030, 0.065], 5 * 3); // upper lip left
  template.set([0.015, -0.030, 0.065], 6 * 3);  // upper lip right
  template.set([0.0, -0.028, 0.068], 7 * 3);    // upper lip center
  template.set([-0.012, -0.042, 0.063], 8 * 3);  // lower lip left
  template.set([0.012, -0.042, 0.063], 9 * 3);   // lower lip right

  // Faces (triangles using our vertices)
  const faces = new Uint32Array([
    0, 1, 2, // face triangle
    1, 3, 2, // face triangle
    5, 6, 7, // lip triangle
    8, 9, 5, // lip triangle
    5, 7, 8, // lip triangle
    7, 6, 9, // lip triangle
  ]);

  // Weights: [nVerts * nJoints]
  const weights = new Float32Array(nVerts * N_JOINTS);
  // Non-lip: head joint = 1.0
  for (let v = 0; v < 5; v++) {
    weights[v * N_JOINTS + 0] = 1.0; // head joint
  }
  // Lip vertices: jaw weight in [0.3, 0.7]
  weights[5 * N_JOINTS + 0] = 0.6; weights[5 * N_JOINTS + 2] = 0.4;  // upper-ish
  weights[6 * N_JOINTS + 0] = 0.6; weights[6 * N_JOINTS + 2] = 0.4;  // upper-ish
  weights[7 * N_JOINTS + 0] = 0.55; weights[7 * N_JOINTS + 2] = 0.45; // upper center
  weights[8 * N_JOINTS + 0] = 0.4; weights[8 * N_JOINTS + 2] = 0.6;  // lower-ish
  weights[9 * N_JOINTS + 0] = 0.4; weights[9 * N_JOINTS + 2] = 0.6;  // lower-ish

  // Shape/expression dirs: small non-zero values so we can verify copying
  const shapedirs = new Float32Array(N_SHAPE * nVerts * 3);
  for (let i = 0; i < shapedirs.length; i++) shapedirs[i] = (i % 7) * 0.001;

  const exprdirs = new Float32Array(N_EXPR * nVerts * 3);
  for (let i = 0; i < exprdirs.length; i++) exprdirs[i] = (i % 11) * 0.0005;

  const posedirs = new Float32Array(N_POSE_FEATURES * nVerts * 3);
  for (let i = 0; i < posedirs.length; i++) posedirs[i] = (i % 13) * 0.0001;

  // jRegressor: identity-ish (each joint gets weight from one vertex)
  const jRegressor = new Float32Array(N_JOINTS * nVerts);
  // Joint 0 (head) from vertex 0
  jRegressor[0 * nVerts + 0] = 1.0;
  // Joint 1 (neck) from vertex 3
  jRegressor[1 * nVerts + 3] = 1.0;
  // Joint 2 (jaw) from vertex 4
  jRegressor[2 * nVerts + 4] = 1.0;
  // Joint 3 (left eye) from vertex 1
  jRegressor[3 * nVerts + 1] = 1.0;
  // Joint 4 (right eye) from vertex 2
  jRegressor[4 * nVerts + 2] = 1.0;

  const albedoMean = new Float32Array(nVerts * 3);
  for (let i = 0; i < albedoMean.length; i++) albedoMean[i] = 0.5;

  const albedoBasis = new Float32Array(N_ALBEDO * nVerts * 3);
  for (let i = 0; i < albedoBasis.length; i++) albedoBasis[i] = (i % 3) * 0.01;

  const kintreeTable = [
    [-1, 0, 0, 0, 0], // parents
    [0, 1, 2, 3, 4],  // children
  ];

  return {
    template, faces, shapedirs, exprdirs,
    albedoMean, albedoBasis, weights, posedirs, jRegressor, kintreeTable,
    n_vertices: nVerts,
    n_faces: nFaces,
    n_shape: N_SHAPE,
    n_expr: N_EXPR,
    n_joints: N_JOINTS,
    n_pose_features: N_POSE_FEATURES,
    n_albedo_components: N_ALBEDO,
  };
}

/** Build a model with no lip vertices (jaw weight never in [0.3, 0.7]) */
function mockNoLipModel(): FlameModel {
  const m = mockFlameModel();
  // Zero out all jaw weights so no lip vertices are found
  for (let v = 0; v < m.n_vertices; v++) {
    m.weights[v * N_JOINTS + 2] = 0;
    m.weights[v * N_JOINTS + 0] = 1.0;
  }
  return m;
}

describe('extendModelWithMouth', () => {
  it('returns unchanged model when no lip vertices found', () => {
    const model = mockNoLipModel();
    const extended = extendModelWithMouth(model);
    expect(extended.mouthGroups).toBeNull();
    expect(extended.n_vertices).toBe(model.n_vertices);
    expect(extended.n_faces).toBe(model.n_faces);
    expect(extended.originalVertexCount).toBe(model.n_vertices);
  });

  it('extends vertex count', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    expect(extended.n_vertices).toBeGreaterThan(model.n_vertices);
    expect(extended.originalVertexCount).toBe(model.n_vertices);
  });

  it('extends face count', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    expect(extended.n_faces).toBeGreaterThan(model.n_faces);
  });

  it('preserves original template data', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    for (let i = 0; i < model.n_vertices * 3; i++) {
      expect(extended.template[i]).toBe(model.template[i]);
    }
  });

  it('preserves original face data', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    for (let i = 0; i < model.n_faces * 3; i++) {
      expect(extended.faces[i]).toBe(model.faces[i]);
    }
  });

  it('mouth face indices reference valid extended vertices', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const groups = extended.mouthGroups!;
    for (const group of [groups.teeth, groups.gums, groups.tongue, groups.cavity]) {
      for (let f = group.faceStart; f < group.faceStart + group.faceCount; f++) {
        const v0 = extended.faces[f * 3];
        const v1 = extended.faces[f * 3 + 1];
        const v2 = extended.faces[f * 3 + 2];
        expect(v0).toBeLessThan(extended.n_vertices);
        expect(v1).toBeLessThan(extended.n_vertices);
        expect(v2).toBeLessThan(extended.n_vertices);
      }
    }
  });

  it('sets head joint weight for upper teeth/gums vertices', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    // Upper teeth are the first mouth part, upper gums come third
    // Check that some mouth vertices have head weight = 1.0
    let foundHead = false;
    for (let v = nOrig; v < extended.n_vertices; v++) {
      if (extended.weights[v * N_JOINTS + 0] === 1.0) {
        // Head joint vertex should have 0 jaw weight
        expect(extended.weights[v * N_JOINTS + 2]).toBe(0);
        foundHead = true;
      }
    }
    expect(foundHead).toBe(true);
  });

  it('sets jaw joint weight for lower teeth/gums/tongue vertices', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    let foundJaw = false;
    for (let v = nOrig; v < extended.n_vertices; v++) {
      if (extended.weights[v * N_JOINTS + 2] === 1.0) {
        expect(extended.weights[v * N_JOINTS + 0]).toBe(0);
        foundJaw = true;
      }
    }
    expect(foundJaw).toBe(true);
  });

  it('cavity vertices have pure head or jaw weights', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const groups = extended.mouthGroups!;
    const nOrig = extended.originalVertexCount;
    // Cavity faces reference new mouth vertices with pure head or jaw weights
    const cavityVertexSet = new Set<number>();
    for (let f = groups.cavity.faceStart; f < groups.cavity.faceStart + groups.cavity.faceCount; f++) {
      cavityVertexSet.add(extended.faces[f * 3]);
      cavityVertexSet.add(extended.faces[f * 3 + 1]);
      cavityVertexSet.add(extended.faces[f * 3 + 2]);
    }
    for (const v of cavityVertexSet) {
      if (v < nOrig) continue; // skip original vertices referenced by strip faces
      const headW = extended.weights[v * N_JOINTS + 0];
      const jawW = extended.weights[v * N_JOINTS + 2];
      // Each mouth vertex is pure head or pure jaw
      expect(headW + jawW).toBeCloseTo(1.0, 5);
      expect(headW === 1.0 || jawW === 1.0).toBe(true);
    }
  });

  it('jRegressor has zeros for mouth vertices', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    for (let j = 0; j < N_JOINTS; j++) {
      for (let v = nOrig; v < extended.n_vertices; v++) {
        expect(extended.jRegressor[j * extended.n_vertices + v]).toBe(0);
      }
    }
  });

  it('shapedirs for mouth vertices are copied from nearest original vertex', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    // For each mouth vertex, its shapedirs should match some original vertex's shapedirs
    for (let c = 0; c < N_SHAPE; c++) {
      for (let m = 0; m < extended.n_vertices - nOrig; m++) {
        const vIdx = nOrig + m;
        const extIdx = c * extended.n_vertices * 3 + vIdx * 3;
        const val = extended.shapedirs[extIdx];
        // Find matching original vertex
        let found = false;
        for (let v = 0; v < nOrig; v++) {
          const origIdx = c * nOrig * 3 + v * 3;
          if (model.shapedirs[origIdx] === val) {
            found = true;
            break;
          }
        }
        expect(found).toBe(true);
      }
    }
  });

  it('albedoBasis is zero for mouth vertices', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    for (let c = 0; c < N_ALBEDO; c++) {
      for (let v = nOrig; v < extended.n_vertices; v++) {
        const idx = c * extended.n_vertices * 3 + v * 3;
        expect(extended.albedoBasis[idx]).toBe(0);
        expect(extended.albedoBasis[idx + 1]).toBe(0);
        expect(extended.albedoBasis[idx + 2]).toBe(0);
      }
    }
  });

  it('albedoMean for mouth vertices has non-zero color values', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const nOrig = extended.originalVertexCount;
    for (let v = nOrig; v < extended.n_vertices; v++) {
      const r = extended.albedoMean[v * 3 + 2]; // BGR format: index+2 = R
      const g = extended.albedoMean[v * 3 + 1];
      const b = extended.albedoMean[v * 3];
      // At least one channel should be > 0 (teeth, gums, tongue, cavity all have color)
      expect(r + g + b).toBeGreaterThan(0);
    }
  });

  it('mouth groups have contiguous non-overlapping face ranges', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const g = extended.mouthGroups!;
    // Teeth start at original face count
    expect(g.teeth.faceStart).toBe(model.n_faces);
    // Groups are contiguous
    expect(g.gums.faceStart).toBe(g.teeth.faceStart + g.teeth.faceCount);
    expect(g.tongue.faceStart).toBe(g.gums.faceStart + g.gums.faceCount);
    expect(g.cavity.faceStart).toBe(g.tongue.faceStart + g.tongue.faceCount);
    // Total mouth faces
    const totalMouth = g.teeth.faceCount + g.gums.faceCount + g.tongue.faceCount + g.cavity.faceCount;
    expect(extended.n_faces).toBe(model.n_faces + totalMouth);
  });

  it('all groups have non-zero face counts', () => {
    const model = mockFlameModel();
    const extended = extendModelWithMouth(model);
    const g = extended.mouthGroups!;
    expect(g.teeth.faceCount).toBeGreaterThan(0);
    expect(g.gums.faceCount).toBeGreaterThan(0);
    expect(g.tongue.faceCount).toBeGreaterThan(0);
    expect(g.cavity.faceCount).toBeGreaterThan(0);
  });

  it('extended arrays have correct sizes', () => {
    const model = mockFlameModel();
    const ext = extendModelWithMouth(model);
    expect(ext.template.length).toBe(ext.n_vertices * 3);
    expect(ext.faces.length).toBe(ext.n_faces * 3);
    expect(ext.shapedirs.length).toBe(ext.n_shape * ext.n_vertices * 3);
    expect(ext.exprdirs.length).toBe(ext.n_expr * ext.n_vertices * 3);
    expect(ext.posedirs.length).toBe(ext.n_pose_features * ext.n_vertices * 3);
    expect(ext.weights.length).toBe(ext.n_vertices * ext.n_joints);
    expect(ext.jRegressor.length).toBe(ext.n_joints * ext.n_vertices);
    expect(ext.albedoMean.length).toBe(ext.n_vertices * 3);
    expect(ext.albedoBasis.length).toBe(ext.n_albedo_components * ext.n_vertices * 3);
  });
});
