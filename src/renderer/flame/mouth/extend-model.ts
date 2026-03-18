import * as THREE from 'three';
import type { FlameModel } from '../types';
import type { ExtendedFlameModel, MouthGroups } from './types';
import { extractMouthMeasurements } from './measurements';
import type { MouthMeasurements } from './types';
import {
  createUpperTeethGeometry,
  createLowerTeethGeometry,
  createUpperGumsGeometry,
  createLowerGumsGeometry,
  createTongueGeometry,
  createCavityGeometry,
} from './geometry';

const HEAD_JOINT = 0;
const JAW_JOINT = 2;

type SkinWeight = 'head' | 'jaw' | 'cavity';

interface MouthPart {
  geo: THREE.BufferGeometry;
  offset: THREE.Vector3;
  skinWeight: SkinWeight;
  group: 'teeth' | 'gums' | 'tongue' | 'cavity';
  albedoBGR: [number, number, number];
}

// Albedo colors in BGR (matching FLAME albedo format), sRGB normalized [0,1]
// Teeth: 0xF0E8D8 → R=0.941 G=0.910 B=0.847
const TEETH_BGR: [number, number, number] = [0.847, 0.910, 0.941];
// Gums: 0x8B5E6B → R=0.545 G=0.369 B=0.420
const GUMS_BGR: [number, number, number] = [0.420, 0.369, 0.545];
// Tongue: 0x7B4B5A → R=0.482 G=0.294 B=0.353
const TONGUE_BGR: [number, number, number] = [0.353, 0.294, 0.482];
// Cavity: 0x1A0F0A → R=0.102 G=0.059 B=0.039
const CAVITY_BGR: [number, number, number] = [0.039, 0.059, 0.102];

/**
 * Extend a FlameModel with procedural mouth vertices.
 *
 * Mouth vertices are integrated into all vertex-indexed arrays so they
 * participate in native shape + expression + LBS deformation. The deformation
 * pipeline operates on n_vertices generically — no changes needed.
 *
 * Graceful no-op: if lip measurements can't be extracted, returns model unchanged.
 */
export function extendModelWithMouth(model: FlameModel): ExtendedFlameModel {
  const measurements = extractMouthMeasurements(model);
  if (!measurements) {
    return { ...model, mouthGroups: null, originalVertexCount: model.n_vertices };
  }

  const m = measurements;
  const recessZ = -m.mouthDepth * 0.6;

  const parts = buildMouthParts(m, recessZ);

  // Extract vertices, faces, and metadata from all parts
  const { positions, faces, skinWeights, albedoColors, groupFaceCounts, totalVertices } =
    extractPartGeometry(parts, model.n_vertices);

  // Dispose temporary geometries
  for (const part of parts) part.geo.dispose();

  const nOrig = model.n_vertices;
  const nMouth = totalVertices;
  const nNew = nOrig + nMouth;
  const nOrigFaces = model.n_faces;
  const nMouthFaces = faces.length / 3;
  const nNewFaces = nOrigFaces + nMouthFaces;

  // Find nearest original FLAME vertex for each mouth vertex (brute force, runs once)
  const nearestVertex = findNearestVertices(positions, model.template, nMouth, nOrig);

  // Build extended arrays
  const newTemplate = extendTemplate(model.template, positions, nOrig, nMouth);
  const newFaces = extendFaces(model.faces, faces, nOrigFaces, nMouthFaces);
  const newShapedirs = extendPerComponentArray(model.shapedirs, model.n_shape, nOrig, nNew, nMouth, nearestVertex);
  const newExprdirs = extendPerComponentArray(model.exprdirs, model.n_expr, nOrig, nNew, nMouth, nearestVertex);
  const newPosedirs = extendPerComponentArray(model.posedirs, model.n_pose_features, nOrig, nNew, nMouth, nearestVertex);
  const newWeights = extendWeights(model.weights, positions, skinWeights, nOrig, nNew, nMouth, model.n_joints);
  const newJRegressor = extendJRegressor(model.jRegressor, nOrig, nNew, model.n_joints);
  const newAlbedoMean = extendAlbedoMean(model.albedoMean, albedoColors, nOrig, nMouth);
  const newAlbedoBasis = extendAlbedoBasis(model.albedoBasis, model.n_albedo_components, nOrig, nNew);

  // Build mouth face group ranges (faces appended in group order)
  let faceOffset = nOrigFaces;
  const mouthGroups: MouthGroups = {
    teeth: { faceStart: faceOffset, faceCount: groupFaceCounts.teeth },
    gums: { faceStart: faceOffset += groupFaceCounts.teeth, faceCount: groupFaceCounts.gums },
    tongue: { faceStart: faceOffset += groupFaceCounts.gums, faceCount: groupFaceCounts.tongue },
    cavity: { faceStart: faceOffset += groupFaceCounts.tongue, faceCount: groupFaceCounts.cavity },
  };

  return {
    template: newTemplate,
    faces: newFaces,
    shapedirs: newShapedirs,
    exprdirs: newExprdirs,
    albedoMean: newAlbedoMean,
    albedoBasis: newAlbedoBasis,
    weights: newWeights,
    posedirs: newPosedirs,
    jRegressor: newJRegressor,
    kintreeTable: model.kintreeTable,
    n_vertices: nNew,
    n_faces: nNewFaces,
    n_shape: model.n_shape,
    n_expr: model.n_expr,
    n_joints: model.n_joints,
    n_pose_features: model.n_pose_features,
    n_albedo_components: model.n_albedo_components,
    mouthGroups,
    originalVertexCount: nOrig,
  };
}

