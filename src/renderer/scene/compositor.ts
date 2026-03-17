import * as THREE from 'three';
import type { FaceInstance } from '../../types';
import type { FlamePipeline } from '../flame/pipeline';
import { FlameFaceMesh } from '../flame/mesh';
import { FACE_MESH_SCALE } from '../constants';

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
  setInstances(instances: FaceInstance[]): void {
    // 1. Build a Set of incoming ids.
    const incomingIds = new Set(instances.map(inst => inst.id));

    // 2. Remove meshes whose id is no longer present.
    for (const [id, fm] of this.meshes.entries()) {
      if (!incomingIds.has(id)) {
        this.scene.remove(fm.mesh);
        this.meshToId.delete(fm.mesh);
        fm.dispose();
        this.meshes.delete(id);
      }
    }

    // 3. For each instance: update if exists, or create new.
    for (const instance of instances) {
      let fm = this.meshes.get(instance.id);
      if (!fm) {
        fm = new FlameFaceMesh(this.pipeline);
        fm.mesh.scale.setScalar(FACE_MESH_SCALE);
        this.meshes.set(instance.id, fm);
        this.meshToId.set(fm.mesh, instance.id);
        this.scene.add(fm.mesh);
      }

      // 4. Update position and parameters.
      const [x, y, z] = instance.position;
      fm.mesh.position.set(x, y, z);
      fm.updateFromParams(instance.params);

      // Crisis intensity from deviation.
      const crisis = Math.min(1, Math.abs(instance.frame.deviation));
      fm.setCrisis(crisis);
    }
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
