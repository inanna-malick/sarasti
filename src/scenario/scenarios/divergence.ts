import type { Scenario, ScenarioFace, ScenarioKeyframe } from '../types';

const faces: ScenarioFace[] = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    const id = `d${r * 4 + c}`;
    faces.push({
      id,
      position: [c, r],
      group: c < 2 ? 'winners' : 'losers',
      label: id === 'd5' ? 'The Torn' : undefined,
    });
  }
}

const curves: Record<string, ScenarioKeyframe[]> = {};

// Winners (Left half, excluding d5 for special handling)
const winnersIds = ['d0', 'd1', 'd4', 'd8', 'd9', 'd12', 'd13'];
for (const id of winnersIds) {
  curves[id] = [
    { t: 0, tension: 0, valence: 0 },
    { t: 5, tension: 0, valence: 0 },
    { t: 15, tension: 0.1, valence: 0.2, gazeTarget: 'd3' },
    { t: 30, tension: 0.6, valence: 0.7, stature: 0.3, flush: 0.3, gazeTarget: 'd7' },
    { t: 45, tension: 0.8, valence: 0.9, stature: 0.5, gazeTarget: 'd11' },
  ];
}

// Losers (Right half)
const losersIds = ['d2', 'd3', 'd6', 'd7', 'd10', 'd11', 'd14', 'd15'];
for (const id of losersIds) {
  curves[id] = [
    { t: 0, tension: 0, valence: 0 },
    { t: 5, tension: 0, valence: 0 },
    { t: 15, tension: 0.1, valence: -0.2 },
    { t: 30, tension: 0.55, valence: -0.7, stature: -0.3, flush: -0.4 },
    { t: 45, tension: 0.6, valence: -0.9, stature: -0.5 },
  ];
}

// The Torn (d5) — oscillates between winner and loser states in the finale
curves['d5'] = [
  { t: 0, tension: 0, valence: 0 },
  { t: 5, tension: 0, valence: 0 },
  { t: 15, tension: 0.1, valence: 0, gazeTarget: 'd4' }, // Looks left
  { t: 30, tension: 0.5, valence: 0.4, gazeTarget: 'd6' }, // Looks right, start oscillation
  { t: 32.5, tension: 0.5, valence: -0.5 },
  { t: 35, tension: 0.5, valence: 0.4 },
  { t: 37.5, tension: 0.5, valence: -0.5, gazeTarget: 'd4' }, // Looks left
  { t: 40, tension: 0.5, valence: 0.4 },
  { t: 42.5, tension: 0.5, valence: -0.5, gazeTarget: 'd6' }, // Looks right
  { t: 45, tension: 0.5, valence: 0.4 },
];

export const DIVERGENCE_SCENARIO: Scenario = {
  id: 'divergence',
  title: 'The Divergence',
  subtitle: 'A spatial split in emotional fortune.',
  duration: 45,
  grid: [4, 4],
  faces,
  curves,
};