function buildMouthParts(m: MouthMeasurements, recessZ: number): MouthPart[] {
  return [
    {
      geo: createUpperTeethGeometry(m),
      offset: new THREE.Vector3(m.upperLipCenter.x, m.upperLipCenter.y, m.upperLipCenter.z + recessZ),
      skinWeight: 'head', group: 'teeth', albedoBGR: TEETH_BGR,
    },
    {
      geo: createLowerTeethGeometry(m),
      offset: new THREE.Vector3(m.lowerLipCenter.x, m.lowerLipCenter.y, m.lowerLipCenter.z + recessZ),
      skinWeight: 'jaw', group: 'teeth', albedoBGR: TEETH_BGR,
    },
    {
      geo: createUpperGumsGeometry(m),
      offset: new THREE.Vector3(m.upperLipCenter.x, m.upperLipCenter.y, m.upperLipCenter.z + recessZ),
      skinWeight: 'head', group: 'gums', albedoBGR: GUMS_BGR,
    },
    {
      geo: createLowerGumsGeometry(m),
      offset: new THREE.Vector3(m.lowerLipCenter.x, m.lowerLipCenter.y, m.lowerLipCenter.z + recessZ),
      skinWeight: 'jaw', group: 'gums', albedoBGR: GUMS_BGR,
    },
    {
      geo: createTongueGeometry(m),
      offset: new THREE.Vector3(m.lowerLipCenter.x, m.lowerLipCenter.y, m.lowerLipCenter.z + recessZ - m.mouthDepth * 0.3),
      skinWeight: 'jaw', group: 'tongue', albedoBGR: TONGUE_BGR,
    },
    {
      geo: createCavityGeometry(m),
      offset: new THREE.Vector3(m.mouthCenter.x, m.mouthCenter.y, m.mouthCenter.z + recessZ - m.mouthDepth * 0.3),
      skinWeight: 'cavity', group: 'cavity', albedoBGR: CAVITY_BGR,
    },
  ];
}

function extractPartGeometry(parts: MouthPart[], baseVertexOffset: number) {
  const positions: number[] = [];
  const faces: number[] = [];
  const skinWeights: SkinWeight[] = [];
  const albedoColors: [number, number, number][] = [];
  const groupFaceCounts = { teeth: 0, gums: 0, tongue: 0, cavity: 0 };
  let vertexOffset = 0;

  for (const part of parts) {
    const posAttr = part.geo.getAttribute('position');
    const nVerts = posAttr.count;
    const posArray = posAttr.array;

    for (let i = 0; i < nVerts; i++) {
      positions.push(
        posArray[i * 3] + part.offset.x,
        posArray[i * 3 + 1] + part.offset.y,
        posArray[i * 3 + 2] + part.offset.z,
      );
      skinWeights.push(part.skinWeight);
      albedoColors.push(part.albedoBGR);
    }

    const indexAttr = part.geo.index;
    if (indexAttr) {
      const indexArray = indexAttr.array;
      for (let i = 0; i < indexArray.length; i++) {
        faces.push(indexArray[i] + baseVertexOffset + vertexOffset);
      }
      groupFaceCounts[part.group] += indexArray.length / 3;
    }

    vertexOffset += nVerts;
  }

  return { positions, faces, skinWeights, albedoColors, groupFaceCounts, totalVertices: vertexOffset };
}

/** Brute-force nearest-vertex search. O(nMouth × nOrig), runs once at load. */
function findNearestVertices(
  mouthPositions: number[],
  template: Float32Array,
  nMouth: number,
  nOrig: number,
): Uint32Array {
  const nearest = new Uint32Array(nMouth);
  for (let m = 0; m < nMouth; m++) {
    const mx = mouthPositions[m * 3];
    const my = mouthPositions[m * 3 + 1];
    const mz = mouthPositions[m * 3 + 2];
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let v = 0; v < nOrig; v++) {
      const dx = template[v * 3] - mx;
      const dy = template[v * 3 + 1] - my;
      const dz = template[v * 3 + 2] - mz;
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = v;
      }
    }
    nearest[m] = bestIdx;
  }
  return nearest;
}

