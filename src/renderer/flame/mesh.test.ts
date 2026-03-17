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
    exprdirs: new Float32Array(3 * 3 * 100),
    albedoMean: new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
    albedoBasis: new Float32Array(3 * 3 * 10).fill(0.1),
    n_vertices: 3,
    n_faces: 1,
    n_shape: 100,
    n_expr: 100,
    n_albedo_components: 10,
  };

  const mockPipeline: FlamePipeline = {
    model: mockModel,
    deformFace: vi.fn((params: FaceParams): FlameBuffers => ({
      vertices: new Float32Array(params.shape.length > 0 && params.shape[0] === 1 ? [0, 0, 1, 1, 0, 1, 0, 1, 1] : [0, 0, 0, 1, 0, 0, 0, 1, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    })),
  };

  it('should initialize with correct vertex count and indices', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    
    expect(meshWrapper.mesh).toBeDefined();
    expect(meshWrapper.mesh.geometry).toBeDefined();
    
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    expect(geometry.getAttribute('position').count).toBe(3);
    expect(geometry.getAttribute('color').count).toBe(3);
    expect(geometry.index?.count).toBe(3);
    expect(meshWrapper.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
    
    const material = meshWrapper.mesh.material as THREE.MeshStandardMaterial;
    expect(material.vertexColors).toBe(true);
  });

  it('should update geometry in-place when updateFromParams is called', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
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

  it('setCrisis is a no-op (expression geometry carries crisis signal)', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const material = meshWrapper.mesh.material as THREE.MeshStandardMaterial;

    const colorBefore = material.color.clone();
    meshWrapper.setCrisis(0);
    meshWrapper.setCrisis(1);
    const colorAfter = material.color.clone();

    // Color should not change
    expect(colorBefore.getHex()).toBe(colorAfter.getHex());
  });

  it('should generate deterministic colors for different ticker IDs', () => {
    const meshWrapper1 = new FlameFaceMesh(mockPipeline, 'BTC');
    const meshWrapper2 = new FlameFaceMesh(mockPipeline, 'AAPL');
    
    const colors1 = (meshWrapper1.mesh.geometry as THREE.BufferGeometry).getAttribute('color').array;
    const colors2 = (meshWrapper2.mesh.geometry as THREE.BufferGeometry).getAttribute('color').array;
    
    // They should be different
    let different = false;
    for (let i = 0; i < colors1.length; i++) {
      if (colors1[i] !== colors2[i]) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('should initialize and update clipping plane based on mesh position', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const material = meshWrapper.mesh.material as THREE.MeshStandardMaterial;

    expect(material.clippingPlanes).toBeDefined();
    expect(material.clippingPlanes?.length).toBe(1);
    
    const plane = material.clippingPlanes![0] as THREE.Plane;
    expect(plane.normal.y).toBe(1);
    // Initial constant should be 0.12 because position is 0 and scale is 1
    expect(plane.constant).toBe(0.12);

    // Update position and params
    meshWrapper.mesh.position.set(0, 10, 0);
    const params: FaceParams = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(50).fill(0),
    };
    meshWrapper.updateFromParams(params);

    // Plane is y + 0.12 = 0 in local space.
    // In world space at y=10, it should be (y - 10) + 0.12 = 0 => y - 9.88 = 0.
    // So constant should be -9.88.
    expect(plane.constant).toBeCloseTo(-9.88);
  });

  it('should clean up resources on dispose', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    
    expect(() => meshWrapper.dispose()).not.toThrow();
  });
});
