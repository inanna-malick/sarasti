// ─── Data ───────────────────────────────────────────

export type AssetClass = 'energy' | 'fear' | 'currency' | 'equity' | 'media';

export interface TickerConfig {
  id: string;
  name: string;
  class: AssetClass;
  family: string;
  age: number;
  tenor_months?: number;
}

export interface TickerFrame {
  close: number;
  volume: number;
  deviation: number;
  velocity: number;
  volatility: number;
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

// ─── Face ───────────────────────────────────────────

export interface FaceParams {
  shape: Float32Array;
  expression: Float32Array;
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

export type LayoutStrategy =
  | { kind: 'family-rows' }
  | { kind: 'class-clusters' }
  | { kind: 'reactivity-sweep' };

export interface LayoutResult {
  positions: Map<string, [number, number, number]>;
}

// ─── Binding ────────────────────────────────────────

export interface ExpressionMap {
  indices: number[];
  weights: number[];
  curve: 'linear' | 'exponential' | 'sigmoid';
}

export interface TidalBinding {
  age_shape_components: number[];
  class_shape_components: number[];
  family_shape_components: number[];
  deviation_expr_map: ExpressionMap;
  velocity_expr_map: ExpressionMap;
  volatility_expr_map: ExpressionMap;
  expression_intensity: number;
}

// ─── Timeline ───────────────────────────────────────

export interface PlaybackState {
  current_index: number;
  playing: boolean;
  speed: number;
  loop: boolean;
}
