import type { PoseParams } from '../../types';
import type { FlameModel } from './types';

/**
 * Convert axis-angle to 3x3 rotation matrix (row-major).
 */
export function axisAngleToRotationMatrix(axisAngle: [number, number, number]): Float32Array {
  const theta = Math.sqrt(axisAngle[0] ** 2 + axisAngle[1] ** 2 + axisAngle[2] ** 2);
  const res = new Float32Array(9);
  if (theta < 1e-8) {
    res[0] = 1; res[4] = 1; res[8] = 1;
    return res;
  }

  const x = axisAngle[0] / theta;
  const y = axisAngle[1] / theta;
  const z = axisAngle[2] / theta;

  const s = Math.sin(theta);
  const c = Math.cos(theta);
  const t = 1 - c;

  // Rodrigues' formula
  res[0] = t * x * x + c;
  res[1] = t * x * y - s * z;
  res[2] = t * x * z + s * y;

  res[3] = t * x * y + s * z;
  res[4] = t * y * y + c;
  res[5] = t * y * z - s * x;

  res[6] = t * x * z - s * y;
  res[7] = t * y * z + s * x;
  res[8] = t * z * z + c;

  return res;
}

/**
 * Extract axis-angle from 3x3 rotation matrix.
 */
function rotationMatrixToAxisAngle(R: Float32Array): [number, number, number] {
  const tr = R[0] + R[4] + R[8];
  const theta = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  if (theta < 1e-8) {
    return [0, 0, 0];
  }
  const s = Math.sin(theta);
  const scale = theta / (2 * s);
  return [
    (R[7] - R[5]) * scale,
    (R[2] - R[6]) * scale,
    (R[3] - R[1]) * scale
  ];
}

function composeRotations(rotations: Float32Array[]): Float32Array {
  let res = rotations[0];
  for (let i = 1; i < rotations.length; i++) {
    res = multiplyMatrices(res, rotations[i]);
  }
  return res;
}

function multiplyMatrices(A: Float32Array, B: Float32Array): Float32Array {
  const C = new Float32Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      C[i * 3 + j] = A[i * 3 + 0] * B[0 * 3 + j] +
                    A[i * 3 + 1] * B[1 * 3 + j] +
                    A[i * 3 + 2] * B[2 * 3 + j];
    }
  }
  return C;
}

function getEulerMatrixX(a: number): Float32Array {
  const s = Math.sin(a), c = Math.cos(a);
  return new Float32Array([1, 0, 0, 0, c, -s, 0, s, c]);
}

function getEulerMatrixY(a: number): Float32Array {
  const s = Math.sin(a), c = Math.cos(a);
  return new Float32Array([c, 0, s, 0, 1, 0, -s, 0, c]);
}

function getEulerMatrixZ(a: number): Float32Array {
  const s = Math.sin(a), c = Math.cos(a);
  return new Float32Array([c, -s, 0, s, c, 0, 0, 0, 1]);
}

/**
 * J = J_regressor @ V_shaped
 */
export function computeJointLocations(
  jRegressor: Float32Array,
  shapedVertices: Float32Array,
  nJoints: number,
  nVertices: number
): Float32Array {
  const joints = new Float32Array(nJoints * 3);
  for (let j = 0; j < nJoints; j++) {
    for (let i = 0; i < nVertices; i++) {
      const w = jRegressor[j * nVertices + i];
      if (w === 0) continue;
      joints[j * 3 + 0] += w * shapedVertices[i * 3 + 0];
      joints[j * 3 + 1] += w * shapedVertices[i * 3 + 1];
      joints[j * 3 + 2] += w * shapedVertices[i * 3 + 2];
    }
  }
  return joints;
}

/**
 * Identity 3x3 matrix (row-major).
 */
function identityMatrix(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
}

/**
 * Propagate transforms through joint tree.
 */
export function forwardKinematics(
  localRotations: Float32Array[],
  kintreeTable: number[][],
  jointLocations: Float32Array
): { worldTransforms: Float32Array[], worldTranslations: Float32Array } {
  const nJoints = localRotations.length;

  if (!kintreeTable || kintreeTable.length < 2) {
    // Return identity transforms — face stays at rest pose
    return {
      worldTransforms: localRotations.map(() => identityMatrix()),
      worldTranslations: new Float32Array(nJoints * 3)
    };
  }

  const worldTransforms: Float32Array[] = new Array(nJoints);
  const worldTranslations = new Float32Array(nJoints * 3);
  const parents = kintreeTable[0];

  for (let j = 0; j < nJoints; j++) {
    const p = parents[j];
    const R_local = localRotations[j];

    if (p === -1 || p === 4294967295 || p >= nJoints) {
      // Root
      worldTransforms[j] = R_local;
      worldTranslations[j * 3 + 0] = jointLocations[j * 3 + 0];
      worldTranslations[j * 3 + 1] = jointLocations[j * 3 + 1];
      worldTranslations[j * 3 + 2] = jointLocations[j * 3 + 2];
    } else {
      const R_parent = worldTransforms[p];
      worldTransforms[j] = multiplyMatrices(R_parent, R_local);

      // T_j = R_p @ (J_j - J_p) + T_p
      const dx = jointLocations[j * 3 + 0] - jointLocations[p * 3 + 0];
      const dy = jointLocations[j * 3 + 1] - jointLocations[p * 3 + 1];
      const dz = jointLocations[j * 3 + 2] - jointLocations[p * 3 + 2];

      worldTranslations[j * 3 + 0] = R_parent[0] * dx + R_parent[1] * dy + R_parent[2] * dz + worldTranslations[p * 3 + 0];
      worldTranslations[j * 3 + 1] = R_parent[3] * dx + R_parent[4] * dy + R_parent[5] * dz + worldTranslations[p * 3 + 1];
      worldTranslations[j * 3 + 2] = R_parent[6] * dx + R_parent[7] * dy + R_parent[8] * dz + worldTranslations[p * 3 + 2];
    }
  }

  return { worldTransforms, worldTranslations };
}

