import * as THREE from 'three';
import {
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_NEAR,
  DEFAULT_CAMERA_FAR,
  DEFAULT_CAMERA_DISTANCE,
} from '../constants';

/**
 * Camera controller with OrbitControls and smooth transitions.
 *
 * Responsibilities:
 * - Owns a PerspectiveCamera + OrbitControls
 * - frameAll(positions): compute bounding box, set camera to see all faces
 * - flyTo(position): smooth tween camera target to a position
 * - update(dt): tick animation, update OrbitControls
 *
 * OrbitControls is from 'three/addons/controls/OrbitControls.js'.
 * Use enableDamping for smooth feel.
 *
 * Export the camera for use by picking (raycaster needs it).
 */
export class CameraController {
  public readonly camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // Tween state for flyTo
  private tweenTarget: THREE.Vector3 | null = null;
  private tweenProgress = 0;
  private tweenDuration = 0.8; // seconds
  private tweenStart = new THREE.Vector3();

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    const aspect = domElement.clientWidth / Math.max(domElement.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA_FOV,
      aspect,
      DEFAULT_CAMERA_NEAR,
      DEFAULT_CAMERA_FAR,
    );
    this.camera.position.set(0, 0, DEFAULT_CAMERA_DISTANCE);
  }

  /**
   * Frame all given positions: compute bounding box, position camera
   * so everything is visible with some padding.
   */
  frameAll(_positions: [number, number, number][]): void {
    throw new Error('Not implemented — camera Dev worktree');
  }

  /**
   * Smooth tween the camera target/lookAt to a world position.
   */
  flyTo(_position: [number, number, number]): void {
    throw new Error('Not implemented — camera Dev worktree');
  }

  /** Handle container resize. */
  handleResize(): void {
    const w = this.domElement.clientWidth;
    const h = Math.max(this.domElement.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Tick — update OrbitControls damping + flyTo tween. */
  update(_dt: number): void {
    throw new Error('Not implemented — camera Dev worktree');
  }

  dispose(): void {
    // OrbitControls cleanup
  }
}
