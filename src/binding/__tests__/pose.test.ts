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
    
    // targetPitch = clamp(1.0 * 1.5, -0.25, 0.25) = 0.25
    // smoothed = 0.08 * 0.25 + 0.92 * 0 = 0.02
    expect(secondPose.neck[0]).toBeCloseTo(0.02, 3);
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
