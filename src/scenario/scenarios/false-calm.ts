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

// ─── Sentinel fc0 — foreshadowing twitches → THE SNAP ─────────────────
curves['fc0'] = [
  // Calm opening — warm, steady, subtle life
  { t: 0, tension: -0.25, valence: 0.3, stature: 0.1, flush: 0.12, fatigue: -0.05,
    pitch: 0.0, roll: 0.0, gazeH: 0.0, gazeV: 0.0 },
  // Breathing, lazily scanning
  { t: 3, tension: -0.3, valence: 0.32, flush: 0.1, fatigue: 0.0,
    pitch: 0.01, roll: -0.005, gazeH: 0.05, gazeV: -0.02 },
  // Micro-twitch 1 — barely perceptible
  { t: 6, tension: -0.28, valence: 0.3, flush: 0.1, fatigue: 0.02,
    pitch: -0.01, gazeH: -0.03, gazeV: 0.01 },
  { t: 7.5, tension: -0.1, valence: 0.25, flush: 0.02, fatigue: 0.0,
    pitch: -0.02, gazeH: 0.0, gazeV: 0.05 },
  { t: 9, tension: -0.25, valence: 0.3, flush: 0.1, fatigue: 0.03,
    pitch: 0.01, roll: 0.005, gazeH: 0.04, gazeV: -0.01 },
  // Calm recovery — everything's fine...
  { t: 11, tension: -0.3, valence: 0.3, flush: 0.11, fatigue: 0.05,
    pitch: 0.0, roll: -0.008, gazeH: -0.06, gazeV: -0.03 },
  // Micro-twitch 2 — a little stronger, flush flickers
  { t: 13, tension: -0.2, valence: 0.28, flush: 0.08, fatigue: 0.04,
    pitch: 0.005, gazeH: 0.02, gazeV: 0.0 },
  { t: 14, tension: 0.0, valence: 0.18, flush: -0.05, fatigue: -0.1,
    pitch: -0.025, gazeH: 0.0, gazeV: 0.08 },
  { t: 15.5, tension: -0.22, valence: 0.28, flush: 0.09, fatigue: 0.06,
    pitch: 0.01, roll: 0.005, gazeH: -0.04, gazeV: -0.02 },
  // Restless recovery — not quite settling
  { t: 17, tension: -0.25, valence: 0.25, flush: 0.1, fatigue: 0.08,
    pitch: -0.005, roll: -0.01, gazeH: 0.05, gazeV: 0.02 },
  // Micro-twitch 3 — the biggest tell
  { t: 19, tension: -0.1, valence: 0.2, flush: 0.03, fatigue: 0.05,
    pitch: -0.015, gazeH: -0.02, gazeV: 0.04 },
  { t: 20, tension: 0.15, valence: 0.1, flush: -0.1, fatigue: -0.15,
    pitch: -0.04, gazeH: 0.0, gazeV: 0.1 },
  { t: 21.5, tension: -0.15, valence: 0.22, flush: 0.06, fatigue: 0.08,
    pitch: 0.005, roll: 0.008, gazeH: 0.03, gazeV: -0.01 },
  // Holding tension — something isn't right
  { t: 23, tension: -0.05, valence: 0.15, flush: 0.02, fatigue: 0.1,
    pitch: -0.01, roll: -0.005, gazeH: -0.02, gazeV: 0.06 },
  // Last moment of calm — the pressure is unbearable
  { t: 24.7, tension: 0.1, valence: 0.05, flush: -0.05, fatigue: -0.2,
    pitch: -0.02, gazeH: 0.0, gazeV: 0.08 },
  // ═══ THE SNAP ═══
  { t: 25, tension: 1.0, valence: -1.0, stature: -0.3, flush: -0.6, fatigue: -0.8,
    pitch: -0.15, roll: 0.0, gazeH: 0.0, gazeV: 0.2 },
  // Overshoot — face distorts beyond steady-state panic
  { t: 25.5, tension: 0.95, valence: -0.9, stature: -0.35, flush: -0.65, fatigue: -0.75,
    pitch: -0.12, gazeV: 0.18 },
  // Settling into sustained alarm
  { t: 27, tension: 0.85, valence: -0.8, stature: -0.25, flush: -0.45, fatigue: -0.6,
    pitch: -0.1, roll: 0.02, gazeV: 0.12 },
  { t: 30, tension: 0.8, valence: -0.75, stature: -0.2, flush: -0.4, fatigue: -0.5,
    pitch: -0.08, roll: 0.01, gazeV: 0.1 },
];

