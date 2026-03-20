import type { FlameModel } from '../types';
import type { ExtendedFlameModel, MouthGroups } from './types';
import { extractMouthMeasurements } from './measurements';
import {
  sortVerticesIntoRing,
  buildRingStrip,
  buildRingCap,
  createTongueGeometry,
} from './geometry';

const HEAD_JOINT = 0;
const JAW_JOINT = 2;

// Recession depths as fractions of lipWidth (~0.104)
// Teeth need to be close to lip surface to catch light and be visible.
// The teeth strip spans lipInner (0.02) → teeth (0.12), ~10mm wide.
const TEETH_RECESS = 0.12;
const GUMS_RECESS = 0.25;
const CAVITY_RECESS = 0.50;
const TONGUE_RECESS = 0.30;

type SkinWeight = 'head' | 'jaw';

// Albedo colors in BGR (matching FLAME albedo format), sRGB normalized [0,1]
const TEETH_BGR: [number, number, number] = [0.847, 0.910, 0.941];
const GUMS_BGR: [number, number, number] = [0.420, 0.369, 0.545];
const TONGUE_BGR: [number, number, number] = [0.353, 0.294, 0.482];
const CAVITY_BGR: [number, number, number] = [0.039, 0.059, 0.102];

/**
 * Extend a FlameModel with mouth interior vertices derived from lip boundary.
 *
 * Instead of procedural geometry, duplicates the actual lip vertices at
 * increasing recession depths to create teeth, gums, and cavity surfaces.
 * Each new vertex inherits shape/expression/pose deformation from its source
 * lip vertex, so mouth interior deforms naturally with the face.
 *
 * Graceful no-op: if lip measurements can't be extracted, returns model unchanged.
 */
