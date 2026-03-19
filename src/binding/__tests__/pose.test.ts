import { describe, it, expect, beforeEach } from 'vitest';
import { createPoseResolver, DEFAULT_POSE_CONFIG } from '../pose';

describe('PoseResolver (chord-based)', () => {
  let resolver = createPoseResolver();

  beforeEach(() => {
    resolver = createPoseResolver();
  });

  const zeroPose = { pitch: 0, yaw: 0, roll: 0, jaw: 0 };

  it('zero chord pose → zero output', () => {
    const pose = resolver.resolve('T1', zeroPose);
    expect(pose.neck).toEqual([0, 0, 0]);
    expect(pose.jaw).toBe(0);
  });

  it('negative pitch → head tilts down', () => {
    const pose = resolver.resolve('T1', { ...zeroPose, pitch: -0.1 });
    expect(pose.neck[0]).toBeLessThan(0);
  });

  it('positive pitch → head tilts up', () => {
    const pose = resolver.resolve('T1', { ...zeroPose, pitch: 0.1 });
    expect(pose.neck[0]).toBeGreaterThan(0);
  });

  it('positive jaw → jaw opens', () => {
    const pose = resolver.resolve('T1', { ...zeroPose, jaw: 0.3 });
    expect(pose.jaw).toBeGreaterThan(0);
    expect(pose.jaw).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxJaw);
  });

  it('clamping: extreme values do not exceed max ranges', () => {
    const pose = resolver.resolve('T1', { pitch: 10, yaw: 10, roll: 10, jaw: 10 });

    expect(Math.abs(pose.neck[0])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxPitch + 1e-6);
    expect(Math.abs(pose.neck[1])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxYaw + 1e-6);
    expect(Math.abs(pose.neck[2])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxRoll + 1e-6);
    expect(pose.jaw).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxJaw + 1e-6);
  });

  it('smoothing: rapid changes are dampened', () => {
    resolver.resolve('T1', zeroPose);
    const secondPose = resolver.resolve('T1', { ...zeroPose, pitch: 0.5 });

    // targetPitch = 0.5, smoothed from 0 with alpha 0.08
    const expectedSmoothed = 0.08 * 0.5;
    expect(secondPose.neck[0]).toBeCloseTo(expectedSmoothed, 3);
  });

  it('jaw closes faster than it opens', () => {
    resolver.reset();
    resolver.resolve('T1', { ...zeroPose, jaw: 0.4 });
    const openedPose = resolver.resolve('T1', { ...zeroPose, jaw: 0.4 });
    const jawOpen = openedPose.jaw;

    const closingPose = resolver.resolve('T1', zeroPose);
    // jaw alpha for closing is max(0.08, 0.5) = 0.5
    expect(closingPose.jaw).toBeCloseTo(jawOpen * 0.5, 5);
  });

  it('different tickers maintain independent smoothing state', () => {
    resolver.resolve('T1', { ...zeroPose, pitch: 0.5 });
    const poseT2 = resolver.resolve('T2', zeroPose);
    expect(poseT2.neck[0]).toBe(0);
  });

  it('reset() clears all state', () => {
    resolver.resolve('T1', { ...zeroPose, pitch: 0.5 });
    resolver.reset();
    const poseT1 = resolver.resolve('T1', zeroPose);
    expect(poseT1.neck[0]).toBe(0);
  });
});
