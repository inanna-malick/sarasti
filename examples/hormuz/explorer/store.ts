import { create } from 'zustand';
import type { FaceParams } from '../../../src/types';
import { zeroPose } from '../../../src/types';
import { N_SHAPE, N_EXPR } from '../../../src/constants';
import { EXPR_AXES, SHAPE_AXES, applyMapping } from '../../../src/binding/axes';
import type { ExprAxis, ShapeAxis } from '../../../src/binding/axes';

type ExplorerMode = 'highlevel' | 'raw';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level: semantic expression axes (per-axis ranges, −3..+3)
  joy: number;
  anguish: number;
  surprise: number;
  tension: number;

  // High-level: semantic shape axes (per-axis ranges, −3..+3)
  stature: number;
  proportion: number;
  angularity: number;

  // Pose override
  poseOverride: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  jawOpen: number;

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

  // Actions
  setMode: (mode: ExplorerMode) => void;
  setJoy: (v: number) => void;
  setAnguish: (v: number) => void;
  setSurprise: (v: number) => void;
  setTension: (v: number) => void;
  setStature: (v: number) => void;
  setProportion: (v: number) => void;
  setAngularity: (v: number) => void;
  setPoseOverride: (v: boolean) => void;
  setPitch: (v: number) => void;
  setYaw: (v: number) => void;
  setRoll: (v: number) => void;
  setJawOpen: (v: number) => void;
  setGazeOverride: (v: boolean) => void;
  setGazeHorizontal: (v: number) => void;
  setGazeVertical: (v: number) => void;
  setFlush: (v: number) => void;
  setFatigue: (v: number) => void;
  setRawShape: (index: number, value: number) => void;
  setRawExpression: (index: number, value: number) => void;
  recompute: () => void;
}

function recomputeParams(state: ExplorerState): { currentParams: FaceParams } {
  if (state.mode === 'raw') {
    const params: FaceParams = {
      shape: new Float32Array(state.rawShape),
      expression: new Float32Array(state.rawExpression),
      pose: zeroPose(),
      flush: state.flush,
      fatigue: state.fatigue,
    };
    applyOverrides(params, state);
    return { currentParams: params };
  }

  // High-level mode: direct FLAME parameter mappings via shared axes
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);

  // Apply expression axes
  applyMapping(expression, EXPR_AXES.joy, state.joy);
  applyMapping(expression, EXPR_AXES.anguish, state.anguish);
  applyMapping(expression, EXPR_AXES.surprise, state.surprise);
  applyMapping(expression, EXPR_AXES.tension, state.tension);

  // Apply shape axes
  applyMapping(shape, SHAPE_AXES.stature, state.stature);
  applyMapping(shape, SHAPE_AXES.proportion, state.proportion);
  applyMapping(shape, SHAPE_AXES.angularity, state.angularity);

  const params: FaceParams = {
    shape,
    expression,
    pose: zeroPose(),
    flush: state.flush,
    fatigue: state.fatigue,
  };

  applyOverrides(params, state);
  return { currentParams: params };
}

function applyOverrides(params: FaceParams, state: ExplorerState): void {
  if (state.poseOverride) {
    params.pose = {
      neck: [state.pitch, state.yaw, state.roll],
      jaw: state.jawOpen,
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

  joy: 0,
  anguish: 0,
  surprise: 0,
  tension: 0,

  stature: 0,
  proportion: 0,
  angularity: 0,

  poseOverride: false,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jawOpen: 0,

  gazeOverride: false,
  gazeHorizontal: 0,
  gazeVertical: 0,

  flush: 0,
  fatigue: 0,

  rawShape: new Float32Array(N_SHAPE),
  rawExpression: new Float32Array(N_EXPR),

  currentParams: null,

  setMode: (v) => update(set, get, { mode: v }),
  setJoy: (v) => update(set, get, { joy: v }),
  setAnguish: (v) => update(set, get, { anguish: v }),
  setSurprise: (v) => update(set, get, { surprise: v }),
  setTension: (v) => update(set, get, { tension: v }),
  setStature: (v) => update(set, get, { stature: v }),
  setProportion: (v) => update(set, get, { proportion: v }),
  setAngularity: (v) => update(set, get, { angularity: v }),
  setPoseOverride: (v) => update(set, get, { poseOverride: v }),
  setPitch: (v) => update(set, get, { pitch: v }),
  setYaw: (v) => update(set, get, { yaw: v }),
  setRoll: (v) => update(set, get, { roll: v }),
  setJawOpen: (v) => update(set, get, { jawOpen: v }),
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

// Export types for use in report panel
export type { ExprAxis, ShapeAxis };
