import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// Mock OrbitControls to avoid DOM dependencies in Node environment
vi.mock('three/addons/controls/OrbitControls.js', () => {
  return {
    OrbitControls: vi.fn().mockImplementation((camera, domElement) => ({
      camera,
      domElement,
      enableDamping: false,
      dampingFactor: 0,
      target: new THREE.Vector3(),
      update: vi.fn(),
      dispose: vi.fn(),
    })),
  };
});

import { CameraController } from './camera';

describe('CameraController', () => {
  let mockDom: HTMLElement;

  beforeEach(() => {
    mockDom = {
      clientWidth: 1000,
      clientHeight: 500,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      style: {
        cursor: '',
        touchAction: '',
      },
      dispatchEvent: vi.fn(),
    } as unknown as HTMLElement;
    
    // Global mocks for Node environment
    if (typeof (global as any).document === 'undefined') {
      (global as any).document = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }
    if (typeof (global as any).window === 'undefined') {
      (global as any).window = global;
    }
  });

  it('initializes with default settings', () => {
    const controller = new CameraController(mockDom);
    expect(controller.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(controller.controls).toBeDefined();
    expect(controller.controls.enableDamping).toBe(true);
    expect(controller.controls.dampingFactor).toBe(0.1);
    controller.dispose();
  });

  it('frameAll positions correctly', () => {
    const controller = new CameraController(mockDom);
    // 10x10x10 cube centered at origin
    const positions: [number, number, number][] = [
      [-5, -5, -5],
      [5, 5, 5],
    ];
    controller.frameAll(positions);
    
    // Bounding box center is at (0, 0, 0)
    expect(controller.controls.target.x).toBeCloseTo(0);
    expect(controller.controls.target.y).toBeCloseTo(0);
    expect(controller.controls.target.z).toBeCloseTo(0);
    
    // Camera should be pushed back along Z
    expect(controller.camera.position.z).toBeGreaterThan(0);
    
    // With FOV=45 and diagonal ~17.3, distance should be significant
    expect(controller.camera.position.z).toBeGreaterThan(20);
    controller.dispose();
  });

  it('flyTo sets up tweening state and update() advances it', () => {
    const controller = new CameraController(mockDom);
    const initialTarget = controller.controls.target.clone();
    const target: [number, number, number] = [10, 20, 30];
    
    controller.flyTo(target);
    
    // Advance halfway (duration is 0.8s)
    controller.update(0.4);
    
    // Should be lerped
    expect(controller.controls.target.x).toBeCloseTo((initialTarget.x + target[0]) / 2);
    expect(controller.controls.target.y).toBeCloseTo((initialTarget.y + target[1]) / 2);
    expect(controller.controls.target.z).toBeCloseTo((initialTarget.z + target[2]) / 2);
    
    // Advance to the end
    controller.update(0.4);
    expect(controller.controls.target.x).toBeCloseTo(target[0]);
    expect(controller.controls.target.y).toBeCloseTo(target[1]);
    expect(controller.controls.target.z).toBeCloseTo(target[2]);
    
    controller.dispose();
  });

  it('handleResize updates aspect ratio', () => {
    const controller = new CameraController(mockDom);
    const initialAspect = controller.camera.aspect;
    
    // Change mock dimensions
    (mockDom as any).clientWidth = 800;
    (mockDom as any).clientHeight = 800;
    
    controller.handleResize();
    expect(controller.camera.aspect).toBe(1);
    expect(controller.camera.aspect).not.toBe(initialAspect);
    controller.dispose();
  });
});
