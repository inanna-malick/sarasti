import type { FaceRenderer, FaceInstance } from '../../types';

/**
 * Unified scene manager implementing FaceRenderer.
 * Composes SceneCompositor + CameraController + FacePicker
 * into the interface the app consumes.
 *
 * This is wired at scene TL integration after all 3 Devs merge.
 */
export async function createFlameSceneRenderer(
  _options?: { dataBasePath?: string; antialias?: boolean; pixelRatio?: number },
): Promise<FaceRenderer> {
  throw new Error('Not implemented — wired at scene TL integration');
}