function extendTemplate(
  original: Float32Array, mouthPositions: number[], nOrig: number, nMouth: number,
): Float32Array {
  const result = new Float32Array((nOrig + nMouth) * 3);
  result.set(original);
  for (let i = 0; i < nMouth * 3; i++) {
    result[nOrig * 3 + i] = mouthPositions[i];
  }
  return result;
}

function extendFaces(
  original: Uint32Array, mouthFaces: number[], nOrigFaces: number, nMouthFaces: number,
): Uint32Array {
  const result = new Uint32Array((nOrigFaces + nMouthFaces) * 3);
  result.set(original);
  for (let i = 0; i < nMouthFaces * 3; i++) {
    result[nOrigFaces * 3 + i] = mouthFaces[i];
  }
  return result;
}

/**
 * Extend a per-component vertex array laid out as [n_components][n_vertices * 3].
 * For each mouth vertex, copies shape/expression/pose data from its nearest original vertex.
 */
function extendPerComponentArray(
  source: Float32Array,
  nComponents: number,
  nOrig: number,
  nNew: number,
  nMouth: number,
  nearestVertex: Uint32Array,
): Float32Array {
  const result = new Float32Array(nComponents * nNew * 3);
  for (let c = 0; c < nComponents; c++) {
    const oldOffset = c * nOrig * 3;
    const newOffset = c * nNew * 3;
    result.set(source.subarray(oldOffset, oldOffset + nOrig * 3), newOffset);
    for (let m = 0; m < nMouth; m++) {
      const nearest = nearestVertex[m];
      const src = oldOffset + nearest * 3;
      const dst = newOffset + (nOrig + m) * 3;
      result[dst] = source[src];
      result[dst + 1] = source[src + 1];
      result[dst + 2] = source[src + 2];
    }
  }
  return result;
}

function extendWeights(
  original: Float32Array,
  mouthPositions: number[],
  skinWeights: SkinWeight[],
  nOrig: number,
  nNew: number,
  nMouth: number,
  nJoints: number,
): Float32Array {
  const result = new Float32Array(nNew * nJoints);
  result.set(original);

  // Compute cavity Y range for head↔jaw blending
  let cavityMinY = Infinity, cavityMaxY = -Infinity;
  for (let m = 0; m < nMouth; m++) {
    if (skinWeights[m] === 'cavity') {
      const y = mouthPositions[m * 3 + 1];
      cavityMinY = Math.min(cavityMinY, y);
      cavityMaxY = Math.max(cavityMaxY, y);
    }
  }
  const cavityYRange = cavityMaxY - cavityMinY;

  for (let m = 0; m < nMouth; m++) {
    const vIdx = nOrig + m;
    const sw = skinWeights[m];
    if (sw === 'head') {
      result[vIdx * nJoints + HEAD_JOINT] = 1.0;
    } else if (sw === 'jaw') {
      result[vIdx * nJoints + JAW_JOINT] = 1.0;
    } else {
      // Cavity: gradient blend from head (top) → jaw (bottom) along Y
      const y = mouthPositions[m * 3 + 1];
      const t = cavityYRange > 1e-8 ? (y - cavityMinY) / cavityYRange : 0.5;
      result[vIdx * nJoints + HEAD_JOINT] = t;
      result[vIdx * nJoints + JAW_JOINT] = 1.0 - t;
    }
  }

  return result;
}

function extendJRegressor(
  original: Float32Array, nOrig: number, nNew: number, nJoints: number,
): Float32Array {
  const result = new Float32Array(nJoints * nNew);
  for (let j = 0; j < nJoints; j++) {
    result.set(
      original.subarray(j * nOrig, j * nOrig + nOrig),
      j * nNew,
    );
  }
  return result;
}

function extendAlbedoMean(
  original: Float32Array,
  albedoColors: [number, number, number][],
  nOrig: number,
  nMouth: number,
): Float32Array {
  const result = new Float32Array((nOrig + nMouth) * 3);
  result.set(original);
  for (let m = 0; m < nMouth; m++) {
    const [b, g, r] = albedoColors[m];
    result[(nOrig + m) * 3] = b;
    result[(nOrig + m) * 3 + 1] = g;
    result[(nOrig + m) * 3 + 2] = r;
  }
  return result;
}

function extendAlbedoBasis(
  original: Float32Array, nAlbedo: number, nOrig: number, nNew: number,
): Float32Array {
  const result = new Float32Array(nAlbedo * nNew * 3);
  for (let c = 0; c < nAlbedo; c++) {
    result.set(
      original.subarray(c * nOrig * 3, c * nOrig * 3 + nOrig * 3),
      c * nNew * 3,
    );
  }
  return result;
}
