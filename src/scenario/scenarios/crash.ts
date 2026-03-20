import type { Scenario, ScenarioKeyframe } from '../types';

/**
 * "The Crash" — 60s, 4×4 grid, 16 faces.
 *
 * Narrative arc:
 *   0-10s   CALM — warm contentment, lazy gaze, gentle breathing
 *   10-12s  DETECTION — sentinels sense something, glance at each other
 *   12-20s  ALARM — sentinels spike, wavefront begins propagating
 *   20-35s  PANIC — full market rout, pallor waves, fatigue accumulating
 *   35-45s  EXHAUSTION — herd collapses into resignation, havens rally
 *   45-60s  AFTERMATH — depleted silence, havens stand tall
 *
 * Wavefront: 2s delay per Manhattan distance from s0.
 * Eyes lead expression by 1-2s (gazeTarget precedes tension spike).
 */

// ─── Sentinels ──────────────────────────────────────

const s0: ScenarioKeyframe[] = [
  // Calm — titan posture, warm, alert gaze
  { t: 0, tension: -0.2, valence: 0.35, stature: 0.3, flush: 0.15, fatigue: -0.2, pitch: -0.05, gazeH: 0.05, gazeV: 0.05 },
  { t: 4, tension: -0.25, valence: 0.3, stature: 0.3, flush: 0.12, fatigue: -0.15, pitch: -0.03, gazeH: -0.03, gazeV: 0.02 },
  { t: 8, tension: -0.15, valence: 0.25, stature: 0.3, flush: 0.1, fatigue: -0.1, pitch: -0.04, gazeH: 0.08, gazeV: 0.08 },
  // Detection — micro-tension spike, eyes snap to s1
  { t: 10, tension: 0.1, valence: 0.1, stature: 0.3, flush: 0.0, fatigue: -0.3, pitch: -0.08, gazeTarget: 's1' },
  { t: 11, tension: 0.3, valence: -0.05, stature: 0.25, flush: -0.1, fatigue: -0.4, pitch: -0.10 },
  // Alarm — full spike, wired skin, head snaps alert
  { t: 12, tension: 0.7, valence: -0.3, stature: 0.2, flush: -0.3, fatigue: -0.6, pitch: -0.12, gazeV: 0.15 },
  { t: 14, tension: 0.85, valence: -0.5, stature: 0.1, flush: -0.45, fatigue: -0.7, pitch: -0.10 },
  { t: 17, tension: 0.95, valence: -0.7, stature: 0.0, flush: -0.55, fatigue: -0.6, pitch: -0.08, gazeH: 0.1 },
  // Sustained panic — fatigue building
  { t: 22, tension: 0.9, valence: -0.75, stature: -0.1, flush: -0.5, fatigue: -0.3, pitch: -0.05 },
  { t: 28, tension: 0.85, valence: -0.7, stature: -0.15, flush: -0.45, fatigue: 0.0 },
  // Breaking — sentinel crumbles, exhaustion wins
  { t: 33, tension: 0.5, valence: -0.6, stature: -0.25, flush: -0.35, fatigue: 0.3, pitch: 0.05, roll: 0.03 },
  { t: 38, tension: -0.1, valence: -0.5, stature: -0.3, flush: -0.2, fatigue: 0.55, pitch: 0.10, roll: 0.04 },
  // Aftermath — depleted, head down, staring at nothing
  { t: 44, tension: -0.4, valence: -0.4, stature: -0.2, flush: -0.1, fatigue: 0.7, pitch: 0.13, gazeV: -0.2 },
  { t: 50, tension: -0.5, valence: -0.35, stature: -0.1, flush: -0.05, fatigue: 0.75, pitch: 0.12, gazeV: -0.25 },
  { t: 55, tension: -0.55, valence: -0.3, stature: 0.0, flush: 0.0, fatigue: 0.7, pitch: 0.10, gazeV: -0.3 },
  { t: 60, tension: -0.6, valence: -0.3, stature: 0.1, flush: 0.0, fatigue: 0.65, pitch: 0.08, gazeV: -0.35 },
];

