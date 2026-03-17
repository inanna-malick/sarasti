import * as THREE from 'three';
import type { MouthMeasurements } from './types';

const ARCH_SEGMENTS = 24;
const RADIAL_SEGMENTS = 4;

/**
 * Build a horseshoe arch (semicircular in XZ, extruded in Y).
 * Sine-wave displacement along the arch gives subtle tooth divisions.
 */
function buildTeethArch(
  width: number,
  height: number,
  depth: number,
  toothFreq: number,
  toothAmp: number,
): THREE.BufferGeometry {
  const halfW = width / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate arch vertices: two rows (front/back) along semicircle
  for (let row = 0; row <= RADIAL_SEGMENTS; row++) {
    const t = row / RADIAL_SEGMENTS;
    const y = (t - 0.5) * height;

    for (let col = 0; col <= ARCH_SEGMENTS; col++) {
      const u = col / ARCH_SEGMENTS;
      const angle = Math.PI * u; // 0 to PI (semicircle)

      const baseX = Math.cos(angle) * halfW;
      const baseZ = -Math.sin(angle) * depth;

      // Sine-wave displacement for tooth divisions
      const toothDisp = Math.sin(u * Math.PI * toothFreq) * toothAmp;
      const x = baseX;
      const z = baseZ - toothDisp;

      positions.push(x, y, z);

      // Approximate normal: pointing outward from arch center
      const nx = Math.cos(angle);
      const nz = -Math.sin(angle);
      const len = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push(nx / len, 0, nz / len);
    }
  }

  // Build index buffer
  const stride = ARCH_SEGMENTS + 1;
  for (let row = 0; row < RADIAL_SEGMENTS; row++) {
    for (let col = 0; col < ARCH_SEGMENTS; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * Upper teeth: smooth arch with subtle sine-wave tooth divisions.
 */
export function createUpperTeethGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const width = m.lipWidth * 0.35;
  const height = m.lipHeight * 0.15;
  const depth = m.mouthDepth * 0.4;
  return buildTeethArch(width, height, depth, 8, depth * 0.08);
}

/**
 * Lower teeth: mirror of upper, slightly smaller.
 */
export function createLowerTeethGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const width = m.lipWidth * 0.32;
  const height = m.lipHeight * 0.12;
  const depth = m.mouthDepth * 0.35;
  return buildTeethArch(width, height, depth, 8, depth * 0.06);
}

/**
 * Build a gum ridge: wider/taller arch wrapping around teeth.
 */
function buildGumGeometry(
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const halfW = width / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const rows = 3;
  const cols = ARCH_SEGMENTS;

  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const y = (t - 0.5) * height;

    for (let col = 0; col <= cols; col++) {
      const u = col / cols;
      const angle = Math.PI * u;

      // Gums are slightly wider and further back than teeth
      const x = Math.cos(angle) * halfW;
      const z = -Math.sin(angle) * depth - depth * 0.15;

      positions.push(x, y, z);

      const nx = Math.cos(angle);
      const nz = -Math.sin(angle);
      const len = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push(nx / len, 0, nz / len);
    }
  }

  const stride = cols + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * Upper gums: wraps around upper teeth arch.
 */
export function createUpperGumsGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const width = m.lipWidth * 0.4;
  const height = m.lipHeight * 0.2;
  const depth = m.mouthDepth * 0.45;
  return buildGumGeometry(width, height, depth);
}

/**
 * Lower gums: wraps around lower teeth.
 */
export function createLowerGumsGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const width = m.lipWidth * 0.38;
  const height = m.lipHeight * 0.18;
  const depth = m.mouthDepth * 0.4;
  return buildGumGeometry(width, height, depth);
}

/**
 * Tongue: flattened ellipsoid stub.
 */
export function createTongueGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const EPS = 1e-6;
  const widthRadius = Math.max(EPS, m.lipWidth * 0.15);
  const heightRadius = Math.max(EPS, m.lipHeight * 0.06);
  const lengthRadius = Math.max(EPS, m.mouthDepth * 0.3);

  const widthSegs = 12;
  const heightSegs = 6;

  // Use a sphere geometry scaled to ellipsoid proportions
  const geo = new THREE.SphereGeometry(1, widthSegs, heightSegs, 0, Math.PI * 2, 0, Math.PI);

  // Scale to ellipsoid
  const posAttr = geo.getAttribute('position');
  const normAttr = geo.getAttribute('normal');
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i) * widthRadius;
    const y = posAttr.getY(i) * heightRadius;
    const z = posAttr.getZ(i) * lengthRadius;
    posAttr.setXYZ(i, x, y, z);

    // Rescale normals for ellipsoid
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

/**
 * Cavity: half-cylinder backdrop behind teeth for depth illusion.
 */
export function createCavityGeometry(m: MouthMeasurements): THREE.BufferGeometry {
  const radius = m.lipWidth * 0.2;
  const length = m.mouthDepth * 0.8;
  const segs = 16;
  const rows = 4;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Half-cylinder: semicircle in XY, extruded along -Z
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const z = -t * length;

    for (let col = 0; col <= segs; col++) {
      const u = col / segs;
      const angle = Math.PI * u;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.6; // flatten vertically

      positions.push(x, y, z);
      // Normals point inward (toward center of cavity)
      normals.push(-Math.cos(angle), -Math.sin(angle) * 0.6, 0);
    }
  }

  const stride = segs + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < segs; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      // Winding order reversed so normals face inward
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}
