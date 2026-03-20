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
  deformFace(params: FaceParams): FlameBuffers;
}

export interface PipelineOptions {
  enableMouth?: boolean;  // default false
  enableEyes?: boolean;   // default false
}

export async function createFlamePipeline(basePath: string, options: PipelineOptions = {}): Promise<FlamePipeline> {
  const rawModel = await loadFlameModel(basePath);
  const enableMouth = options.enableMouth ?? false;
  const enableEyes = options.enableEyes ?? false;
  const model = enableMouth ? extendModelWithMouth(rawModel) : { ...rawModel, mouthGroups: null, originalVertexCount: rawModel.n_vertices };
  const eyeGroups = enableEyes ? identifyEyeVertices(rawModel.weights, rawModel.faces, rawModel.n_vertices, rawModel.n_joints) : null;

  return {
    model,
    eyeGroups,
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