// ─── Herd faces — calm micro-life → wavefront snap ──────────────────

for (const face of faces) {
  if (face.id === 'fc0') continue;

  const [col, row] = face.position;
  const d = dist(col, row);
  const idx = row * 4 + col;
  const snapTime = 25 + d * 0.5;

  // Per-face variation seeds (deterministic from index)
  const phase = (idx * 2.3) % 6;         // breathing phase offset
  const gazeWander = (idx * 1.7) % 4;    // gaze wander phase
  const rollSign = idx % 2 === 0 ? 1 : -1;
  const pitchBias = ((idx % 3) - 1) * 0.008; // subtle pitch personality

  // Panic intensity scales with proximity to fc0
  const panicIntensity = Math.max(0.5, 1.0 - d * 0.08);
  // Faces farther away have a gentler, more confused response
  const snapTension = 0.7 + panicIntensity * 0.3;
  const snapValence = -0.5 - panicIntensity * 0.4;
  const snapFlush = -0.2 - panicIntensity * 0.35;
  const snapFatigue = -0.3 - panicIntensity * 0.4;
  const snapStature = -0.1 - panicIntensity * 0.2;
  const snapPitch = -0.05 - panicIntensity * 0.08;

  // Nearest panicking neighbor for gaze chain (toward fc0 direction)
  const nearestNeighborCol = Math.max(0, col - 1);
  const nearestNeighborRow = Math.max(0, row - 1);
  let gazeChainTarget: string;
  if (col > 0 && row > 0) {
    // Diagonal — look toward closer face
    gazeChainTarget = col > row ? `fc${row * 4 + (col - 1)}` : `fc${(row - 1) * 4 + col}`;
  } else if (col > 0) {
    gazeChainTarget = `fc${row * 4 + (col - 1)}`;
  } else if (row > 0) {
    gazeChainTarget = `fc${(row - 1) * 4 + col}`;
  } else {
    gazeChainTarget = 'fc0';
  }

  const kf: ScenarioKeyframe[] = [];

  // ─── CALM PERIOD (0–25s): subtle micro-life ───

  // Opening — warm, content, alive
  kf.push({
    t: 0, tension: -0.3, valence: 0.3, stature: 0.0, flush: 0.1, fatigue: 0.0,
    pitch: pitchBias, roll: 0.0, gazeH: 0.0, gazeV: 0.0,
  });

  // Breathing oscillations — 4 cycles across the calm with per-face phase offsets
  // Each face "breathes" at a slightly different rhythm
  const breathTimes = [3 + phase * 0.3, 7 + phase * 0.2, 12 + phase * 0.4, 17 + phase * 0.3, 22 + phase * 0.2];
  for (let bi = 0; bi < breathTimes.length; bi++) {
    const bt = breathTimes[bi];
    if (bt >= snapTime - 1) break; // don't place calm keyframes too close to snap

    const breathDepth = bi % 2 === 0 ? 1 : -1; // inhale/exhale
    const boredomDrift = bt / 90; // very slow fatigue accumulation
    const gazePhase = (bt + gazeWander) * 0.4;

    kf.push({
      t: bt,
      tension: -0.3 + breathDepth * 0.04 + boredomDrift * 0.05,
      valence: 0.3 - boredomDrift * 0.1,
      flush: 0.1 + breathDepth * 0.015,
      fatigue: boredomDrift * 0.8,
      pitch: pitchBias + breathDepth * 0.015,
      roll: rollSign * breathDepth * 0.008,
      gazeH: Math.sin(gazePhase) * 0.06,
      gazeV: Math.cos(gazePhase + 1.2) * 0.04,
    });
  }

  // Pre-snap awareness — closer faces notice sooner
  // The "something's wrong" phase
  if (d <= 3) {
    const awarenessTime = Math.max(kf[kf.length - 1].t + 0.5, snapTime - 2);
    if (awarenessTime < snapTime - 0.5) {
      kf.push({
        t: awarenessTime,
        tension: -0.2 + d * 0.03,
        valence: 0.25 - d * 0.02,
        flush: 0.08,
        fatigue: 0.12 + d * 0.02,
        pitch: pitchBias - 0.01,
        gazeH: -col * 0.03, // eyes drift toward fc0 corner
        gazeV: -row * 0.02,
      });
    }
  }

  // ─── THE TRANSITION (snap - 0.3s) → snap → overshoot → settle ───

  // Last calm keyframe — eyes snap to sentinel
  const preSnapT = Math.max(kf[kf.length - 1].t + 0.3, snapTime - 0.3);
  kf.push({
    t: preSnapT,
    tension: -0.15 + d * 0.03,
    valence: 0.2,
    flush: 0.05,
    fatigue: 0.15,
    pitch: pitchBias - 0.02,
    gazeTarget: 'fc0',
  });

  // THE SNAP — full panic
  kf.push({
    t: snapTime,
    tension: snapTension,
    valence: snapValence,
    stature: snapStature,
    flush: snapFlush,
    fatigue: snapFatigue,
    pitch: snapPitch,
    roll: rollSign * 0.015,
    gazeTarget: 'fc0',
  });

  // Overshoot — 0.3s after snap, slightly beyond steady state
  const overshootT = snapTime + 0.3;
  if (overshootT <= 30) {
    kf.push({
      t: overshootT,
      tension: Math.min(1.0, snapTension + 0.08),
      valence: Math.max(-1.0, snapValence - 0.1),
      stature: snapStature - 0.05,
      flush: snapFlush - 0.05,
      fatigue: snapFatigue - 0.1,
      pitch: snapPitch - 0.02,
      roll: rollSign * 0.02,
      gazeTarget: 'fc0',
    });
  }

  // Gaze chain — after initial fc0 lock, eyes find nearest panicking neighbor
  const gazeChainT = snapTime + 0.8;
  if (gazeChainT <= 30 && gazeChainTarget !== 'fc0') {
    kf.push({
      t: gazeChainT,
      tension: snapTension - 0.05,
      valence: snapValence + 0.05,
      stature: snapStature + 0.02,
      flush: snapFlush + 0.05,
      fatigue: snapFatigue + 0.05,
      pitch: snapPitch + 0.01,
      roll: rollSign * 0.012,
      gazeTarget: gazeChainTarget,
    });
  }

  // Settling into sustained panic
  const settleT = Math.min(snapTime + 1.5, 30);
  if (settleT > (kf[kf.length - 1].t + 0.3)) {
    kf.push({
      t: settleT,
      tension: snapTension - 0.1,
      valence: snapValence + 0.08,
      stature: snapStature + 0.05,
      flush: snapFlush + 0.1,
      fatigue: snapFatigue + 0.1,
      pitch: snapPitch + 0.03,
      roll: rollSign * 0.008,
    });
  }

  // End hold — faces at high dist are still mid-transition, which is the point
  const endT = 30;
  if (kf[kf.length - 1].t < endT - 0.1) {
    // Distant faces: still escalating at t=30 (unsettling cut)
    if (d >= 5) {
      kf.push({
        t: endT,
        tension: snapTension * 0.7, // not yet at full panic
        valence: snapValence * 0.6,
        stature: snapStature * 0.5,
        flush: snapFlush * 0.5,
        fatigue: snapFatigue * 0.4,
        pitch: snapPitch * 0.5,
        roll: rollSign * 0.005,
        gazeTarget: 'fc0',
      });
    } else {
      kf.push({
        t: endT,
        tension: snapTension - 0.15,
        valence: snapValence + 0.1,
        stature: snapStature + 0.08,
        flush: snapFlush + 0.15,
        fatigue: snapFatigue + 0.15,
        pitch: snapPitch + 0.04,
        roll: rollSign * 0.005,
      });
    }
  }

  curves[face.id] = kf;
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
