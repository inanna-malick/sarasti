import { MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '../constants';

export interface GazeConfig {
  maxHorizontal: number;
  maxVertical: number;
  smoothingAlpha: number;
}

export const DEFAULT_GAZE_CONFIG: GazeConfig = {
  maxHorizontal: MAX_EYE_HORIZONTAL,
  maxVertical: MAX_EYE_VERTICAL,
  smoothingAlpha: 0.15,
};

export interface GazeState {
  currentH: number;
  currentV: number;
}

export interface GazeResolver {
  /** Resolve gaze from chord-computed offsets. Returns conjugate eye gaze. */
  resolve(
    tickerId: string,
    chordGaze: { gazeH: number; gazeV: number },
  ): { leftEye: [number, number]; rightEye: [number, number] };
  /** Reset smoothing state */
  reset(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Gaze resolver: accumulates chord-computed gaze offsets with EMA smoothing.
 * Gaze is now orchestrated by expression chords — no independent signal mapping.
 */
export function createGazeResolver(config?: Partial<GazeConfig>): GazeResolver {
  const fullConfig: GazeConfig = { ...DEFAULT_GAZE_CONFIG, ...(config ?? {}) };
  const stateMap = new Map<string, GazeState>();

  return {
    resolve(tickerId: string, chordGaze: { gazeH: number; gazeV: number }) {
      const { maxHorizontal, maxVertical, smoothingAlpha } = fullConfig;

      const targetH = clamp(chordGaze.gazeH, -maxHorizontal, maxHorizontal);
      const targetV = clamp(chordGaze.gazeV, -maxVertical, maxVertical);

      let state = stateMap.get(tickerId);
      if (!state) {
        state = { currentH: targetH, currentV: targetV };
        stateMap.set(tickerId, state);
      } else {
        state.currentH = smoothingAlpha * targetH + (1 - smoothingAlpha) * state.currentH;
        state.currentV = smoothingAlpha * targetV + (1 - smoothingAlpha) * state.currentV;
      }

      const gaze: [number, number] = [state.currentH, state.currentV];
      return {
        leftEye: gaze,
        rightEye: gaze,
      };
    },

    reset() {
      stateMap.clear();
    },
  };
}
