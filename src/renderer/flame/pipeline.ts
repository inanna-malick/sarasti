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
      const shaped = deform(model, params.shape, params.expression);
      const posedVertices = applyLBS(model, shaped.vertices, params.pose);
      const normals = computeNormals(posedVertices, model.faces, model.n_vertices, model.n_faces);
      return { vertices: posedVertices, normals };
    },
  };
}
