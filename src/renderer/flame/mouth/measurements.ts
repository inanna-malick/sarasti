import * as THREE from 'three';
import type { FlameModel } from '../types';
import { computeJointLocations } from '../lbs';
import type { MouthMeasurements } from './types';

const JAW_JOINT_INDEX = 2;
const JAW_WEIGHT_LOW = 0.45;
const JAW_WEIGHT_HIGH = 0.55;
/** Threshold for upper/lower classification: < 0.5 = upper (head-dominant) */
const LIP_SPLIT_THRESHOLD = 0.5;

/**
 * Identify inner-lip boundary vertices: vertices with jaw joint (2) skinning
 * weight in [0.3, 0.7] — the transition zone between head and jaw.
 */
export function identifyLipVertices(
  weights: Float32Array,
  nVertices: number,
  nJoints: number,
): number[] {
  const lipVertices: number[] = [];
  for (let v = 0; v < nVertices; v++) {
    const jawWeight = weights[v * nJoints + JAW_JOINT_INDEX];
    if (jawWeight >= JAW_WEIGHT_LOW && jawWeight <= JAW_WEIGHT_HIGH) {
      lipVertices.push(v);
    }
  }
  return lipVertices;
}

/**
 * Classify lip boundary vertices into upper (head-dominant) and lower (jaw-dominant)
 * based on jaw skinning weight relative to threshold 0.5.
 */
export function classifyLipVertices(
  lipVertices: number[],
  weights: Float32Array,
  nJoints: number,
): { upper: number[]; lower: number[] } {
  const upper: number[] = [];
  const lower: number[] = [];
  for (const v of lipVertices) {
    const jawWeight = weights[v * nJoints + JAW_JOINT_INDEX];
    if (jawWeight < LIP_SPLIT_THRESHOLD) {
      upper.push(v);
    } else {
      lower.push(v);
    }
  }
  return { upper, lower };
}

/**
 * Compute the centroid of a set of vertices from a flat vertex buffer.
 * Writes into `out` to avoid per-frame allocation. Returns `out`.
 */
export function computeVertexCentroid(
  vertices: Float32Array,
  indices: number[] | Uint32Array,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  if (indices.length === 0) return out.set(0, 0, 0);
  let sx = 0, sy = 0, sz = 0;
  for (let i = 0; i < indices.length; i++) {
    const v = indices[i];
    sx += vertices[v * 3];
    sy += vertices[v * 3 + 1];
    sz += vertices[v * 3 + 2];
  }
  const n = indices.length;
  return out.set(sx / n, sy / n, sz / n);
}

/**
 * Extract mouth measurements from the FLAME template mesh.
 * Uses skinning weights to identify lip boundary vertices,
 * classifies into upper/lower, then computes spatial extents.
 */
export function extractMouthMeasurements(model: FlameModel): MouthMeasurements | null {
  const { template, weights, jRegressor, n_vertices, n_joints } = model;

  // 1. Identify lip boundary vertices
  const lipVertices = identifyLipVertices(weights, n_vertices, n_joints);

  if (lipVertices.length === 0) {
    return null;
  }

  // 2. Classify into upper and lower lip — need both sets for anchoring
  const { upper, lower } = classifyLipVertices(lipVertices, weights, n_joints);
  if (upper.length === 0 || lower.length === 0) {
    return null;
  }

  // 3. Compute bounding box of all lip vertices
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let sumX = 0, sumY = 0, sumZ = 0;

  for (const v of lipVertices) {
    const x = template[v * 3];
    const y = template[v * 3 + 1];
    const z = template[v * 3 + 2];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    sumX += x;
    sumY += y;
    sumZ += z;
  }

  const n = lipVertices.length;
  const mouthCenter = new THREE.Vector3(sumX / n, sumY / n, sumZ / n);

  // 4. Compute per-set rest-pose centroids
  const upperLipCenter = computeVertexCentroid(template, upper);
  const lowerLipCenter = computeVertexCentroid(template, lower);

  // 5. Compute jaw joint position from joint regressor
  const jointLocations = computeJointLocations(jRegressor, template, n_joints, n_vertices);
  const jawJointPosition = new THREE.Vector3(
    jointLocations[JAW_JOINT_INDEX * 3],
    jointLocations[JAW_JOINT_INDEX * 3 + 1],
    jointLocations[JAW_JOINT_INDEX * 3 + 2],
  );

  return {
    lipWidth: maxX - minX,
    lipHeight: maxY - minY,
    mouthDepth: maxZ - minZ,
    mouthCenter,
    jawJointPosition,
    lipVertices,
    upperLipVertices: upper,
    lowerLipVertices: lower,
    upperLipCenter,
    lowerLipCenter,
  };
}
