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
  
  faces.forEach((face, i) => {
    // Deterministic variations based on index to create "herd" drift
    const driftOffset = (i % 7 - 3) * 1.5; // [-4.5, 4.5]
    const realizationOffset = (i % 5 - 2) * 1.2; // [-2.4, 2.4]
    const terminalOffset = (i % 3 - 1) * 0.5; // [-0.5, 0.5]

    curves[face.id] = [
      // t=0: Contentment
      { t: 0, tension: -0.2, valence: 0.4, stature: 0.1, flush: 0.2 },
      
      // t=30: Halfway through the "fine" drift
      { 
        t: 30 + driftOffset / 2, 
        tension: -0.05, 
        valence: -0.05, 
        stature: -0.1, 
        flush: -0.1 
      },
      
      // t=60: The drift is complete, but still relatively "calm"
      { 
        t: 60 + driftOffset, 
        tension: 0.1, 
        valence: -0.5, 
        stature: -0.3, 
        flush: -0.4 
      },
      
      // t=75: The realization / acceleration of misery
      { 
        t: 75 + realizationOffset, 
        tension: 0.05, 
        valence: -0.8, 
        stature: -0.4, 
        flush: -0.45 
      },
      
      // t=85: Terminal descent
      { 
        t: 85 + terminalOffset, 
        tension: -0.3, 
        valence: -0.85, 
        stature: -0.45, 
        flush: -0.48 
      },
      
      // t=90: Final resignation
      { 
        t: 90, 
        tension: -0.7, 
        valence: -0.9, 
        stature: -0.5, 
        flush: -0.5 
      }
    ];
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
