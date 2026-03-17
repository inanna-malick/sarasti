import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
  public readonly controls: OrbitControls;
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

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
  }

  /**
   * Frame all given positions: compute bounding box, position camera
   * so everything is visible with some padding.
   */
  frameAll(positions: [number, number, number][]): void {
    if (positions.length === 0) return;

    const box = new THREE.Box3();
    const vec = new THREE.Vector3();
    for (const p of positions) {
      vec.set(p[0], p[1], p[2]);
      box.expandByPoint(vec);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const diagonal = size.length();

    // Field of view in radians
    const fov = (this.camera.fov * Math.PI) / 180;

    // Distance required to fit the diagonal into the view, plus 20% padding.
    // We use diagonal/2 because distance = (half-height) / tan(fov/2)
    const distance = (diagonal / 2) / Math.tan(fov / 2) * 1.2;

    this.camera.position.set(center.x, center.y, center.z + distance);
    this.controls.target.copy(center);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Smooth tween the camera target/lookAt to a world position.
   */
  flyTo(position: [number, number, number]): void {
    this.tweenTarget = new THREE.Vector3(position[0], position[1], position[2]);
    this.tweenStart.copy(this.controls.target);
    this.tweenProgress = 0;
  }

  /** Handle container resize. */
  handleResize(): void {
    const w = this.domElement.clientWidth;
    const h = Math.max(this.domElement.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Tick — update OrbitControls damping + flyTo tween. */
  update(dt: number): void {
    if (this.tweenTarget) {
      this.tweenProgress += dt / this.tweenDuration;
      if (this.tweenProgress >= 1) {
        this.controls.target.copy(this.tweenTarget);
        this.tweenTarget = null;
        this.tweenProgress = 0;
      } else {
        // Linear interpolation for now, simple and effective
        this.controls.target.lerpVectors(this.tweenStart, this.tweenTarget, this.tweenProgress);
      }
    }
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