const s1: ScenarioKeyframe[] = [
  // Calm — slightly scanning right toward herd
  { t: 0, tension: -0.25, valence: 0.3, stature: 0.25, flush: 0.12, fatigue: -0.15, gazeH: 0.1, gazeV: 0.03 },
  { t: 4, tension: -0.2, valence: 0.35, stature: 0.25, flush: 0.15, fatigue: -0.1, gazeH: -0.05, gazeV: 0.0 },
  { t: 8, tension: -0.2, valence: 0.3, stature: 0.28, flush: 0.1, fatigue: -0.1, gazeH: 0.08, gazeV: 0.05 },
  // Detection — eyes snap to s0 FIRST (1.5s before tension rises)
  { t: 10.5, tension: -0.1, valence: 0.2, stature: 0.25, flush: 0.05, fatigue: -0.2, gazeTarget: 's0' },
  { t: 11.5, tension: 0.05, valence: 0.1, stature: 0.25, flush: -0.05, fatigue: -0.3, gazeTarget: 's0', pitch: -0.06 },
  // Alarm — delayed 2s behind s0, building
  { t: 13, tension: 0.5, valence: -0.15, stature: 0.2, flush: -0.2, fatigue: -0.5, pitch: -0.10, gazeTarget: 's0' },
  { t: 15, tension: 0.7, valence: -0.4, stature: 0.1, flush: -0.35, fatigue: -0.6, pitch: -0.08 },
  { t: 18, tension: 0.85, valence: -0.6, stature: 0.0, flush: -0.5, fatigue: -0.55, pitch: -0.06, gazeH: 0.15 },
  // Sustained panic
  { t: 23, tension: 0.85, valence: -0.65, stature: -0.05, flush: -0.45, fatigue: -0.2 },
  { t: 28, tension: 0.8, valence: -0.6, stature: -0.1, flush: -0.4, fatigue: 0.05 },
  // Breaking
  { t: 34, tension: 0.3, valence: -0.55, stature: -0.2, flush: -0.25, fatigue: 0.35, pitch: 0.08, roll: -0.03 },
  { t: 40, tension: -0.2, valence: -0.45, stature: -0.25, flush: -0.15, fatigue: 0.55, pitch: 0.12, roll: -0.04 },
  // Aftermath
  { t: 46, tension: -0.45, valence: -0.4, stature: -0.15, flush: -0.05, fatigue: 0.7, pitch: 0.13, gazeV: -0.2 },
  { t: 52, tension: -0.5, valence: -0.35, stature: -0.05, flush: 0.0, fatigue: 0.72, pitch: 0.11, gazeV: -0.28 },
  { t: 57, tension: -0.55, valence: -0.3, stature: 0.05, flush: 0.0, fatigue: 0.68, pitch: 0.09, gazeV: -0.3 },
  { t: 60, tension: -0.58, valence: -0.28, stature: 0.1, flush: 0.0, fatigue: 0.65, pitch: 0.08, gazeV: -0.32 },
];

// ─── Herd ───────────────────────────────────────────
// Each herd face has a unique panic onset = 12 + manhattan_dist * 2
// Eyes lead by looking at s0 ~1.5s before their panic onset.
// h0 panics earliest & hardest, h9 slowest.