/**
 * Extract 9 elements from (R - I) for each non-root joint.
 */
export function computePoseFeatures(localRotations: Float32Array[]): Float32Array {
  const nJoints = localRotations.length;
  const features = new Float32Array((nJoints - 1) * 9);
  for (let j = 1; j < nJoints; j++) {
    const R = localRotations[j];
    const offset = (j - 1) * 9;
    for (let i = 0; i < 9; i++) {
      features[offset + i] = R[i];
    }
    // Subtract Identity
    features[offset + 0] -= 1;
    features[offset + 4] -= 1;
    features[offset + 8] -= 1;
  }
  return features;
}

/**
 * vertices += posedirs @ poseFeatures
 */
export function applyPoseCorrections(
  vertices: Float32Array,
  posedirs: Float32Array,
  poseFeatures: Float32Array,
  nVertices: number
): void {
  const nFeatures = poseFeatures.length;
  for (let k = 0; k < nFeatures; k++) {
    const f = poseFeatures[k];
    if (f === 0) continue;
    const offset = k * nVertices * 3;
    for (let i = 0; i < nVertices * 3; i++) {
      vertices[i] += posedirs[offset + i] * f;
    }
  }
}

/**
 * v' = Σ_j w_j * (R_j * (v - j_rest) + j_posed)
 */
export function skinVertices(
  vertices: Float32Array,
  jointLocations: Float32Array,
  worldTransforms: Float32Array[],
  worldTranslations: Float32Array,
  weights: Float32Array,
  nVertices: number,
  nJoints: number
): Float32Array {
  const skinned = new Float32Array(nVertices * 3);
  for (let i = 0; i < nVertices; i++) {
    const vx = vertices[i * 3 + 0];
    const vy = vertices[i * 3 + 1];
    const vz = vertices[i * 3 + 2];

    for (let j = 0; j < nJoints; j++) {
      const w = weights[i * nJoints + j];
      if (w === 0) continue;

      const R = worldTransforms[j];
      const jrx = jointLocations[j * 3 + 0];
      const jry = jointLocations[j * 3 + 1];
      const jrz = jointLocations[j * 3 + 2];
      const jpx = worldTranslations[j * 3 + 0];
      const jpy = worldTranslations[j * 3 + 1];
      const jpz = worldTranslations[j * 3 + 2];

      const dx = vx - jrx;
      const dy = vy - jry;
      const dz = vz - jrz;

      const rx = R[0] * dx + R[1] * dy + R[2] * dz + jpx;
      const ry = R[3] * dx + R[4] * dy + R[5] * dz + jpy;
      const rz = R[6] * dx + R[7] * dy + R[8] * dz + jpz;

      skinned[i * 3 + 0] += w * rx;
      skinned[i * 3 + 1] += w * ry;
      skinned[i * 3 + 2] += w * rz;
    }
  }
  return skinned;
}

/**
 * Full LBS pipeline.
 */
export function applyLBS(
  model: FlameModel,
  shapedVertices: Float32Array,
  pose: PoseParams
): Float32Array {
  const { n_joints, n_vertices, kintreeTable, jRegressor, weights, posedirs } = model;

  // 1. Convert PoseParams to axis-angle and then to rotation matrices
  const localRotations: Float32Array[] = new Array(n_joints);

  // Joint 0: root
  localRotations[0] = axisAngleToRotationMatrix([0, 0, 0]);

  // Joint 1: neck [pitch, yaw, roll] -> X*Y*Z
  const neckR = composeRotations([
    getEulerMatrixX(pose.neck[0]),
    getEulerMatrixY(pose.neck[1]),
    getEulerMatrixZ(pose.neck[2])
  ]);
  const neckAA = rotationMatrixToAxisAngle(neckR);
  localRotations[1] = axisAngleToRotationMatrix(neckAA);

  // Joint 2: jaw -> rotation around X
  localRotations[2] = axisAngleToRotationMatrix([pose.jaw, 0, 0]);

  // Joint 3: left eye [h, v] -> X(v)*Y(h)
  const leftEyeR = composeRotations([
    getEulerMatrixX(pose.leftEye[1]),
    getEulerMatrixY(pose.leftEye[0])
  ]);
  const leftEyeAA = rotationMatrixToAxisAngle(leftEyeR);
  localRotations[3] = axisAngleToRotationMatrix(leftEyeAA);

  // Joint 4: right eye [h, v] -> X(v)*Y(h)
  const rightEyeR = composeRotations([
    getEulerMatrixX(pose.rightEye[1]),
    getEulerMatrixY(pose.rightEye[0])
  ]);
  const rightEyeAA = rotationMatrixToAxisAngle(rightEyeR);
  localRotations[4] = axisAngleToRotationMatrix(rightEyeAA);

  // 2. Compute joint locations in rest pose
  const jointLocations = computeJointLocations(jRegressor, shapedVertices, n_joints, n_vertices);

  // 3. Forward Kinematics
  const { worldTransforms, worldTranslations } = forwardKinematics(localRotations, kintreeTable, jointLocations);

  // 4. Pose corrective blendshapes
  const poseFeatures = computePoseFeatures(localRotations);
  const posedVertices = new Float32Array(shapedVertices);
  applyPoseCorrections(posedVertices, posedirs, poseFeatures, n_vertices);

  // 5. Skinning
  return skinVertices(posedVertices, jointLocations, worldTransforms, worldTranslations, weights, n_vertices, n_joints);
}
