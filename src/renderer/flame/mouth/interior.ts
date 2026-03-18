import * as THREE from 'three';
import type { MouthMeasurements, MouthInterior } from './types';
import { computeVertexCentroid } from './measurements';
import {
  createUpperTeethGeometry,
  createLowerTeethGeometry,
  createUpperGumsGeometry,
  createLowerGumsGeometry,
  createTongueGeometry,
  createCavityGeometry,
} from './geometry';
import {
  createTeethMaterial,
  createGumsMaterial,
  createTongueMaterial,
  createCavityMaterial,
} from './materials';

/**
 * Create the mouth interior assembly: teeth, gums, tongue, cavity.
 * Upper parts track upper lip centroid; lower parts track lower lip centroid.
 * Rotation derived from deformed lip vectors, not manual jaw kinematics.
 */
export function createMouthInterior(m: MouthMeasurements): MouthInterior {
  // --- Materials (shared refs for opacity control) ---
  const teethMat = createTeethMaterial();
  const gumsMat = createGumsMaterial();
  const tongueMat = createTongueMaterial();
  const cavityMat = createCavityMaterial();

  // --- Geometries ---
  const upperTeethGeo = createUpperTeethGeometry(m);
  const lowerTeethGeo = createLowerTeethGeometry(m);
  const upperGumsGeo = createUpperGumsGeometry(m);
  const lowerGumsGeo = createLowerGumsGeometry(m);
  const tongueGeo = createTongueGeometry(m);
  const cavityGeo = createCavityGeometry(m);

  // Recess depth: push geometry behind the lip surface
  const recessZ = -m.mouthDepth * 0.6;

  // --- Upper group (tracks upper lip centroid) ---
  const upperGroup = new THREE.Group();
  const upperTeeth = new THREE.Mesh(upperTeethGeo, teethMat);
  const upperGums = new THREE.Mesh(upperGumsGeo, gumsMat);
  upperTeeth.renderOrder = 3;
  upperGums.renderOrder = 2;
  upperGroup.add(upperTeeth, upperGums);
  upperGroup.position.copy(m.upperLipCenter);
  upperGroup.position.z += recessZ;

  // --- Lower group (tracks lower lip centroid) ---
  const lowerGroup = new THREE.Group();
  const lowerTeeth = new THREE.Mesh(lowerTeethGeo, teethMat);
  const lowerGums = new THREE.Mesh(lowerGumsGeo, gumsMat);
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  lowerTeeth.renderOrder = 3;
  lowerGums.renderOrder = 2;

  // Offset tongue slightly back
  tongue.position.set(0, 0, -m.mouthDepth * 0.3);

  lowerGroup.add(lowerTeeth, lowerGums, tongue);
  lowerGroup.position.copy(m.lowerLipCenter);
  lowerGroup.position.z += recessZ;

  // --- Cavity ---
  const cavityMesh = new THREE.Mesh(cavityGeo, cavityMat);
  cavityMesh.position.copy(m.mouthCenter);
  cavityMesh.position.z += recessZ - m.mouthDepth * 0.3;

  // Collect all materials for opacity control
  const allMaterials: THREE.Material[] = [teethMat, gumsMat, tongueMat, cavityMat];

  // Render mouth interior after face skin so depth test occludes behind lips
  for (const mat of allMaterials) {
    mat.depthWrite = false;
    mat.side = THREE.DoubleSide;
  }
  cavityMesh.renderOrder = 1;

  // Start hidden
  upperGroup.visible = false;
  lowerGroup.visible = false;
  cavityMesh.visible = false;

  // Rest-pose reference vector: upper→lower lip centroid direction (YZ plane)
  const restDY = m.lowerLipCenter.y - m.upperLipCenter.y;
  const restDZ = m.lowerLipCenter.z - m.upperLipCenter.z;
  const restAngle = Math.atan2(restDZ, restDY);

  return {
    upperGroup,
    lowerGroup,
    cavityMesh,

    update(deformedVertices: Float32Array): void {
      // Always visible — lips occlude naturally when mouth is closed
      upperGroup.visible = true;
      lowerGroup.visible = true;
      cavityMesh.visible = true;

      for (const mat of allMaterials) {
        (mat as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial).opacity = 1;
      }

      // Compute deformed lip centroids from vertex buffer
      const upperCenter = computeVertexCentroid(deformedVertices, m.upperLipVertices);
      const lowerCenter = computeVertexCentroid(deformedVertices, m.lowerLipVertices);

      // Position upper group at deformed upper lip centroid + recess
      upperGroup.position.copy(upperCenter);
      upperGroup.position.z += recessZ;

      // Position lower group at deformed lower lip centroid + recess
      lowerGroup.position.copy(lowerCenter);
      lowerGroup.position.z += recessZ;

      // Derive jaw rotation from deformed upper→lower vector vs rest-pose vector
      // Jaw rotates around X axis, so we measure angle change in YZ plane
      const defDY = lowerCenter.y - upperCenter.y;
      const defDZ = lowerCenter.z - upperCenter.z;
      const defAngle = Math.atan2(defDZ, defDY);
      const jawRotation = defAngle - restAngle;

      lowerGroup.rotation.x = jawRotation;

      // Tongue tracks at 0.7× jaw rotation (relative to lower group)
      tongue.rotation.x = -jawRotation * 0.3;

      // Cavity midpoint between upper and lower
      cavityMesh.position.set(
        (upperCenter.x + lowerCenter.x) / 2,
        (upperCenter.y + lowerCenter.y) / 2,
        (upperCenter.z + lowerCenter.z) / 2 + recessZ - m.mouthDepth * 0.3,
      );
    },

    dispose(): void {
      upperTeethGeo.dispose();
      lowerTeethGeo.dispose();
      upperGumsGeo.dispose();
      lowerGumsGeo.dispose();
      tongueGeo.dispose();
      cavityGeo.dispose();

      for (const mat of allMaterials) {
        mat.dispose();
      }
    },
  };
}