// h2 at [0,1] — dist 1, panic onset ~14
const h2: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0, gazeH: 0.0, gazeV: 0.0 },
  { t: 5, tension: -0.25, valence: 0.35, stature: 0.0, flush: 0.12, fatigue: 0.0, gazeH: 0.03, gazeV: -0.02 },
  { t: 9, tension: -0.2, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  // Eyes snap to s0 at t=12.5, 1.5s before panic
  { t: 12.5, tension: -0.15, valence: 0.2, stature: 0.0, flush: 0.05, fatigue: -0.1, gazeTarget: 's0', pitch: -0.03 },
  // Panic hits at t=14
  { t: 14, tension: 0.6, valence: -0.3, stature: -0.05, flush: -0.2, fatigue: -0.4, pitch: -0.08, gazeTarget: 's0' },
  { t: 16, tension: 0.8, valence: -0.55, stature: -0.1, flush: -0.4, fatigue: -0.5, pitch: -0.06 },
  { t: 19, tension: 0.85, valence: -0.65, stature: -0.15, flush: -0.5, fatigue: -0.35, gazeH: -0.05 },
  { t: 24, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.45, fatigue: -0.1 },
  { t: 29, tension: 0.8, valence: -0.65, stature: -0.25, flush: -0.4, fatigue: 0.15, pitch: 0.02 },
  // Exhaustion wave
  { t: 34, tension: 0.4, valence: -0.55, stature: -0.3, flush: -0.25, fatigue: 0.4, pitch: 0.08 },
  { t: 39, tension: -0.1, valence: -0.5, stature: -0.35, flush: -0.15, fatigue: 0.6, pitch: 0.12, roll: 0.03 },
  { t: 44, tension: -0.35, valence: -0.45, stature: -0.35, flush: -0.1, fatigue: 0.7, pitch: 0.14, gazeV: -0.2 },
  { t: 50, tension: -0.45, valence: -0.4, stature: -0.3, flush: -0.05, fatigue: 0.72, pitch: 0.13, gazeV: -0.25 },
  { t: 55, tension: -0.5, valence: -0.35, stature: -0.25, flush: 0.0, fatigue: 0.7, pitch: 0.12, gazeV: -0.3 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.2, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// h3 at [1,1] — dist 2, panic onset ~16
const h3: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  { t: 5, tension: -0.25, valence: 0.32, stature: 0.0, flush: 0.13, fatigue: 0.0, gazeH: -0.03 },
  { t: 10, tension: -0.2, valence: 0.28, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  // Eyes snap to s0 at t=14.5
  { t: 14.5, tension: -0.1, valence: 0.15, stature: 0.0, flush: 0.02, fatigue: -0.1, gazeTarget: 's0', pitch: -0.04 },
  // Panic at t=16
  { t: 16, tension: 0.55, valence: -0.25, stature: -0.05, flush: -0.15, fatigue: -0.35, pitch: -0.07 },
  { t: 18, tension: 0.75, valence: -0.5, stature: -0.1, flush: -0.35, fatigue: -0.45 },
  { t: 21, tension: 0.85, valence: -0.65, stature: -0.15, flush: -0.48, fatigue: -0.3, gazeH: 0.08 },
  { t: 26, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.45, fatigue: -0.05 },
  { t: 30, tension: 0.8, valence: -0.65, stature: -0.25, flush: -0.38, fatigue: 0.15 },
  // FALSE RELIEF at t=35 — brief valence uptick
  { t: 35, tension: 0.3, valence: -0.3, stature: -0.2, flush: -0.15, fatigue: 0.3, pitch: 0.03, gazeTarget: 'v0' },
  // Re-panic at t=38
  { t: 38, tension: 0.65, valence: -0.6, stature: -0.3, flush: -0.4, fatigue: 0.2, pitch: -0.04 },
  { t: 42, tension: 0.3, valence: -0.55, stature: -0.35, flush: -0.25, fatigue: 0.5, pitch: 0.10 },
  // Final exhaustion
  { t: 47, tension: -0.2, valence: -0.45, stature: -0.35, flush: -0.1, fatigue: 0.65, pitch: 0.13, roll: -0.03, gazeV: -0.2 },
  { t: 52, tension: -0.45, valence: -0.4, stature: -0.3, flush: -0.05, fatigue: 0.7, pitch: 0.12, gazeV: -0.25 },
  { t: 57, tension: -0.5, valence: -0.35, stature: -0.25, flush: 0.0, fatigue: 0.68, pitch: 0.11, gazeV: -0.28 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.2, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// h0 at [2,0] — dist 2, panic onset ~16, PANICS HARDEST
const h0: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.05, flush: 0.12, fatigue: 0.0, gazeH: -0.08 },
  { t: 5, tension: -0.25, valence: 0.28, stature: 0.05, flush: 0.1, fatigue: 0.0, gazeH: -0.05 },
  { t: 10, tension: -0.15, valence: 0.2, stature: 0.05, flush: 0.08, fatigue: 0.0 },
  // Eyes toward sentinels early — proximity to s1
  { t: 13, tension: -0.05, valence: 0.1, stature: 0.0, flush: 0.0, fatigue: -0.15, gazeTarget: 's1', pitch: -0.04 },
  { t: 14.5, tension: 0.2, valence: 0.0, stature: 0.0, flush: -0.1, fatigue: -0.3, gazeTarget: 's0' },
  // Panic — earliest herd, hits HARDEST
  { t: 16, tension: 0.7, valence: -0.4, stature: -0.1, flush: -0.3, fatigue: -0.5, pitch: -0.10 },
  { t: 18, tension: 0.9, valence: -0.65, stature: -0.15, flush: -0.5, fatigue: -0.55 },
  { t: 21, tension: 0.95, valence: -0.8, stature: -0.2, flush: -0.6, fatigue: -0.4, gazeV: 0.1 },
  { t: 25, tension: 0.95, valence: -0.85, stature: -0.3, flush: -0.55, fatigue: -0.15 },
  { t: 30, tension: 0.9, valence: -0.8, stature: -0.35, flush: -0.5, fatigue: 0.1 },
  // No relief — straight into despair
  { t: 35, tension: 0.6, valence: -0.75, stature: -0.4, flush: -0.35, fatigue: 0.35, pitch: 0.08 },
  { t: 40, tension: 0.2, valence: -0.7, stature: -0.45, flush: -0.2, fatigue: 0.55, pitch: 0.12, roll: 0.05 },
  { t: 45, tension: -0.15, valence: -0.65, stature: -0.5, flush: -0.1, fatigue: 0.7, pitch: 0.15, gazeV: -0.25 },
  { t: 50, tension: -0.35, valence: -0.55, stature: -0.45, flush: -0.05, fatigue: 0.75, pitch: 0.14, gazeV: -0.3 },
  { t: 55, tension: -0.5, valence: -0.45, stature: -0.4, flush: 0.0, fatigue: 0.72, pitch: 0.13, gazeV: -0.35 },
  { t: 60, tension: -0.55, valence: -0.4, stature: -0.35, flush: 0.0, fatigue: 0.7, pitch: 0.12, gazeV: -0.35 },
];

// h6 at [0,2] — dist 2, panic onset ~16, slightly more composed
const h6: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  { t: 5, tension: -0.28, valence: 0.32, stature: 0.0, flush: 0.12, fatigue: 0.0, gazeH: 0.05 },
  { t: 10, tension: -0.2, valence: 0.25, stature: 0.0, flush: 0.08, fatigue: 0.0 },
  // Eyes snap upward toward s0 at t=14
  { t: 14, tension: -0.1, valence: 0.15, stature: 0.0, flush: 0.0, fatigue: -0.1, gazeTarget: 's0', gazeV: 0.1 },
  { t: 15.5, tension: 0.2, valence: 0.0, stature: 0.0, flush: -0.08, fatigue: -0.25 },
  // Panic at t=16
  { t: 16.5, tension: 0.6, valence: -0.35, stature: -0.05, flush: -0.25, fatigue: -0.4, pitch: -0.06 },
  { t: 19, tension: 0.75, valence: -0.55, stature: -0.1, flush: -0.4, fatigue: -0.35 },
  { t: 23, tension: 0.8, valence: -0.6, stature: -0.15, flush: -0.42, fatigue: -0.1, gazeH: 0.05 },
  { t: 28, tension: 0.75, valence: -0.6, stature: -0.2, flush: -0.38, fatigue: 0.1 },
  { t: 33, tension: 0.5, valence: -0.5, stature: -0.25, flush: -0.25, fatigue: 0.3, pitch: 0.05 },
  // Exhaustion — slower collapse than h0
  { t: 38, tension: 0.0, valence: -0.45, stature: -0.3, flush: -0.15, fatigue: 0.5, pitch: 0.10, roll: -0.03 },
  { t: 43, tension: -0.3, valence: -0.42, stature: -0.3, flush: -0.08, fatigue: 0.62, pitch: 0.12, gazeV: -0.15 },
  { t: 48, tension: -0.4, valence: -0.38, stature: -0.28, flush: -0.03, fatigue: 0.68, pitch: 0.13, gazeV: -0.22 },
  { t: 53, tension: -0.48, valence: -0.35, stature: -0.25, flush: 0.0, fatigue: 0.7, pitch: 0.12, gazeV: -0.28 },
  { t: 58, tension: -0.55, valence: -0.3, stature: -0.2, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.2, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// h1 at [3,0] — dist 3, panic onset ~18
const h1: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0, gazeH: -0.1 },
  { t: 6, tension: -0.25, valence: 0.3, stature: 0.0, flush: 0.12, fatigue: 0.0 },
  { t: 12, tension: -0.2, valence: 0.25, stature: 0.0, flush: 0.08, fatigue: 0.0 },
  // Eyes glance left toward h0 at t=16, sees panic
  { t: 16, tension: -0.05, valence: 0.1, stature: 0.0, flush: 0.0, fatigue: -0.1, gazeTarget: 'h0' },
  { t: 17, tension: 0.15, valence: 0.0, stature: 0.0, flush: -0.08, fatigue: -0.2, gazeTarget: 's0' },
  // Panic at t=18
  { t: 18, tension: 0.6, valence: -0.35, stature: -0.05, flush: -0.2, fatigue: -0.4, pitch: -0.06 },
  { t: 20, tension: 0.8, valence: -0.6, stature: -0.1, flush: -0.4, fatigue: -0.5 },
  { t: 24, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.5, fatigue: -0.3 },
  { t: 28, tension: 0.9, valence: -0.75, stature: -0.25, flush: -0.48, fatigue: -0.1 },
  { t: 33, tension: 0.85, valence: -0.75, stature: -0.3, flush: -0.42, fatigue: 0.1 },
  // Extended panic — this face burns hot and long
  { t: 38, tension: 0.6, valence: -0.7, stature: -0.35, flush: -0.3, fatigue: 0.35, pitch: 0.06 },
  { t: 43, tension: 0.2, valence: -0.6, stature: -0.4, flush: -0.18, fatigue: 0.55, pitch: 0.12, roll: -0.04 },
  { t: 48, tension: -0.15, valence: -0.5, stature: -0.4, flush: -0.08, fatigue: 0.68, pitch: 0.14, gazeV: -0.2 },
  { t: 53, tension: -0.4, valence: -0.42, stature: -0.35, flush: -0.03, fatigue: 0.72, pitch: 0.13, gazeV: -0.28 },
  { t: 58, tension: -0.5, valence: -0.35, stature: -0.3, flush: 0.0, fatigue: 0.7, pitch: 0.11, gazeV: -0.3 },
  { t: 60, tension: -0.55, valence: -0.32, stature: -0.25, flush: 0.0, fatigue: 0.68, pitch: 0.10, gazeV: -0.3 },
];

// h4 at [2,1] — dist 3, panic onset ~18, has FALSE RELIEF at t=37
const h4: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  { t: 6, tension: -0.28, valence: 0.32, stature: 0.0, flush: 0.12, fatigue: 0.0, gazeH: -0.04 },
  { t: 12, tension: -0.2, valence: 0.25, stature: 0.0, flush: 0.08, fatigue: 0.0 },
  // Eyes snap to h3 at t=16.5
  { t: 16.5, tension: -0.05, valence: 0.1, stature: 0.0, flush: 0.0, fatigue: -0.1, gazeTarget: 'h3' },
  // Panic at t=18
  { t: 18, tension: 0.55, valence: -0.3, stature: -0.05, flush: -0.18, fatigue: -0.35, pitch: -0.06 },
  { t: 20, tension: 0.75, valence: -0.55, stature: -0.1, flush: -0.38, fatigue: -0.45 },
  { t: 24, tension: 0.85, valence: -0.65, stature: -0.15, flush: -0.48, fatigue: -0.25 },
  { t: 28, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.45, fatigue: -0.05 },
  { t: 33, tension: 0.7, valence: -0.6, stature: -0.25, flush: -0.35, fatigue: 0.15 },
  // FALSE RELIEF at t=37 — looks at havens with hope
  { t: 37, tension: 0.2, valence: -0.2, stature: -0.15, flush: -0.1, fatigue: 0.25, gazeTarget: 'v0', pitch: 0.0 },
  // Re-panic at t=40 — hope crushed
  { t: 40, tension: 0.7, valence: -0.65, stature: -0.3, flush: -0.4, fatigue: 0.2, pitch: -0.04 },
  { t: 44, tension: 0.35, valence: -0.6, stature: -0.35, flush: -0.25, fatigue: 0.5, pitch: 0.10 },
  { t: 48, tension: -0.1, valence: -0.5, stature: -0.38, flush: -0.1, fatigue: 0.65, pitch: 0.13, gazeV: -0.2 },
  { t: 53, tension: -0.4, valence: -0.4, stature: -0.35, flush: -0.03, fatigue: 0.7, pitch: 0.12, gazeV: -0.25 },
  { t: 57, tension: -0.5, valence: -0.35, stature: -0.3, flush: 0.0, fatigue: 0.68, pitch: 0.11, gazeV: -0.28 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.25, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// h7 at [1,2] — dist 3, panic onset ~18, slightly stoic
const h7: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.28, stature: 0.0, flush: 0.1, fatigue: 0.05 },
  { t: 6, tension: -0.25, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.05, gazeH: 0.06 },
  { t: 12, tension: -0.2, valence: 0.25, stature: 0.0, flush: 0.08, fatigue: 0.05 },
  // Eyes snap to h3/s0 area
  { t: 16, tension: -0.1, valence: 0.12, stature: 0.0, flush: 0.0, fatigue: -0.05, gazeTarget: 'h3', pitch: -0.03 },
  { t: 17.5, tension: 0.15, valence: 0.0, stature: 0.0, flush: -0.08, fatigue: -0.2, gazeTarget: 's0' },
  // Panic at t=18
  { t: 18.5, tension: 0.55, valence: -0.3, stature: -0.05, flush: -0.2, fatigue: -0.3, pitch: -0.05 },
  { t: 21, tension: 0.75, valence: -0.55, stature: -0.1, flush: -0.38, fatigue: -0.35 },
  { t: 25, tension: 0.8, valence: -0.65, stature: -0.15, flush: -0.45, fatigue: -0.15 },
  { t: 30, tension: 0.8, valence: -0.65, stature: -0.2, flush: -0.4, fatigue: 0.05 },
  { t: 35, tension: 0.6, valence: -0.6, stature: -0.25, flush: -0.3, fatigue: 0.25, pitch: 0.04 },
  // Slow collapse
  { t: 40, tension: 0.15, valence: -0.5, stature: -0.3, flush: -0.18, fatigue: 0.45, pitch: 0.10, roll: 0.04 },
  { t: 45, tension: -0.2, valence: -0.45, stature: -0.32, flush: -0.08, fatigue: 0.6, pitch: 0.13, gazeV: -0.15 },
  { t: 50, tension: -0.4, valence: -0.4, stature: -0.3, flush: -0.03, fatigue: 0.68, pitch: 0.12, gazeV: -0.22 },
  { t: 55, tension: -0.48, valence: -0.35, stature: -0.28, flush: 0.0, fatigue: 0.7, pitch: 0.11, gazeV: -0.28 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.25, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// h8 at [0,3] — dist 3, panic onset ~18, more fearful than h7
const h8: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  { t: 6, tension: -0.28, valence: 0.3, stature: 0.0, flush: 0.12, fatigue: 0.0, gazeV: -0.03 },
  { t: 12, tension: -0.2, valence: 0.25, stature: 0.0, flush: 0.08, fatigue: 0.0 },
  // Eyes snap upward to h6
  { t: 15.5, tension: -0.05, valence: 0.15, stature: 0.0, flush: 0.0, fatigue: -0.1, gazeTarget: 'h6', gazeV: 0.12 },
  { t: 17, tension: 0.2, valence: 0.0, stature: 0.0, flush: -0.1, fatigue: -0.25, gazeTarget: 's0' },
  // Panic at t=18
  { t: 18.5, tension: 0.6, valence: -0.4, stature: -0.05, flush: -0.25, fatigue: -0.4, pitch: -0.07 },
  { t: 21, tension: 0.8, valence: -0.6, stature: -0.1, flush: -0.42, fatigue: -0.4 },
  { t: 25, tension: 0.85, valence: -0.7, stature: -0.18, flush: -0.48, fatigue: -0.2 },
  { t: 30, tension: 0.85, valence: -0.7, stature: -0.25, flush: -0.45, fatigue: 0.0 },
  { t: 35, tension: 0.7, valence: -0.65, stature: -0.3, flush: -0.35, fatigue: 0.2 },
  // Collapse
  { t: 40, tension: 0.25, valence: -0.55, stature: -0.35, flush: -0.2, fatigue: 0.45, pitch: 0.10, roll: -0.05 },
  { t: 45, tension: -0.1, valence: -0.5, stature: -0.38, flush: -0.1, fatigue: 0.6, pitch: 0.14, gazeV: -0.18 },
  { t: 50, tension: -0.35, valence: -0.42, stature: -0.35, flush: -0.05, fatigue: 0.7, pitch: 0.13, gazeV: -0.25 },
  { t: 55, tension: -0.48, valence: -0.38, stature: -0.3, flush: 0.0, fatigue: 0.72, pitch: 0.12, gazeV: -0.3 },
  { t: 60, tension: -0.55, valence: -0.32, stature: -0.25, flush: 0.0, fatigue: 0.68, pitch: 0.10, gazeV: -0.3 },
];

// h5 at [3,1] — dist 4, panic onset ~20, FALSE RELIEF at t=36
const h5: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0 },
  { t: 7, tension: -0.28, valence: 0.3, stature: 0.0, flush: 0.12, fatigue: 0.0 },
  { t: 13, tension: -0.2, valence: 0.28, stature: 0.0, flush: 0.08, fatigue: 0.0, gazeH: -0.06 },
  // Eyes snap to h4 at t=18
  { t: 18, tension: -0.1, valence: 0.15, stature: 0.0, flush: 0.0, fatigue: -0.08, gazeTarget: 'h4' },
  { t: 19, tension: 0.1, valence: 0.05, stature: 0.0, flush: -0.05, fatigue: -0.15, gazeTarget: 's0' },
  // Panic at t=20
  { t: 20, tension: 0.5, valence: -0.25, stature: -0.05, flush: -0.15, fatigue: -0.3, pitch: -0.05 },
  { t: 22, tension: 0.7, valence: -0.5, stature: -0.1, flush: -0.35, fatigue: -0.4 },
  { t: 26, tension: 0.8, valence: -0.65, stature: -0.15, flush: -0.45, fatigue: -0.2 },
  { t: 30, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.45, fatigue: -0.05 },
  { t: 34, tension: 0.7, valence: -0.65, stature: -0.25, flush: -0.35, fatigue: 0.15 },
  // FALSE RELIEF at t=36
  { t: 36, tension: 0.25, valence: -0.25, stature: -0.15, flush: -0.1, fatigue: 0.2, gazeTarget: 'v1', pitch: 0.0 },
  // Re-panic at t=39
  { t: 39, tension: 0.65, valence: -0.6, stature: -0.3, flush: -0.35, fatigue: 0.15, pitch: -0.03 },
  { t: 43, tension: 0.35, valence: -0.55, stature: -0.35, flush: -0.2, fatigue: 0.45, pitch: 0.08 },
  { t: 48, tension: -0.05, valence: -0.45, stature: -0.38, flush: -0.08, fatigue: 0.6, pitch: 0.13, gazeV: -0.18 },
  { t: 53, tension: -0.35, valence: -0.4, stature: -0.35, flush: -0.03, fatigue: 0.68, pitch: 0.12, gazeV: -0.25 },
  { t: 58, tension: -0.5, valence: -0.35, stature: -0.3, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.28 },
  { t: 60, tension: -0.55, valence: -0.3, stature: -0.25, flush: 0.0, fatigue: 0.63, pitch: 0.10, gazeV: -0.3 },
];

