import { create } from 'zustand';
import type { AssetClass, TickerConfig, TickerFrame, FaceParams } from '@/types';
import { zeroPose } from '@/types';
import type { BindingReport } from '@/binding/report';
import { resolveWithReport } from '@/binding/resolve';
import {
  N_SHAPE,
  N_EXPR,
  MAX_NECK_PITCH,
  MAX_NECK_YAW,
  MAX_NECK_ROLL,
  MAX_JAW_OPEN,
  MAX_EYE_HORIZONTAL,
  MAX_EYE_VERTICAL,
} from '@/constants';

type ExplorerMode = 'highlevel' | 'raw';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level inputs
  age: number;
  assetClass: AssetClass;
  family: string;
  deviation: number;
  velocity: number;
  volatility: number;

  // Pose override
  poseOverride: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  jaw: number;

  // Gaze override
  gazeOverride: boolean;
  gazeHorizontal: number;
  gazeVertical: number;

  // Texture
  flush: number;
  fatigue: number;

  // Raw mode
  rawShape: Float32Array;
  rawExpression: Float32Array;

  // Computed
  currentParams: FaceParams | null;
  currentReport: BindingReport | null;

  // Actions
  setMode: (mode: ExplorerMode) => void;
  setAge: (v: number) => void;
  setAssetClass: (v: AssetClass) => void;
  setFamily: (v: string) => void;
  setDeviation: (v: number) => void;
  setVelocity: (v: number) => void;
  setVolatility: (v: number) => void;
  setPoseOverride: (v: boolean) => void;
  setPitch: (v: number) => void;
  setYaw: (v: number) => void;
  setRoll: (v: number) => void;
  setJaw: (v: number) => void;
  setGazeOverride: (v: boolean) => void;
  setGazeHorizontal: (v: number) => void;
  setGazeVertical: (v: number) => void;
  setFlush: (v: number) => void;
  setFatigue: (v: number) => void;
  setRawShape: (index: number, value: number) => void;
  setRawExpression: (index: number, value: number) => void;
  recompute: () => void;
}

function recomputeParams(state: ExplorerState): { currentParams: FaceParams; currentReport: BindingReport | null } {
  if (state.mode === 'raw') {
    const params: FaceParams = {
      shape: new Float32Array(state.rawShape),
      expression: new Float32Array(state.rawExpression),
      pose: zeroPose(),
      flush: 0,
      fatigue: 0,
    };
    applyOverrides(params, state);
    return { currentParams: params, currentReport: null };
  }

  // High-level mode: construct synthetic ticker + frame, run real binding
  const ticker: TickerConfig = {
    id: 'explorer',
    name: 'Explorer',
    class: state.assetClass,
    family: state.family,
    age: state.age,
  };

  const frame: TickerFrame = {
    close: 100,
    volume: 1000,
    deviation: state.deviation,
    velocity: state.velocity,
    volatility: state.volatility,
  };

  const { params, report } = resolveWithReport(ticker, frame);

  // Always override texture from sliders in explorer
  params.flush = state.flush;
  params.fatigue = state.fatigue;

  applyOverrides(params, state);

  return { currentParams: params, currentReport: report };
}

function applyOverrides(params: FaceParams, state: ExplorerState): void {
  if (state.poseOverride) {
    params.pose = {
      neck: [state.pitch, state.yaw, state.roll],
      jaw: state.jaw,
      leftEye: [state.gazeHorizontal, state.gazeVertical],
      rightEye: [state.gazeHorizontal, state.gazeVertical],
    };
  } else if (state.gazeOverride) {
    params.pose = {
      ...params.pose,
      leftEye: [state.gazeHorizontal, state.gazeVertical],
      rightEye: [state.gazeHorizontal, state.gazeVertical],
    };
  }
}

function setter<K extends keyof ExplorerState>(key: K) {
  return (set: any, get: any) => (v: ExplorerState[K]) => {
    set({ [key]: v });
    const state = get();
    const computed = recomputeParams(state);
    set(computed);
  };
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  mode: 'highlevel',

  age: 30,
  assetClass: 'energy',
  family: 'brent',
  deviation: 0,
  velocity: 0,
  volatility: 0,

  poseOverride: false,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jaw: 0,

  gazeOverride: false,
  gazeHorizontal: 0,
  gazeVertical: 0,

  flush: 0,
  fatigue: 0,

  rawShape: new Float32Array(N_SHAPE),
  rawExpression: new Float32Array(N_EXPR),

  currentParams: null,
  currentReport: null,

  setMode: (mode) => { set({ mode }); set(recomputeParams({ ...get(), mode })); },
  setAge: (v) => { set({ age: v }); set(recomputeParams({ ...get(), age: v })); },
  setAssetClass: (v) => { set({ assetClass: v }); set(recomputeParams({ ...get(), assetClass: v })); },
  setFamily: (v) => { set({ family: v }); set(recomputeParams({ ...get(), family: v })); },
  setDeviation: (v) => { set({ deviation: v }); set(recomputeParams({ ...get(), deviation: v })); },
  setVelocity: (v) => { set({ velocity: v }); set(recomputeParams({ ...get(), velocity: v })); },
  setVolatility: (v) => { set({ volatility: v }); set(recomputeParams({ ...get(), volatility: v })); },
  setPoseOverride: (v) => { set({ poseOverride: v }); set(recomputeParams({ ...get(), poseOverride: v })); },
  setPitch: (v) => { set({ pitch: v }); set(recomputeParams({ ...get(), pitch: v })); },
  setYaw: (v) => { set({ yaw: v }); set(recomputeParams({ ...get(), yaw: v })); },
  setRoll: (v) => { set({ roll: v }); set(recomputeParams({ ...get(), roll: v })); },
  setJaw: (v) => { set({ jaw: v }); set(recomputeParams({ ...get(), jaw: v })); },
  setGazeOverride: (v) => { set({ gazeOverride: v }); set(recomputeParams({ ...get(), gazeOverride: v })); },
  setGazeHorizontal: (v) => { set({ gazeHorizontal: v }); set(recomputeParams({ ...get(), gazeHorizontal: v })); },
  setGazeVertical: (v) => { set({ gazeVertical: v }); set(recomputeParams({ ...get(), gazeVertical: v })); },
  setFlush: (v) => { set({ flush: v }); set(recomputeParams({ ...get(), flush: v })); },
  setFatigue: (v) => { set({ fatigue: v }); set(recomputeParams({ ...get(), fatigue: v })); },

  setRawShape: (index, value) => {
    const arr = new Float32Array(get().rawShape);
    arr[index] = value;
    set({ rawShape: arr });
    set(recomputeParams({ ...get(), rawShape: arr }));
  },

  setRawExpression: (index, value) => {
    const arr = new Float32Array(get().rawExpression);
    arr[index] = value;
    set({ rawExpression: arr });
    set(recomputeParams({ ...get(), rawExpression: arr }));
  },

  recompute: () => {
    set(recomputeParams(get()));
  },
}));
