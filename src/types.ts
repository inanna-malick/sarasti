// ─── Data ───────────────────────────────────────────

export type AssetClass = 'energy' | 'commodity' | 'fear' | 'currency' | 'equity' | 'media';
export type Exchange = 'NYMEX' | 'NYSE' | 'CBOE' | 'ICE' | 'COMEX' | '24H';

export interface TickerConfig {
  id: string;
  name: string;
  class: AssetClass;
  family: string;
  age: number;
  tenor_months?: number;
  exchange?: Exchange;
}

export interface TickerFrame {
  close: number;
  volume: number;
  deviation: number;
  velocity: number;
  volatility: number;
  // ─── Derived signals (computed at data-bake time) ──
  /** Distance from rolling max. 0 = at peak, negative = in drawdown. */
  drawdown: number;
  /** Rate of change over longer window. Structural trend direction. */
  momentum: number;
  /** deviation / volatility. How abnormal is this abnormality? */
  mean_reversion_z: number;
  /** Rolling beta to market. 1 = with herd, 0 = independent, negative = contrarian. */
  beta: number;
}

export interface Frame {
  timestamp: string;
  values: Record<string, TickerFrame>;
}

export interface TimelineDataset {
  tickers: TickerConfig[];
  frames: Frame[];
  timestamps: string[];
  baseline_timestamp: string;
}

// ─── Pose ───────────────────────────────────────────

export interface PoseParams {
  /** Neck rotation [pitch, yaw, roll] in radians */
  neck: [number, number, number];
  /** Jaw open angle in radians */
  jaw: number;
  /** Left eye gaze [horizontal, vertical] in radians */
  leftEye: [number, number];
  /** Right eye gaze [horizontal, vertical] in radians */
  rightEye: [number, number];
}

export function zeroPose(): PoseParams {
  return {
    neck: [0, 0, 0],
    jaw: 0,
    leftEye: [0, 0],
    rightEye: [0, 0],
  };
}

// ─── Face ───────────────────────────────────────────

export interface FaceParams {
  shape: Float32Array;
  expression: Float32Array;
  pose: PoseParams;
  flush: number;      // [-1, 1] — -1 bloodless, 0 baseline, +1 flushed
  fatigue: number;    // [-1, 1] — -1 alert, 0 baseline, +1 fatigued
}

export interface FaceInstance {
  id: string;
  params: FaceParams;
  position: [number, number, number];
  ticker: TickerConfig;
  frame: TickerFrame;
}

// ─── Renderer ───────────────────────────────────────

export interface FaceRenderer {
  init(container: HTMLElement): Promise<void>;
  setInstances(instances: FaceInstance[]): void;
  highlightInstance(id: string | null): void;
  getInstanceAtScreenPos(x: number, y: number): string | null;
  setCameraTarget(pos: [number, number, number]): void;
  dispose(): void;
}

// ─── Layout ─────────────────────────────────────────

export interface LayoutResult {
  positions: Map<string, [number, number, number]>;
}


// ─── Timeline ───────────────────────────────────────

export interface PlaybackState {
  current_index: number;
  playing: boolean;
  speed: number;
  loop: boolean;
}

// ─── Library Generic Types ───────────────────────────

/** Consumer's data shape — opaque to library */
export interface FaceDatum {
  id: string;
  label?: string;
  [key: string]: unknown;
}

/** Timeline frame for generic data */
export interface FaceFrame<T extends FaceDatum = FaceDatum> {
  timestamp: string;  // ISO timestamp
  data: T[];
}

/** Accessor: extracts a number from a datum */
export type Accessor<T = unknown> = (datum: T) => number;

/** Generic face instance (library API) */
export interface GenericFaceInstance<T extends FaceDatum = FaceDatum> {
  id: string;
  params: FaceParams;
  position: [number, number, number];
  datum: T;
}