// h9 at [1,3] — dist 4, panic onset ~20, SLOWEST REACTOR, last to break
const h9: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.05, flush: 0.12, fatigue: 0.0 },
  { t: 7, tension: -0.28, valence: 0.32, stature: 0.05, flush: 0.1, fatigue: 0.0, gazeH: 0.04 },
  { t: 14, tension: -0.22, valence: 0.25, stature: 0.05, flush: 0.08, fatigue: 0.0 },
  // Still calm while others panic — looking around with confusion
  { t: 17, tension: -0.15, valence: 0.15, stature: 0.05, flush: 0.05, fatigue: 0.0, gazeTarget: 'h8', gazeV: 0.05 },
  { t: 18.5, tension: -0.05, valence: 0.1, stature: 0.0, flush: 0.0, fatigue: -0.08, gazeTarget: 'h7' },
  // Panic at t=20 — delayed, builds slower
  { t: 20, tension: 0.3, valence: -0.1, stature: 0.0, flush: -0.08, fatigue: -0.2 },
  { t: 22, tension: 0.55, valence: -0.35, stature: -0.05, flush: -0.2, fatigue: -0.35, pitch: -0.04 },
  { t: 26, tension: 0.7, valence: -0.55, stature: -0.1, flush: -0.35, fatigue: -0.25 },
  { t: 30, tension: 0.8, valence: -0.65, stature: -0.15, flush: -0.42, fatigue: -0.05 },
  { t: 35, tension: 0.85, valence: -0.7, stature: -0.2, flush: -0.45, fatigue: 0.1 },
  // Peak panic LATER than everyone else — still burning at t=40
  { t: 40, tension: 0.8, valence: -0.7, stature: -0.25, flush: -0.4, fatigue: 0.25, pitch: 0.03 },
  { t: 45, tension: 0.5, valence: -0.6, stature: -0.3, flush: -0.25, fatigue: 0.45, pitch: 0.08 },
  { t: 50, tension: 0.1, valence: -0.5, stature: -0.35, flush: -0.12, fatigue: 0.6, pitch: 0.12, gazeV: -0.15 },
  { t: 55, tension: -0.25, valence: -0.42, stature: -0.32, flush: -0.05, fatigue: 0.7, pitch: 0.13, gazeV: -0.25 },
  { t: 58, tension: -0.4, valence: -0.38, stature: -0.28, flush: 0.0, fatigue: 0.68, pitch: 0.12, gazeV: -0.28 },
  { t: 60, tension: -0.5, valence: -0.35, stature: -0.25, flush: 0.0, fatigue: 0.65, pitch: 0.10, gazeV: -0.3 },
];

