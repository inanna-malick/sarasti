import { create } from 'zustand';
import type { AssetClass, TickerConfig, TickerFrame, FaceParams } from '@/types';
import { zeroPose } from '@/types';
import type { BindingReport, BindingEntry } from '@/binding/report';
import { resolveWithReport } from '@/binding/resolve';
import { N_SHAPE, N_EXPR } from '@/constants';

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

function manualEntry(param: string, index: number, value: number): BindingEntry {
  return {
    param, index, value,
    contributions: [{ source: 'manual', input: value, mapped: value, weight: 1, contribution: value }],
  };
}

function recomputeParams(state: ExplorerState): { currentParams: FaceParams; currentReport: BindingReport | null } {
  if (state.mode === 'raw') {
    const params: FaceParams = {
      shape: new Float32Array(state.rawShape),
      expression: new Float32Array(state.rawExpression),
      pose: zeroPose(),
      flush: state.flush,
      fatigue: state.fatigue,
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
  report.flush = manualEntry('flush', 0, state.flush);
  report.fatigue = manualEntry('fatigue', 0, state.fatigue);

  applyOverrides(params, state);

  // Patch report to reflect overrides so report stays consistent with rendered params
  if (state.poseOverride) {
    report.pose = {
      pitch: manualEntry('pose', 0, state.pitch),
      yaw: manualEntry('pose', 1, state.yaw),
      roll: manualEntry('pose', 2, state.roll),
      jaw: manualEntry('pose', 3, state.jaw),
    };
    report.gaze = {
      horizontal: manualEntry('gaze', 0, state.gazeHorizontal),
      vertical: manualEntry('gaze', 1, state.gazeVertical),
    };
  } else if (state.gazeOverride) {
    report.gaze = {
      horizontal: manualEntry('gaze', 0, state.gazeHorizontal),
      vertical: manualEntry('gaze', 1, state.gazeVertical),
    };
  }

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

function update(set: any, get: any, patch: Partial<ExplorerState>) {
  set(patch);
  set(recomputeParams({ ...get(), ...patch }));
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  mode: 'highlevel',

  age: 30,
  assetClass: 'energy',
  family: 'brent',
  deviation: 0,
  velocity: 0,
  volatility: 1,

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

  setMode: (v) => update(set, get, { mode: v }),
  setAge: (v) => update(set, get, { age: v }),
  setAssetClass: (v) => update(set, get, { assetClass: v }),
  setFamily: (v) => update(set, get, { family: v }),
  setDeviation: (v) => update(set, get, { deviation: v }),
  setVelocity: (v) => update(set, get, { velocity: v }),
  setVolatility: (v) => update(set, get, { volatility: v }),
  setPoseOverride: (v) => update(set, get, { poseOverride: v }),
  setPitch: (v) => update(set, get, { pitch: v }),
  setYaw: (v) => update(set, get, { yaw: v }),
  setRoll: (v) => update(set, get, { roll: v }),
  setJaw: (v) => update(set, get, { jaw: v }),
  setGazeOverride: (v) => update(set, get, { gazeOverride: v }),
  setGazeHorizontal: (v) => update(set, get, { gazeHorizontal: v }),
  setGazeVertical: (v) => update(set, get, { gazeVertical: v }),
  setFlush: (v) => update(set, get, { flush: v }),
  setFatigue: (v) => update(set, get, { fatigue: v }),

  setRawShape: (index, value) => {
    const arr = new Float32Array(get().rawShape);
    arr[index] = value;
    update(set, get, { rawShape: arr });
  },

  setRawExpression: (index, value) => {
    const arr = new Float32Array(get().rawExpression);
    arr[index] = value;
    update(set, get, { rawExpression: arr });
  },

  recompute: () => {
    set(recomputeParams(get()));
  },
}));
