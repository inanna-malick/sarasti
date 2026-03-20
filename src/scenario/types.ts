/**
 * Scenario types — authored emotional narratives for the face wall.
 *
 * A scenario defines a choreographed animation: faces on a grid,
 * keyframes specifying tension/valence/stature over time,
 * with cubic interpolation between them.
 */

/** A face in the scenario grid */
export interface ScenarioFace {
  id: string;
  label?: string;
  /** Grid slot [col, row] — 0-indexed */
  position: [col: number, row: number];
  /** Spatial narrative group (e.g. "sentinels", "herd", "havens") */
  group?: string;
}

/** A keyframe for a single face */
export interface ScenarioKeyframe {
  /** Seconds from start */
  t: number;
  /** Tension: [-1, 1] calm(−) ↔ tense(+) */
  tension: number;
  /** Valence: [-1, 1] bad(−) ↔ good(+) */
  valence: number;
  /** Stature: [-1, 1] sprite(−) ↔ titan(+), default 0 */
  stature?: number;
  /** Flush override: [-1, 1], default from chord recipes */
  flush?: number;
  /** Fatigue override: [-1, 1] wired(−) ↔ exhausted(+), default from chord recipes */
  fatigue?: number;
  /** Additive pitch override (radians, on top of chord-derived pose) */
  pitch?: number;
  /** Additive yaw override (radians) */
  yaw?: number;
  /** Additive roll override (radians) */
  roll?: number;
  /** Direct gaze horizontal override (radians) — alternative to gazeTarget */
  gazeH?: number;
  /** Direct gaze vertical override (radians) */
  gazeV?: number;
  /** Face id to look at (eyes track toward that face's grid position) */
  gazeTarget?: string;
}

/** A complete scenario definition */
export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  /** Total duration in seconds */
  duration: number;
  /** Grid dimensions [cols, rows] */
  grid: [number, number];
  /** Face definitions */
  faces: ScenarioFace[];
  /** Per-face keyframe curves: face.id → keyframes (sorted by t) */
  curves: Record<string, ScenarioKeyframe[]>;
}

/** Interpolated state at a point in time */
export interface InterpolatedState {
  tension: number;
  valence: number;
  stature: number;
  flush?: number;
  fatigue?: number;
  pitch?: number;
  yaw?: number;
  roll?: number;
  gazeH?: number;
  gazeV?: number;
  gazeTarget?: string;
  /** Blend factor for gaze target transition [0,1] */
  gazeBlend?: number;
}
