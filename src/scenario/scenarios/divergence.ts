import type { Scenario, ScenarioFace, ScenarioKeyframe } from '../types';

/**
 * "The Divergence" — 45s, 16 faces, 4×4 grid.
 *
 * Left half (cols 0-1) = winners. Right half (cols 2-3) = losers.
 * d5 = "The Torn" — caught between, the emotional centerpiece.
 *
 * The narrative is physical: winners GROW (stature → +0.6 titan),
 * losers SHRINK (stature → -0.6 sprite). The size gap IS the story.
 * Flush, fatigue, pose, gaze all reinforce the widening split.
 */

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

// ─── Winners ─────────────────────────────────────────
// d0 (top-left, biggest winner), d1, d4, d8, d9, d12, d13
// d0 leads, others follow 1-2s offset. Valence peaks staggered.

// Winner template generator
function winnerCurve(
  id: string,
  /** Delay from d0's lead (0 for d0, 1-2s for others) */
  delay: number,
  /** Peak valence (0.95 for d0, 0.6 for d13) */
  peakVal: number,
  /** Peak stature */
  peakStat: number,
  /** Which loser to watch late-game */
  watchTarget: string,
): ScenarioKeyframe[] {
  const d = delay;
  return [
    // t=0: neutral morning, slightly positive, eyes scanning upward (watching market)
    { t: 0, tension: 0, valence: 0.05, stature: 0, flush: 0.05, fatigue: 0, pitch: 0, gazeV: 0.08 },
    // t=3: first stirring — slight uptick, still cautious
    { t: 3 + d * 0.5, tension: 0.05, valence: 0.1, stature: 0.02, flush: 0.05, fatigue: -0.05, gazeV: 0.1 },
    // t=6: signal strengthens, tension rises with opportunity
    { t: 6 + d, tension: 0.15, valence: 0.2, stature: 0.05, flush: 0.1, fatigue: -0.1, gazeV: 0.06, pitch: -0.01 },
    // t=10: divergence begins — winners feel it, growing confidence
    { t: 10 + d, tension: 0.25, valence: 0.35, stature: 0.1, flush: 0.15, fatigue: -0.15, pitch: -0.02, gazeV: 0.04 },
    // t=14: acceleration — winners pulling ahead, starting to watch losers
    { t: 14 + d, tension: 0.35, valence: 0.5, stature: 0.2, flush: 0.2, fatigue: -0.2, pitch: -0.03, yaw: 0.02, gazeH: 0.08 },
    // t=18: euphoria building, size divergence becoming visible
    { t: 18 + d, tension: 0.5, valence: 0.65, stature: 0.3, flush: 0.3, fatigue: -0.3, pitch: -0.04, yaw: 0.03, gazeH: 0.12, gazeTarget: watchTarget },
    // t=22: approaching peak, flush deepening
    { t: 22 + d, tension: 0.6, valence: 0.75, stature: 0.38, flush: 0.35, fatigue: -0.35, pitch: -0.04, yaw: 0.04, gazeTarget: watchTarget },
    // t=25: near-peak, watching losers with a mix of schadenfreude
    { t: 25 + d * 0.8, tension: 0.65, valence: peakVal * 0.85, stature: 0.45, flush: 0.4, fatigue: -0.4, pitch: -0.05, yaw: 0.05, gazeTarget: watchTarget },
    // t=28: peak euphoria — maximum divergence
    { t: 28 + d * 0.5, tension: 0.7, valence: peakVal * 0.95, stature: 0.5, flush: 0.45, fatigue: -0.45, pitch: -0.05, yaw: 0.05, gazeH: 0.15 },
    // t=31: peak hold — titans looking down at sprites
    { t: 31, tension: 0.65, valence: peakVal, stature: peakStat * 0.92, flush: 0.5, fatigue: -0.5, pitch: -0.05, yaw: 0.06, gazeH: 0.18 },
    // t=34: first micro-softening — winning gets boring
    { t: 34, tension: 0.55, valence: peakVal * 0.92, stature: peakStat * 0.95, flush: 0.45, fatigue: -0.4, pitch: -0.04, yaw: 0.05, gazeH: 0.14 },
    // t=37: plateau — settled into dominance
    { t: 37, tension: 0.45, valence: peakVal * 0.88, stature: peakStat * 0.98, flush: 0.42, fatigue: -0.35, pitch: -0.04, yaw: 0.04, gazeH: 0.12 },
    // t=40: faint unease — how long can this last?
    { t: 40, tension: 0.4, valence: peakVal * 0.82, stature: peakStat, flush: 0.38, fatigue: -0.3, pitch: -0.03, yaw: 0.04, gazeV: 0.04 },
    // t=43: settling into new normal
    { t: 43, tension: 0.35, valence: peakVal * 0.8, stature: peakStat, flush: 0.35, fatigue: -0.25, pitch: -0.03, yaw: 0.03, gazeV: 0.02 },
    // t=45: end hold
    { t: 45, tension: 0.3, valence: peakVal * 0.78, stature: peakStat, flush: 0.32, fatigue: -0.2, pitch: -0.02, yaw: 0.03 },
  ];
}

