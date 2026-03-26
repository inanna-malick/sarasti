import { create } from 'zustand';
import type {
  PlaybackState,
  FaceInstance,
  TimelineDataset,
  TickerConfig,
  TickerFrame,
} from './types';
import { DEFAULT_SPEED } from './constants';

// ─── Playback slice ────────────────────────────────

export interface PlaybackSlice {
  playback: PlaybackState;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
  setCurrentIndex: (index: number) => void;
  /** Total number of frames in the dataset. */
  frameCount: number;
  setFrameCount: (count: number) => void;
}

// ─── Data slice ────────────────────────────────────

export interface DataSlice {
  dataset: TimelineDataset | null;
  setDataset: (dataset: TimelineDataset) => void;
  /** Global statistics for the entire dataset (computed on load). */
  datasetStats: import('./data/stats').DatasetStats | null;
  setDatasetStats: (stats: import('./data/stats').DatasetStats) => void;
}

// ─── UI slice ──────────────────────────────────────

export interface UISlice {
  /** Currently hovered face id, or null. */
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;

  /** Currently selected (clicked) face id, or null. */
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  /** Whether landing overlay is visible. */
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;

  /** Current timestamp string (from dataset, for display). */
  currentTimestamp: string;
  setCurrentTimestamp: (ts: string) => void;

  /** Callback to fly camera to a face position. Set by App after renderer init. */
  flyToFace: ((id: string) => void) | null;
  setFlyToFace: (fn: ((id: string) => void) | null) => void;
}

// ─── Scene slice ───────────────────────────────────

export interface SceneSlice {
  /** Current face instances (updated by frame driver). */
  instances: FaceInstance[];
  setInstances: (instances: FaceInstance[]) => void;
}

// ─── Combined store ────────────────────────────────

export type AppStore = PlaybackSlice & DataSlice & UISlice & SceneSlice;

export const useStore = create<AppStore>((set) => ({
  // Playback
  playback: {
    current_index: 0,
    playing: false,
    speed: DEFAULT_SPEED,
    loop: true,
  },
  frameCount: 0,
  setFrameCount: (count) => set({ frameCount: count }),
  setPlaying: (playing) =>
    set((s) => ({ playback: { ...s.playback, playing } })),
  setSpeed: (speed) =>
    set((s) => ({ playback: { ...s.playback, speed } })),
  setLoop: (loop) =>
    set((s) => ({ playback: { ...s.playback, loop } })),
  setCurrentIndex: (index) =>
    set((s) => ({ playback: { ...s.playback, current_index: index } })),

  // Data
  dataset: null,
  setDataset: (dataset) => set({ dataset }),
  datasetStats: null,
  setDatasetStats: (datasetStats) => set({ datasetStats }),

  // UI
  hoveredId: null,
  setHoveredId: (id) => set({ hoveredId: id }),
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  showLanding: true,
  setShowLanding: (show) => set({ showLanding: show }),
  currentTimestamp: '',
  setCurrentTimestamp: (ts) => set({ currentTimestamp: ts }),
  flyToFace: null,
  setFlyToFace: (fn) => set({ flyToFace: fn }),

  // Scene
  instances: [],
  setInstances: (instances) => set({ instances }),
}));
