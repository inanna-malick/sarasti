import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { FacePicker } from './picking';
import type { SceneCompositor } from './compositor';
import { DIM_OPACITY } from '../constants';

describe('FacePicker', () => {
  let camera: THREE.PerspectiveCamera;
  let compositor: SceneCompositor;
  let picker: FacePicker;
  let mockMeshes: THREE.Mesh[];

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Create mock meshes with materials that have opacity/transparent properties
    mockMeshes = [
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1), 
        new THREE.MeshMatcapMaterial({ color: 0xffffff })
      ),
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1), 
        new THREE.MeshMatcapMaterial({ color: 0xffffff })
      ),
    ];
    
    mockMeshes[0].position.set(0, 0, 0);
    mockMeshes[0].updateMatrixWorld();
    
    mockMeshes[1].position.set(5, 5, 0);
    mockMeshes[1].updateMatrixWorld();

    compositor = {
      getMeshes: vi.fn().mockReturnValue(mockMeshes),
      getIdForMesh: vi.fn().mockImplementation((mesh: THREE.Mesh) => {
        if (mesh === mockMeshes[0]) return 'face-1';
        if (mesh === mockMeshes[1]) return 'face-2';
        return undefined;
      }),
    } as unknown as SceneCompositor;

    picker = new FacePicker(camera, compositor, 1000, 1000);
  });

  it('getInstanceAtScreenPos returns id on hit', () => {
    // Center of 1000x1000 container should hit mesh at (0,0,0)
    const id = picker.getInstanceAtScreenPos(500, 500);
    expect(id).toBe('face-1');
  });

  it('getInstanceAtScreenPos returns null on miss', () => {
    // Top-left should miss both meshes
    const id = picker.getInstanceAtScreenPos(0, 0);
    expect(id).toBeNull();
  });

  it('highlightInstance scales up target and dims others', () => {
    picker.highlightInstance('face-1');
    
    expect(mockMeshes[0].scale.x).toBeCloseTo(1.05);
    const mat0 = mockMeshes[0].material as THREE.MeshMatcapMaterial;
    expect(mat0.opacity).toBe(1);
    expect(mat0.transparent).toBe(false);

    expect(mockMeshes[1].scale.x).toBe(1);
    const mat1 = mockMeshes[1].material as THREE.MeshMatcapMaterial;
    expect(mat1.opacity).toBe(DIM_OPACITY);
    expect(mat1.transparent).toBe(true);
  });

  it('highlightInstance(null) restores all meshes', () => {
    // First highlight something
    picker.highlightInstance('face-1');
    
    // Then clear
    picker.highlightInstance(null);
    
    for (const mesh of mockMeshes) {
      expect(mesh.scale.x).toBe(1);
      const mat = mesh.material as THREE.MeshMatcapMaterial;
      expect(mat.opacity).toBe(1);
      expect(mat.transparent).toBe(false);
    }
  });

  it('highlightInstance does nothing if id is same', () => {
    const spy = vi.spyOn(compositor, 'getMeshes');
    picker.highlightInstance('face-1');
    expect(spy).toHaveBeenCalledTimes(1);
    
    picker.highlightInstance('face-1');
    expect(spy).toHaveBeenCalledTimes(1); // No second call
  });

  it('setSize updates internal dimensions', () => {
    picker.setSize(2000, 2000);
    // Center of 2000x2000 should now be (1000, 1000)
    const id = picker.getInstanceAtScreenPos(1000, 1000);
    expect(id).toBe('face-1');
  });
});
