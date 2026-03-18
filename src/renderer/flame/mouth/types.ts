import * as THREE from 'three';
import type { FlameModel } from '../types';

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

/** Face index range within the extended model's faces array */
export interface MouthFaceGroup {
  faceStart: number;
  faceCount: number;
}

/** Face index ranges per mouth material group */
export interface MouthGroups {
  teeth: MouthFaceGroup;
  gums: MouthFaceGroup;
  tongue: MouthFaceGroup;
  cavity: MouthFaceGroup;
}

/**
 * FlameModel extended with procedural mouth vertices integrated
 * into all vertex arrays. Deformation pipeline operates on n_vertices
 * generically — mouth vertices participate in shape + expression + LBS.
 */
export interface ExtendedFlameModel extends FlameModel {
  /** Face index ranges per mouth material, or null if extension failed */
  mouthGroups: MouthGroups | null;
  /** Original FLAME vertex count before mouth extension */
  originalVertexCount: number;
}
