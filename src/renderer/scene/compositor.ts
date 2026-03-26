import * as THREE from 'three';
import type { FaceInstance } from '../../types';
import type { FlamePipeline } from '../flame/pipeline';
import { FlameFaceMesh } from '../flame/mesh';
import { FACE_MESH_SCALE } from '../constants';
import { HudRings3D } from '../../ui/HudRings3D';
import { computeCircumplex } from '../../binding/chords';
import type { DatasetStats } from '../../data/stats';
import type { RingSignal } from '../../ui/types';
import { RING_META } from '../../ui/ringMeta';
import { useStore } from '../../store';

/**
 * Manages N FlameFaceMesh instances in a Three.js scene graph.
 *
 * Responsibilities:
 * - Create/update/remove FlameFaceMesh instances as setInstances() is called
 * - Position meshes according to FaceInstance.position
 * - Call updateFromParams() and setCrisis() on each mesh
 * - Track mesh↔id mapping for picking
 * - Create/update HudRings3D per face with circumplex signals
 *
 * Crisis intensity = Math.abs(instance.frame.deviation) clamped to [0, 1].
 */
export class SceneCompositor {
  private scene: THREE.Scene;
  private pipeline: FlamePipeline;
  private meshes: Map<string, FlameFaceMesh> = new Map();
  private meshToId: Map<THREE.Mesh, string> = new Map();
  private faceGroups: Map<string, THREE.Group> = new Map();
  private hudRings: Map<string, HudRings3D> = new Map();

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

  /** Tick all HudRings3D for arc animation. Call from animation loop. */
  tickHudRings(): void {
    for (const hud of this.hudRings.values()) {
      hud.tick();
    }
  }

  /**
   * Sync the scene graph to match the given instances.
   * Creates new meshes, updates existing, removes stale.
   */
  setInstances(instances: FaceInstance[]): void {
    const stats = useStore.getState().datasetStats;

    // 1. Build a Set of incoming ids.
    const incomingIds = new Set(instances.map(inst => inst.id));

    // 2. Remove meshes whose id is no longer present.
    for (const [id, fm] of this.meshes.entries()) {
      if (!incomingIds.has(id)) {
        const group = this.faceGroups.get(id);
        if (group) {
          this.scene.remove(group);
          this.faceGroups.delete(id);
        }
        this.meshToId.delete(fm.mesh);
        fm.dispose();
        this.meshes.delete(id);
        const hud = this.hudRings.get(id);
        if (hud) {
          hud.dispose();
          this.hudRings.delete(id);
        }
      }
    }

    // 3. For each instance: update if exists, or create new.
    for (const instance of instances) {
      let fm = this.meshes.get(instance.id);
      let group = this.faceGroups.get(instance.id);
      let hud = this.hudRings.get(instance.id);

      if (!fm) {
        fm = new FlameFaceMesh(this.pipeline, instance.id);
        fm.mesh.scale.setScalar(FACE_MESH_SCALE);
        fm.mesh.userData.baseScale = FACE_MESH_SCALE;
        this.meshes.set(instance.id, fm);
        this.meshToId.set(fm.mesh, instance.id);

        // Wrap face mesh + HudRings3D in a Group
        group = new THREE.Group();
        group.add(fm.mesh);
        // Face mesh at local origin — position via group
        fm.mesh.position.set(0, 0, 0);

        // Create HudRings3D for this face — scale to match FACE_MESH_SCALE
        hud = new HudRings3D();
        hud.group.scale.setScalar(FACE_MESH_SCALE);
        // Halo center — raised half radius from previous drop
        hud.group.position.set(0, 0.0325 * FACE_MESH_SCALE, -0.05 * FACE_MESH_SCALE);
        group.add(hud.group);

        this.faceGroups.set(instance.id, group);
        this.hudRings.set(instance.id, hud);
        this.scene.add(group);
      }

      // 4. Update position (on the group, not the mesh).
      const [x, y, z] = instance.position;
      group!.position.set(x, y, z);
      fm.updateFromParams(instance.params);

      // Crisis intensity from deviation.
      const crisis = Math.min(1, Math.abs(instance.frame.deviation));
      fm.setCrisis(crisis);

      // Update HudRings3D with circumplex signals
      if (hud) {
        const activations = computeCircumplex(
          instance.frame,
          stats ?? undefined,
          instance.id,
        );
        const ringSignals: RingSignal[] = RING_META.map((meta) => ({
          name: meta.key,
          negativeColor: meta.negativeColor,
          positiveColor: meta.positiveColor,
          value: activations[meta.key],
        }));
        hud.update(ringSignals);
      }
    }
  }

  dispose(): void {
    for (const hud of this.hudRings.values()) {
      hud.dispose();
    }
    this.hudRings.clear();
    for (const fm of this.meshes.values()) {
      fm.dispose();
    }
    for (const group of this.faceGroups.values()) {
      this.scene.remove(group);
    }
    this.meshes.clear();
    this.meshToId.clear();
    this.faceGroups.clear();
  }
}