// d0: biggest winner, leads the pack (row 0, col 0)
curves['d0'] = winnerCurve('d0', 0, 0.95, 0.6, 'd3');

// d1: strong winner, 0.5s delay (row 0, col 1)
curves['d1'] = winnerCurve('d1', 0.5, 0.85, 0.55, 'd2');

// d4: solid winner, 1s delay (row 1, col 0)
curves['d4'] = winnerCurve('d4', 1.0, 0.8, 0.5, 'd7');

// d8: mid-tier winner, 1.2s delay (row 2, col 0)
curves['d8'] = winnerCurve('d8', 1.2, 0.75, 0.48, 'd10');

// d9: mid-tier winner, 1.5s delay (row 2, col 1)
curves['d9'] = winnerCurve('d9', 1.5, 0.7, 0.45, 'd11');

// d12: moderate winner, 1.8s delay (row 3, col 0)
curves['d12'] = winnerCurve('d12', 1.8, 0.65, 0.42, 'd14');

// d13: most moderate winner, 2s delay (row 3, col 1)
curves['d13'] = winnerCurve('d13', 2.0, 0.6, 0.38, 'd15');


// ─── Losers ──────────────────────────────────────────
// d2, d3, d6, d7, d10, d11, d14, d15 (excluding d5 = Torn)
// d3 is biggest loser (valence -0.9), d11 is most moderate.

