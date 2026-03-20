import type { Scenario, ScenarioFace, ScenarioKeyframe } from '../types';

/**
 * "The False Calm" — 30s, 16 faces, 4×4 grid.
 *
 * 25 seconds of content calm. Sentinel fc0 micro-twitches subtly.
 * At t=25, THE SNAP — fc0 spikes to full panic, wavefront radiates
 * from corner at ~0.5s per Manhattan distance unit.
 *
 * The key is CONTRAST: boredom then violence.
 */

const faces: ScenarioFace[] = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    const id = `fc${r * 4 + c}`;
    faces.push({
      id,
      position: [c, r],
      group: r === 0 && c === 0 ? 'sentinel' : 'herd',
    });
  }
}

/** Manhattan distance from (0,0) */
function dist(col: number, row: number): number {
  return col + row;
}

const curves: Record<string, ScenarioKeyframe[]> = {};

// Sentinel fc0 — micro-twitch then snap
curves['fc0'] = [
  { t: 0, tension: -0.3, valence: 0.3, stature: 0.1, flush: 0.1 },
  // Micro-twitch cycle 1
  { t: 5, tension: -0.2, valence: 0.3 },
  { t: 6.5, tension: -0.05, valence: 0.25 },
  { t: 8, tension: -0.2, valence: 0.3 },
  // Micro-twitch cycle 2
  { t: 11, tension: -0.05, valence: 0.2 },
  { t: 12.5, tension: -0.2, valence: 0.3 },
  // Micro-twitch cycle 3 — slightly stronger
  { t: 16, tension: 0.0, valence: 0.15 },
  { t: 17.5, tension: -0.15, valence: 0.25 },
  // Building...
  { t: 21, tension: 0.05, valence: 0.1 },
  { t: 23, tension: -0.1, valence: 0.2 },
  // THE SNAP
  { t: 24.8, tension: -0.1, valence: 0.2 },
  { t: 25, tension: 1.0, valence: -1.0, flush: -0.6 },
  // Settling
  { t: 28, tension: 0.8, valence: -0.7, flush: -0.4 },
  { t: 30, tension: 0.8, valence: -0.7 },
];

// All other faces — calm then wavefront snap
for (const face of faces) {
  if (face.id === 'fc0') continue;

  const [col, row] = face.position;
  const d = dist(col, row);
  const snapTime = 25 + d * 0.5; // 0.5s per grid unit from corner

  // Leading gaze: eyes dart toward fc0 slightly before their snap
  const gazeLeadTime = Math.max(25, snapTime - 0.8);

  curves[face.id] = [
    { t: 0, tension: -0.3, valence: 0.3, stature: 0.1, flush: 0.1 },
    { t: 20, tension: -0.3, valence: 0.3 },
    // Gaze darts to sentinel before snap
    { t: gazeLeadTime, tension: -0.3, valence: 0.3, gazeTarget: 'fc0' },
    // Still calm just before snap
    { t: snapTime - 0.1, tension: -0.2, valence: 0.2, gazeTarget: 'fc0' },
    // SNAP — panic (slight variation by distance)
    { t: snapTime, tension: 0.9 + d * 0.015, valence: -0.8 - d * 0.03, flush: -0.5, gazeTarget: 'fc0' },
    // Settling
    { t: Math.min(snapTime + 2, 30), tension: 0.8, valence: -0.7 },
    { t: 30, tension: 0.8, valence: -0.7 },
  ];
}

export const FALSE_CALM_SCENARIO: Scenario = {
  id: 'false-calm',
  title: 'The False Calm',
  subtitle: '25 seconds of peace. Then the wall screams.',
  duration: 30,
  grid: [4, 4],
  faces,
  curves,
};
