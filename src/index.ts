// Library entry — barrel exports

// Builder API
export { sarasti, SarastiBuilder } from './api';
export type { SarastiOptions } from './api';

// Core types
export type {
  FaceDatum,
  FaceFrame,
  Accessor,
  FaceParams,
  FaceInstance,
  GenericFaceInstance,
  FaceRenderer,
  PoseParams,
  LayoutResult,
  PlaybackState,
} from './types';

// Binding — axes (core value prop)
export { EXPR_AXES, SHAPE_AXES, applyMapping } from './binding/axes';
export type { AxesConfig, AxisCurveConfig, ResponseCurve } from './binding/types';
export { applyCurve, applySymmetricCurve } from './binding/curves';
export { resolveFromAxes } from './binding/resolve';
export type { AxisValues } from './binding/resolve';
export { DEFAULT_AXIS_CURVES } from './binding/config';

// Layout
export { gridLayout } from './spatial/layout';
export type { GridLayoutOptions } from './spatial/layout';

// Renderer (advanced usage)
export { createFlameSceneRenderer } from './renderer';

// UI components
export { FaceHud } from './ui/FaceHud';
export { FaceOverlay } from './ui/FaceOverlay';
export type { OverlayInstance } from './ui/FaceOverlay';
export type { RingSignal, HudLabel, HudAnnotation, HudTheme, HudSizing } from './ui/types';
