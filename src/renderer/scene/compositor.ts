import * as THREE from 'three';
import type { FaceInstance } from '../../types';
import type { FlamePipeline } from '../flame/pipeline';
import { FlameFaceMesh } from '../flame/mesh';

/**
 * Manages N FlameFaceMesh instances in a Three.js scene graph.
 *
 * Responsibilities:
 * - Create/update/remove FlameFaceMesh instances as setInstances() is called
 * - Position meshes according to FaceInstance.position
 * - Call updateFromParams() and setCrisis() on each mesh
 * - Track mesh↔id mapping for picking
 *
 * Crisis intensity = Math.abs(instance.frame.deviation) clamped to [0, 1].
 */
export class SceneCompositor {
  private scene: THREE.Scene;
  private pipeline: FlamePipeline;
  private meshes: Map<string, FlameFaceMesh> = new Map();
  private meshToId: Map<THREE.Mesh, string> = new Map();

  constructor(scene: THREE.Scene, pipeline: FlamePipeline) {
    this.scene = scene;
    this.pipeline = pipeline;
  }

  /** Get all Three.js meshes (for raycasting). */
  getMeshes(): THREE.Mesh[] {
    return Array.from(this.meshes.values()).map(fm => fm.mesh);
  }

  /** Map a Three.js mesh back to a face id. */
  getIdForMesh(mesh: THREE.Mesh): string | undefined {
    return this.meshToId.get(mesh);
  }

  /** Get the underlying FlameFaceMesh by id. */
  getFaceMesh(id: string): FlameFaceMesh | undefined {
    return this.meshes.get(id);
  }

  /**
   * Sync the scene graph to match the given instances.
   * Creates new meshes, updates existing, removes stale.
   */
  setInstances(_instances: FaceInstance[]): void {
    throw new Error('Not implemented — compositor Dev worktree');
  }

  dispose(): void {
    for (const fm of this.meshes.values()) {
      this.scene.remove(fm.mesh);
      fm.dispose();
    }
    this.meshes.clear();
    this.meshToId.clear();
  }
}
