import * as THREE from 'three';
import type { MouthMeasurements } from './types';

/**
 * Sort vertex indices into ring order via angular sort in the XY plane,
 * then decimate to ~targetCount evenly-spaced vertices.
 * The decimation removes the dense vertex clusters on the upper lip
 * that cause nearest-neighbor and ring-strip artifacts.
 */
export function sortVerticesIntoRing(
  template: Float32Array,
  indices: number[],
  centroid: THREE.Vector3,
  targetCount = 24,
): number[] {
  if (indices.length <= 2) return [...indices];

  const cx = centroid.x;
  const cy = centroid.y;

  // Sort by angle in XY plane around centroid
  const sorted = [...indices].sort((a, b) => {
    const angleA = Math.atan2(template[a * 3 + 1] - cy, template[a * 3] - cx);
    const angleB = Math.atan2(template[b * 3 + 1] - cy, template[b * 3] - cx);
    return angleA - angleB;
  });

  // Decimate: pick ~targetCount evenly spaced vertices from the sorted ring
  if (sorted.length <= targetCount) return sorted;

  const step = sorted.length / targetCount;
  const decimated: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    decimated.push(sorted[Math.round(i * step) % sorted.length]);
  }
  return decimated;
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
 * Create a U-shaped teeth wall: a forward-facing strip positioned behind the lips.
 * Unlike the concentric ring recession (which angles away from camera),
 * this creates geometry with surface area facing +Z (toward the viewer),
 * making the teeth visible as a white strip when the mouth opens.
 *
 * Returns positions, normals, and indices for the teeth geometry.
 * The teeth arc follows the upper or lower lip boundary.
 */
export function createTeethArcGeometry(
  m: MouthMeasurements,
  which: 'upper' | 'lower',
): { positions: number[]; indices: number[] } {
  const segs = 10;
  const arcWidth = m.lipWidth * 0.38;     // narrow arc, well within lip edges
  const teethHeight = m.lipHeight * 0.12; // thin teeth strip
  const recess = m.lipWidth * 0.22;       // deep behind lip surface to prevent poke-through

  const positions: number[] = [];
  const indices: number[] = [];

  const cx = m.mouthCenter.x;
  const cz = m.mouthCenter.z - recess;

  // Teeth Y: upper teeth hang from upper lip center,
  // lower teeth rise from lower lip center
  const baseY = which === 'upper'
    ? m.upperLipCenter.y - teethHeight * 0.3
    : m.lowerLipCenter.y + teethHeight * 0.3;

  const heightDir = which === 'upper' ? -1 : 1;

  // Build a U-shaped quad strip: front row + back row
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    // Arc from -π to 0 (upper) or 0 to π (lower)
    const angle = which === 'upper'
      ? Math.PI + t * Math.PI  // π → 2π (bottom half of circle)
      : t * Math.PI;            // 0 → π (top half)

    const x = cx + Math.cos(angle) * arcWidth * 0.5;
    const curvature = Math.sin(angle); // 0 at edges, 1 at center

    // Front edge (slightly behind lip surface)
    const frontZ = cz;
    positions.push(x, baseY, frontZ);

    // Back edge (recessed deeper, shifted vertically into mouth)
    const backY = baseY + heightDir * teethHeight * Math.abs(curvature);
    const backZ = cz - recess * 0.4;
    positions.push(x, backY, backZ);
  }

  // Build quad strip between front/back rows
  for (let i = 0; i < segs; i++) {
    const f0 = i * 2;       // front[i]
    const b0 = i * 2 + 1;   // back[i]
    const f1 = (i + 1) * 2; // front[i+1]
    const b1 = (i + 1) * 2 + 1;

    if (which === 'upper') {
      // CCW winding for front face visible from +Z
      indices.push(f0, f1, b0);
      indices.push(f1, b1, b0);
    } else {
      indices.push(f0, b0, f1);
      indices.push(f1, b0, b1);
    }
  }

  return { positions, indices };
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
