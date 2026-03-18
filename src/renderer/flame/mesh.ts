import * as THREE from 'three';
import type { FlamePipeline } from './pipeline';
import type { FaceParams } from '../../types';
import { zeroPose } from '../../types';
import { TEXTURE_CONFIG } from '../../binding/config';
import { identifyEyeVertices } from './eyes';
import { createEyeMaterial } from './eyeMaterial';
import type { MouthGroups } from './mouth/types';
import {
  createTeethMaterial,
  createGumsMaterial,
  createTongueMaterial,
  createCavityMaterial,
} from './mouth/materials';
import { identifyCheekRegion, identifyLipRegion } from './cheeks';
import type { CheekVertex } from './cheeks';

/**
 * FlameFaceMesh wraps a Three.js Mesh and manages its geometry and material.
 * Uses MeshStandardMaterial with vertex colors derived from the albedo PCA model.
 *
 * Mouth interior (teeth, gums, tongue, cavity) is integrated into the vertex
 * buffers via AGORA — mouth vertices participate in native FLAME deformation.
 */
export class FlameFaceMesh {
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshStandardMaterial;
  private leftEyeMaterial: THREE.ShaderMaterial;
  private rightEyeMaterial: THREE.ShaderMaterial;
  private teethMaterial: THREE.MeshStandardMaterial | null = null;
  private gumsMaterial: THREE.MeshStandardMaterial | null = null;
  private tongueMaterial: THREE.MeshStandardMaterial | null = null;
  private cavityMaterial: THREE.MeshBasicMaterial | null = null;
  private pipeline: FlamePipeline;
  private baseColors!: Float32Array;
  private cheekVertices: CheekVertex[];
  private lipVertices: CheekVertex[];

  constructor(pipeline: FlamePipeline, tickerId: string, eyeOverrides?: { irisRadius?: number; pupilRadius?: number }) {
    this.pipeline = pipeline;
    const { model } = pipeline;
    const mouthGroups = model.mouthGroups;

    // 1. Create BufferGeometry
    this.geometry = new THREE.BufferGeometry();

    // Identify eye vertices and faces
    const eyeGroups = identifyEyeVertices(model.weights, model.faces, model.n_vertices, model.n_joints);

    // Reorder face index buffer: non-eye → left-eye → right-eye → mouth groups
    const eyeFaceIndices = new Set([...eyeGroups.leftEyeFaces, ...eyeGroups.rightEyeFaces]);
    const originalFaceCount = mouthGroups ? mouthGroups.teeth.faceStart : model.n_faces;

    const nonEyeFaces: number[] = [];
    for (let i = 0; i < originalFaceCount; i++) {
      if (!eyeFaceIndices.has(i)) {
        nonEyeFaces.push(i);
      }
    }

    const newIndices = new Uint32Array(model.n_faces * 3);
    let offset = 0;

    // Non-eye faces (group 0: face skin)
    for (const f of nonEyeFaces) {
      newIndices[offset++] = model.faces[f * 3];
      newIndices[offset++] = model.faces[f * 3 + 1];
      newIndices[offset++] = model.faces[f * 3 + 2];
    }
    const nonEyeIndexCount = nonEyeFaces.length * 3;

    // Left eye faces (group 1)
    for (const f of eyeGroups.leftEyeFaces) {
      newIndices[offset++] = model.faces[f * 3];
      newIndices[offset++] = model.faces[f * 3 + 1];
      newIndices[offset++] = model.faces[f * 3 + 2];
    }
    const leftEyeIndexCount = eyeGroups.leftEyeFaces.length * 3;

    // Right eye faces (group 2)
    for (const f of eyeGroups.rightEyeFaces) {
      newIndices[offset++] = model.faces[f * 3];
      newIndices[offset++] = model.faces[f * 3 + 1];
      newIndices[offset++] = model.faces[f * 3 + 2];
    }
    const rightEyeIndexCount = eyeGroups.rightEyeFaces.length * 3;

    this.geometry.setIndex(new THREE.BufferAttribute(newIndices, 1));

    let groupOffset = 0;
    this.geometry.addGroup(groupOffset, nonEyeIndexCount, 0);
    groupOffset += nonEyeIndexCount;
    this.geometry.addGroup(groupOffset, leftEyeIndexCount, 1);
    groupOffset += leftEyeIndexCount;
    this.geometry.addGroup(groupOffset, rightEyeIndexCount, 2);
    groupOffset += rightEyeIndexCount;

    // Mouth material groups (3–6)
    if (mouthGroups) {
      offset = this.appendMouthFaces(newIndices, offset, model.faces, mouthGroups);
      this.geometry.setIndex(new THREE.BufferAttribute(newIndices, 1));

      const teethCount = mouthGroups.teeth.faceCount * 3;
      const gumsCount = mouthGroups.gums.faceCount * 3;
      const tongueCount = mouthGroups.tongue.faceCount * 3;
      const cavityCount = mouthGroups.cavity.faceCount * 3;

      this.geometry.addGroup(groupOffset, teethCount, 3);
      groupOffset += teethCount;
      this.geometry.addGroup(groupOffset, gumsCount, 4);
      groupOffset += gumsCount;
      this.geometry.addGroup(groupOffset, tongueCount, 5);
      groupOffset += tongueCount;
      this.geometry.addGroup(groupOffset, cavityCount, 6);
    }

    const positions = new Float32Array(model.n_vertices * 3);
    const normals = new Float32Array(model.n_vertices * 3);

    // computeAlbedoColors now populates this.baseColors
    const colors = this.computeAlbedoColors(tickerId);

    // Compute sparse vertex lists for localized flush effect
    this.cheekVertices = identifyCheekRegion(
      model.template,
      model.n_vertices,
      TEXTURE_CONFIG.flush.cheek_radius,
    );
    this.lipVertices = identifyLipRegion(
      model.template,
      model.n_vertices,
    );

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 2. Create Materials
    // Face Material: Smooth alpha fade at neck base
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.0,
      transparent: true,
      alphaTest: 0.01,
    });

    this.material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
