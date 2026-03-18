import { describe, it, expect, beforeEach } from 'vitest';
import { createPoseResolver, DEFAULT_POSE_CONFIG } from '../pose';
import { TickerFrame } from '../../types';

describe('PoseResolver', () => {
  let resolver = createPoseResolver();

  beforeEach(() => {
    resolver = createPoseResolver();
  });

  const neutralFrame: TickerFrame = {
    close: 100,
    volume: 1000,
    deviation: 0,
    velocity: 0,
    volatility: 1.0,
    drawdown: 0,
    momentum: 0,
    mean_reversion_z: 0,
    beta: 1,
  };

  it('zero deviation + neutral volatility -> near-zero pose', () => {
    const pose = resolver.resolve('T1', neutralFrame);
    expect(pose.neck).toEqual([0, 0, 0]);
    expect(pose.jaw).toBe(0);
  });

  it('negative deviation -> negative pitch (head down)', () => {
    const frame: TickerFrame = { ...neutralFrame, deviation: -0.1 };
    const pose = resolver.resolve('T1', frame);
    expect(pose.neck[0]).toBeLessThan(0);
    expect(pose.neck[1]).toBe(0); // yaw disabled
    expect(pose.neck[2]).toBe(0); // roll disabled
  });

  it('positive deviation -> positive pitch (head up)', () => {
    const frame: TickerFrame = { ...neutralFrame, deviation: 0.1 };
    const pose = resolver.resolve('T1', frame);
    expect(pose.neck[0]).toBeGreaterThan(0);
  });

  it('high volatility -> jaw opens', () => {
    const frame: TickerFrame = { ...neutralFrame, volatility: 2.0 };
    const pose = resolver.resolve('T1', frame);
    expect(pose.jaw).toBeGreaterThan(0);
    expect(pose.jaw).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxJaw);
  });

  it('jaw boundary: remains closed at volatility ≤ 1.0, opens above', () => {
    resolver.reset();

    // jaw = clamp((vol - 1.0) * 0.15, 0, maxJaw)
    // At vol=1.0, jaw = 0
    const poseClosed = resolver.resolve('T1', { ...neutralFrame, volatility: 1.0 });
    expect(poseClosed.jaw).toBe(0);

    // At vol > 1.0, jaw > 0
    resolver.reset();
    const poseOpen = resolver.resolve('T1', { ...neutralFrame, volatility: 1.5 });
    expect(poseOpen.jaw).toBeGreaterThan(0);
  });

  it('jaw closes faster than it opens when rested', () => {
    resolver.reset();
    
    // Open the jaw over a couple of frames
    resolver.resolve('T1', { ...neutralFrame, volatility: 3.0 });
    const openedPose = resolver.resolve('T1', { ...neutralFrame, volatility: 3.0 });
    const jawOpen = openedPose.jaw;
    
    // Now close it by dropping volatility below threshold
    const closingPose = resolver.resolve('T1', { ...neutralFrame, volatility: 1.0 });
    
    // With smoothing alpha of 0.5 when target is 0, jaw should be exactly half of previous state
    expect(closingPose.jaw).toBeCloseTo(jawOpen * 0.5, 5);
  });

  it('clamping: extreme values do not exceed max ranges', () => {
    const frame: TickerFrame = {
      ...neutralFrame,
      deviation: 10,
      velocity: 10,
      volatility: 10,
    };
    
    // Enable all features for test
    const customResolver = createPoseResolver({ enableYaw: true, enableRoll: true });
    const pose = customResolver.resolve('T1', frame);
    
    expect(Math.abs(pose.neck[0])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxPitch + 1e-6);
    expect(Math.abs(pose.neck[1])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxYaw + 1e-6);
    expect(Math.abs(pose.neck[2])).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxRoll + 1e-6);
    expect(pose.jaw).toBeLessThanOrEqual(DEFAULT_POSE_CONFIG.maxJaw + 1e-6);
  });

  it('smoothing: rapid changes are dampened', () => {
    const firstPose = resolver.resolve('T1', neutralFrame);
    expect(firstPose.neck[0]).toBe(0);

    const targetDeviation = 1.0;
    const secondPose = resolver.resolve('T1', { ...neutralFrame, deviation: targetDeviation });
    
    // targetPitch = clamp(1.0 * 1.5, -maxPitch, maxPitch) = maxPitch
    // smoothed = 0.08 * maxPitch + 0.92 * 0 = 0.08 * maxPitch
    const expectedSmoothed = 0.08 * DEFAULT_POSE_CONFIG.maxPitch;
    expect(secondPose.neck[0]).toBeCloseTo(expectedSmoothed, 3);
  });

  it('yaw disabled by default', () => {
    const frame: TickerFrame = { ...neutralFrame, velocity: 1.0 };
    const pose = resolver.resolve('T1', frame);
    expect(pose.neck[1]).toBe(0);
  });

  it('yaw enabled -> velocity maps to yaw', () => {
    const customResolver = createPoseResolver({ enableYaw: true });
    const frame: TickerFrame = { ...neutralFrame, velocity: 1.0 };
    const pose = customResolver.resolve('T1', frame);
    expect(pose.neck[1]).toBeGreaterThan(0);
  });

  it('roll disabled by default', () => {
    const frame: TickerFrame = { ...neutralFrame, volatility: 2.0 };
    const pose = resolver.resolve('T1', frame);
    expect(pose.neck[2]).toBe(0);
  });

  it('roll enabled -> volatility maps to roll', () => {
    const customResolver = createPoseResolver({ enableRoll: true });
    const frame: TickerFrame = { ...neutralFrame, volatility: 2.0 };
    const pose = customResolver.resolve('T1', frame);
    expect(pose.neck[2]).toBeGreaterThan(0);
  });

  it('different tickers maintain independent smoothing state', () => {
    resolver.resolve('T1', { ...neutralFrame, deviation: 1.0 }); // T1 starts moving
    const poseT2 = resolver.resolve('T2', neutralFrame); // T2 starts at zero
    
    expect(poseT2.neck[0]).toBe(0);
  });

  it('reset() clears all state', () => {
    resolver.resolve('T1', { ...neutralFrame, deviation: 1.0 });
    resolver.reset();
    
    const poseT1 = resolver.resolve('T1', neutralFrame);
    expect(poseT1.neck[0]).toBe(0);
  });
});
