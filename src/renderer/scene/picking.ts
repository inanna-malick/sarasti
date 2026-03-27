import * as THREE from 'three';
import type { SceneCompositor } from './compositor';
import { DIM_OPACITY } from '../constants';

/**
 * Raycasting: screen coords → face id.
 * Highlight effect: scale boost on hovered mesh.
 * Dim effect: reduce opacity on non-highlighted meshes when one is selected.
 *
 * Coordinates: x, y are in CSS pixels relative to the container element.
 * Convert to NDC (-1 to 1) before raycasting.
 *
 * Uses compositor.getMeshes() for raycast targets,
 * compositor.getIdForMesh() to resolve hits to face ids.
 */
export class FacePicker {
  private camera: THREE.Camera;
  private compositor: SceneCompositor;
  private raycaster: THREE.Raycaster;
  private containerWidth: number;
  private containerHeight: number;
  private highlightedId: string | null = null;
  private selectedId: string | null = null;

  constructor(
    camera: THREE.Camera,
    compositor: SceneCompositor,
    containerWidth: number,
    containerHeight: number,
  ) {
    this.camera = camera;
    this.compositor = compositor;
    this.raycaster = new THREE.Raycaster();
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
  }

  /** Update container dimensions (on resize). */
  setSize(width: number, height: number): void {
    this.containerWidth = width;
    this.containerHeight = height;
  }

  /**
   * Raycast from screen pixel coords → face id or null.
   * x, y are CSS pixels relative to container top-left.
   */
  getInstanceAtScreenPos(x: number, y: number): string | null {
    const ndcX = (x / this.containerWidth) * 2 - 1;
    const ndcY = -(y / this.containerHeight) * 2 + 1;

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    const meshes = this.compositor.getMeshes();
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const id = this.compositor.getIdForMesh(hit.object as THREE.Mesh);
      return id ?? null;
    }

    return null;
  }

  /**
   * Highlight a face by id. Pass null to clear.
   * Highlighted face gets scaled up.
   * All other faces get dimmed opacity when something is highlighted.
   */
  highlightInstance(id: string | null): void {
    if (this.highlightedId === id) return;

    const meshes = this.compositor.getMeshes();

    if (id === null) {
      // Restore all to default — preserve existing base scale
      for (const mesh of meshes) {
        const baseScale = mesh.userData.baseScale ?? 1;
        mesh.scale.setScalar(baseScale);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 1;
        mat.transparent = false;
      }
    } else {
      // Apply highlight and dim others — preserve existing base scale
      for (const mesh of meshes) {
        const meshId = this.compositor.getIdForMesh(mesh);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const baseScale = mesh.userData.baseScale ?? 1;

        if (meshId === id) {
          mesh.scale.setScalar(baseScale * 1.05);
          mat.opacity = 1;
          mat.transparent = false;
        } else {
          mesh.scale.setScalar(baseScale);
          mat.opacity = DIM_OPACITY;
          mat.transparent = true;
        }
      }
    }

    this.highlightedId = id;
  }

  /**
   * Track selected face id. Visual ring is handled by CSS HUD overlay.
   */
  selectInstance(id: string | null): void {
    this.selectedId = id;
  }

  dispose(): void {
    // Clear highlight state
    this.highlightInstance(null);
    this.selectInstance(null);
  }
}
