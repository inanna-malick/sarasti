import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { MouthMeasurements } from './types';
import {
  createUpperTeethGeometry,
  createLowerTeethGeometry,
  createUpperGumsGeometry,
  createLowerGumsGeometry,
  createTongueGeometry,
  createCavityGeometry,
} from './geometry';

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

function validateGeometry(geo: THREE.BufferGeometry, name: string) {
  const pos = geo.getAttribute('position');
  expect(pos, `${name} should have position attribute`).toBeDefined();
  expect(pos.count, `${name} should have vertices`).toBeGreaterThan(0);

  const norm = geo.getAttribute('normal');
  expect(norm, `${name} should have normal attribute`).toBeDefined();

  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);

  // All dimensions should be within FLAME scale (< 0.1m)
  expect(size.x, `${name} X extent`).toBeLessThan(0.1);
  expect(size.y, `${name} Y extent`).toBeLessThan(0.1);
  expect(size.z, `${name} Z extent`).toBeLessThan(0.1);
}

describe('mouth geometry', () => {
  const m = mockMeasurements();

  it('createUpperTeethGeometry produces valid geometry', () => {
    validateGeometry(createUpperTeethGeometry(m), 'upperTeeth');
  });

  it('createLowerTeethGeometry produces valid geometry', () => {
    validateGeometry(createLowerTeethGeometry(m), 'lowerTeeth');
  });

  it('createUpperGumsGeometry produces valid geometry', () => {
    validateGeometry(createUpperGumsGeometry(m), 'upperGums');
  });

  it('createLowerGumsGeometry produces valid geometry', () => {
    validateGeometry(createLowerGumsGeometry(m), 'lowerGums');
  });

  it('createTongueGeometry produces valid geometry', () => {
    validateGeometry(createTongueGeometry(m), 'tongue');
  });

  it('createCavityGeometry produces valid geometry', () => {
    validateGeometry(createCavityGeometry(m), 'cavity');
  });
});
