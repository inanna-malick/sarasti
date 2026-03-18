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
    lipVertices: [],
  };
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

  it('starts hidden (jaw closed)', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(interior.upperGroup.visible).toBe(false);
    expect(interior.lowerGroup.visible).toBe(false);
    expect(interior.cavityMesh.visible).toBe(false);
  });

  it('always visible after update (lips occlude naturally)', () => {
    const interior = createMouthInterior(mockMeasurements());
    interior.update(0.01);
    expect(interior.upperGroup.visible).toBe(true);
    expect(interior.lowerGroup.visible).toBe(true);
  });

  it('visible when jaw angle > 0.08', () => {
    const interior = createMouthInterior(mockMeasurements());
    interior.update(0.1);
    expect(interior.upperGroup.visible).toBe(true);
    expect(interior.lowerGroup.visible).toBe(true);
    expect(interior.cavityMesh.visible).toBe(true);
  });

  it('lower group rotates with jaw angle', () => {
    const interior = createMouthInterior(mockMeasurements());
    interior.update(0.15);
    expect(interior.lowerGroup.rotation.x).not.toBe(0);
  });

  it('dispose does not throw', () => {
    const interior = createMouthInterior(mockMeasurements());
    expect(() => interior.dispose()).not.toThrow();
  });
});