function loserCurve(
  id: string,
  /** Delay from first loser reaction */
  delay: number,
  /** Bottom valence (-0.9 for d3, -0.5 for d11) */
  bottomVal: number,
  /** Bottom stature */
  bottomStat: number,
  /** Which winner to watch with envy */
  watchTarget: string,
  /** Roll direction — asymmetric resignation tilt */
  rollSign: number,
): ScenarioKeyframe[] {
  const d = delay;
  return [
    // t=0: neutral morning, same as winners
    { t: 0, tension: 0, valence: 0.05, stature: 0, flush: 0.05, fatigue: 0, pitch: 0, gazeV: 0.08 },
    // t=3: still fine, no signal yet
    { t: 3, tension: 0.02, valence: 0.05, stature: 0, flush: 0.03, fatigue: 0, gazeV: 0.08 },
    // t=6: first bad sign — slight dip
    { t: 6 + d, tension: 0.1, valence: -0.05, stature: -0.02, flush: 0, fatigue: 0.05, gazeV: 0.05 },
    // t=10: divergence visible — losers feel the pull
    { t: 10 + d, tension: 0.2, valence: -0.15, stature: -0.08, flush: -0.05, fatigue: 0.1, pitch: 0.02, gazeH: -0.05 },
    // t=13: denial phase — brief micro-rally ("it'll come back")
    { t: 13 + d, tension: 0.15, valence: -0.08, stature: -0.06, flush: -0.02, fatigue: 0.12, pitch: 0.01, gazeV: 0.06 },
    // t=16: denial fails, slide resumes harder
    { t: 16 + d, tension: 0.35, valence: -0.25, stature: -0.15, flush: -0.1, fatigue: 0.2, pitch: 0.04, gazeH: -0.1, gazeTarget: watchTarget },
    // t=19: watching winners grow while shrinking
    { t: 19 + d, tension: 0.5, valence: -0.4, stature: -0.25, flush: -0.2, fatigue: 0.3, pitch: 0.06, yaw: -0.02, roll: rollSign * 0.01, gazeTarget: watchTarget },
    // t=22: accelerating decline, fatigue building
    { t: 22 + d, tension: 0.6, valence: -0.55, stature: -0.33, flush: -0.3, fatigue: 0.4, pitch: 0.08, yaw: -0.03, roll: rollSign * 0.02, gazeTarget: watchTarget },
    // t=25: deep loss, head dropping
    { t: 25 + d * 0.7, tension: 0.7, valence: -0.65, stature: -0.4, flush: -0.4, fatigue: 0.5, pitch: 0.1, roll: rollSign * 0.03, gazeH: -0.15 },
    // t=28: near-bottom — second micro-rally (dead cat bounce)
    { t: 28, tension: 0.55, valence: bottomVal * 0.7, stature: -0.42, flush: -0.35, fatigue: 0.5, pitch: 0.08, roll: rollSign * 0.02, gazeV: 0.02 },
    // t=30: bounce fails
    { t: 30, tension: 0.65, valence: bottomVal * 0.8, stature: -0.47, flush: -0.42, fatigue: 0.55, pitch: 0.09, roll: rollSign * 0.03, gazeH: -0.12 },
    // t=33: approaching bottom
    { t: 33, tension: 0.75, valence: bottomVal * 0.9, stature: bottomStat * 0.85, flush: -0.5, fatigue: 0.65, pitch: 0.1, roll: rollSign * 0.04, gazeV: -0.1 },
    // t=36: bottom — maximum humiliation, gaze drops to floor
    { t: 36, tension: 0.8, valence: bottomVal, stature: bottomStat * 0.93, flush: -0.55, fatigue: 0.7, pitch: 0.12, roll: rollSign * 0.05, gazeV: -0.2 },
    // t=39: resignation sets in — tension drops but valence stays low
    { t: 39, tension: 0.6, valence: bottomVal * 0.95, stature: bottomStat * 0.97, flush: -0.55, fatigue: 0.75, pitch: 0.12, roll: rollSign * 0.05, gazeV: -0.25 },
    // t=42: hollow acceptance
    { t: 42, tension: 0.4, valence: bottomVal * 0.9, stature: bottomStat, flush: -0.6, fatigue: 0.8, pitch: 0.12, roll: rollSign * 0.06, gazeV: -0.3 },
    // t=45: end — small, exhausted, staring at nothing
    { t: 45, tension: 0.3, valence: bottomVal * 0.88, stature: bottomStat, flush: -0.6, fatigue: 0.8, pitch: 0.12, roll: rollSign * 0.06, gazeV: -0.35 },
  ];
}

// d3: biggest loser — top-right, most exposed (row 0, col 3)
curves['d3'] = loserCurve('d3', 0, -0.9, -0.6, 'd0', 1);

// d2: heavy loser, 0.5s delay (row 0, col 2) — right next to winners
curves['d2'] = loserCurve('d2', 0.3, -0.8, -0.55, 'd1', -1);

// d7: strong loser, 0.8s delay (row 1, col 3)
curves['d7'] = loserCurve('d7', 0.8, -0.75, -0.52, 'd4', 1);

// d6: loser adjacent to Torn, 0.6s delay (row 1, col 2)
curves['d6'] = loserCurve('d6', 0.6, -0.7, -0.48, 'd5', -1);

// d10: mid-tier loser, 1s delay (row 2, col 2)
curves['d10'] = loserCurve('d10', 1.0, -0.65, -0.45, 'd9', 1);

// d11: most moderate loser, 1.3s delay (row 2, col 3)
curves['d11'] = loserCurve('d11', 1.3, -0.5, -0.38, 'd8', -1);

// d14: moderate loser, 1.5s delay (row 3, col 2)
curves['d14'] = loserCurve('d14', 1.5, -0.6, -0.42, 'd13', 1);

// d15: moderate-heavy loser, 1.2s delay (row 3, col 3)
curves['d15'] = loserCurve('d15', 1.2, -0.7, -0.5, 'd12', -1);


// ─── The Torn (d5) ──────────────────────────────────
// Row 1, col 1 (winner side) but labeled as the emotional centerpiece.
// Pulled both ways. Valence oscillates. Gaze ping-pongs.
// Stature stays near 0 (neither grows nor shrinks).
// Fatigue builds from the stress of the middle.

