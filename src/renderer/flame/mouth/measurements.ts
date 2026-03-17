import * as THREE from 'three';
import type { FlameModel } from '../types';
import { computeJointLocations } from '../lbs';
import type { MouthMeasurements } from './types';

const JAW_JOINT_INDEX = 2;
const JAW_WEIGHT_LOW = 0.3;
const JAW_WEIGHT_HIGH = 0.7;

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
 * Extract mouth measurements from the FLAME template mesh.
 * Uses skinning weights to identify lip boundary vertices,
 * then computes spatial extents for geometry sizing.
 */
export function extractMouthMeasurements(model: FlameModel): MouthMeasurements {
  const { template, weights, jRegressor, n_vertices, n_joints } = model;

  // 1. Identify lip boundary vertices
  const lipVertices = identifyLipVertices(weights, n_vertices, n_joints);

  // 2. Compute bounding box of lip vertices
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
  const mouthCenter = new THREE.Vector3(
    n > 0 ? sumX / n : 0,
    n > 0 ? sumY / n : 0,
    n > 0 ? sumZ / n : 0,
  );

  // 3. Compute jaw joint position from joint regressor
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
  };
}
