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
   * Set the crisis intensity (0-1). Currently a no-op — expression geometry
   * carries the crisis signal. Kept for interface compatibility.
   */
  public setCrisis(_intensity: number): void {
    // No-op: single matcap, no color tinting.
  }

  /**
   * Generates a warm skin-tone matcap texture with realistic lighting.
   * Key light from above-left, warm fill from below-right, soft ambient.
   */
  private generateMatcapTexture(): THREE.Texture {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    // Skin base color (olive/Mediterranean tone)
    const baseR = 0.76, baseG = 0.60, baseB = 0.50;
    // Warm highlight (sunlit skin)
    const hiR = 0.95, hiG = 0.85, hiB = 0.75;
    // Shadow (warm dark, not grey)
    const shR = 0.35, shG = 0.22, shB = 0.18;
    // Subsurface scatter tint (warm red at grazing angles)
    const sssR = 0.85, sssG = 0.35, sssB = 0.25;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        const nx = (x / size) * 2 - 1;
        const ny = (y / size) * 2 - 1;
        const r2 = nx * nx + ny * ny;

        if (r2 <= 1) {
          const nz = Math.sqrt(1 - r2);

          // Key light: above-left, warm white
          const keyDir = [-.5, .6, .6];
          const keyLen = Math.sqrt(keyDir[0] ** 2 + keyDir[1] ** 2 + keyDir[2] ** 2);
          const key = Math.max(0, (nx * keyDir[0] + ny * keyDir[1] + nz * keyDir[2]) / keyLen);

          // Fill light: below-right, dimmer and warmer
          const fillDir = [.4, -.3, .5];
          const fillLen = Math.sqrt(fillDir[0] ** 2 + fillDir[1] ** 2 + fillDir[2] ** 2);
          const fill = Math.max(0, (nx * fillDir[0] + ny * fillDir[1] + nz * fillDir[2]) / fillLen) * 0.35;

          // Ambient
          const ambient = 0.15;

          // Total diffuse
          const diffuse = Math.min(1, key + fill + ambient);

          // Specular (key light only, broad and soft)
          // Half-vector with view (0,0,1)
          const hx = keyDir[0] / keyLen;
          const hy = keyDir[1] / keyLen;
          const hz = (keyDir[2] / keyLen + 1) / 2; // simplified half-vector
          const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
          const specDot = Math.max(0, (nx * hx + ny * hy + nz * hz) / hLen);
          const spec = Math.pow(specDot, 20) * 0.3;

          // Subsurface scattering approximation: glow at grazing angles
          const fresnel = Math.pow(1 - nz, 3) * 0.4;

          // Lerp base→shadow in dark areas, base→highlight in bright areas
          let r, g, b;
          if (diffuse < 0.5) {
            const t = diffuse * 2; // 0→1 in shadow range
            r = shR + (baseR - shR) * t;
            g = shG + (baseG - shG) * t;
            b = shB + (baseB - shB) * t;
          } else {
            const t = (diffuse - 0.5) * 2; // 0→1 in highlight range
            r = baseR + (hiR - baseR) * t;
            g = baseG + (hiG - baseG) * t;
            b = baseB + (hiB - baseB) * t;
          }

          // Add SSS at edges
          r += sssR * fresnel;
          g += sssG * fresnel;
          b += sssB * fresnel;

          // Add specular
          r += spec;
          g += spec;
          b += spec;

          data[idx] = Math.min(255, r * 255) | 0;
          data[idx + 1] = Math.min(255, g * 255) | 0;
          data[idx + 2] = Math.min(255, b * 255) | 0;
          data[idx + 3] = 255;
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
