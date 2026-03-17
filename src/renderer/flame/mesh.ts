import * as THREE from 'three';
import type { FlamePipeline } from './pipeline';
import type { FaceParams } from '../../types';
import { identifyEyeVertices } from './eyes';
import { createEyeMaterial } from './eyeMaterial';

/**
 * FlameFaceMesh wraps a Three.js Mesh and manages its geometry and material.
 * Uses MeshStandardMaterial with vertex colors derived from the albedo PCA model.
 */
export class FlameFaceMesh {
  public readonly mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshStandardMaterial;
  private leftEyeMaterial: THREE.ShaderMaterial;
  private rightEyeMaterial: THREE.ShaderMaterial;
  private pipeline: FlamePipeline;

  constructor(pipeline: FlamePipeline, tickerId: string) {
    this.pipeline = pipeline;
    const { model } = pipeline;

    // 1. Create BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    
    // Identify eye vertices and faces
    const eyeGroups = identifyEyeVertices(model.weights, model.faces, model.n_vertices, model.n_joints);
    
    // Reorder face index buffer
    const eyeFaceIndices = new Set([...eyeGroups.leftEyeFaces, ...eyeGroups.rightEyeFaces]);
    const nonEyeFaces: number[] = [];
    for (let i = 0; i < model.n_faces; i++) {
      if (!eyeFaceIndices.has(i)) {
        nonEyeFaces.push(i);
      }
    }

    const newIndices = new Uint32Array(model.faces.length);
    let offset = 0;
    
    // Non-eye faces (group 0)
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
    this.geometry.addGroup(0, nonEyeIndexCount, 0);
    this.geometry.addGroup(nonEyeIndexCount, leftEyeIndexCount, 1);
    this.geometry.addGroup(nonEyeIndexCount + leftEyeIndexCount, rightEyeIndexCount, 2);

    const positions = new Float32Array(model.n_vertices * 3);
    const normals = new Float32Array(model.n_vertices * 3);
    const colors = this.computeAlbedoColors(tickerId);

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

    // Eye Materials
    const irisColor = this.computeIrisColor(tickerId);
    this.leftEyeMaterial = createEyeMaterial({ irisColor });
    this.rightEyeMaterial = createEyeMaterial({ irisColor });

    // Compute eye centers from template (stable in mesh space for now)
    const leftCenter = this.computeVertexGroupCenter(model.template, eyeGroups.leftEyeVertices);
    const rightCenter = this.computeVertexGroupCenter(model.template, eyeGroups.rightEyeVertices);
    
    this.leftEyeMaterial.uniforms.eyeCenter.value.copy(leftCenter);
    this.rightEyeMaterial.uniforms.eyeCenter.value.copy(rightCenter);

    // 3. Create Mesh with multi-material
    this.mesh = new THREE.Mesh(this.geometry, [
      this.material,
      this.leftEyeMaterial,
      this.rightEyeMaterial,
    ]);
  }

  public updateFromParams(params: FaceParams): void {
    const buffers = this.pipeline.deformFace(params);

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = this.geometry.getAttribute('normal') as THREE.BufferAttribute;

    positionAttr.array.set(buffers.vertices);
    normalAttr.array.set(buffers.normals);

    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;

    // Update gaze offsets
    this.leftEyeMaterial.uniforms.gazeOffset.value.set(
      params.pose.leftEye[0],
      params.pose.leftEye[1]
    );
    this.rightEyeMaterial.uniforms.gazeOffset.value.set(
      params.pose.rightEye[0],
      params.pose.rightEye[1]
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
   * Computes per-vertex albedo colors using PCA basis and a hash of the tickerId.
   */
  private computeAlbedoColors(tickerId: string): Float32Array {
    const { model } = this.pipeline;
    const n_verts = model.n_vertices;
    const n_comp = model.n_albedo_components;
    const colors = new Float32Array(n_verts * 3);

    // 1. Generate 10 deterministic coefficients from tickerId hash
    const coeffs = this.getHashedCoefficients(tickerId, n_comp);

    // 2. vertex_color[v] = mean[v] + sum(coeff[c] * basis[c][v])
    colors.set(model.albedoMean);

    for (let c = 0; c < n_comp; c++) {
      const coeff = coeffs[c];
      const basisOffset = c * n_verts * 3;
      for (let i = 0; i < n_verts * 3; i++) {
        colors[i] += coeff * model.albedoBasis[basisOffset + i];
      }
    }

    // 3. Clamp and apply color space corrections (BGR -> RGB, sRGB -> Linear)
    for (let i = 0; i < colors.length; i += 3) {
      const b = Math.max(0, Math.min(1, colors[i]));
      const g = Math.max(0, Math.min(1, colors[i + 1]));
      const r = Math.max(0, Math.min(1, colors[i + 2]));

      // Convert sRGB to Linear: pow(v, 2.2)
      colors[i] = Math.pow(r, 2.2);
      colors[i + 1] = Math.pow(g, 2.2);
      colors[i + 2] = Math.pow(b, 2.2);
    }

    return colors;
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
  }
}
