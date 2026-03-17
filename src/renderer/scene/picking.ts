import * as THREE from 'three';
import type { SceneCompositor } from './compositor';
import { HIGHLIGHT_EMISSIVE_BOOST, DIM_OPACITY } from '../constants';

/**
 * Raycasting: screen coords → face id.
 * Highlight effect: emissive boost on hovered mesh.
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
  getInstanceAtScreenPos(_x: number, _y: number): string | null {
    throw new Error('Not implemented — picking Dev worktree');
  }

  /**
   * Highlight a face by id. Pass null to clear.
   * Highlighted face gets emissive boost.
   * All other faces get dimmed opacity when something is highlighted.
   */
  highlightInstance(_id: string | null): void {
    throw new Error('Not implemented — picking Dev worktree');
  }

  dispose(): void {
    // Clear highlight state
    this.highlightInstance(null);
  }
}
