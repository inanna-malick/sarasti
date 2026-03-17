/**
 * Renderer subsystem entry point.
 * Exposes both FLAME and SVG FaceRenderer factories.
 */
export { createFlameRenderer } from './flame/index';
export { createSvgRenderer } from './svg/index';
export type { FlameRendererOptions, SvgRendererOptions } from './types';
