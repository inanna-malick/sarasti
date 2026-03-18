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
 * Component catalog (FLAME 2023 Open, official PCA ordering):
 *   ψ0: jaw drop            ψ1: smile/frown (ASYMMETRIC)  ψ2: brow raise
 *   ψ3: brow furrow         ψ4: lip pucker                ψ5: upper lip raiser
 *   ψ6: lower lip depressor ψ7: eyelid close              ψ8: nose wrinkler
 *   ψ9: cheek puffer (ASYMMETRIC)
 *
 *   β0: global width         β1: face length         β2: sagittal depth (profile)
 *   β3: mandibular width     β4: brow ridge          β5: nasal bridge
 *   β6: cheekbone prominence β8: mouth size          β10: chin projection
 *   β16+: high-freq/asymmetric, keep ≤±3.5σ
 */

// Expression axes — each entry is [ψ_index, weight]
// Emotion Quartet: 4 bipolar axes with minimal overlap.
// Weights target raw ψ values up to ~7 at slider extremes (cartoon-level exaggeration).
// ψ1 (smile) and ψ9 (cheek puff) are ASYMMETRIC at the mouth — avoided entirely.
// Safe symmetric set: ψ0 (jaw), ψ2 (brow raise), ψ3 (brow furrow), ψ4 (lip pucker),
//   ψ5 (upper lip), ψ6 (lower lip), ψ7 (eyelid), ψ8 (nose wrinkle).
const EXPR_MAPPINGS = {
  // Joy (+) / Grief (-): jaw-dominant with eye opening. Lower face + eyes.
  joy: [[0, 2.0], [5, -1.5], [7, -0.7]] as [number, number][],
  // Anguish (+) / Serenity (-): brow furrow + nose wrinkle + upper lip snarl. Mid-face.
  anguish: [[3, 2.3], [8, 1.5], [5, 1.2]] as [number, number][],
  // Surprise (+) / Calm (-): brow rockets + jaw drops + eyes snap open. Classic surprise.
  surprise: [[2, 2.3], [0, 1.5], [7, -1.5]] as [number, number][],
  // Tension (+) / Slack (-): lips pucker + lower lip tenses + nose sets. Mouth-region clench.
  tension: [[4, 2.0], [6, 1.5], [8, 1.0]] as [number, number][],
} as const;

// Shape axes — each entry is [β_index, weight]
// Shape Triad: 3 bipolar axes with zero component overlap.
// Each axis has a root note (dominant silhouette driver) + 1-2 color tones (seasoning).
// Global components (β0-β3) pushed hard; mid-freq (β4-β10) kept conservative.
const SHAPE_MAPPINGS = {
  // Heavy (+) / Gaunt (-): overall mass and presence.
  // Root: β0 (global width). Color: β3 (jaw width), β2 (profile depth).
  stature: [[0, 2.5], [3, 1.5], [2, 1.0]] as [number, number][],
  // Elongated (+) / Compact (-): vertical distribution of mass.
  // Root: β1 (face length). Color: β4 (brow ridge, inverse), β6 (cheekbone, inverse).
  proportion: [[1, 2.5], [4, -1.5], [6, -1.0]] as [number, number][],
  // Chiseled (+) / Soft (-): sharpness of features.
  // Root: β10 (chin projection). Color: β8 (mouth size, inverse), β5 (nasal bridge, inverse).
  angularity: [[10, 1.5], [8, -1.2], [5, -1.0]] as [number, number][],
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
  applyMapping(shape, SHAPE_MAPPINGS.stature, state.stature);
  applyMapping(shape, SHAPE_MAPPINGS.proportion, state.proportion);
  applyMapping(shape, SHAPE_MAPPINGS.angularity, state.angularity);

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

// Export mappings for use in report panel
export { EXPR_MAPPINGS, SHAPE_MAPPINGS };
export type { ExprAxis, ShapeAxis };
