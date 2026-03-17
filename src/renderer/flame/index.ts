import type { FaceRenderer } from '../../types';
import type { FlameRendererOptions } from '../types';

/**
 * Create a FLAME-based FaceRenderer.
 * Loads model files, creates Three.js scene, manages face meshes.
 *
 * This is the integration point wired after flame/ children merge.
 */
export async function createFlameRenderer(
  _options?: FlameRendererOptions,
): Promise<FaceRenderer> {
  throw new Error('Not implemented — wired at renderer TL integration after flame + scene merge');
}
