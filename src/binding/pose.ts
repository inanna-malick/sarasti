import { MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN } from '../constants';
import { PoseParams, TickerFrame, zeroPose } from '../types';

export interface PoseConfig {
  maxPitch: number;      // default 0.25 rad
  maxYaw: number;        // default 0.30 rad
  maxRoll: number;       // default 0.15 rad
  maxJaw: number;        // default 0.5 rad
  smoothingAlpha: number; // default 0.08 (heavier than gaze)
  enableYaw: boolean;     // default false (opt-in)
  enableRoll: boolean;    // default false (opt-in)
}

export const DEFAULT_POSE_CONFIG: PoseConfig = {
  maxPitch: MAX_NECK_PITCH,
  maxYaw: MAX_NECK_YAW,
  maxRoll: MAX_NECK_ROLL,
  maxJaw: MAX_JAW_OPEN,
  smoothingAlpha: 0.08,
  enableYaw: false,
  enableRoll: false,
};

export interface PoseState {
  pitch: number;
  yaw: number;
  roll: number;
  jaw: number;
}

export interface PoseResolver {
  /** Resolve pose for a ticker. Returns full PoseParams (but only populates neck + jaw; eyes handled by gaze resolver). */
  resolve(tickerId: string, frame: TickerFrame): PoseParams;
  /** Reset smoothing state */
  reset(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Strip keys with undefined values so they don't clobber defaults via spread. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result as Partial<T>;
}

/** Raw input multipliers used before clamping/smoothing (exported for report tracing). */
export const POSE_MULTIPLIERS = {
  pitch: 1.5,       // deviation * 1.5
  yaw: 1.0,         // velocity * 1.0
  roll_offset: 1.0, // volatility - 1.0
  roll_scale: 0.3,  // (volatility - 1.0) * 0.3
  jaw_offset: 1.0,  // volatility - 1.0
  jaw_scale: 0.15,  // (volatility - 1.0) * 0.15
} as const;

export function createPoseResolver(config?: Partial<PoseConfig>): PoseResolver {
  const fullConfig: PoseConfig = { ...DEFAULT_POSE_CONFIG, ...(config ? stripUndefined(config) : {}) };
  const states = new Map<string, PoseState>();

  return {
    resolve(tickerId: string, frame: TickerFrame): PoseParams {
      const { deviation, velocity, volatility } = frame;

      // 1. Calculate Targets
      // Negative deviation (crisis/drawdown) -> head tilts down (negative pitch)
      const targetPitch = clamp(deviation * POSE_MULTIPLIERS.pitch, -fullConfig.maxPitch, fullConfig.maxPitch);

      // Positive velocity -> head turns right
      const targetYaw = fullConfig.enableYaw
        ? clamp(velocity * POSE_MULTIPLIERS.yaw, -fullConfig.maxYaw, fullConfig.maxYaw)
        : 0;

      // Volatility asymmetry
      const targetRoll = fullConfig.enableRoll
        ? clamp((volatility - POSE_MULTIPLIERS.roll_offset) * POSE_MULTIPLIERS.roll_scale, -fullConfig.maxRoll, fullConfig.maxRoll)
        : 0;

      // Higher volatility -> mouth opens
      const targetJaw = clamp((volatility - POSE_MULTIPLIERS.jaw_offset) * POSE_MULTIPLIERS.jaw_scale, 0, fullConfig.maxJaw);

      // 2. Apply Smoothing
      let state = states.get(tickerId);
      if (!state) {
        state = {
          pitch: targetPitch,
          yaw: targetYaw,
          roll: targetRoll,
          jaw: targetJaw,
        };
        states.set(tickerId, state);
      } else {
        const alpha = fullConfig.smoothingAlpha;
        state.pitch = alpha * targetPitch + (1 - alpha) * state.pitch;
        state.yaw = alpha * targetYaw + (1 - alpha) * state.yaw;
        state.roll = alpha * targetRoll + (1 - alpha) * state.roll;
        
        const jawAlpha = targetJaw === 0 ? Math.max(alpha, 0.5) : alpha;
        state.jaw = jawAlpha * targetJaw + (1 - jawAlpha) * state.jaw;
      }

      const pose = zeroPose();
      pose.neck = [state.pitch, state.yaw, state.roll];
      pose.jaw = state.jaw;
      
      return pose;
    },

    reset() {
      states.clear();
    }
  };
}
