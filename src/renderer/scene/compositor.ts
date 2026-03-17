import type { FaceInstance } from '../../types';
import * as THREE from 'three';

/**
 * Manages N face meshes in a Three.js scene graph.
 * Creates/updates/removes meshes as instances change.
 */
export class SceneCompositor {
  constructor(_scene: THREE.Scene) {}

  setInstances(_instances: FaceInstance[]): void {
    throw new Error('Not implemented — see renderer/scene/compositor worktree');
  }

  dispose(): void {
    throw new Error('Not implemented');
  }
}