// ─── Havens ─────────────────────────────────────────
// Havens dip in sympathy, then RALLY — growing stature, warm flush,
// positive valence. They become the visual anchors of stability.

// v0 at [2,2] — dist 4, nearest haven, rallies fastest
const v0: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: -0.1, flush: 0.1, fatigue: 0.0 },
  { t: 6, tension: -0.25, valence: 0.28, stature: -0.1, flush: 0.12, fatigue: 0.0, gazeH: -0.05 },
  { t: 12, tension: -0.15, valence: 0.2, stature: -0.1, flush: 0.08, fatigue: 0.0 },
  // Sympathy dip — watches the carnage
  { t: 18, tension: 0.1, valence: 0.05, stature: -0.1, flush: -0.05, fatigue: -0.1, gazeTarget: 'h3' },
  { t: 21, tension: 0.4, valence: -0.2, stature: -0.15, flush: -0.2, fatigue: -0.2, gazeTarget: 's0' },
  { t: 25, tension: 0.55, valence: -0.35, stature: -0.2, flush: -0.3, fatigue: -0.15 },
  // Turning point — safe-haven flows arrive
  { t: 29, tension: 0.4, valence: -0.15, stature: -0.1, flush: -0.15, fatigue: -0.1 },
  { t: 33, tension: 0.2, valence: 0.15, stature: 0.05, flush: 0.05, fatigue: -0.05, gazeTarget: 'h4' },
  // Rally — growing, warm, confident
  { t: 37, tension: 0.1, valence: 0.4, stature: 0.2, flush: 0.2, fatigue: -0.15, pitch: -0.03 },
  { t: 41, tension: 0.05, valence: 0.5, stature: 0.3, flush: 0.3, fatigue: -0.2, gazeTarget: 'h3' },
  { t: 45, tension: 0.0, valence: 0.55, stature: 0.35, flush: 0.35, fatigue: -0.15 },
  { t: 49, tension: -0.05, valence: 0.5, stature: 0.4, flush: 0.32, fatigue: -0.1 },
  // Settle — titan, warm, composed
  { t: 53, tension: -0.1, valence: 0.45, stature: 0.42, flush: 0.28, fatigue: -0.05, gazeV: -0.05 },
  { t: 57, tension: -0.15, valence: 0.4, stature: 0.45, flush: 0.25, fatigue: 0.0 },
  { t: 60, tension: -0.2, valence: 0.35, stature: 0.45, flush: 0.2, fatigue: 0.0 },
];

