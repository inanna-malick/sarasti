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

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  mode: 'highlevel',
  age: 30,
  assetClass: 'energy',
  family: 'brent',
  deviation: 0,
  velocity: 0,
  volatility: 1.0, // Neutral baseline
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
  setAge: (v) => { set({ age: clamp(v, 20, 60) }); get().recompute(); },
  setAssetClass: (assetClass) => { set({ assetClass }); get().recompute(); },
  setFamily: (family) => { set({ family }); get().recompute(); },
  setDeviation: (v) => { set({ deviation: clamp(v, -0.2, 0.2) }); get().recompute(); },
  setVelocity: (v) => { set({ velocity: clamp(v, -3, 3) }); get().recompute(); },
  setVolatility: (v) => { set({ volatility: clamp(v, 0, 3) }); get().recompute(); },
  setPoseOverride: (poseOverride) => { set({ poseOverride }); get().recompute(); },
  setPitch: (v) => { set({ pitch: clamp(v, -MAX_NECK_PITCH, MAX_NECK_PITCH) }); get().recompute(); },
  setYaw: (v) => { set({ yaw: clamp(v, -MAX_NECK_YAW, MAX_NECK_YAW) }); get().recompute(); },
  setRoll: (v) => { set({ roll: clamp(v, -MAX_NECK_ROLL, MAX_NECK_ROLL) }); get().recompute(); },
  setJaw: (v) => { set({ jaw: clamp(v, 0, MAX_JAW_OPEN) }); get().recompute(); },
  setGazeOverride: (v) => { set({ gazeOverride: v }); get().recompute(); },
  setGazeHorizontal: (v) => { set({ gazeHorizontal: clamp(v, -MAX_EYE_HORIZONTAL, MAX_EYE_HORIZONTAL) }); get().recompute(); },
  setGazeVertical: (v) => { set({ gazeVertical: clamp(v, -MAX_EYE_VERTICAL, MAX_EYE_VERTICAL) }); get().recompute(); },
  setFlush: (v) => { set({ flush: clamp(v, -1, 1) }); get().recompute(); },
  setFatigue: (v) => { set({ fatigue: clamp(v, -1, 1) }); get().recompute(); },
  setRawShape: (index, value) => {
    const next = new Float32Array(get().rawShape);
    next[index] = clamp(value, -5, 5);
    set({ rawShape: next });
    get().recompute();
  },
  setRawExpression: (index, value) => {
    const next = new Float32Array(get().rawExpression);
    next[index] = clamp(value, -5, 5);
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
      report = null;
    }

    // Apply Overrides
    if (state.poseOverride) {
      params.pose = {
        neck: [state.pitch, state.yaw, state.roll],
        jaw: state.jaw,
        leftEye: [state.gazeHorizontal, state.gazeVertical],
        rightEye: [state.gazeHorizontal, state.gazeVertical],
      };
      // Overrides make the binding report inconsistent
      report = null;
    } else if (state.gazeOverride) {
      params.pose.leftEye = [state.gazeHorizontal, state.gazeVertical];
      params.pose.rightEye = [state.gazeHorizontal, state.gazeVertical];
      // Overrides make the binding report inconsistent
      report = null;
    }

    // Texture always overridden in explorer
    params.flush = state.flush;
    params.fatigue = state.fatigue;

    set({ currentParams: params, currentReport: report });
  },
}));
