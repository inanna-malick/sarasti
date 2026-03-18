import type { FlameModel, FlameBuffers } from './types';
import type { FaceParams } from '../../types';
import { loadFlameModel } from './loader';
import { deform, computeNormals } from './deform';
import { applyLBS } from './lbs';

/**
 * FLAME pipeline: load model once, deform per-face per-frame.
 *
 * Usage:
 *   const pipeline = await createFlamePipeline('/data/');
 *   const buffers = pipeline.deformFace(faceParams);
 */
export interface FlamePipeline {
  readonly model: FlameModel;
  deformFace(params: FaceParams): FlameBuffers;
}

export async function createFlamePipeline(basePath: string): Promise<FlamePipeline> {
  const model = await loadFlameModel(basePath);

  return {
    model,
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
