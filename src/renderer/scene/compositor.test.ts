import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { SceneCompositor } from './compositor';
import { FlameFaceMesh } from '../flame/mesh';

// Mock FlameFaceMesh to avoid actual WebGL/Three.js geometry/material logic
vi.mock('../flame/mesh', () => {
  return {
    FlameFaceMesh: vi.fn().mockImplementation(() => ({
      mesh: new THREE.Mesh(),
      updateFromParams: vi.fn(),
      setCrisis: vi.fn(),
      dispose: vi.fn(),
    })),
  };
});

describe('SceneCompositor', () => {
  let scene: THREE.Scene;
  let pipeline: any;
  let compositor: SceneCompositor;

  beforeEach(() => {
    scene = new THREE.Scene();
    pipeline = {
      model: {
        n_vertices: 4,
        faces: new Uint32Array([0, 1, 2, 0, 2, 3]),
      },
    };
    compositor = new SceneCompositor(scene, pipeline as any);
    vi.clearAllMocks();
  });

  it('setInstances creates new meshes for new ids', () => {
    const instances: any[] = [
      { id: '1', position: [1, 2, 3], params: { shape: new Float32Array(100), expression: new Float32Array(50) }, frame: { deviation: 0.5 } },
      { id: '2', position: [4, 5, 6], params: { shape: new Float32Array(100), expression: new Float32Array(50) }, frame: { deviation: -0.2 } },
    ];

    compositor.setInstances(instances);

    expect(compositor.getMeshes().length).toBe(2);
    expect(FlameFaceMesh).toHaveBeenCalledTimes(2);

    const mesh1 = compositor.getFaceMesh('1');
    expect(mesh1).toBeDefined();
    expect(mesh1?.mesh.position.x).toBe(1);
    expect(mesh1?.mesh.position.y).toBe(2);
    expect(mesh1?.mesh.position.z).toBe(3);
    expect(mesh1?.setCrisis).toHaveBeenCalledWith(0.5);

    const mesh2 = compositor.getFaceMesh('2');
    expect(mesh2?.setCrisis).toHaveBeenCalledWith(0.2);
  });

  it('setInstances removes meshes no longer present', () => {
    const inst1: any[] = [
      { id: '1', position: [0,0,0], params: {}, frame: { deviation: 0 } },
      { id: '2', position: [0,0,0], params: {}, frame: { deviation: 0 } },
    ];
    compositor.setInstances(inst1);
    expect(compositor.getMeshes().length).toBe(2);

    const inst2: any[] = [
      { id: '2', position: [0,0,0], params: {}, frame: { deviation: 0 } },
    ];
    compositor.setInstances(inst2);

    expect(compositor.getMeshes().length).toBe(1);
    expect(compositor.getFaceMesh('1')).toBeUndefined();
    expect(compositor.getFaceMesh('2')).toBeDefined();
    expect(scene.children.length).toBe(1);
  });

  it('setInstances updates existing meshes', () => {
    const inst1: any[] = [{ id: '1', position: [0,0,0], params: { p: 1 }, frame: { deviation: 0.1 } }];
    compositor.setInstances(inst1);
    const fm = compositor.getFaceMesh('1');
    vi.clearAllMocks();

    const inst2: any[] = [{ id: '1', position: [10,10,10], params: { p: 2 }, frame: { deviation: -0.9 } }];
    compositor.setInstances(inst2);

    expect(compositor.getFaceMesh('1')).toBe(fm);
    expect(FlameFaceMesh).not.toHaveBeenCalled();
    expect(fm?.mesh.position.x).toBe(10);
    expect(fm?.updateFromParams).toHaveBeenCalledWith({ p: 2 });
    expect(fm?.setCrisis).toHaveBeenCalledWith(0.9);
  });

  it('getIdForMesh returns correct id', () => {
    const instances: any[] = [{ id: 'test-id', position: [0,0,0], params: {}, frame: { deviation: 0 } }];
    compositor.setInstances(instances);
    const fm = compositor.getFaceMesh('test-id')!;
    
    expect(compositor.getIdForMesh(fm.mesh)).toBe('test-id');
  });

  it('dispose cleans up all meshes', () => {
    const instances: any[] = [
      { id: '1', position: [0,0,0], params: {}, frame: { deviation: 0 } },
      { id: '2', position: [0,0,0], params: {}, frame: { deviation: 0 } },
    ];
    compositor.setInstances(instances);
    const fm1 = compositor.getFaceMesh('1')!;
    const fm2 = compositor.getFaceMesh('2')!;

    compositor.dispose();

    expect(scene.children.length).toBe(0);
    expect(fm1.dispose).toHaveBeenCalled();
    expect(fm2.dispose).toHaveBeenCalled();
    expect(compositor.getMeshes().length).toBe(0);
    expect(compositor.getIdForMesh(fm1.mesh)).toBeUndefined();
  });
});
