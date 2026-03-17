import * as THREE from 'three';

/**
 * Camera controller with OrbitControls and smooth transitions.
 */
export class CameraController {
  constructor(_camera: THREE.PerspectiveCamera, _domElement: HTMLElement) {}

  frameAll(_positions: [number, number, number][]): void {
    throw new Error('Not implemented — see renderer/scene/camera worktree');
  }

  flyTo(_position: [number, number, number]): void {
    throw new Error('Not implemented');
  }

  update(_dt: number): void {
    throw new Error('Not implemented');
  }

  dispose(): void {
    throw new Error('Not implemented');
  }
}
