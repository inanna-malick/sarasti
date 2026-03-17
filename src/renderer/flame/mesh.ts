import * as THREE from 'three';
import type { FlamePipeline } from './pipeline';
import type { FaceParams } from '../../types';

/**
 * Realistic human skin tone palette — covers the full range of human
 * complexions. Each face gets one assigned randomly for visual differentiation.
 * Hex values sourced from dermatology references (Fitzpatrick scale + Von Luschan).
 */
const SKIN_TONES: number[] = [
  0xf5d6b8, // light / Northern European
  0xe8c4a0, // fair / Mediterranean
  0xd4a574, // olive / Persian
  0xc68642, // medium / South Asian
  0xa0724a, // tan / Middle Eastern
  0x8d5524, // brown / Southeast Asian
  0x6b3a2a, // dark brown / East African
  0x4a2912, // deep brown / West African
  0xf0c8a0, // peach / East Asian
  0xd4956b, // warm bronze / Latin American
  0xbe8a60, // caramel / North African
  0x946b4d, // chestnut / Pacific Islander
];

/**
 * FlameFaceMesh wraps a Three.js Mesh and manages its geometry and material.
 * Uses a neutral warm matcap for lighting and per-face skin tone via color.
 */
export class FlameFaceMesh {
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshMatcapMaterial;
  private pipeline: FlamePipeline;

  private static matcapTexture: THREE.Texture | null = null;
  private static skinToneIndex = 0;

  constructor(pipeline: FlamePipeline) {
    this.pipeline = pipeline;
    const { model } = pipeline;

    // 1. Create BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setIndex(new THREE.BufferAttribute(model.faces, 1));

    const positions = new Float32Array(model.n_vertices * 3);
    const normals = new Float32Array(model.n_vertices * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // 2. Create Material — shared matcap, per-face skin tone
    if (!FlameFaceMesh.matcapTexture) {
      FlameFaceMesh.matcapTexture = FlameFaceMesh.generateMatcapTexture();
    }

    // Assign skin tone: cycle through shuffled palette so each face is different
    const tone = SKIN_TONES[FlameFaceMesh.skinToneIndex % SKIN_TONES.length];
    FlameFaceMesh.skinToneIndex++;

    this.material = new THREE.MeshMatcapMaterial({
      matcap: FlameFaceMesh.matcapTexture,
      color: new THREE.Color(tone),
    });

    // 3. Create Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }

  public updateFromParams(params: FaceParams): void {
    const buffers = this.pipeline.deformFace(params);

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    positionAttr.array.set(buffers.vertices);
    normalAttr.array.set(buffers.normals);

    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;
  }

  /**
   * Set the crisis intensity (0-1). No-op — expression geometry carries
   * the crisis signal. Kept for interface compatibility.
   */
  public setCrisis(_intensity: number): void {}

  /**
   * Generates a neutral warm-white matcap for skin lighting.
   * The matcap encodes ONLY lighting — skin color comes from material.color.
   * Key light above-left, warm fill below-right, SSS at grazing angles.
   */
  private static generateMatcapTexture(): THREE.Texture {
    const size = 256;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        const nx = (x / size) * 2 - 1;
        const ny = (y / size) * 2 - 1;
        const r2 = nx * nx + ny * ny;

        if (r2 <= 1) {
          const nz = Math.sqrt(1 - r2);

          // Key light: above-left
          const key = Math.max(0, nx * -0.4 + ny * 0.55 + nz * 0.73);

          // Fill light: below-right, warm
          const fill = Math.max(0, nx * 0.35 + ny * -0.25 + nz * 0.6) * 0.4;

          // Rim light: behind, subtle
          const rim = Math.pow(Math.max(0, 1 - nz), 2) * 0.15;

          const ambient = 0.2;
          const diffuse = Math.min(1, key + fill + rim + ambient);

          // Broad specular highlight
          const specDot = Math.max(0, nx * -0.2 + ny * 0.4 + nz * 0.9);
          const spec = Math.pow(specDot, 12) * 0.25;

          // SSS: warm red glow at grazing angles (simulates light passing through skin)
          const fresnel = Math.pow(1 - nz, 3);
          const sssR = fresnel * 0.3;
          const sssG = fresnel * 0.08;

          // Base: neutral warm white that takes color tint well
          let r = diffuse * 1.0 + spec + sssR;
          let g = diffuse * 0.95 + spec + sssG;
          let b = diffuse * 0.88 + spec;

          data[idx]     = Math.min(255, r * 255) | 0;
          data[idx + 1] = Math.min(255, g * 255) | 0;
          data[idx + 2] = Math.min(255, b * 255) | 0;
          data[idx + 3] = 255;
        } else {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