varying float vY;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vY = position.y;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
varying float vY;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
float fadeStart = -0.08;
float fadeEnd = -0.15;
float fade = smoothstep(fadeEnd, fadeStart, vY);
gl_FragColor.a *= fade;`
      );
    };

    // Eye Materials — pass through any overrides from RefineHarness
    const irisColor = this.computeIrisColor(tickerId);
    this.leftEyeMaterial = createEyeMaterial({ irisColor, ...eyeOverrides });
    this.rightEyeMaterial = createEyeMaterial({ irisColor, ...eyeOverrides });

    // Compute eye centers from template (stable in mesh space for now)
    const leftCenter = this.computeVertexGroupCenter(model.template, eyeGroups.leftEyeVertices);
    const rightCenter = this.computeVertexGroupCenter(model.template, eyeGroups.rightEyeVertices);

    this.leftEyeMaterial.uniforms.eyeCenter.value.copy(leftCenter);
    this.rightEyeMaterial.uniforms.eyeCenter.value.copy(rightCenter);

    // Build materials array
    const materials: THREE.Material[] = [
      this.material,
      this.leftEyeMaterial,
      this.rightEyeMaterial,
    ];

    if (mouthGroups) {
      this.teethMaterial = createTeethMaterial();
      this.gumsMaterial = createGumsMaterial();
      this.tongueMaterial = createTongueMaterial();
      this.cavityMaterial = createCavityMaterial();

      // Mouth materials: double-sided for interior visibility
      for (const mat of [this.teethMaterial, this.gumsMaterial, this.tongueMaterial, this.cavityMaterial] as THREE.Material[]) {
        mat.side = THREE.DoubleSide;
      }

      materials.push(this.teethMaterial, this.gumsMaterial, this.tongueMaterial, this.cavityMaterial);
    }

    // 3. Create Mesh with multi-material
    this.mesh = new THREE.Mesh(this.geometry, materials);
  }

  /** Append mouth face groups to the index buffer in material-group order. */
  private appendMouthFaces(
    indices: Uint32Array, offset: number, faces: Uint32Array, groups: MouthGroups,
  ): number {
    for (const group of [groups.teeth, groups.gums, groups.tongue, groups.cavity]) {
      for (let f = group.faceStart; f < group.faceStart + group.faceCount; f++) {
        indices[offset++] = faces[f * 3];
        indices[offset++] = faces[f * 3 + 1];
        indices[offset++] = faces[f * 3 + 2];
      }
    }
    return offset;
  }

  public updateFromParams(params: FaceParams): void {
    const pose = params.pose ?? zeroPose();
    const buffers = this.pipeline.deformFace({ ...params, pose });

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    positionAttr.array.set(buffers.vertices);
    normalAttr.array.set(buffers.normals);

    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;

    this.updateTexture(params.flush, params.fatigue);

    // Update gaze offsets
    this.leftEyeMaterial.uniforms.gazeOffset.value.set(
      pose.leftEye[0],
      pose.leftEye[1]
    );
    this.rightEyeMaterial.uniforms.gazeOffset.value.set(
      pose.rightEye[0],
      pose.rightEye[1]
    );

    // Ensure matrix world is updated for any dependent systems
    this.mesh.updateMatrixWorld();
  }

  /**
   * Set the crisis intensity (0-1). No-op — expression geometry carries
   * the crisis signal. Kept for interface compatibility.
   */
  public setCrisis(_intensity: number): void {}

  /**
   * Modulates vertex colors: flush via localized cheek weight map, fatigue via albedo PCA basis.
   */
  private updateTexture(flush: number, fatigue: number): void {
    const colors = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const arr = colors.array as Float32Array;
    arr.set(this.baseColors); // reset to identity base

    const { albedoBasis, n_vertices } = this.pipeline.model;
    const stride = n_vertices * 3;

    // Flush: localized color on cheeks + lips via sparse precomputed vertex lists
    // arr is in BGR order before the clamp+swap loop below,
    // so arr[i+2] = R channel, arr[i+1] = G channel, arr[i] = B channel
    // Positive = warm blush, Negative = cold frostbite (asymmetric color profiles)
    if (flush !== 0) {
      const cfg = TEXTURE_CONFIG.flush;
      const t = Math.abs(flush);
      const rMod = flush > 0 ? cfg.warm_red : cfg.cold_red;
      const gMod = flush > 0 ? cfg.warm_green : cfg.cold_green;
      const bMod = flush > 0 ? cfg.warm_blue : cfg.cold_blue;
      // Cheeks (primary) + lips (secondary, weight pre-scaled to 0.7 peak)
      for (const vertices of [this.cheekVertices, this.lipVertices]) {
        for (const { index, weight } of vertices) {
          const i = index * 3;
          arr[i + 2] += t * weight * rMod;    // R
          arr[i + 1] += t * weight * gMod;    // G
          arr[i]     += t * weight * bMod;     // B
        }
      }
    }

    // Fatigue: PC components from TEXTURE_CONFIG (eye-area warmth/darkness)
    if (fatigue !== 0) {
      const [fc0, fc1] = TEXTURE_CONFIG.fatigue.components;
      const [fw0, fw1] = TEXTURE_CONFIG.fatigue.weights;
      const pc0Offset = fc0 * stride;
      const pc1Offset = fc1 * stride;
      for (let i = 0; i < stride; i++) {
        arr[i] += fatigue * fw0 * albedoBasis[pc0Offset + i];
        arr[i] += fatigue * fw1 * albedoBasis[pc1Offset + i];
      }
    }

    // Clamp and apply BGR→RGB + sRGB→linear (same as computeAlbedoColors)
    for (let i = 0; i < arr.length; i += 3) {
      const b = Math.max(0, Math.min(1, arr[i]));
      const g = Math.max(0, Math.min(1, arr[i + 1]));
      const r = Math.max(0, Math.min(1, arr[i + 2]));

      // Convert sRGB to Linear: pow(v, 2.2)
      arr[i] = Math.pow(r, 2.2);
      arr[i + 1] = Math.pow(g, 2.2);
      arr[i + 2] = Math.pow(b, 2.2);
    }

    colors.needsUpdate = true;
  }

  /**
   * Computes per-vertex albedo colors using PCA basis and a hash of the tickerId.
   */
  private computeAlbedoColors(tickerId: string): Float32Array {
    const { model } = this.pipeline;
    const n_verts = model.n_vertices;
    const n_comp = model.n_albedo_components;
    const rawColors = new Float32Array(n_verts * 3);

    // 1. Generate 10 deterministic coefficients from tickerId hash
    const coeffs = this.getHashedCoefficients(tickerId, n_comp);

    // 2. vertex_color[v] = mean[v] + sum(coeff[c] * basis[c][v])
    rawColors.set(model.albedoMean);

    for (let c = 0; c < n_comp; c++) {
      const coeff = coeffs[c];
      const basisOffset = c * n_verts * 3;
      for (let i = 0; i < n_verts * 3; i++) {
        rawColors[i] += coeff * model.albedoBasis[basisOffset + i];
      }
    }

    // Save pre-corrected colors for dynamic updates
    this.baseColors = new Float32Array(rawColors);

    // 3. Clamp and apply color space corrections (BGR -> RGB, sRGB -> Linear)
    const finalColors = new Float32Array(rawColors.length);
    for (let i = 0; i < rawColors.length; i += 3) {
      const b = Math.max(0, Math.min(1, rawColors[i]));
      const g = Math.max(0, Math.min(1, rawColors[i + 1]));
      const r = Math.max(0, Math.min(1, rawColors[i + 2]));

      // Convert sRGB to Linear: pow(v, 2.2)
      finalColors[i] = Math.pow(r, 2.2);
      finalColors[i + 1] = Math.pow(g, 2.2);
      finalColors[i + 2] = Math.pow(b, 2.2);
    }

    return finalColors;
  }

  /**
   * Simple deterministic hash to coefficients.
   * First 5: ±1.5σ (skin tone variation)
   * Next 5: ±0.5σ (subtle detail)
   */
  private getHashedCoefficients(tickerId: string, count: number): number[] {
    const coeffs: number[] = [];
    let seed = 0;
    for (let i = 0; i < tickerId.length; i++) {
      seed = (seed * 31 + tickerId.charCodeAt(i)) | 0;
    }

    // LCG-like pseudo-random generator
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return (seed >>> 0) / 0xffffffff;
    };

    for (let i = 0; i < count; i++) {
      const rand = lcg() * 2 - 1; // [-1, 1]
      const sigma = i < 5 ? 1.5 : 0.5;
      coeffs.push(rand * sigma);
    }

    return coeffs;
  }

  /**
   * Deterministic iris color from tickerId.
   */
  private computeIrisColor(tickerId: string): THREE.Color {
    // We can use the first few coefficients from the albedo hash for variety
    const coeffs = this.getHashedCoefficients(tickerId, 3);

    // Default eye colors: brown, blue, green
    const bases = [
      new THREE.Color(0.2, 0.1, 0.05), // Brown
      new THREE.Color(0.1, 0.2, 0.4),  // Blue
      new THREE.Color(0.1, 0.3, 0.1),  // Green
    ];

    // Pick base based on hash
    let hash = 0;
    for (let i = 0; i < tickerId.length; i++) {
      hash = (hash * 31 + tickerId.charCodeAt(i)) | 0;
    }
    const base = bases[Math.abs(hash) % bases.length].clone();

    // Perturb color slightly with coefficients
    base.r = Math.max(0, Math.min(1, base.r + coeffs[0] * 0.1));
    base.g = Math.max(0, Math.min(1, base.g + coeffs[1] * 0.1));
    base.b = Math.max(0, Math.min(1, base.b + coeffs[2] * 0.1));

    return base;
  }

  /**
   * Computes the geometric center of a group of vertices.
   */
  private computeVertexGroupCenter(vertices: Float32Array, indices: number[]): THREE.Vector3 {
    const center = new THREE.Vector3(0, 0, 0);
    if (indices.length === 0) return center;

    for (const idx of indices) {
      center.x += vertices[idx * 3];
      center.y += vertices[idx * 3 + 1];
      center.z += vertices[idx * 3 + 2];
    }

    return center.divideScalar(indices.length);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.leftEyeMaterial.dispose();
    this.rightEyeMaterial.dispose();
    this.teethMaterial?.dispose();
    this.gumsMaterial?.dispose();
    this.tongueMaterial?.dispose();
    this.cavityMaterial?.dispose();
  }
}