// v1 at [3,2] — dist 5, rallies slightly later
const v1: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: -0.15, flush: 0.1, fatigue: 0.0 },
  { t: 7, tension: -0.25, valence: 0.3, stature: -0.15, flush: 0.12, fatigue: 0.0 },
  { t: 13, tension: -0.2, valence: 0.22, stature: -0.15, flush: 0.08, fatigue: 0.0 },
  // Sympathy dip — delayed
  { t: 20, tension: 0.05, valence: 0.1, stature: -0.15, flush: 0.0, fatigue: -0.05, gazeTarget: 'h5' },
  { t: 23, tension: 0.45, valence: -0.25, stature: -0.2, flush: -0.2, fatigue: -0.15, gazeTarget: 's0' },
  { t: 27, tension: 0.55, valence: -0.3, stature: -0.2, flush: -0.28, fatigue: -0.1 },
  // Turning point
  { t: 31, tension: 0.35, valence: -0.1, stature: -0.1, flush: -0.1, fatigue: -0.05 },
  { t: 35, tension: 0.15, valence: 0.15, stature: 0.0, flush: 0.05, fatigue: -0.1, gazeTarget: 'h5' },
  // Rally
  { t: 39, tension: 0.05, valence: 0.4, stature: 0.15, flush: 0.2, fatigue: -0.15 },
  { t: 43, tension: 0.0, valence: 0.5, stature: 0.3, flush: 0.3, fatigue: -0.2, pitch: -0.03, gazeTarget: 'h9' },
  { t: 47, tension: -0.05, valence: 0.55, stature: 0.38, flush: 0.35, fatigue: -0.15 },
  { t: 51, tension: -0.1, valence: 0.52, stature: 0.42, flush: 0.32, fatigue: -0.1 },
  // Settle
  { t: 55, tension: -0.15, valence: 0.45, stature: 0.45, flush: 0.28, fatigue: -0.05 },
  { t: 58, tension: -0.18, valence: 0.4, stature: 0.48, flush: 0.25, fatigue: 0.0 },
  { t: 60, tension: -0.2, valence: 0.38, stature: 0.5, flush: 0.22, fatigue: 0.0 },
];

