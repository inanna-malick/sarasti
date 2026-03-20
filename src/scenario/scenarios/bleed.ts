import type { Scenario, ScenarioFace, ScenarioKeyframe } from '../types';

/**
 * "The Slow Bleed" scenario.
 * 16 faces, 4x4 grid. 90s duration.
 * The horror of unanimity and the slow drift from contentment to resignation.
 */

const createFaces = (): ScenarioFace[] => {
  const faces: ScenarioFace[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const id = `b${row * 4 + col}`;
      faces.push({ id, position: [col, row] });
    }
  }
  return faces;
};

const createCurves = (faces: ScenarioFace[]): Record<string, ScenarioKeyframe[]> => {
  const curves: Record<string, ScenarioKeyframe[]> = {};
  
  // 17 keyframes (approx every 5-6s)
  const times = [0, 6, 12, 18, 25, 30, 36, 42, 45, 50, 60, 68, 75, 82, 85, 88, 90];

  // Common trajectory components
  const getGaze = (t: number, id: string): { gazeTarget?: string, gazeV?: number } => {
    if (t <= 20) {
      const idx = parseInt(id.substring(1));
      // Neighbors look at each other
      const targetIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      return { gazeTarget: `b${targetIdx}` };
    }
    if (t <= 50) return { gazeTarget: 'b0' }; // All watch the canary
    // Drift gaze to floor after t=50
    const drift = Math.min(1, (t - 50) / 25);
    return { gazeV: -0.3 * drift };
  };

  const getFatigue = (t: number): number => {
    if (t <= 30) return -0.2 + (t / 30) * 0.2; // -0.2 (wired) to 0
    if (t <= 60) return 0.0 + ((t - 30) / 30) * 0.4; // 0 to 0.4
    if (t <= 75) return 0.4 + ((t - 60) / 15) * 0.3; // 0.4 to 0.7
    if (t <= 88) return 0.7 + ((t - 75) / 13) * 0.15; // 0.7 to 0.85
    return 0.85 + ((t - 88) / 2) * 0.05;
  };

  const common = (t: number) => ({
    fatigue: getFatigue(t),
    stature: 0.15 - (t / 90) * 0.55, // 0.15 to -0.4
    flush: t <= 70 ? 0.2 - (t / 70) * 0.7 : -0.5 - ((t - 70) / 20) * 0.1,
    pitch: (t / 90) * 0.12, // 0 to +0.12
  });

  faces.forEach(face => {
    const id = face.id;
    const idx = parseInt(id.substring(1));
    const kfs: ScenarioKeyframe[] = [];

    // Per-face asymmetry in roll
    const maxRoll = (idx % 2 === 0 ? 0.04 : -0.04) + (idx % 3 === 0 ? 0.02 : -0.02);

    times.forEach(t => {
      const gaze = getGaze(t, id);
      const state = common(t);
      
      const kf: ScenarioKeyframe = {
        t,
        tension: -0.2 + (t / 90) * 0.5,
        valence: 0.4 - (t / 90) * 1.3,
        stature: state.stature,
        fatigue: state.fatigue,
        flush: state.flush,
        pitch: state.pitch,
        roll: maxRoll * (t / 90),
        ...gaze,
      };

      // Archetype Overrides
      
      // b0 (Canary): First to show strain at t=12, no rallies
      if (id === 'b0') {
        if (t === 12) kf.valence = -0.1;
        if (t === 30) kf.valence = -0.3;
        if (t > 30) kf.valence = Math.min(kf.valence, -0.4);
        kf.tension += 0.1;
      } else {
        // Others maintain some positivity early
        if (t === 12) kf.valence = 0.3;
        
        // b7, b8 (Bellwethers): Micro-rally at t=25
        if ((id === 'b7' || id === 'b8') && t === 25) {
          kf.valence = 0.2; // Visible bump from ~0.04 baseline
          kf.tension += 0.15;
        }
        
        // b3, b12 (Edge Extremes): Micro-rally at t=45
        if ((id === 'b3' || id === 'b12') && t === 45) {
          kf.valence = 0.05; // Visible bump from ~-0.25 baseline
          kf.tension += 0.2;
        }
      }

      // b15 (Holdout): Maintained valence, dead cat bounce, then fastest collapse
      if (id === 'b15') {
        if (t <= 40) kf.valence = 0.2;
        else if (t === 60) kf.valence = 0.1; // Dead cat bounce
        else if (t >= 85) kf.valence = -0.95;
        else kf.valence = 0.2 - ((t - 40) / 45) * 1.1;

        if (t > 85) kf.fatigue = 0.95;
      }

      // Interior Herd (moderate) vs Edge Herd (extreme)
      const isInterior = [5, 6, 9, 10].includes(idx);
      if (isInterior) {
        kf.valence = Math.max(kf.valence, -0.75);
        kf.stature = Math.max(kf.stature!, -0.3);
      } else if (!['b0', 'b15', 'b3', 'b12'].includes(id)) {
        // Edge herd drifts further than interior
        if (t > 80) kf.valence = Math.min(kf.valence, -0.85);
      }

      kfs.push(kf);
    });

    curves[id] = kfs;
  });

  return curves;
};

const faces = createFaces();

export const BLEED_SCENARIO: Scenario = {
  id: 'bleed',
  title: 'The Slow Bleed',
  subtitle: 'The horror is UNANIMITY.',
  duration: 90,
  grid: [4, 4],
  faces,
  curves: createCurves(faces),
};
