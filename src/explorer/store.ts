import { create } from 'zustand';
import type { FaceParams } from '@/types';
import { zeroPose } from '@/types';
import { N_SHAPE, N_EXPR } from '@/constants';

type ExplorerMode = 'highlevel' | 'raw';

/**
 * Direct FLAME parameter mappings for data-viz.
 * Each semantic axis maps to specific ψ/β components with weights.
 * These are hand-tuned for dramatic, legible deformation — not photorealism.
 *
 * Component catalog (FLAME 2023 Open, empirical at ±5):
 *   ψ0: jaw open + smile    ψ1: smile/frown       ψ2: mouth open wide
 *   ψ3: lip part/protrude   ψ4: brow raise/lower   ψ5: lip purse
 *   ψ6: jaw lateral         ψ7: head shape mod      ψ8: lip/nose subtle
 *   ψ9: eye/cheek region
 *
 *   β0: face width    β1: face height    β2: jaw shape (square/pointed)
 *   β3: secondary width   β4+: finer detail
 */

// Expression axes — each entry is [ψ_index, weight]
// Emotion Quartet: 4 bipolar axes with minimal overlap.
// Weights target raw ψ values up to ~7 at slider extremes (cartoon-level exaggeration).
// ψ1 and ψ9 are ASYMMETRIC at the mouth — avoided entirely.
// Symmetric mouth movers: ψ0 (jaw+smile), ψ2 (wide), ψ3 (lip part), ψ5 (purse).
const EXPR_MAPPINGS = {
  // Joy (+) / Grief (-): face lifts (joy) or drops (grief). Lower+upper face.
  joy: [[0, 2.3], [7, 1.2]] as [number, number][],
  // Anguish (+) / Serenity (-): upper face knots (anguish) or settles (serenity). No jaw.
  anguish: [[6, 2.0], [7, -2.0], [8, 1.5]] as [number, number][],
  // Surprise (+) / Calm (-): brow rockets, mouth widens. Brow-dominant.
  surprise: [[4, 2.3], [2, 1.5], [0, -1.0]] as [number, number][],
  // Tension (+) / Slack (-): face tightens (tension) or goes limp (slack). Pervasive clench.
  tension: [[3, 2.0], [5, 1.5], [8, 1.0]] as [number, number][],
} as const;

// Shape axes — each entry is [β_index, weight]
const SHAPE_MAPPINGS = {
  // Wider (+) / Narrower (-)
  width: [[0, 3.0], [3, 1.5]] as [number, number][],
  // Taller (+) / Shorter (-)
  height: [[1, 3.0]] as [number, number][],
  // Square jaw (+) / Pointed chin (-)
  jaw: [[2, 3.0]] as [number, number][],
} as const;

type ExprAxis = keyof typeof EXPR_MAPPINGS;
type ShapeAxis = keyof typeof SHAPE_MAPPINGS;

interface ExplorerState {
  mode: ExplorerMode;

  // High-level: semantic expression axes (per-axis ranges, −3..+3)
  joy: number;
  anguish: number;
  surprise: number;
  tension: number;

  // High-level: semantic shape axes (per-axis ranges)
  width: number;
  height: number;
  jaw: number;

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
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setJaw: (v: number) => void;
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

function applyMapping(target: Float32Array, mapping: readonly [number, number][], value: number): void {
  for (const [idx, weight] of mapping) {
    if (idx < target.length) {
      target[idx] += weight * value;
    }
  }
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

  // High-level mode: direct FLAME parameter mappings
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);

  // Apply expression axes
  applyMapping(expression, EXPR_MAPPINGS.joy, state.joy);
  applyMapping(expression, EXPR_MAPPINGS.anguish, state.anguish);
  applyMapping(expression, EXPR_MAPPINGS.surprise, state.surprise);
  applyMapping(expression, EXPR_MAPPINGS.tension, state.tension);

  // Apply shape axes
  applyMapping(shape, SHAPE_MAPPINGS.width, state.width);
  applyMapping(shape, SHAPE_MAPPINGS.height, state.height);
  applyMapping(shape, SHAPE_MAPPINGS.jaw, state.jaw);

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

  width: 0,
  height: 0,
  jaw: 0,

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
  setWidth: (v) => update(set, get, { width: v }),
  setHeight: (v) => update(set, get, { height: v }),
  setJaw: (v) => update(set, get, { jaw: v }),
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

// Export mappings for use in report panel
export { EXPR_MAPPINGS, SHAPE_MAPPINGS };
export type { ExprAxis, ShapeAxis };