// v2 at [2,3] — dist 5, watches herd collapse, rallies with resolve
const v2: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: -0.15, flush: 0.1, fatigue: 0.0 },
  { t: 7, tension: -0.25, valence: 0.28, stature: -0.15, flush: 0.12, fatigue: 0.0, gazeH: -0.05 },
  { t: 14, tension: -0.2, valence: 0.22, stature: -0.15, flush: 0.08, fatigue: 0.0 },
  // Sympathy dip — watches h8
  { t: 20, tension: 0.05, valence: 0.1, stature: -0.15, flush: 0.0, fatigue: -0.05, gazeTarget: 'h8' },
  { t: 23, tension: 0.4, valence: -0.2, stature: -0.2, flush: -0.18, fatigue: -0.15 },
  { t: 27, tension: 0.5, valence: -0.3, stature: -0.2, flush: -0.25, fatigue: -0.1, gazeTarget: 's1' },
  // Turning point
  { t: 31, tension: 0.3, valence: -0.08, stature: -0.1, flush: -0.08, fatigue: -0.05, gazeTarget: 'h8' },
  { t: 35, tension: 0.1, valence: 0.18, stature: 0.0, flush: 0.08, fatigue: -0.1 },
  // Rally — slightly later than v0
  { t: 39, tension: 0.0, valence: 0.35, stature: 0.12, flush: 0.18, fatigue: -0.15 },
  { t: 43, tension: -0.05, valence: 0.48, stature: 0.25, flush: 0.28, fatigue: -0.18, gazeTarget: 's1' },
  { t: 47, tension: -0.1, valence: 0.52, stature: 0.35, flush: 0.32, fatigue: -0.15 },
  { t: 51, tension: -0.12, valence: 0.5, stature: 0.4, flush: 0.3, fatigue: -0.1 },
  // Settle
  { t: 55, tension: -0.15, valence: 0.45, stature: 0.43, flush: 0.25, fatigue: -0.05, gazeV: -0.05 },
  { t: 58, tension: -0.18, valence: 0.4, stature: 0.45, flush: 0.22, fatigue: 0.0 },
  { t: 60, tension: -0.2, valence: 0.38, stature: 0.45, flush: 0.2, fatigue: 0.0 },
];

