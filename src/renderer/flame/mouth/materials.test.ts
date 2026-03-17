import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createTeethMaterial,
  createGumsMaterial,
  createTongueMaterial,
  createCavityMaterial,
} from './materials';

describe('mouth materials', () => {
  it('createTeethMaterial returns MeshStandardMaterial with correct properties', () => {
    const mat = createTeethMaterial();
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(mat.color.getHex()).toBe(0xF0E8D8);
    expect(mat.roughness).toBe(0.2);
    expect(mat.transparent).toBe(true);
  });

  it('createGumsMaterial returns MeshStandardMaterial with correct properties', () => {
    const mat = createGumsMaterial();
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(mat.color.getHex()).toBe(0x8B5E6B);
    expect(mat.roughness).toBe(0.3);
    expect(mat.transparent).toBe(true);
  });

  it('createTongueMaterial returns MeshStandardMaterial with correct properties', () => {
    const mat = createTongueMaterial();
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(mat.color.getHex()).toBe(0x7B4B5A);
    expect(mat.roughness).toBe(0.4);
    expect(mat.transparent).toBe(true);
  });

  it('createCavityMaterial returns MeshBasicMaterial (unlit)', () => {
    const mat = createCavityMaterial();
    expect(mat).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(mat.color.getHex()).toBe(0x1A0F0A);
    expect(mat.transparent).toBe(true);
  });
});
