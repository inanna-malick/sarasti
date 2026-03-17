// FLAME model dimensions (truncated for performance)
export const N_SHAPE = 100;
export const N_EXPR = 100;

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
// At overview zoom (23 faces), we need coefficients in the 5-15 range
// to produce pixel-level visible deformation.
export const EXPRESSION_INTENSITY_DEFAULT = 15.0;
