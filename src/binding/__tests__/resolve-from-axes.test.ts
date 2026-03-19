import { describe, it, expect } from 'vitest';
import { resolveFromAxes } from '../resolve';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('resolveFromAxes (4-axis expression + 2 shape)', () => {
  it('empty values → near-zero output with identity noise', () => {
    const result = resolveFromAxes({}, 'test-id');
    expect(result.expression.length).toBe(N_EXPR);
    expect(result.shape.length).toBe(N_SHAPE);

    // Expression should be all zeros
    for (let i = 0; i < 10; i++) {
      expect(result.expression[i]).toBe(0);
    }

    // Shape has identity noise on β33-β41
    let noiseSum = 0;
    for (let i = 33; i < 42; i++) noiseSum += Math.abs(result.shape[i]);
    expect(noiseSum).toBeGreaterThan(0);
  });

  it('alarm value drives ψ8 (shocked), ψ6 (surprise), ψ2 (open mouth)', () => {
    const alarmed = resolveFromAxes({ alarm: 2.0 }, 'a');
    // alarm: [[8, 2.0], [6, -1.5], [2, 1.0]]
    expect(alarmed.expression[8]).toBeCloseTo(4.0);   // ψ8 × 2.0 × 2.0
    expect(alarmed.expression[6]).toBeCloseTo(-3.0);  // ψ6 × -1.5 × 2.0
    expect(alarmed.expression[2]).toBeCloseTo(2.0);   // ψ2 × 1.0 × 2.0
  });

  it('fatigue value drives ψ3 (curiosity), ψ4 (engagement), ψ5 (tightness), ψ8 (alert)', () => {
    const wired = resolveFromAxes({ fatigue: 2.0 }, 'a');
    // fatigue: [[3, 1.5], [4, 1.2], [5, 1.2], [8, 0.6]]
    expect(wired.expression[3]).toBeCloseTo(3.0);   // ψ3 × 1.5 × 2.0
    expect(wired.expression[4]).toBeCloseTo(2.4);   // ψ4 × 1.2 × 2.0
    expect(wired.expression[5]).toBeCloseTo(2.4);   // ψ5 × 1.2 × 2.0
    expect(wired.expression[8]).toBeCloseTo(1.2);   // ψ8 × 0.6 × 2.0
  });

  it('dominance drives mass + jaw + bone detail', () => {
    const chad = resolveFromAxes({ dominance: 2.0 }, 'a');
    const soyboi = resolveFromAxes({ dominance: -2.0 }, 'a');
    expect(chad.shape[0]).toBeGreaterThan(0);   // β0: thick
    expect(soyboi.shape[0]).toBeLessThan(0);
    expect(chad.shape[3]).toBeGreaterThan(0);   // β3: jaw width
    expect(chad.shape[16]).toBeGreaterThan(0);  // β16: defined jaw
    expect(chad.shape[19]).toBeLessThan(0);     // β19: jutting chin (inverted)
    expect(chad.shape[18]).toBeGreaterThan(0);  // β18: bone structure
  });


  it('pose values map to neck and jaw', () => {
    const result = resolveFromAxes({ pitch: 0.3, yaw: -0.2, roll: 0.1, jaw: 0.4 }, 'a');
    expect(result.pose.neck[0]).toBeCloseTo(0.3);
    expect(result.pose.neck[1]).toBeCloseTo(-0.2);
    expect(result.pose.neck[2]).toBeCloseTo(0.1);
    expect(result.pose.jaw).toBeCloseTo(0.4);
  });

  it('gaze values map to both eyes (conjugate)', () => {
    const result = resolveFromAxes({ gazeH: 0.2, gazeV: -0.1 }, 'a');
    expect(result.pose.leftEye[0]).toBeCloseTo(0.2);
    expect(result.pose.rightEye[0]).toBeCloseTo(0.2);
    expect(result.pose.leftEye[1]).toBeCloseTo(-0.1);
  });

  it('flush passes through', () => {
    const result = resolveFromAxes({ flush: 0.7 }, 'a');
    expect(result.flush).toBeCloseTo(0.7);
  });

  it('different datumIds get different identity noise', () => {
    const a = resolveFromAxes({}, 'ticker-A');
    const b = resolveFromAxes({}, 'ticker-B');
    let diff = 0;
    for (let i = 33; i < 42; i++) diff += Math.abs(a.shape[i] - b.shape[i]);
    expect(diff).toBeGreaterThan(0.01);
  });

  it('multiple axes combine additively on shared components', () => {
    // alarm uses ψ2 (weight 1.0), fatigue doesn't use ψ2 — but both use ψ8
    // alarm ψ8 weight 2.0, fatigue ψ8 weight 0.6
    const combined = resolveFromAxes({ alarm: 1.0, fatigue: 1.0 }, 'a');
    const alarmOnly = resolveFromAxes({ alarm: 1.0 }, 'a');
    const fatigueOnly = resolveFromAxes({ fatigue: 1.0 }, 'a');
    // ψ8 should be sum of both contributions
    expect(combined.expression[8]).toBeCloseTo(alarmOnly.expression[8] + fatigueOnly.expression[8]);
  });
});
