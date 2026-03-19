import * as THREE from 'three';
import type { MouthMeasurements } from './types';

/**
 * Sort vertex indices into ring order by angle around centroid.
 * Uses atan2 in the XY plane for ring ordering around the lip boundary.
 */
export function sortVerticesIntoRing(
  template: Float32Array,
  indices: number[],
  centroid: THREE.Vector3,
): number[] {
  return [...indices].sort((a, b) => {
    const ax = template[a * 3] - centroid.x;
    const ay = template[a * 3 + 1] - centroid.y;
    const bx = template[b * 3] - centroid.x;
    const by = template[b * 3 + 1] - centroid.y;
    return Math.atan2(ay, ax) - Math.atan2(by, bx);
  });
}

/**
 * Build triangle strip faces between two parallel vertex rings (closed loop).
 * Both rings must have the same length and matching vertex order.
 */
export function buildRingStrip(ringA: number[], ringB: number[]): number[] {
  const n = ringA.length;
  const faces: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    faces.push(ringA[i], ringA[next], ringB[i]);
    faces.push(ringA[next], ringB[next], ringB[i]);
  }
  return faces;
}

/**
 * Build triangle fan to cap a ring with a center vertex.
 */
export function buildRingCap(ring: number[], centerIdx: number): number[] {
  const n = ring.length;
  const faces: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    faces.push(centerIdx, ring[i], ring[next]);
  }
  return faces;
}

/**
 * Tongue: flattened ellipsoid stub.
 * Dimensions based on lipWidth (not mouthDepth which is unreliable).
 */
export function createTongueGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const EPS = 1e-6;
  const widthRadius = Math.max(EPS, m.lipWidth * 0.15);
  const heightRadius = Math.max(EPS, m.lipHeight * 0.06);
  const lengthRadius = Math.max(EPS, m.lipWidth * 0.2);

  const widthSegs = 12;
  const heightSegs = 6;

  const geo = new THREE.SphereGeometry(1, widthSegs, heightSegs, 0, Math.PI * 2, 0, Math.PI);

  const posAttr = geo.getAttribute('position');
  const normAttr = geo.getAttribute('normal');
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i) * widthRadius;
    const y = posAttr.getY(i) * heightRadius;
    const z = posAttr.getZ(i) * lengthRadius;
    posAttr.setXYZ(i, x, y, z);

    const nx = normAttr.getX(i) / widthRadius;
    const ny = normAttr.getY(i) / heightRadius;
    const nz = normAttr.getZ(i) / lengthRadius;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    normAttr.setXYZ(i, nx / len, ny / len, nz / len);
  }

  posAttr.needsUpdate = true;
  normAttr.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  return geo;
}
