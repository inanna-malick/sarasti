import * as THREE from 'three';

/**
 * Raycasting: screen coords → face id.
 * Highlight effect on hover, dim effect on non-selected.
 */
export class FacePicker {
  constructor(_camera: THREE.Camera, _scene: THREE.Scene) {}

  getInstanceAtScreenPos(_x: number, _y: number): string | null {
    throw new Error('Not implemented — see renderer/scene/picking worktree');
  }

  highlightInstance(_id: string | null): void {
    throw new Error('Not implemented');
  }

  dispose(): void {
    throw new Error('Not implemented');
  }
}
