import type { FaceParams } from '../../types';

/**
 * Three.js mesh wrapper for a single FLAME face.
 * Creates BufferGeometry from deformed vertices + face indices.
 * Matcap material with warm/cool tint uniform.
 */
export class FlameFaceMesh {
  updateFromParams(_params: FaceParams): void {
    throw new Error('Not implemented — see renderer/flame/mesh worktree');
  }

  dispose(): void {
    throw new Error('Not implemented');
  }
}
