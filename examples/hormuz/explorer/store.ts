import { create } from 'zustand';
import type { FaceParams } from '../../../src/types';
import { zeroPose } from '../../../src/types';
import { N_SHAPE, N_EXPR, PSI7_CLAMP, BETA3_CLAMP, BETA_GENERAL_CLAMP, MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN, MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '../../../src/constants';
import { SHAPE_AXES, applyMapping } from '../../../src/binding/axes';
import type { ExprAxis, ShapeAxis } from '../../../src/binding/axes';
import {
  ALARM_ALARMED_RECIPE,
  ALARM_EUPHORIC_RECIPE,
  FATIGUE_WIRED_RECIPE,
  FATIGUE_EXHAUSTED_RECIPE,
  AGGRESSION_AGGRESSIVE_RECIPE,
  AGGRESSION_YIELDING_RECIPE,
  DOMINANCE_RECIPE,
  MATURITY_RECIPE,
  SHARPNESS_RECIPE,
  META_MIXING,
  type ExpressionChordRecipe,
  type ShapeChordRecipe,
  type MetaAxes,
} from '../../../src/binding/chords';

type ExplorerMode = 'highlevel' | 'semantic' | 'raw' | 'data';

interface ExplorerState {
  mode: ExplorerMode;

  // High-level: 6 axes (pose/gaze/texture computed from chord recipes)
  alarm: number;
  fatigue: number;
  aggression: number;
  dominance: number;
  maturity: number;
  sharpness: number;

  // Semantic: 3 meta-axes
  distress: number;
  vitality: number;
  metaAggression: number;

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
  fatigueTex: number;
  rawShape: Float32Array;
  rawExpression: Float32Array;

  // Computed
  currentParams: FaceParams | null;

  // Actions
  setMode: (mode: ExplorerMode) => void;
  setAlarm: (v: number) => void;
  setFatigue: (v: number) => void;
  setAggression: (v: number) => void;
  setDominance: (v: number) => void;
  setMaturity: (v: number) => void;
  setSharpness: (v: number) => void;
  setDistress: (v: number) => void;
  setVitality: (v: number) => void;
  setMetaAggression: (v: number) => void;
  setPoseOverride: (v: boolean) => void;
  setPitch: (v: number) => void;
  setYaw: (v: number) => void;
  setRoll: (v: number) => void;
  setJawOpen: (v: number) => void;
  setGazeOverride: (v: boolean) => void;
  setGazeHorizontal: (v: number) => void;
  setGazeVertical: (v: number) => void;
  setFlush: (v: number) => void;
  setFatigueTex: (v: number) => void;
  setRawShape: (index: number, value: number) => void;
  setRawExpression: (index: number, value: number) => void;
  setCurrentParams: (params: FaceParams) => void;
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

function applyShapeRecipePoseTexture(
  recipe: ShapeChordRecipe,
  value: number,
  out: { pitch: number; yaw: number; roll: number; skinAge: number },
) {
  if (recipe.pose?.pitch) out.pitch += recipe.pose.pitch * value;
  if (recipe.pose?.yaw) out.yaw += recipe.pose.yaw * value;
  if (recipe.pose?.roll) out.roll += recipe.pose.roll * value;
  if (recipe.texture?.skinAge) out.skinAge += recipe.texture.skinAge * value;
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
  for (const entry of recipe.expression) {
    const idx = entry[0];
    const w = entry[1];
    const power = entry.length > 2 ? (entry as readonly [number, number, number])[2] : 1;
    const effectiveMag = power === 1 ? magnitude : Math.sign(magnitude) * Math.pow(Math.abs(magnitude), power);
    expression[idx] += w * effectiveMag;
  }
  applyExprRecipePoseGazeTexture(recipe, magnitude, out);
}

function recomputeParams(state: ExplorerState): { currentParams: FaceParams | null } {
  if (state.mode === 'data') {
    // Data mode: params set externally via setCurrentParams, no recompute needed
    return { currentParams: state.currentParams };
  }

  if (state.mode === 'semantic') {
    // Semantic mode: 3 meta-axes → mixing matrix → 6 low-level activations → recipes
    const meta: MetaAxes = {
      distress: state.distress,
      vitality: state.vitality,
      aggression: state.metaAggression,
    };

    // Apply mixing matrix
    const low: Record<string, number> = {
      alarm: 0, fatigue: 0, aggression: 0, dominance: 0, sharpness: 0,
    };
    for (const [metaKey, weights] of Object.entries(META_MIXING)) {
      const metaVal = meta[metaKey as keyof MetaAxes];
      for (const [lowKey, weight] of Object.entries(weights)) {
        low[lowKey] += metaVal * weight;
      }
    }
    for (const key of Object.keys(low)) {
      low[key] = clamp(low[key], -1, 1);
    }

    // Now use the same recipe-application path as highlevel mode
    const semanticState: ExplorerState = {
      ...state,
      mode: 'highlevel',
      alarm: low.alarm,
      fatigue: low.fatigue,
      aggression: low.aggression,
      dominance: low.dominance,
      sharpness: low.sharpness,
      maturity: state.maturity,
    };
    return recomputeParams(semanticState);
  }

  if (state.mode === 'raw') {
    const params: FaceParams = {
      shape: new Float32Array(state.rawShape),
      expression: new Float32Array(state.rawExpression),
      pose: zeroPose(),
      flush: state.flush,
      fatigue: state.fatigueTex,
      skinAge: 0,
    };
    applyRawOverrides(params, state);
    return { currentParams: params };
  }

  // High-level mode: 6 axes drive everything via full chord recipes
  const shape = new Float32Array(N_SHAPE);
  const expression = new Float32Array(N_EXPR);
  const pgt = { pitch: 0, yaw: 0, roll: 0, jaw: 0, gazeH: 0, gazeV: 0, flush: 0, fatigue: 0 };

  // Alarm → alarmed (+) / euphoric (−)
  if (state.alarm >= 0) {
    applyFullExprRecipe(ALARM_ALARMED_RECIPE, state.alarm, expression, pgt);
  } else {
    applyFullExprRecipe(ALARM_EUPHORIC_RECIPE, Math.abs(state.alarm), expression, pgt);
  }

  // Fatigue → full bipolar recipe (ψ + pose + gaze + texture)
  if (state.fatigue >= 0) {
    applyFullExprRecipe(FATIGUE_WIRED_RECIPE, state.fatigue, expression, pgt);
  } else {
    applyFullExprRecipe(FATIGUE_EXHAUSTED_RECIPE, Math.abs(state.fatigue), expression, pgt);
  }

  // Aggression → aggressive (+) / yielding (−)
  if (state.aggression >= 0) {
    applyFullExprRecipe(AGGRESSION_AGGRESSIVE_RECIPE, state.aggression, expression, pgt);
  } else {
    applyFullExprRecipe(AGGRESSION_YIELDING_RECIPE, Math.abs(state.aggression), expression, pgt);
  }

  // ψ7 safety clamp
  expression[7] = clamp(expression[7], -PSI7_CLAMP, PSI7_CLAMP);

  // Shape β components — dominance + maturity + sharpness
  applyMapping(shape, SHAPE_AXES.dominance, state.dominance);
  applyMapping(shape, SHAPE_AXES.maturity, state.maturity);
  applyMapping(shape, SHAPE_AXES.sharpness, state.sharpness);

  // Shape safety clamps — prevents mesh breakage at extreme slider values
  shape[3] = clamp(shape[3], -BETA3_CLAMP, BETA3_CLAMP);
  for (let i = 0; i < N_SHAPE; i++) {
    if (i !== 3) shape[i] = clamp(shape[i], -BETA_GENERAL_CLAMP, BETA_GENERAL_CLAMP);
  }

  // Shape → identity pose + texture
  const spt = { pitch: 0, yaw: 0, roll: 0, skinAge: 0 };
  applyShapeRecipePoseTexture(DOMINANCE_RECIPE, state.dominance, spt);
  applyShapeRecipePoseTexture(MATURITY_RECIPE, state.maturity, spt);
  applyShapeRecipePoseTexture(SHARPNESS_RECIPE, state.sharpness, spt);

  const params: FaceParams = {
    shape,
    expression,
    pose: {
      neck: [
        clamp(pgt.pitch + spt.pitch, -MAX_NECK_PITCH, MAX_NECK_PITCH),
        clamp(pgt.yaw + spt.yaw, -MAX_NECK_YAW, MAX_NECK_YAW),
        clamp(pgt.roll + spt.roll, -MAX_NECK_ROLL, MAX_NECK_ROLL),
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
    skinAge: clamp(spt.skinAge, -1, 1),
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

  alarm: 0,
  fatigue: 0,
  aggression: 0,
  dominance: 0,
  maturity: 0,
  sharpness: 0,

  distress: 0,
  vitality: 0,
  metaAggression: 0,

  poseOverride: false,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jawOpen: 0,
  gazeOverride: false,
  gazeHorizontal: 0,
  gazeVertical: 0,
  flush: 0,
  fatigueTex: 0,

  rawShape: new Float32Array(N_SHAPE),
  rawExpression: new Float32Array(N_EXPR),

  currentParams: null,

  setMode: (v) => update(set, get, { mode: v }),
  setAlarm: (v) => update(set, get, { alarm: v }),
  setFatigue: (v) => update(set, get, { fatigue: v }),
  setAggression: (v) => update(set, get, { aggression: v }),
  setDominance: (v) => update(set, get, { dominance: v }),
  setMaturity: (v) => update(set, get, { maturity: v }),
  setSharpness: (v) => update(set, get, { sharpness: v }),
  setDistress: (v) => update(set, get, { distress: v }),
  setVitality: (v) => update(set, get, { vitality: v }),
  setMetaAggression: (v) => update(set, get, { metaAggression: v }),
  setPoseOverride: (v) => update(set, get, { poseOverride: v }),
  setPitch: (v) => update(set, get, { pitch: v }),
  setYaw: (v) => update(set, get, { yaw: v }),
  setRoll: (v) => update(set, get, { roll: v }),
  setJawOpen: (v) => update(set, get, { jawOpen: v }),
  setGazeOverride: (v) => update(set, get, { gazeOverride: v }),
  setGazeHorizontal: (v) => update(set, get, { gazeHorizontal: v }),
  setGazeVertical: (v) => update(set, get, { gazeVertical: v }),
  setFlush: (v) => update(set, get, { flush: v }),
  setFatigueTex: (v) => update(set, get, { fatigueTex: v }),

  setCurrentParams: (params) => set({ currentParams: params }),

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
