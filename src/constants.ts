// FLAME model dimensions (truncated for performance)
export const N_SHAPE = 100;
export const N_EXPR = 100;
export const N_JOINTS = 5; // neck, jaw, left_eye, right_eye, root

// Pose safe ranges (radians) — CMA-ES optimized (CLIP score 0.9319)
export const MAX_NECK_PITCH = 0.537;
export const MAX_NECK_YAW = 0.256;
export const MAX_NECK_ROLL = 0.15;
export const MAX_JAW_OPEN = 0.548;
export const MAX_EYE_HORIZONTAL = 0.52;
export const MAX_EYE_VERTICAL = 0.15;

// Timeline
export const TIMELINE_START = '2026-02-25T00:00:00Z';
export const TIMELINE_END_APPROX = '2026-03-16T00:00:00Z';
export const DEFAULT_SPEED = 1; // 1 second per hour of data

// Layout
export const FACE_SPACING = 2.5; // multiplier on bounding sphere radius

// Binding
// Tuned for market data: typical deviations are 0.05–0.3σ.
// A lower cap makes small deviations produce visible expression changes.
// GDELT data (dev up to ±9) will simply saturate — which is correct.
// Tightened to actual data range (±0.23) so crisis faces fully saturate
export const MAX_DEVIATION_SIGMA = 0.2;
// Data-viz mode: amplified expressions for visibility.
// FLAME vertex displacements are millimeter-scale per unit coefficient.
// CMA-ES optimized — ~2x previous value for dramatic, readable expressions.
export const EXPRESSION_INTENSITY_DEFAULT = 35;

// Chord architecture
/** ψ7 (eyelid close) safe range. Beyond ±4.0, eyelids clip through eyeball joint sphere. */
export const PSI7_CLAMP = 4.0;
/** β3 (mandibular width) safe range. Past -4.0 SD, jaw vertices collapse into oral cavity. */
export const BETA3_CLAMP = 4.0;
/** General β component safe range. Artifacts begin ~±5σ, mesh inversion by ~±10σ. */
export const BETA_GENERAL_CLAMP = 5.0;
