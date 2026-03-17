import type { FaceParams, FaceInstance, FaceRenderer } from '../types';

// Re-export core types for renderer-internal use
export type { FaceParams, FaceInstance, FaceRenderer };

// ─── FLAME types (re-exported from flame/) ──────────
export type { FlameModel, FlameBuffers, FlameMeta } from './flame/types';

// ─── Scene types ────────────────────────────────────

export interface SceneState {
  instances: FaceInstance[];
  highlightedId: string | null;
  cameraTarget: [number, number, number];
}

/** Options for creating a FLAME-based FaceRenderer */
export interface FlameRendererOptions {
  /** Base path for FLAME .bin files (default: '/data/') */
  dataBasePath?: string;
  /** Enable antialiasing (default: true) */
  antialias?: boolean;
  /** Pixel ratio (default: window.devicePixelRatio) */
  pixelRatio?: number;
}

/** Options for creating an SVG-based FaceRenderer */
export interface SvgRendererOptions {
  /** SVG viewBox dimensions per face */
  faceWidth?: number;
  faceHeight?: number;
}

// ─── Visual check types ─────────────────────────────

export interface ParamSweepConfig {
  /** Which param array to sweep ('shape' | 'expression') */
  target: 'shape' | 'expression';
  /** Which component index to vary */
  componentIndex: number;
  /** Range of values to sweep */
  range: [number, number];
  /** Number of steps in the sweep */
  steps: number;
}

export interface GalleryConfig {
  /** FaceParams[] to render in a grid */
  faces: FaceParams[];
  /** Grid columns */
  cols: number;
}