curves['d5'] = [
  // t=0: neutral like everyone else
  { t: 0, tension: 0, valence: 0, stature: 0, flush: 0, fatigue: 0, pitch: 0, gazeV: 0.08 },
  // t=2: slight positive lean — first inklings, watching market
  { t: 2, tension: 0.05, valence: 0.08, stature: 0, flush: 0.03, fatigue: 0, gazeV: 0.1 },
  // t=5: pulled toward winners — brief hope
  { t: 5, tension: 0.1, valence: 0.2, stature: 0.03, flush: 0.1, fatigue: 0.05, gazeTarget: 'd4', pitch: -0.01 },
  // t=8: glances at loser neighbor — something's wrong there
  { t: 8, tension: 0.2, valence: 0.15, stature: 0.02, flush: 0.05, fatigue: 0.1, gazeTarget: 'd6', pitch: 0 },
  // t=11: pulled back toward winners — second hope surge
  { t: 11, tension: 0.25, valence: 0.3, stature: 0.05, flush: 0.15, fatigue: 0.12, gazeTarget: 'd4', pitch: -0.01 },
  // t=14: doubt creeps in — sees d6 shrinking, flushes cold
  { t: 14, tension: 0.35, valence: 0.1, stature: 0.02, flush: -0.05, fatigue: 0.18, gazeTarget: 'd6', pitch: 0.02, roll: -0.01 },
  // t=16: pulled back — winners are so warm and big now
  { t: 16, tension: 0.4, valence: 0.2, stature: 0.04, flush: 0.1, fatigue: 0.22, gazeTarget: 'd4', yaw: -0.02 },
  // t=18: the oscillation tightens — shorter swings
  { t: 18, tension: 0.45, valence: -0.05, stature: 0, flush: -0.08, fatigue: 0.28, gazeTarget: 'd6', pitch: 0.03, roll: 0.01 },
  // t=20: brief warm pull
  { t: 20, tension: 0.5, valence: 0.1, stature: 0.02, flush: 0.05, fatigue: 0.32, gazeTarget: 'd1', yaw: -0.03 },
  // t=22: loser gravity wins — valence goes negative
  { t: 22, tension: 0.6, valence: -0.2, stature: -0.03, flush: -0.12, fatigue: 0.38, gazeTarget: 'd6', pitch: 0.04, roll: -0.02 },
  // t=25: brief dead cat bounce toward hope
  { t: 25, tension: 0.55, valence: 0.05, stature: 0.01, flush: 0.02, fatigue: 0.42, gazeTarget: 'd4', pitch: 0.02 },
  // t=27: the slide — stress is winning
  { t: 27, tension: 0.65, valence: -0.3, stature: -0.05, flush: -0.15, fatigue: 0.48, gazeTarget: 'd2', pitch: 0.05, roll: 0.02 },
  // t=30: deeper — watching the carnage on the loser side
  { t: 30, tension: 0.7, valence: -0.4, stature: -0.06, flush: -0.2, fatigue: 0.52, gazeTarget: 'd7', pitch: 0.06, roll: -0.03 },
  // t=33: last hope — looks at winners one final time
  { t: 33, tension: 0.6, valence: -0.2, stature: -0.03, flush: -0.08, fatigue: 0.58, gazeTarget: 'd0', yaw: -0.04, pitch: 0.03 },
  // t=36: hope extinguished — settles into the gap
  { t: 36, tension: 0.55, valence: -0.5, stature: -0.08, flush: -0.25, fatigue: 0.65, pitch: 0.07, roll: 0.03, gazeV: -0.1 },
  // t=39: resigned exhaustion — the worst position is the middle
  { t: 39, tension: 0.45, valence: -0.4, stature: -0.05, flush: -0.2, fatigue: 0.72, pitch: 0.08, roll: 0.03, gazeV: -0.18 },
  // t=42: fading — not quite loser, not winner, just spent
  { t: 42, tension: 0.35, valence: -0.3, stature: -0.04, flush: -0.18, fatigue: 0.78, pitch: 0.08, roll: 0.02, gazeV: -0.22 },
  // t=45: end — hollow, staring down
  { t: 45, tension: 0.25, valence: -0.25, stature: -0.03, flush: -0.15, fatigue: 0.8, pitch: 0.09, roll: 0.02, gazeV: -0.3 },
];


export const DIVERGENCE_SCENARIO: Scenario = {
  id: 'divergence',
  title: 'The Divergence',
  subtitle: 'When the same market makes winners and losers',
  duration: 45,
  grid: [4, 4],
  faces,
  curves,
};
