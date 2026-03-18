// src/index.ts — Library entry
export type {
  AssetClass,
  TickerConfig,
  TickerFrame,
  TickerStatic,
  Frame,
  TimelineDataset,
  PoseParams,
  FaceParams,
  FaceInstance,
  FaceRenderer,
} from './types';
export { EXPR_AXES, SHAPE_AXES, applyMapping } from './binding/axes';
export type { ResponseCurve, BindingConfig } from './binding/types';
export { applyCurve, applySymmetricCurve } from './binding/curves';
export { resolve, createResolver, createShapeResolver, createExpressionResolver } from './binding/resolve';
export { DEFAULT_BINDING_CONFIG } from './binding/config';
export { gridLayout } from './spatial/layout';
export { createFlameSceneRenderer } from './renderer';
