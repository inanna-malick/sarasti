/**
 * Renderer subsystem entry point.
 * Exposes FLAME pipeline + mesh, SVG renderer, and scene components.
 */

// FLAME subsystem
export { createFlamePipeline, FlameFaceMesh } from './flame/index';
export type { FlamePipeline } from './flame/index';

// SVG renderer
export { createSvgRenderer } from './svg/index';

// Scene (wired after scene TL merges)
export { SceneCompositor } from './scene/compositor';
export { CameraController } from './scene/camera';
export { FacePicker } from './scene/picking';

// Types
export type { FlameRendererOptions, SvgRendererOptions } from './types';
