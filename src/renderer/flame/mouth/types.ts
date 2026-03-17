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
}

/**
 * Assembled mouth interior: upper/lower groups parented to
 * head/jaw joints, with visibility gating on jaw angle.
 */
export interface MouthInterior {
  /** Upper teeth + upper gums (parents to head/neck joint) */
  upperGroup: THREE.Group;
  /** Lower teeth + lower gums + tongue (parents to jaw joint) */
  lowerGroup: THREE.Group;
  /** Dark cavity backdrop */
  cavityMesh: THREE.Mesh;
  /** Update visibility and jaw tracking. jawAngle in radians. */
  update(jawAngle: number): void;
  /** Dispose all geometry and materials */
  dispose(): void;
}
