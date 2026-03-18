import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { MouthMeasurements } from './types';
import { createMouthInterior } from './interior';

function mockMeasurements(): MouthMeasurements {
  return {
    lipWidth: 0.04,
    lipHeight: 0.015,
    mouthDepth: 0.02,
    mouthCenter: new THREE.Vector3(0, -0.035, 0.06),
    jawJointPosition: new THREE.Vector3(0, -0.06, 0),
    lipVertices: [10, 11, 12, 13],
    upperLipVertices: [10, 11],
    lowerLipVertices: [12, 13],
    upperLipCenter: new THREE.Vector3(0, -0.030, 0.06),
    lowerLipCenter: new THREE.Vector3(0, -0.040, 0.06),
  };
}

/** Build a deformed vertex buffer with given upper/lower lip centroids. */
function makeDeformedVertices(
  m: MouthMeasurements,
  upperY: number,
  upperZ: number,
  lowerY: number,
  lowerZ: number,
): Float32Array {
  // Allocate enough for max vertex index + 1
  const maxIdx = Math.max(...m.upperLipVertices, ...m.lowerLipVertices);
  const buf = new Float32Array((maxIdx + 1) * 3);
  // Place upper lip vertices at the given centroid
  for (const v of m.upperLipVertices) {
    buf[v * 3] = 0;
    buf[v * 3 + 1] = upperY;
    buf[v * 3 + 2] = upperZ;
  }
  // Place lower lip vertices at the given centroid
  for (const v of m.lowerLipVertices) {
    buf[v * 3] = 0;
    buf[v * 3 + 1] = lowerY;
    buf[v * 3 + 2] = lowerZ;
  }
  return buf;
}

describe('createMouthInterior', () => {
  it('returns object with upperGroup, lowerGroup, cavityMesh', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(interior.upperGroup).toBeInstanceOf(THREE.Group);
    expect(interior.lowerGroup).toBeInstanceOf(THREE.Group);
    expect(interior.cavityMesh).toBeInstanceOf(THREE.Mesh);
  });

  it('upper group has teeth + gums children', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(interior.upperGroup.children.length).toBe(2);
  });

  it('lower group has teeth + gums + tongue children', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(interior.lowerGroup.children.length).toBe(3);
  });

  it('starts hidden', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(interior.upperGroup.visible).toBe(false);
    expect(interior.lowerGroup.visible).toBe(false);
    expect(interior.cavityMesh.visible).toBe(false);
  });

  it('always visible after update (lips occlude naturally)', () => {
    const m = mockMeasurements();
    const interior = createMouthInterior(m);
    const verts = makeDeformedVertices(m, -0.030, 0.06, -0.040, 0.06);
    interior.update(verts);
    expect(interior.upperGroup.visible).toBe(true);
    expect(interior.lowerGroup.visible).toBe(true);
    expect(interior.cavityMesh.visible).toBe(true);
  });

  it('upper group tracks deformed upper lip centroid', () => {
    const m = mockMeasurements();
    const interior = createMouthInterior(m);
    // Move upper lip centroid up by 0.01
    const verts = makeDeformedVertices(m, -0.020, 0.06, -0.040, 0.06);
    interior.update(verts);
    // Upper group Y should follow the deformed upper centroid
    expect(interior.upperGroup.position.y).toBeCloseTo(-0.020, 4);
  });

  it('lower group tracks deformed lower lip centroid', () => {
    const m = mockMeasurements();
    const interior = createMouthInterior(m);
    // Move lower lip centroid down by 0.01
    const verts = makeDeformedVertices(m, -0.030, 0.06, -0.050, 0.06);
    interior.update(verts);
    expect(interior.lowerGroup.position.y).toBeCloseTo(-0.050, 4);
  });

  it('lower group rotates when jaw opens (lower lip moves down+back)', () => {
    const m = mockMeasurements();
    const interior = createMouthInterior(m);
    // Simulate jaw opening: lower lip moves down and slightly back
    const verts = makeDeformedVertices(m, -0.030, 0.06, -0.055, 0.05);
    interior.update(verts);
    expect(interior.lowerGroup.rotation.x).not.toBe(0);
  });

  it('no rotation at rest pose (deformed matches rest)', () => {
    const m = mockMeasurements();
    const interior = createMouthInterior(m);
    // Deformed centroids match rest-pose centroids exactly
    const verts = makeDeformedVertices(m, -0.030, 0.06, -0.040, 0.06);
    interior.update(verts);
    expect(interior.lowerGroup.rotation.x).toBeCloseTo(0, 5);
  });

  it('dispose does not throw', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(() => interior.dispose()).not.toThrow();
  });
});
