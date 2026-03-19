import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { FlameFaceMesh } from './mesh';
import type { FlamePipeline } from './pipeline';
import type { FlameBuffers } from './types';
import type { ExtendedFlameModel } from './mouth/types';
import type { FaceParams } from '../../types';
import { zeroPose } from '../../types';

describe('FlameFaceMesh', () => {
  const mockModel: ExtendedFlameModel = {
    template: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), // 3 vertices
    faces: new Uint32Array([0, 1, 2]),                      // 1 face
    shapedirs: new Float32Array(3 * 3 * 100),
    exprdirs: new Float32Array(3 * 3 * 100),
    albedoMean: new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]),
    albedoBasis: new Float32Array(3 * 3 * 10).fill(0.1),
    weights: new Float32Array(3 * 5),
    posedirs: new Float32Array(36 * 3 * 3),
    jRegressor: new Float32Array(5 * 3),
    kintreeTable: [[-1, 0, 1, 1, 1], [0, 1, 2, 3, 4]],
    n_vertices: 3,
    n_faces: 1,
    n_shape: 100,
    n_expr: 100,
    n_joints: 5,
    n_pose_features: 36,
    n_albedo_components: 10,
    mouthGroups: null,
    originalVertexCount: 3,
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
    
    // Single skin material (eyes use FLAME albedo defaults, no custom shader)
    expect(Array.isArray(meshWrapper.mesh.material)).toBe(true);
    const materials = meshWrapper.mesh.material as THREE.Material[];
    expect(materials.length).toBe(1);

    const faceMaterial = materials[0] as THREE.MeshStandardMaterial;
    expect(faceMaterial.vertexColors).toBe(true);
  });

  it('should update geometry in-place when updateFromParams is called', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

    const params: FaceParams = {
      shape: new Float32Array(100).fill(1),
      expression: new Float32Array(50).fill(0),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0,
    };

    meshWrapper.updateFromParams(params);

    expect(mockPipeline.deformFace).toHaveBeenCalledWith(params);
    // Based on our mockDeformFace logic:
    expect(positionAttr.array[2]).toBe(1); // Z-coordinate of first vertex shifted to 1
  });

  it('setCrisis is a no-op (expression geometry carries crisis signal)', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const materials = meshWrapper.mesh.material as THREE.Material[];
    const material = materials[0] as THREE.MeshStandardMaterial;

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

  it('should modulate vertex colors based on flush', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    
    const colorsBefore = (colorAttr.array as Float32Array).slice();

    const params: FaceParams = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(50).fill(0),
      pose: zeroPose(),
      flush: 0.5,
      fatigue: 0,
    };

    meshWrapper.updateFromParams(params);
    
    const colorsAfter = colorAttr.array as Float32Array;
    
    let different = false;
    for (let i = 0; i < colorsBefore.length; i++) {
      if (colorsBefore[i] !== colorsAfter[i]) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('should modulate vertex colors based on fatigue', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    
    const colorsBefore = (colorAttr.array as Float32Array).slice();

    const params: FaceParams = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(50).fill(0),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0.5,
    };

    meshWrapper.updateFromParams(params);
    
    const colorsAfter = colorAttr.array as Float32Array;
    
    let different = false;
    for (let i = 0; i < colorsBefore.length; i++) {
      if (colorsBefore[i] !== colorsAfter[i]) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('should clamp vertex colors to [0, 1] range', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    const geometry = meshWrapper.mesh.geometry as THREE.BufferGeometry;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;

    const params: FaceParams = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(50).fill(0),
      pose: zeroPose(),
      flush: 10.0, // Extreme flush
      fatigue: 10.0, // Extreme fatigue
    };

    meshWrapper.updateFromParams(params);
    
    const colors = colorAttr.array as Float32Array;
    for (let i = 0; i < colors.length; i++) {
      expect(colors[i]).toBeGreaterThanOrEqual(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
    }
  });

  it('should clean up resources on dispose', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    
    expect(() => meshWrapper.dispose()).not.toThrow();
  });

  it('gracefully handles no lip vertices (no mouth interior)', () => {
    // mockModel has all-zero weights → no lip vertices → mouthInterior is null
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');

    // No mouth interior children (only scene graph children from Three.js internals)
    const mouthGroups = meshWrapper.mesh.children.filter(c => c instanceof THREE.Group);
    expect(mouthGroups.length).toBe(0);

    // updateFromParams with jaw open should not throw
    const params: FaceParams = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(100).fill(0),
      pose: { ...zeroPose(), jaw: 0.15 },
      flush: 0,
      fatigue: 0,
    };
    expect(() => meshWrapper.updateFromParams(params)).not.toThrow();
    expect(() => meshWrapper.dispose()).not.toThrow();
  });

  it('should handle missing pose in updateFromParams without throwing', () => {
    const meshWrapper = new FlameFaceMesh(mockPipeline, 'BTC');
    
    // Construct FaceParams with missing pose
    const params = {
      shape: new Float32Array(100).fill(0),
      expression: new Float32Array(50).fill(0),
      // pose is missing
      flush: 0,
      fatigue: 0,
    } as any;

    expect(() => meshWrapper.updateFromParams(params)).not.toThrow();
  });
});
