import type { FlameBuffers } from './types';
import type { ExtendedFlameModel } from './mouth/types';
import type { FaceParams } from '../../types';
import { loadFlameModel } from './loader';
import { extendModelWithMouth } from './mouth/extend-model';
import { deform, computeNormals } from './deform';
import { applyLBS } from './lbs';
import { identifyEyeVertices, type EyeVertexGroups } from './eyes';

/**
 * FLAME pipeline: load model once, deform per-face per-frame.
 *
 * Usage:
 *   const pipeline = await createFlamePipeline('/data/');
 *   const buffers = pipeline.deformFace(faceParams);
 */
export interface FlamePipeline {
  readonly model: ExtendedFlameModel;
  readonly eyeGroups: EyeVertexGroups | null;
  readonly neckMask: Uint8Array | null;
  readonly filteredFaces: Uint32Array | null;
  readonly filteredFaceCount: number | null;
  deformFace(params: FaceParams): FlameBuffers;
}

export interface PipelineOptions {
  enableMouth?: boolean;  // default false
  enableEyes?: boolean;   // default false
}

function computeNeckMask(weights: Float32Array, nVertices: number, nJoints: number, template: Float32Array): Uint8Array {
  const mask = new Uint8Array(nVertices);
  for (let v = 0; v < nVertices; v++) {
    const neckWeight = weights[v * nJoints + 1];
    const y = template[v * 3 + 1];
    if (neckWeight > 0.25 || y < -0.055) {
      mask[v] = 0; // removed
    } else {
      mask[v] = 1; // kept
    }
  }
  return mask;
}

function filterFaces(faces: Uint32Array, nFaces: number, mask: Uint8Array): { filteredFaces: Uint32Array, filteredFaceCount: number } {
  const filteredFaces = new Uint32Array(nFaces * 3);
  let filteredFaceCount = 0;
  for (let f = 0; f < nFaces; f++) {
    const v0 = faces[f * 3];
    const v1 = faces[f * 3 + 1];
    const v2 = faces[f * 3 + 2];
    if (mask[v0] === 1 && mask[v1] === 1 && mask[v2] === 1) {
      filteredFaces[filteredFaceCount * 3] = v0;
      filteredFaces[filteredFaceCount * 3 + 1] = v1;
      filteredFaces[filteredFaceCount * 3 + 2] = v2;
      filteredFaceCount++;
    }
  }
  return { filteredFaces, filteredFaceCount };
}

export async function createFlamePipeline(basePath: string, options: PipelineOptions = {}): Promise<FlamePipeline> {
  const rawModel = await loadFlameModel(basePath);
  const enableMouth = options.enableMouth ?? false;
  const enableEyes = options.enableEyes ?? false;
  const model = enableMouth ? extendModelWithMouth(rawModel) : { ...rawModel, mouthGroups: null, originalVertexCount: rawModel.n_vertices };
  const eyeGroups = enableEyes ? identifyEyeVertices(rawModel.weights, rawModel.faces, rawModel.n_vertices, rawModel.n_joints) : null;

  const neckMask = computeNeckMask(rawModel.weights, rawModel.n_vertices, rawModel.n_joints, rawModel.template);
  const { filteredFaces, filteredFaceCount } = filterFaces(rawModel.faces, rawModel.n_faces, neckMask);

  return {
    model,
    eyeGroups,
    neckMask,
    filteredFaces,
    filteredFaceCount,
    deformFace(params: FaceParams): FlameBuffers {
      try {
        const shaped = deform(model, params.shape, params.expression);
        const posedVertices = applyLBS(model, shaped.vertices, params.pose);
        const normals = computeNormals(posedVertices, model.faces, model.n_vertices, model.n_faces);
        return { vertices: posedVertices, normals };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const shapeSnap = Array.from(params.shape.slice(0, 5)).map(v => v.toFixed(3));
        const exprSnap = Array.from(params.expression.slice(0, 5)).map(v => v.toFixed(3));
        const pose = params.pose;
        console.error(
          `[FLAME deformFace] ${msg}\n` +
          `  shape[0:5]=[${shapeSnap}] expression[0:5]=[${exprSnap}]\n` +
          `  pose: neck=[${pose.neck}] jaw=${pose.jaw} leftEye=[${pose.leftEye}] rightEye=[${pose.rightEye}]`
        );
        throw err;
      }
    },
  };
}