// v3 at [3,3] — dist 6, most distant, slowest sympathy, tallest rally
const v3: ScenarioKeyframe[] = [
  { t: 0, tension: -0.3, valence: 0.32, stature: -0.2, flush: 0.12, fatigue: 0.0 },
  { t: 8, tension: -0.28, valence: 0.3, stature: -0.2, flush: 0.1, fatigue: 0.0 },
  { t: 15, tension: -0.2, valence: 0.25, stature: -0.2, flush: 0.08, fatigue: 0.0 },
  // Sympathy dip — last to feel it
  { t: 22, tension: 0.0, valence: 0.12, stature: -0.2, flush: 0.0, fatigue: 0.0, gazeTarget: 'h9' },
  { t: 25, tension: 0.35, valence: -0.15, stature: -0.2, flush: -0.15, fatigue: -0.1, gazeTarget: 's0' },
  { t: 29, tension: 0.5, valence: -0.3, stature: -0.2, flush: -0.25, fatigue: -0.08 },
  // Turning point
  { t: 33, tension: 0.35, valence: -0.1, stature: -0.1, flush: -0.08, fatigue: -0.05 },
  { t: 37, tension: 0.15, valence: 0.2, stature: 0.0, flush: 0.1, fatigue: -0.1 },
  // Rally — latest but BIGGEST, becomes the tallest face
  { t: 41, tension: 0.05, valence: 0.45, stature: 0.15, flush: 0.22, fatigue: -0.2, gazeTarget: 'h3' },
  { t: 45, tension: 0.0, valence: 0.55, stature: 0.3, flush: 0.32, fatigue: -0.25, pitch: -0.04 },
  { t: 49, tension: -0.05, valence: 0.65, stature: 0.4, flush: 0.38, fatigue: -0.2 },
  { t: 53, tension: -0.1, valence: 0.6, stature: 0.45, flush: 0.35, fatigue: -0.15 },
  // Settle — tallest stature of all faces
  { t: 56, tension: -0.12, valence: 0.55, stature: 0.48, flush: 0.3, fatigue: -0.1 },
  { t: 58, tension: -0.15, valence: 0.5, stature: 0.5, flush: 0.25, fatigue: -0.05 },
  { t: 60, tension: -0.2, valence: 0.45, stature: 0.5, flush: 0.22, fatigue: 0.0 },
];

export const CRASH_SCENARIO: Scenario = {
  id: 'crash',
  title: 'The Crash',
  subtitle: 'Market-wide failure with cascading panics',
  duration: 60,
  grid: [4, 4],
  faces: [
    { id: 's0', label: 'Sentinel Alpha', position: [0, 0], group: 'sentinels' },
    { id: 's1', label: 'Sentinel Beta', position: [1, 0], group: 'sentinels' },
    { id: 'h0', position: [2, 0], group: 'herd' },
    { id: 'h1', position: [3, 0], group: 'herd' },
    { id: 'h2', position: [0, 1], group: 'herd' },
    { id: 'h3', position: [1, 1], group: 'herd' },
    { id: 'h4', position: [2, 1], group: 'herd' },
    { id: 'h5', position: [3, 1], group: 'herd' },
    { id: 'h6', position: [0, 2], group: 'herd' },
    { id: 'h7', position: [1, 2], group: 'herd' },
    { id: 'h8', position: [0, 3], group: 'herd' },
    { id: 'h9', position: [1, 3], group: 'herd' },
    { id: 'v0', label: 'Haven North', position: [2, 2], group: 'havens' },
    { id: 'v1', label: 'Haven East', position: [3, 2], group: 'havens' },
    { id: 'v2', label: 'Haven West', position: [2, 3], group: 'havens' },
    { id: 'v3', label: 'Haven South', position: [3, 3], group: 'havens' },
  ],
  curves: {
    's0': s0,
    's1': s1,
    'h0': h0,
    'h1': h1,
    'h2': h2,
    'h3': h3,
    'h4': h4,
    'h5': h5,
    'h6': h6,
    'h7': h7,
    'h8': h8,
    'h9': h9,
    'v0': v0,
    'v1': v1,
    'v2': v2,
    'v3': v3,
  },
};
