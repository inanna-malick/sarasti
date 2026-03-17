import { MAX_EYE_HORIZONTAL, MAX_EYE_VERTICAL } from '../constants';
import type { TickerFrame } from '../types';

export interface GazeConfig {
  maxHorizontal: number; // default 0.35 rad
  maxVertical: number; // default 0.25 rad
  smoothingAlpha: number; // default 0.15 (exponential smoothing)
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
  /** Resolve gaze for a ticker. Returns [horizontal, vertical] for both eyes (conjugate). */
  resolve(
    tickerId: string,
    frame: TickerFrame
  ): { leftEye: [number, number]; rightEye: [number, number] };
  /** Reset smoothing state */
  reset(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createGazeResolver(config?: Partial<GazeConfig>): GazeResolver {
  const fullConfig: GazeConfig = { ...DEFAULT_GAZE_CONFIG, ...config };
  const stateMap = new Map<string, GazeState>();

  return {
    resolve(tickerId: string, frame: TickerFrame) {
      const { velocity, volatility } = frame;
      const { maxHorizontal, maxVertical, smoothingAlpha } = fullConfig;

      // 1. Horizontal gaze = velocity mapped to [-maxHorizontal, +maxHorizontal]
      // Positive velocity (price rising) -> eyes look right
      // Negative velocity (price falling) -> eyes look left
      const targetH = clamp(velocity * 2.0, -maxHorizontal, maxHorizontal);

      // 2. Vertical gaze = volatility mapped to [-maxVertical, +maxVertical]
      // High volatility -> eyes look up (alert)
      // Low volatility -> eyes look down (calm)
      const targetV = clamp((volatility - 1.0) * 0.5, -maxVertical, maxVertical);

      // 3. Exponential smoothing per ticker
      let state = stateMap.get(tickerId);
      if (!state) {
        state = { currentH: targetH, currentV: targetV };
        stateMap.set(tickerId, state);
      } else {
        state.currentH =
          smoothingAlpha * targetH + (1 - smoothingAlpha) * state.currentH;
        state.currentV =
          smoothingAlpha * targetV + (1 - smoothingAlpha) * state.currentV;
      }

      const gaze: [number, number] = [state.currentH, state.currentV];

      // 4. Conjugate gaze: both eyes look in the same direction
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
