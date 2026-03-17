import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { FlameFaceMesh } from './mesh';
import type { FlamePipeline } from './pipeline';
import type { FlameModel, FlameBuffers } from './types';
import type { FaceParams } from '../../types';

describe('FlameFaceMesh', () => {
  const mockModel: FlameModel = {
    template: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), // 3 vertices
    faces: new Uint32Array([0, 1, 2]),                      // 1 face
    shapedirs: new Float32Array(3 * 3 * 100),
    exprdirs: new Float32Array(3 * 3 * 50),
    n_vertices: 3,
    n_faces: 1,
    n_shape: 100,
    n_expr: 50,
  };

  const mockPipeline: FlamePipeline = {
    model: mockModel,
    deformFace: vi.fn((params: FaceParams): FlameBuffers => ({
      vertices: new Float32Array(params.shape.length > 0 && params.shape[0] === 1 ? [0, 0, 1, 1, 0, 1, 0, 1, 1] : [0, 0, 0, 1, 0, 0, 0, 1, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    })),
  };

  it('should initialize with correct vertex count and indices', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline);
    
    expect(meshWrapper.mesh).toBeDefined();
    expect(meshWrapper.mesh.geometry).toBeDefined();
    
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    expect(geometry.getAttribute('position').count).toBe(3);
    expect(geometry.index?.count).toBe(3);
    expect(meshWrapper.mesh.material).toBeInstanceOf(THREE.MeshMatcapMaterial);
  });

  it('should update geometry in-place when updateFromParams is called', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline);
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    const params: FaceParams = {
      shape: new Float32Array(100).fill(1),
      expression: new Float32Array(50).fill(0),
    };

    meshWrapper.updateFromParams(params);

    expect(mockPipeline.deformFace).toHaveBeenCalledWith(params);
    // Based on our mockDeformFace logic:
    expect(positionAttr.array[2]).toBe(1); // Z-coordinate of first vertex shifted to 1
  });

  it('should update material color based on intensity via setCrisis', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline);
    const material = meshWrapper.mesh.material as THREE.MeshMatcapMaterial;

    // Calm intensity
    meshWrapper.setCrisis(0);
    const calmColor = material.color.clone();

    // Crisis intensity
    meshWrapper.setCrisis(1);
    const crisisColor = material.color.clone();

    expect(calmColor.getHex()).not.toBe(crisisColor.getHex());
    // Cool (SlateGray #708090) vs Warm (OrangeRed #FF4500)
    expect(calmColor.getHex()).toBe(0x708090);
    expect(crisisColor.getHex()).toBe(0xff4500);
  });

  it('should clean up resources on dispose', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline);
    
    expect(() => meshWrapper.dispose()).not.toThrow();
  });
});
