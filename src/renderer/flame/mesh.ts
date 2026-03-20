import * as THREE from 'three';
import type { FlamePipeline } from './pipeline';
import type { EyeVertexGroups } from './eyes';
import type { FaceParams } from '../../types';
import { zeroPose } from '../../types';
import { TEXTURE_CONFIG } from '../../binding/config';
import type { MouthGroups } from './mouth/types';
import {
  createTeethMaterial,
  createGumsMaterial,
  createTongueMaterial,
  createCavityMaterial,
} from './mouth/materials';
import { createEyeMaterial } from './eyeMaterial';
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
  private interiorMaterial: THREE.MeshBasicMaterial;
  private teethMaterial: THREE.MeshStandardMaterial | null = null;
  private gumsMaterial: THREE.MeshStandardMaterial | null = null;
  private tongueMaterial: THREE.MeshStandardMaterial | null = null;
  private cavityMaterial: THREE.MeshBasicMaterial | null = null;
  private leftEyeMaterial: THREE.ShaderMaterial | null = null;
  private rightEyeMaterial: THREE.ShaderMaterial | null = null;
  private eyeGroups: EyeVertexGroups | null = null;
  private pipeline: FlamePipeline;
  private baseColors!: Float32Array;
  private cheekVertices: CheekVertex[];
  private lipVertices: CheekVertex[];

  constructor(pipeline: FlamePipeline, tickerId: string) {
    this.pipeline = pipeline;
    const { model } = pipeline;
    const mouthGroups = model.mouthGroups;
    const eyeGroups = pipeline.eyeGroups;
    this.eyeGroups = eyeGroups;

    // 1. Create BufferGeometry with face indices
    this.geometry = new THREE.BufferGeometry();

    const originalFaceCount = mouthGroups ? mouthGroups.teeth.faceStart : model.n_faces;

    // Build face index buffer: reorder so eye faces are in contiguous groups
    let materialIdx = 0;
    if (eyeGroups) {
      // Build set of eye face indices for fast lookup
      const eyeFaceSet = new Set<number>();
      for (const f of eyeGroups.leftEyeFaces) eyeFaceSet.add(f);
      for (const f of eyeGroups.rightEyeFaces) eyeFaceSet.add(f);

      // Reorder: skin faces first, then left eye, then right eye
      const reorderedIndices = new Uint32Array(model.faces.length);
      let writeIdx = 0;

      // Skin faces (non-eye original faces)
      for (let f = 0; f < originalFaceCount; f++) {
        if (!eyeFaceSet.has(f)) {
          reorderedIndices[writeIdx++] = model.faces[f * 3];
          reorderedIndices[writeIdx++] = model.faces[f * 3 + 1];
          reorderedIndices[writeIdx++] = model.faces[f * 3 + 2];
        }
      }
      const skinIndexCount = writeIdx;

      // Left eye faces
      const leftEyeStart = writeIdx;
      for (const f of eyeGroups.leftEyeFaces) {
        reorderedIndices[writeIdx++] = model.faces[f * 3];
        reorderedIndices[writeIdx++] = model.faces[f * 3 + 1];
        reorderedIndices[writeIdx++] = model.faces[f * 3 + 2];
      }
      const leftEyeIndexCount = writeIdx - leftEyeStart;

      // Right eye faces
      const rightEyeStart = writeIdx;
      for (const f of eyeGroups.rightEyeFaces) {
        reorderedIndices[writeIdx++] = model.faces[f * 3];
        reorderedIndices[writeIdx++] = model.faces[f * 3 + 1];
        reorderedIndices[writeIdx++] = model.faces[f * 3 + 2];
      }
      const rightEyeIndexCount = writeIdx - rightEyeStart;

      // Copy mouth faces (unchanged positions in buffer)
      if (mouthGroups) {
        const mouthStart = originalFaceCount * 3;
        for (let i = mouthStart; i < model.faces.length; i++) {
          reorderedIndices[writeIdx++] = model.faces[i];
        }
      }

      this.geometry.setIndex(new THREE.BufferAttribute(reorderedIndices, 1));

      // Material groups: skin=0, leftEye=1, rightEye=2
      this.geometry.addGroup(0, skinIndexCount, 0);
      materialIdx = 1;
      this.geometry.addGroup(leftEyeStart, leftEyeIndexCount, materialIdx++);
      this.geometry.addGroup(rightEyeStart, rightEyeIndexCount, materialIdx++);

      // Mouth groups shifted by eye material count
      if (mouthGroups) {
        const mouthStartInReordered = rightEyeStart + rightEyeIndexCount;
        const teethCount = mouthGroups.teeth.faceCount * 3;
        const gumsCount = mouthGroups.gums.faceCount * 3;
        const tongueCount = mouthGroups.tongue.faceCount * 3;
        const cavityCount = mouthGroups.cavity.faceCount * 3;

        let mouthOffset = mouthStartInReordered;
        this.geometry.addGroup(mouthOffset, teethCount, materialIdx++);
        mouthOffset += teethCount;
        this.geometry.addGroup(mouthOffset, gumsCount, materialIdx++);
        mouthOffset += gumsCount;
        this.geometry.addGroup(mouthOffset, tongueCount, materialIdx++);
        mouthOffset += tongueCount;
        this.geometry.addGroup(mouthOffset, cavityCount, materialIdx++);
      }
    } else {
      // No eyes — original layout
      this.geometry.setIndex(new THREE.BufferAttribute(model.faces, 1));

      let groupOffset = 0;
      this.geometry.addGroup(groupOffset, originalFaceCount * 3, 0);
      groupOffset += originalFaceCount * 3;

      materialIdx = 1;
      // Mouth material groups (1–4) if enabled
      if (mouthGroups) {
        const teethCount = mouthGroups.teeth.faceCount * 3;
        const gumsCount = mouthGroups.gums.faceCount * 3;
        const tongueCount = mouthGroups.tongue.faceCount * 3;
        const cavityCount = mouthGroups.cavity.faceCount * 3;

        this.geometry.addGroup(groupOffset, teethCount, materialIdx++);
        groupOffset += teethCount;
        this.geometry.addGroup(groupOffset, gumsCount, materialIdx++);
        groupOffset += gumsCount;
        this.geometry.addGroup(groupOffset, tongueCount, materialIdx++);
        groupOffset += tongueCount;
        this.geometry.addGroup(groupOffset, cavityCount, materialIdx++);
      }
    }

    const positions = new Float32Array(model.n_vertices * 3);
    const normals = new Float32Array(model.n_vertices * 3);

    // computeAlbedoColors populates this.baseColors
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
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.0,
    });

    const materials: THREE.Material[] = [this.material];

    // Eye materials (if enabled)
    if (eyeGroups) {
      const irisColor = getIrisColor(tickerId);
      this.leftEyeMaterial = createEyeMaterial({ irisColor });
      this.rightEyeMaterial = createEyeMaterial({ irisColor });
      materials.push(this.leftEyeMaterial, this.rightEyeMaterial);

      // Compute initial eye centers from template
      this.updateEyeCenters(model.template);
    }

    if (mouthGroups) {
      this.teethMaterial = createTeethMaterial();
      this.gumsMaterial = createGumsMaterial();
      this.tongueMaterial = createTongueMaterial();
      this.cavityMaterial = createCavityMaterial();

      for (const mat of [this.teethMaterial, this.gumsMaterial, this.tongueMaterial, this.cavityMaterial] as THREE.Material[]) {
        mat.side = THREE.DoubleSide;
      }

      materials.push(this.teethMaterial, this.gumsMaterial, this.tongueMaterial, this.cavityMaterial);
    }

    // 3. Create Mesh
    this.mesh = new THREE.Mesh(this.geometry, materials);

    // 4. Black interior — back faces render as black void (mouth, nostrils)
    //    Added as child of the front mesh so it inherits all transforms.
    this.interiorMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });
    this.mesh.add(new THREE.Mesh(this.geometry, this.interiorMaterial));
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

    this.updateTexture(params.flush, params.fatigue, params.skinAge ?? 0);

    // Dynamic roughness from skinAge: weathered = matte, youthful = dewy
    const skinAge = params.skinAge ?? 0;
    this.material.roughness = 0.7 + skinAge * 0.15;  // range: [0.55, 0.85]

    // Update eye material uniforms from deformed vertices + gaze
    if (this.leftEyeMaterial && this.rightEyeMaterial && this.eyeGroups) {
      this.updateEyeCenters(buffers.vertices);

      // Gaze offset from pose
      const leftGaze = pose.leftEye ?? [0, 0];
      const rightGaze = pose.rightEye ?? [0, 0];
      (this.leftEyeMaterial.uniforms.gazeOffset.value as THREE.Vector2).set(leftGaze[0], leftGaze[1]);
      (this.rightEyeMaterial.uniforms.gazeOffset.value as THREE.Vector2).set(rightGaze[0], rightGaze[1]);
    }

    // Ensure matrix world is updated for any dependent systems
    this.mesh.updateMatrixWorld();
  }

  /** Compute eye centers from vertex positions and update shader uniforms */
  private updateEyeCenters(vertices: Float32Array): void {
    if (!this.eyeGroups || !this.leftEyeMaterial || !this.rightEyeMaterial) return;

    // Left eye center = mean of left eye vertex positions
    let lx = 0, ly = 0, lz = 0;
    for (const v of this.eyeGroups.leftEyeVertices) {
      lx += vertices[v * 3];
      ly += vertices[v * 3 + 1];
      lz += vertices[v * 3 + 2];
    }
    const ln = this.eyeGroups.leftEyeVertices.length;
    (this.leftEyeMaterial.uniforms.eyeCenter.value as THREE.Vector3).set(lx / ln, ly / ln, lz / ln);

    // Right eye center = mean of right eye vertex positions
    let rx = 0, ry = 0, rz = 0;
    for (const v of this.eyeGroups.rightEyeVertices) {
      rx += vertices[v * 3];
      ry += vertices[v * 3 + 1];
      rz += vertices[v * 3 + 2];
    }
    const rn = this.eyeGroups.rightEyeVertices.length;
    (this.rightEyeMaterial.uniforms.eyeCenter.value as THREE.Vector3).set(rx / rn, ry / rn, rz / rn);
  }

  /**
   * Set the crisis intensity (0-1). No-op — expression geometry carries
   * the crisis signal. Kept for interface compatibility.
   */
  public setCrisis(_intensity: number): void {}

  /**
   * Modulates vertex colors: flush via localized cheek weight map, fatigue via albedo PCA basis,
   * skinAge via full-face sallow/fresh color shift.
   */
  private updateTexture(flush: number, fatigue: number, skinAge: number = 0): void {
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

      // Global diffuse flush: whole-face color shift for thumbnail readability.
      // At 80-150px per face, localized cheek flush is invisible. This shifts
      // the entire face temperature (warm pink vs cold pale) at 40% of the
      // localized intensity so it reads at small scale without overpowering close-up.
      const globalScale = 0.4;
      for (let i = 0; i < stride; i += 3) {
        arr[i + 2] += t * globalScale * rMod;    // R
        arr[i + 1] += t * globalScale * gMod;    // G
        arr[i]     += t * globalScale * bMod;     // B
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

    // SkinAge: full-face color temperature shift for aged/youthful appearance
    // Weathered (+): yellow desaturation — reduce blue, reduce overall saturation
    // Youthful (−): pink freshness — boost red subtly, add vibrancy
    // Applied to ALL vertices (full-face, not localized)
    if (skinAge !== 0) {
      const t = Math.abs(skinAge);
      // arr is BGR order here
      if (skinAge > 0) {
        // Aged: grey-warm desaturation — drain blue+green, slight warm undertone
        // Key: green DRAIN (not boost) avoids jaundiced yellow cast
        for (let i = 0; i < stride; i += 3) {
          arr[i]     -= t * 0.04;   // B: drain blue → desaturate
          arr[i + 1] -= t * 0.02;   // G: drain green → grey, NOT sallow
          arr[i + 2] += t * 0.01;   // R: tiny red boost → warm undertone
        }
      } else {
        // Young: pink/dewy — boost pink, increase saturation
        for (let i = 0; i < stride; i += 3) {
          arr[i]     += t * 0.02;   // B: slight blue boost → cooler/fresh
          arr[i + 1] -= t * 0.02;   // G: drain green → pinker
          arr[i + 2] += t * 0.04;   // R: boost red → rosy/dewy
        }
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
   * Apply a debug material mode for isolating eyes/mouth during iteration.
   * - 'normal': all opaque (default)
   * - 'skin_xray': skin at 30% opacity, mouth/eyes opaque (see through skin)
   * - 'eyes_only': hide skin + mouth, show only eye material
   * - 'mouth_only': hide skin + eyes, show only mouth geometry
   */
  public setDebugMaterial(mode: 'normal' | 'skin_xray' | 'eyes_only' | 'mouth_only'): void {
    if (mode === 'normal') {
      this.material.transparent = false;
      this.material.opacity = 1.0;
      this.material.visible = true;
      this.interiorMaterial.visible = true;
      if (this.leftEyeMaterial) this.leftEyeMaterial.visible = true;
      if (this.rightEyeMaterial) this.rightEyeMaterial.visible = true;
    } else if (mode === 'skin_xray') {
      this.material.transparent = true;
      this.material.opacity = 0.3;
      this.material.depthWrite = false;
      this.material.visible = true;
      this.interiorMaterial.visible = false;
      if (this.leftEyeMaterial) this.leftEyeMaterial.visible = true;
      if (this.rightEyeMaterial) this.rightEyeMaterial.visible = true;
    } else if (mode === 'eyes_only') {
      this.material.visible = false;
      this.interiorMaterial.visible = false;
      if (this.leftEyeMaterial) this.leftEyeMaterial.visible = true;
      if (this.rightEyeMaterial) this.rightEyeMaterial.visible = true;
      // Hide mouth materials
      if (this.teethMaterial) this.teethMaterial.visible = false;
      if (this.gumsMaterial) this.gumsMaterial.visible = false;
      if (this.tongueMaterial) this.tongueMaterial.visible = false;
      if (this.cavityMaterial) this.cavityMaterial.visible = false;
    } else if (mode === 'mouth_only') {
      this.material.visible = false;
      this.interiorMaterial.visible = false;
      if (this.leftEyeMaterial) this.leftEyeMaterial.visible = false;
      if (this.rightEyeMaterial) this.rightEyeMaterial.visible = false;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.interiorMaterial.dispose();
    this.leftEyeMaterial?.dispose();
    this.rightEyeMaterial?.dispose();
    this.teethMaterial?.dispose();
    this.gumsMaterial?.dispose();
    this.tongueMaterial?.dispose();
    this.cavityMaterial?.dispose();
  }
}

/** Deterministic iris color from ticker ID hash */
function getIrisColor(tickerId: string): THREE.Color {
  let seed = 0;
  for (let i = 0; i < tickerId.length; i++) {
    seed = (seed * 31 + tickerId.charCodeAt(i)) | 0;
  }
  const hue = ((seed >>> 0) % 360) / 360;
  return new THREE.Color().setHSL(hue, 0.6, 0.35);
}
