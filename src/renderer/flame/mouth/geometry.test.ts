import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { MouthMeasurements } from './types';
import {
  sortVerticesIntoRing,
  buildRingStrip,
  buildRingCap,
  createTongueGeometry,
} from './geometry';

function mockMeasurements(): MouthMeasurements {
  return {
    lipWidth: 0.04,
    lipHeight: 0.015,
    mouthDepth: 0.02,
    mouthCenter: new THREE.Vector3(0, -0.035, 0.06),
    jawJointPosition: new THREE.Vector3(0, -0.06, 0),
    lipVertices: [],
    upperLipVertices: [],
    lowerLipVertices: [],
    upperLipCenter: new THREE.Vector3(0, -0.030, 0.06),
    lowerLipCenter: new THREE.Vector3(0, -0.040, 0.06),
  };
}

describe('sortVerticesIntoRing', () => {
  it('sorts vertices by angle around centroid', () => {
    // 4 vertices in a square around origin, unsorted
    const template = new Float32Array([
      1, 0, 0,   // v0: right (angle=0)
      0, 1, 0,   // v1: top (angle=π/2)
      -1, 0, 0,  // v2: left (angle=π)
      0, -1, 0,  // v3: bottom (angle=-π/2)
    ]);
    const centroid = new THREE.Vector3(0, 0, 0);
    const indices = [2, 0, 3, 1]; // shuffled

    const sorted = sortVerticesIntoRing(template, indices, centroid);
    // Expect sorted by angle: bottom (-π/2) → right (0) → top (π/2) → left (π)
    expect(sorted).toEqual([3, 0, 1, 2]);
  });

  it('does not mutate input array', () => {
    const template = new Float32Array([1, 0, 0, 0, 1, 0]);
    const centroid = new THREE.Vector3(0, 0, 0);
    const indices = [1, 0];
    sortVerticesIntoRing(template, indices, centroid);
    expect(indices).toEqual([1, 0]);
  });
});

describe('buildRingStrip', () => {
  it('produces 2 triangles per ring segment', () => {
    const ringA = [0, 1, 2];
    const ringB = [3, 4, 5];
    const faces = buildRingStrip(ringA, ringB);
    // 3 segments × 2 triangles × 3 indices = 18
    expect(faces.length).toBe(18);
  });

  it('wraps around (closed loop)', () => {
    const ringA = [0, 1, 2];
    const ringB = [3, 4, 5];
    const faces = buildRingStrip(ringA, ringB);
    // Last segment connects index 2 back to index 0
    // Should contain triangle with ringA[2]=2, ringA[0]=0, ringB[2]=5
    expect(faces).toContain(2);
    expect(faces).toContain(0);
    expect(faces).toContain(5);
  });
});

describe('buildRingCap', () => {
  it('produces N triangles for N-vertex ring', () => {
    const ring = [0, 1, 2, 3];
    const center = 10;
    const faces = buildRingCap(ring, center);
    // 4 triangles × 3 indices = 12
    expect(faces.length).toBe(12);
  });

  it('every triangle includes center vertex', () => {
    const ring = [0, 1, 2];
    const center = 10;
    const faces = buildRingCap(ring, center);
    for (let i = 0; i < faces.length; i += 3) {
      const tri = [faces[i], faces[i + 1], faces[i + 2]];
      expect(tri).toContain(center);
    }
  });
});

describe('createTongueGeometry', () => {
  it('produces valid geometry within FLAME scale', () => {
    const m = mockMeasurements();
    const geo = createTongueGeometry(m);

    const pos = geo.getAttribute('position');
    expect(pos.count).toBeGreaterThan(0);

    const norm = geo.getAttribute('normal');
    expect(norm).toBeDefined();

    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox!.getSize(size);
    expect(size.x).toBeLessThan(0.1);
    expect(size.y).toBeLessThan(0.1);
    expect(size.z).toBeLessThan(0.1);
  });
});
