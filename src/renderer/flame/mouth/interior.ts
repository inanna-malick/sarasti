import * as THREE from 'three';
import type { MouthMeasurements, MouthInterior } from './types';
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

/** Jaw angle thresholds for visibility gating (radians) */
const JAW_HIDDEN_THRESHOLD = 0.02;
const JAW_VISIBLE_THRESHOLD = 0.08;

/**
 * Create the mouth interior assembly: teeth, gums, tongue, cavity.
 * Upper parts stay fixed relative to head; lower parts track jaw joint.
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
  const recessZ = -m.mouthDepth * 0.4;

  // --- Upper group (parents to head) ---
  const upperGroup = new THREE.Group();
  const upperTeeth = new THREE.Mesh(upperTeethGeo, teethMat);
  const upperGums = new THREE.Mesh(upperGumsGeo, gumsMat);
  upperGroup.add(upperTeeth, upperGums);
  upperGroup.position.copy(m.mouthCenter);
  upperGroup.position.y += m.lipHeight * 0.15;
  upperGroup.position.z += recessZ;

  // --- Lower group (tracks jaw joint) ---
  const lowerGroup = new THREE.Group();
  const lowerTeeth = new THREE.Mesh(lowerTeethGeo, teethMat.clone());
  const lowerGums = new THREE.Mesh(lowerGumsGeo, gumsMat.clone());
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);

  // Offset tongue slightly back
  tongue.position.set(0, 0, -m.mouthDepth * 0.3);

  lowerGroup.add(lowerTeeth, lowerGums, tongue);
  lowerGroup.position.copy(m.mouthCenter);
  lowerGroup.position.y -= m.lipHeight * 0.15;
  lowerGroup.position.z += recessZ;

  // --- Cavity ---
  const cavityMesh = new THREE.Mesh(cavityGeo, cavityMat);
  cavityMesh.position.copy(m.mouthCenter);
  cavityMesh.position.z += recessZ - m.mouthDepth * 0.3;

  // Render mouth interior behind face skin to avoid z-fighting
  upperGroup.renderOrder = -1;
  lowerGroup.renderOrder = -1;
  cavityMesh.renderOrder = -2;

  // Collect all materials for opacity control
  const allMaterials: THREE.Material[] = [
    teethMat,
    gumsMat,
    tongueMat,
    cavityMat,
    lowerTeeth.material as THREE.Material,
    lowerGums.material as THREE.Material,
  ];

  // Start hidden
  upperGroup.visible = false;
  lowerGroup.visible = false;
  cavityMesh.visible = false;

  // Jaw pivot: lower group rotates around the jaw joint position
  const jawPivot = m.jawJointPosition.clone();

  return {
    upperGroup,
    lowerGroup,
    cavityMesh,

    update(jawAngle: number): void {
      if (jawAngle < JAW_HIDDEN_THRESHOLD) {
        // Fully hidden
        upperGroup.visible = false;
        lowerGroup.visible = false;
        cavityMesh.visible = false;
        return;
      }

      upperGroup.visible = true;
      lowerGroup.visible = true;
      cavityMesh.visible = true;

      // Opacity fade in the transition zone
      if (jawAngle < JAW_VISIBLE_THRESHOLD) {
        const t = (jawAngle - JAW_HIDDEN_THRESHOLD) / (JAW_VISIBLE_THRESHOLD - JAW_HIDDEN_THRESHOLD);
        for (const mat of allMaterials) {
          (mat as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial).opacity = t;
        }
      } else {
        for (const mat of allMaterials) {
          (mat as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial).opacity = 1;
        }
      }

      // Rotate lower group around jaw joint (X-axis rotation)
      // Reset position to jaw pivot, apply rotation, offset back
      lowerGroup.position.copy(m.mouthCenter);
      lowerGroup.position.y -= m.lipHeight * 0.25;

      // Apply jaw rotation relative to jaw joint
      const dy = lowerGroup.position.y - jawPivot.y;
      const dz = lowerGroup.position.z - jawPivot.z;
      const cos = Math.cos(-jawAngle);
      const sin = Math.sin(-jawAngle);
      lowerGroup.position.y = jawPivot.y + dy * cos - dz * sin;
      lowerGroup.position.z = jawPivot.z + dy * sin + dz * cos;
      lowerGroup.rotation.x = -jawAngle;

      // Tongue tracks at 0.7× jaw rotation
      tongue.rotation.x = -jawAngle * 0.7 + jawAngle; // relative to lower group
    },

    dispose(): void {
      // Dispose geometries
      upperTeethGeo.dispose();
      lowerTeethGeo.dispose();
      upperGumsGeo.dispose();
      lowerGumsGeo.dispose();
      tongueGeo.dispose();
      cavityGeo.dispose();

      // Dispose materials (including cloned ones on lower group)
      for (const mat of allMaterials) {
        mat.dispose();
      }
    },
  };
}
