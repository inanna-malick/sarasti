import { MAX_NECK_PITCH, MAX_NECK_YAW, MAX_NECK_ROLL, MAX_JAW_OPEN } from '../constants';
import { PoseParams, zeroPose } from '../types';

export interface PoseConfig {
  maxPitch: number;
  maxYaw: number;
  maxRoll: number;
  maxJaw: number;
  smoothingAlpha: number;
}

export const DEFAULT_POSE_CONFIG: PoseConfig = {
  maxPitch: MAX_NECK_PITCH,
  maxYaw: MAX_NECK_YAW,
  maxRoll: MAX_NECK_ROLL,
  maxJaw: MAX_JAW_OPEN,
  smoothingAlpha: 0.08,
};

export interface PoseState {
  pitch: number;
  yaw: number;
  roll: number;
  jaw: number;
}

export interface PoseResolver {
  /** Resolve pose from chord-computed offsets. Returns full PoseParams (neck + jaw; eyes handled by gaze resolver). */
  resolve(tickerId: string, chordPose: { pitch: number; yaw: number; roll: number; jaw: number }): PoseParams;
  /** Reset smoothing state */
  reset(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Pose resolver: accumulates chord-computed pose offsets with EMA smoothing.
 * Pose is now orchestrated by expression chords — no independent signal mapping.
 */
export function createPoseResolver(config?: Partial<PoseConfig>): PoseResolver {
  const fullConfig: PoseConfig = { ...DEFAULT_POSE_CONFIG, ...(config ?? {}) };
  const states = new Map<string, PoseState>();

  return {
    resolve(tickerId: string, chordPose: { pitch: number; yaw: number; roll: number; jaw: number }): PoseParams {
      // Clamp to safe ranges
      const targetPitch = clamp(chordPose.pitch, -fullConfig.maxPitch, fullConfig.maxPitch);
      const targetYaw = clamp(chordPose.yaw, -fullConfig.maxYaw, fullConfig.maxYaw);
      const targetRoll = clamp(chordPose.roll, -fullConfig.maxRoll, fullConfig.maxRoll);
      const targetJaw = clamp(chordPose.jaw, 0, fullConfig.maxJaw);

      // EMA smoothing
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
        // Jaw closes faster than it opens
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
    },
  };
}
