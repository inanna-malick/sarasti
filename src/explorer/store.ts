import { create } from 'zustand';
import type { AssetClass, TickerConfig, TickerFrame, FaceParams } from '@/types';
import { zeroPose } from '@/types';
import type { BindingReport } from '@/binding/report';
import { resolveWithReport } from '@/binding/resolve';
import { N_SHAPE, N_EXPR, MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN, MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '@/constants';

export type ExplorerMode = 'highlevel' | 'raw';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level inputs
  age: number;           // 20-60
  assetClass: AssetClass; // dropdown
  family: string;         // dropdown
  deviation: number;      // -0.2..0.2
  velocity: number;       // -3..3
  volatility: number;     // 0..3

  // Pose override
  poseOverride: boolean;
  pitch: number;         // -MAX_NECK_PITCH..MAX_NECK_PITCH
  yaw: number;           // -MAX_NECK_YAW..MAX_NECK_YAW
  roll: number;          // -MAX_NECK_ROLL..MAX_NECK_ROLL
  jaw: number;           // 0..MAX_JAW_OPEN

  // Gaze override
  gazeOverride: boolean;
  gazeHorizontal: number; // -MAX_EYE_HORIZONTAL..MAX_EYE_HORIZONTAL
  gazeVertical: number;   // -MAX_EYE_VERTICAL..MAX_EYE_VERTICAL

  // Texture
  flush: number;    // -1..1
  fatigue: number;  // -1..1

  // Raw mode arrays
  rawShape: Float32Array;      // length 100, each -5..+5
  rawExpression: Float32Array; // length 100, each -5..+5

  // Computed (derived)
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

  setMode: (mode) => { set({ mode }); get().recompute(); },
  setAge: (age) => { set({ age }); get().recompute(); },
  setAssetClass: (assetClass) => { set({ assetClass }); get().recompute(); },
  setFamily: (family) => { set({ family }); get().recompute(); },
  setDeviation: (deviation) => { set({ deviation }); get().recompute(); },
  setVelocity: (velocity) => { set({ velocity }); get().recompute(); },
  setVolatility: (volatility) => { set({ volatility }); get().recompute(); },
  setPoseOverride: (poseOverride) => { set({ poseOverride }); get().recompute(); },
  setPitch: (pitch) => { set({ pitch }); get().recompute(); },
  setYaw: (yaw) => { set({ yaw }); get().recompute(); },
  setRoll: (roll) => { set({ roll }); get().recompute(); },
  setJaw: (jaw) => { set({ jaw }); get().recompute(); },
  setGazeOverride: (gazeOverride) => { set({ gazeOverride }); get().recompute(); },
  setGazeHorizontal: (gazeHorizontal) => { set({ gazeHorizontal }); get().recompute(); },
  setGazeVertical: (gazeVertical) => { set({ gazeVertical }); get().recompute(); },
  setFlush: (flush) => { set({ flush }); get().recompute(); },
  setFatigue: (fatigue) => { set({ fatigue }); get().recompute(); },
  setRawShape: (index, value) => {
    const next = new Float32Array(get().rawShape);
    next[index] = value;
    set({ rawShape: next });
    get().recompute();
  },
  setRawExpression: (index, value) => {
    const next = new Float32Array(get().rawExpression);
    next[index] = value;
    set({ rawExpression: next });
    get().recompute();
  },

  recompute: () => {
    const state = get();
    let params: FaceParams;
    let report: BindingReport | null = null;

    if (state.mode === 'highlevel') {
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

      const result = resolveWithReport(ticker, frame);
      params = result.params;
      report = result.report;
    } else {
      params = {
        shape: new Float32Array(state.rawShape),
        expression: new Float32Array(state.rawExpression),
        pose: zeroPose(),
        flush: 0,
        fatigue: 0,
      };
    }

    // Apply Overrides
    if (state.poseOverride) {
      params.pose = {
        neck: [state.pitch, state.yaw, state.roll],
        jaw: state.jaw,
        leftEye: [state.gazeHorizontal, state.gazeVertical],
        rightEye: [state.gazeHorizontal, state.gazeVertical],
      };
    } else if (state.gazeOverride) {
      params.pose.leftEye = [state.gazeHorizontal, state.gazeVertical];
      params.pose.rightEye = [state.gazeHorizontal, state.gazeVertical];
    }

    // Texture always overridden in explorer
    params.flush = state.flush;
    params.fatigue = state.fatigue;

    set({ currentParams: params, currentReport: report });
  },
}));
