import type { Frame, TickerFrame } from '../types';

/**
 * Linearly interpolate between two frames.
 *
 * @param f0 - Start frame
 * @param f1 - End frame
 * @param alpha - Interpolation factor (0 = f0, 1 = f1)
 * @returns Blended frame with interpolated timestamp and values
 */
export function interpolateFrame(f0: Frame, f1: Frame, alpha: number): Frame {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  // Interpolate timestamp
  const t0 = new Date(f0.timestamp).getTime();
  const t1 = new Date(f1.timestamp).getTime();
  const timestamp = new Date(t0 + (t1 - t0) * clampedAlpha).toISOString();

  // Merge all ticker ids from both frames
  const allIds = new Set([...Object.keys(f0.values), ...Object.keys(f1.values)]);
  const values: Record<string, TickerFrame> = {};

  for (const id of allIds) {
    const v0 = f0.values[id];
    const v1 = f1.values[id];

    if (v0 && v1) {
      values[id] = lerpTickerFrame(v0, v1, clampedAlpha);
    } else {
      // One side missing — use whichever exists
      values[id] = v0 ?? v1;
    }
  }

  return { timestamp, values };
}

function lerpTickerFrame(a: TickerFrame, b: TickerFrame, alpha: number): TickerFrame {
  return {
    close:      lerp(a.close, b.close, alpha),
    volume:     lerp(a.volume, b.volume, alpha),
    deviation:  lerp(a.deviation, b.deviation, alpha),
    velocity:   lerp(a.velocity, b.velocity, alpha),
    volatility: lerp(a.volatility, b.volatility, alpha),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
