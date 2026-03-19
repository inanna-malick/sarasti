import { create } from 'zustand';
import type { FaceParams } from '../../../src/types';
import { zeroPose } from '../../../src/types';
import { N_SHAPE, N_EXPR } from '../../../src/constants';
import { EXPR_AXES, SHAPE_AXES, applyMapping } from '../../../src/binding/axes';
import type { ExprAxis, ShapeAxis } from '../../../src/binding/axes';

type ExplorerMode = 'highlevel' | 'raw';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level: expression chord axes (−3..+3)
  alarm: number;
  valence: number;
  arousal: number;

  // High-level: shape axes (−3..+3)
  dominance: number;
  stature: number;

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
  setAlarm: (v: number) => void;
  setValence: (v: number) => void;
  setArousal: (v: number) => void;
  setDominance: (v: number) => void;
  setStature: (v: number) => void;
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

  // Apply expression chord axes
  applyMapping(expression, EXPR_AXES.alarm, state.alarm);
  applyMapping(expression, EXPR_AXES.valence, state.valence);
  applyMapping(expression, EXPR_AXES.arousal, state.arousal);

  // Apply shape axes
  applyMapping(shape, SHAPE_AXES.dominance, state.dominance);
  applyMapping(shape, SHAPE_AXES.stature, state.stature);

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

  alarm: 0,
  valence: 0,
  arousal: 0,

  dominance: 0,
  stature: 0,

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
  setAlarm: (v) => update(set, get, { alarm: v }),
  setValence: (v) => update(set, get, { valence: v }),
  setArousal: (v) => update(set, get, { arousal: v }),
  setDominance: (v) => update(set, get, { dominance: v }),
  setStature: (v) => update(set, get, { stature: v }),
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
