import type { FlameModel, FlameBuffers } from './types';

/**
 * Deform FLAME mesh: output = template + shapedirs @ beta + exprdirs @ psi.
 * Computes vertex normals after deformation.
 */
export function deform(
  _model: FlameModel,
  _beta: Float32Array,
  _psi: Float32Array,
): FlameBuffers {
  throw new Error('Not implemented — see renderer/flame/deformer worktree');
}
