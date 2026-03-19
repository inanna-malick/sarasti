import { create } from 'zustand';
import type { FaceParams } from '../../../src/types';
import { zeroPose } from '../../../src/types';
import { N_SHAPE, N_EXPR, PSI7_CLAMP, BETA3_CLAMP, BETA_GENERAL_CLAMP, MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN, MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '../../../src/constants';
import { SHAPE_AXES, applyMapping } from '../../../src/binding/axes';
import type { ExprAxis, ShapeAxis } from '../../../src/binding/axes';
import {
  TENSION_TENSE_RECIPE,
  TENSION_PLACID_RECIPE,
  MOOD_EUPHORIA_RECIPE,
  MOOD_GRIEF_RECIPE,
  DOMINANCE_RECIPE,
  PREDATOR_RECIPE,
  type ExpressionChordRecipe,
  type ShapeChordRecipe,
} from '../../../src/binding/chords';

type ExplorerMode = 'highlevel' | 'raw';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level: 4 axes (pose/gaze/texture computed from chord recipes)
  tension: number;
  mood: number;
  dominance: number;
  predator: number;

  // Raw mode: manual overrides
  poseOverride: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  jawOpen: number;
  gazeOverride: boolean;
  gazeHorizontal: number;
  gazeVertical: number;
  flush: number;
  fatigue: number;
  rawShape: Float32Array;
  rawExpression: Float32Array;

  // Computed
  currentParams: FaceParams | null;

  // Actions
  setMode: (mode: ExplorerMode) => void;
  setTension: (v: number) => void;
  setMood: (v: number) => void;
  setDominance: (v: number) => void;
  setPredator: (v: number) => void;
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

// ─── Chord recipe application helpers ────────────────

function applyExprRecipePoseGazeTexture(
  recipe: ExpressionChordRecipe,
  magnitude: number,
  out: { pitch: number; yaw: number; roll: number; jaw: number; gazeH: number; gazeV: number; flush: number; fatigue: number },
) {
  if (recipe.pose.pitch) out.pitch += recipe.pose.pitch * magnitude;
  if (recipe.pose.yaw) out.yaw += recipe.pose.yaw * magnitude;
  if (recipe.pose.roll) out.roll += recipe.pose.roll * magnitude;
  if (recipe.pose.jaw) out.jaw += recipe.pose.jaw * Math.abs(magnitude);
  if (recipe.gaze.gazeH) out.gazeH += recipe.gaze.gazeH * magnitude;
  if (recipe.gaze.gazeV) out.gazeV += recipe.gaze.gazeV * magnitude;
  if (recipe.texture.flush) out.flush += recipe.texture.flush * magnitude;
  if (recipe.texture.fatigue) out.fatigue += recipe.texture.fatigue * magnitude;
}

function applyShapeRecipePose(
  recipe: ShapeChordRecipe,
  value: number,
  out: { pitch: number; yaw: number; roll: number },
) {
  if (recipe.pose?.pitch) out.pitch += recipe.pose.pitch * value;
  if (recipe.pose?.yaw) out.yaw += recipe.pose.yaw * value;
  if (recipe.pose?.roll) out.roll += recipe.pose.roll * value;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Recompute ───────────────────────────────────────

/** Apply full chord recipe: ψ components + pose + gaze + texture */
function applyFullExprRecipe(
  recipe: ExpressionChordRecipe,
  magnitude: number,
  expression: Float32Array,
  out: { pitch: number; yaw: number; roll: number; jaw: number; gazeH: number; gazeV: number; flush: number; fatigue: number },
) {
  for (const [idx, w] of recipe.expression) {
    expression[idx] += w * magnitude;
  }
  applyExprRecipePoseGazeTexture(recipe, magnitude, out);
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
    applyRawOverrides(params, state);
    return { currentParams: params };
  }

  // High-level mode: 4 axes drive everything via full chord recipes
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);
  const pgt = { pitch: 0, yaw: 0, roll: 0, jaw: 0, gazeH: 0, gazeV: 0, flush: 0, fatigue: 0 };

  // Tension → full bipolar recipe (ψ + pose + gaze + texture)
  if (state.tension >= 0) {
    applyFullExprRecipe(TENSION_TENSE_RECIPE, state.tension, expression, pgt);
  } else {
    applyFullExprRecipe(TENSION_PLACID_RECIPE, Math.abs(state.tension), expression, pgt);
  }

  // Mood → full bipolar recipe (ψ + pose + gaze + texture)
  if (state.mood >= 0) {
    applyFullExprRecipe(MOOD_EUPHORIA_RECIPE, state.mood, expression, pgt);
  } else {
    applyFullExprRecipe(MOOD_GRIEF_RECIPE, Math.abs(state.mood), expression, pgt);
  }

  // ψ7 safety clamp
  expression[7] = clamp(expression[7], -PSI7_CLAMP, PSI7_CLAMP);

  // Shape β components
  applyMapping(shape, SHAPE_AXES.dominance, state.dominance);
  applyMapping(shape, SHAPE_AXES.predator, state.predator);

  // Shape safety clamps — prevents mesh breakage at extreme slider values
  shape[3] = clamp(shape[3], -BETA3_CLAMP, BETA3_CLAMP);
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) shape[i] = clamp(shape[i], -BETA_GENERAL_CLAMP, BETA_GENERAL_CLAMP);
  }

  // Shape → identity pose
  applyShapeRecipePose(DOMINANCE_RECIPE, state.dominance, pgt);
  applyShapeRecipePose(PREDATOR_RECIPE, state.predator, pgt);

  const params: FaceParams = {
    shape,
    expression,
    pose: {
      neck: [
        clamp(pgt.pitch, -MAX_NECK_PITCH, MAX_NECK_PITCH),
        clamp(pgt.yaw, -MAX_NECK_YAW, MAX_NECK_YAW),
        clamp(pgt.roll, -MAX_NECK_ROLL, MAX_NECK_ROLL),
      ],
      jaw: clamp(pgt.jaw, 0, MAX_JAW_OPEN),
      leftEye: [
        clamp(pgt.gazeH, -MAX_EYE_HORIZONTAL, MAX_EYE_HORIZONTAL),
        clamp(pgt.gazeV, -MAX_EYE_VERTICAL, MAX_EYE_VERTICAL),
      ],
      rightEye: [
        clamp(pgt.gazeH, -MAX_EYE_HORIZONTAL, MAX_EYE_HORIZONTAL),
        clamp(pgt.gazeV, -MAX_EYE_VERTICAL, MAX_EYE_VERTICAL),
      ],
    },
    flush: clamp(pgt.flush, -1, 1),
    fatigue: clamp(pgt.fatigue, -1, 1),
  };

  return { currentParams: params };
}

function applyRawOverrides(params: FaceParams, state: ExplorerState): void {
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

  tension: 0,
  mood: 0,
  dominance: 0,
  predator: 0,

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
  setTension: (v) => update(set, get, { tension: v }),
  setMood: (v) => update(set, get, { mood: v }),
  setDominance: (v) => update(set, get, { dominance: v }),
  setPredator: (v) => update(set, get, { predator: v }),
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