export function extendModelWithMouth(model: FlameModel): ExtendedFlameModel {
  const measurements = extractMouthMeasurements(model);
  if (!measurements) {
    return { ...model, mouthGroups: null, originalVertexCount: model.n_vertices };
  }

  const m = measurements;
  const nOrig = model.n_vertices;
  const nOrigFaces = model.n_faces;

  // Sort ALL lip vertices into one full ring around the mouth opening.
  // Previous approach split upper/lower into half-rings and closed them,
  // creating spiky artifacts at the corners. A full ring is a proper closed loop.
  const fullLipRing = sortVerticesIntoRing(model.template, m.lipVertices, m.mouthCenter);

  // Accumulate new vertices
  const newPositions: number[] = [];
  const sourceVertices: number[] = []; // maps each new vertex → source FLAME vertex
  const skinWeights: SkinWeight[] = [];
  const albedoColors: [number, number, number][] = [];

  // Determine skin type from source vertex's jaw weight
  function getSkinType(v: number): SkinWeight {
    const jawWeight = model.weights[v * model.n_joints + JAW_JOINT];
    return jawWeight < 0.5 ? 'head' : 'jaw';
  }

  // Create a recession layer: duplicate ring vertices, offset into -Z
  function addLayer(
    ring: number[], recess: number, color: [number, number, number],
  ): number[] {
    const newRing: number[] = [];
    for (const v of ring) {
      const newIdx = nOrig + newPositions.length / 3;
      newRing.push(newIdx);
      newPositions.push(
        model.template[v * 3],
        model.template[v * 3 + 1],
        model.template[v * 3 + 2] - recess * m.lipWidth,
      );
      sourceVertices.push(v);
      skinWeights.push(getSkinType(v));
      albedoColors.push(color);
    }
    return newRing;
  }

  // Create a center vertex for fan cap
  function addCenter(
    ring: number[], recess: number, skinType: SkinWeight, color: [number, number, number],
  ): number {
    let cx = 0, cy = 0, cz = 0;
    for (const v of ring) {
      cx += model.template[v * 3];
      cy += model.template[v * 3 + 1];
      cz += model.template[v * 3 + 2];
    }
    const n = ring.length;
    const newIdx = nOrig + newPositions.length / 3;
    newPositions.push(cx / n, cy / n, cz / n - recess * m.lipWidth);
    sourceVertices.push(ring[0]); // approximate for deformation
    skinWeights.push(skinType);
    albedoColors.push(color);
    return newIdx;
  }

  // Full-ring recession layers (per-vertex skinning from source jaw weight)
  // The lip-inner ring sits just behind the lip surface to avoid z-fighting
  // with skin faces at the lip boundary.
  const LIP_INNER_RECESS = 0.02;
  const lipInnerRing = addLayer(fullLipRing, LIP_INNER_RECESS, TEETH_BGR);
  const teethRing = addLayer(fullLipRing, TEETH_RECESS, TEETH_BGR);
  const gumsRing = addLayer(fullLipRing, GUMS_RECESS, GUMS_BGR);
  const cavityCenter = addCenter(fullLipRing, CAVITY_RECESS, 'jaw', CAVITY_BGR);

  // Build faces: closed ring strips + fan cap
  // lipInner→teeth is the gums strip just behind the lips
  const teethFaces = buildRingStrip(lipInnerRing, teethRing);
  const gumsFaces = buildRingStrip(teethRing, gumsRing);
  const cavityFaces = buildRingCap(gumsRing, cavityCenter);

  // Tongue: procedural ellipsoid, positioned at gums depth
  const tongueGeo = createTongueGeometry(m);
  const tonguePosAttr = tongueGeo.getAttribute('position');
  const tongueStartIdx = nOrig + newPositions.length / 3;
  const tongueOffset = {
    x: m.mouthCenter.x,
    y: m.mouthCenter.y,
    z: m.mouthCenter.z - TONGUE_RECESS * m.lipWidth,
  };
  for (let i = 0; i < tonguePosAttr.count; i++) {
    newPositions.push(
      tonguePosAttr.getX(i) + tongueOffset.x,
      tonguePosAttr.getY(i) + tongueOffset.y,
      tonguePosAttr.getZ(i) + tongueOffset.z,
    );
    sourceVertices.push(m.lipVertices[0]);
    skinWeights.push('jaw');
    albedoColors.push(TONGUE_BGR);
  }
  const tongueFaces: number[] = [];
  const tongueIndexAttr = tongueGeo.index;
  if (tongueIndexAttr) {
    for (let i = 0; i < tongueIndexAttr.count; i++) {
      tongueFaces.push(tongueIndexAttr.getX(i) + tongueStartIdx);
    }
  }
  tongueGeo.dispose();

  // Assemble face indices in group order: teeth, gums, tongue, cavity
  const allFaceIndices: number[] = [...teethFaces, ...gumsFaces, ...tongueFaces, ...cavityFaces];
  const groupFaceCounts = {
    teeth: teethFaces.length / 3,
    gums: gumsFaces.length / 3,
    tongue: tongueFaces.length / 3,
    cavity: cavityFaces.length / 3,
  };

  const nMouth = newPositions.length / 3;
  const nNew = nOrig + nMouth;
  const nMouthFaces = allFaceIndices.length / 3;
  const nNewFaces = nOrigFaces + nMouthFaces;

  // Direct source vertex mapping (no brute-force search needed)
  const nearestVertex = new Uint32Array(nMouth);
  for (let i = 0; i < nMouth; i++) {
    nearestVertex[i] = sourceVertices[i];
  }

  // Build extended arrays
  const newTemplate = extendTemplate(model.template, newPositions, nOrig, nMouth);
  const newFaces = extendFaces(model.faces, allFaceIndices, nOrigFaces, nMouthFaces);
  const newShapedirs = extendPerComponentArray(model.shapedirs, model.n_shape, nOrig, nNew, nMouth, nearestVertex);
  const newExprdirs = extendPerComponentArray(model.exprdirs, model.n_expr, nOrig, nNew, nMouth, nearestVertex);
  const newPosedirs = extendPerComponentArray(model.posedirs, model.n_pose_features, nOrig, nNew, nMouth, nearestVertex);
  const newWeights = extendWeights(model.weights, skinWeights, nOrig, nNew, nMouth, model.n_joints);
  const newJRegressor = extendJRegressor(model.jRegressor, nOrig, nNew, model.n_joints);
  const newAlbedoMean = extendAlbedoMean(model.albedoMean, albedoColors, nOrig, nMouth);
  const newAlbedoBasis = extendAlbedoBasis(model.albedoBasis, model.n_albedo_components, nOrig, nNew);

  // Build mouth face group ranges
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
 * For each mouth vertex, copies data from its source lip vertex.
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
  skinWeights: SkinWeight[],
  nOrig: number,
  nNew: number,
  nMouth: number,
  nJoints: number,
): Float32Array {
  const result = new Float32Array(nNew * nJoints);
  result.set(original);

  for (let m = 0; m < nMouth; m++) {
    const vIdx = nOrig + m;
    const sw = skinWeights[m];
    if (sw === 'head') {
      result[vIdx * nJoints + HEAD_JOINT] = 1.0;
    } else {
      result[vIdx * nJoints + JAW_JOINT] = 1.0;
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
