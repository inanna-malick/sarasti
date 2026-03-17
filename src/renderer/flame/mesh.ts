import * as THREE from 'three';
import type { FlamePipeline } from './pipeline';
import type { FaceParams } from '../../types';

/**
 * FlameFaceMesh wraps a Three.js Mesh and manages its geometry and material.
 * It uses a procedural matcap for stylized rendering and provides an intensity
 * property to shift between calm (cool) and crisis (warm) aesthetics.
 */
export class FlameFaceMesh {
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshMatcapMaterial;
  private pipeline: FlamePipeline;

  private static matcapTexture: THREE.Texture | null = null;

  constructor(pipeline: FlamePipeline) {
    this.pipeline = pipeline;
    const { model } = pipeline;

    // 1. Create BufferGeometry
    this.geometry = new THREE.BufferGeometry();

    // Set index buffer
    this.geometry.setIndex(new THREE.BufferAttribute(model.faces, 1));

    // Create position and normal attributes
    // They will be populated in the first updateFromParams call
    const positions = new Float32Array(model.n_vertices * 3);
    const normals = new Float32Array(model.n_vertices * 3);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // 2. Create Material
    if (!FlameFaceMesh.matcapTexture) {
      FlameFaceMesh.matcapTexture = this.generateMatcapTexture();
    }

    this.material = new THREE.MeshMatcapMaterial({
      matcap: FlameFaceMesh.matcapTexture,
      color: new THREE.Color(0x888888), // Neutral base
    });

    // 3. Create Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  /**
   * Updates the mesh geometry based on face parameters.
   * @param params Shape and expression coefficients
   */
  public updateFromParams(params: FaceParams): void {
    const buffers = this.pipeline.deformFace(params);

    // Update geometry in-place
    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    positionAttr.array.set(buffers.vertices);
    normalAttr.array.set(buffers.normals);

    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;
  }

  /**
   * Set the crisis intensity (0-1) to shift the matcap tint.
   * @param intensity 0 (cool/calm) to 1 (warm/crisis)
   */
  public setCrisis(intensity: number): void {
    // Cool (blue-grey): #708090 (SlateGray)
    // Warm (orange-red): #ff4500 (OrangeRed)
    const coolColor = new THREE.Color(0x708090);
    const warmColor = new THREE.Color(0xff4500);

    this.material.color.copy(coolColor).lerp(warmColor, THREE.MathUtils.clamp(intensity, 0, 1));
  }

  /**
   * Generates a simple procedural matcap texture (grey sphere).
   */
  private generateMatcapTexture(): THREE.Texture {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Normalized coordinates from -1 to 1
        const nx = (x / size) * 2 - 1;
        const ny = (y / size) * 2 - 1;
        const r2 = nx * nx + ny * ny;

        if (r2 <= 1) {
          const nz = Math.sqrt(1 - r2);
          
          // Simple lambert-like shading for the matcap
          // Light from top-right
          const dot = nx * 0.5 + ny * 0.5 + nz * 0.707;
          const val = Math.max(0, dot) * 255;

          data[idx] = val;     // R
          data[idx + 1] = val; // G
          data[idx + 2] = val; // B
          data[idx + 3] = 255; // A
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Clean up resources.
   */
  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    // Note: matcapTexture is static and shared, so we don't dispose it here
    // unless we want to clear it globally.
  }
}
