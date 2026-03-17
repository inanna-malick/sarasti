import type { FaceRenderer } from '../../types';

/**
 * SVG-based FaceRenderer implementation.
 * Same interface as the FLAME renderer, but uses DOM SVG elements.
 */
export function createSvgRenderer(): FaceRenderer {
  throw new Error('Not implemented — see renderer/svg worktree');
}
