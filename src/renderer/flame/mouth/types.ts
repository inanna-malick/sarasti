import * as THREE from 'three';

/**
 * Measurements extracted from the FLAME template mesh that define
 * the mouth cavity geometry. All values in FLAME model space (meters).
 */
export interface MouthMeasurements {
  /** Maximum X spread of inner-lip vertices (meters) */
  lipWidth: number;
  /** Y spread of inner-lip vertices (meters) */
  lipHeight: number;
  /** Z range of inner-lip vertices (meters) */
  mouthDepth: number;
  /** Center position of inner-lip ring */
  mouthCenter: THREE.Vector3;
  /** Jaw joint position in rest pose */
  jawJointPosition: THREE.Vector3;
  /** Indices of vertices on the inner lip boundary */
  lipVertices: number[];
  /** Upper lip vertices (jaw weight < 0.5 — head-dominant) */
  upperLipVertices: number[];
  /** Lower lip vertices (jaw weight >= 0.5 — jaw-dominant) */
  lowerLipVertices: number[];
  /** Rest-pose centroid of upper lip vertices */
  upperLipCenter: THREE.Vector3;
  /** Rest-pose centroid of lower lip vertices */
  lowerLipCenter: THREE.Vector3;
}

/**
 * Assembled mouth interior: upper/lower groups positioned by
 * deformed lip vertex centroids each frame.
 */
export interface MouthInterior {
  /** Upper teeth + upper gums (tracks upper lip centroid) */
  upperGroup: THREE.Group;
  /** Lower teeth + lower gums + tongue (tracks lower lip centroid) */
  lowerGroup: THREE.Group;
  /** Dark cavity backdrop */
  cavityMesh: THREE.Mesh;
  /** Update positions from deformed vertex buffer (pipeline output). */
  update(deformedVertices: Float32Array): void;
  /** Dispose all geometry and materials */
  dispose(): void;
}
