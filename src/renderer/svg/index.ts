import type { FaceRenderer } from '../../types';
import type { SvgRendererOptions } from '../types';

/**
 * Create an SVG-based FaceRenderer.
 * Same interface as FLAME renderer but uses DOM SVG elements.
 */
export function createSvgRenderer(
  _options?: SvgRendererOptions,
): FaceRenderer {
  throw new Error('Not implemented — see renderer/svg worktree');
}
