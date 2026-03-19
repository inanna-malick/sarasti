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

  it('alarm value drives ψ2 (brow up), ψ0 (jaw), ψ8 (nose wrinkle)', () => {
    const alarmed = resolveFromAxes({ alarm: 2.0 }, 'a');
    // alarm: [[2, 2.0], [7, -2.0], [0, 1.0], [8, 1.0]]
    expect(alarmed.expression[2]).toBeCloseTo(4.0);   // ψ2 × 2.0 × 2.0
    expect(alarmed.expression[0]).toBeCloseTo(2.0);   // ψ0 × 1.0 × 2.0
    expect(alarmed.expression[8]).toBeCloseTo(2.0);   // ψ8 × 1.0 × 2.0
    expect(alarmed.expression[7]).toBeCloseTo(-4.0);  // ψ7 × -2.0 × 2.0
  });

  it('fatigue value drives ψ5 (tight lip), ψ3 (furrow)', () => {
    const wired = resolveFromAxes({ fatigue: 2.0 }, 'a');
    // fatigue: [[5, 1.5], [3, 1.0], [4, -0.8]]
    expect(wired.expression[5]).toBeCloseTo(3.0);   // ψ5 × 1.5 × 2.0
    expect(wired.expression[3]).toBeCloseTo(2.0);   // ψ3 × 1.0 × 2.0
    expect(wired.expression[4]).toBeCloseTo(-1.6);  // ψ4 × -0.8 × 2.0
  });

  it('vigilance value drives ψ3 (furrow), ψ8 (nose wrinkle)', () => {
    const suspicious = resolveFromAxes({ vigilance: 2.0 }, 'a');
    // vigilance: [[3, 0.8], [7, -0.5], [8, 0.6]]
    expect(suspicious.expression[3]).toBeCloseTo(1.6);   // ψ3 × 0.8 × 2.0
    expect(suspicious.expression[7]).toBeCloseTo(-1.0);  // ψ7 × -0.5 × 2.0
    expect(suspicious.expression[8]).toBeCloseTo(1.2);   // ψ8 × 0.6 × 2.0
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

  it('feastFamine drives body mass components', () => {
    const heavy = resolveFromAxes({ feastFamine: 2.0 }, 'a');
    const gaunt = resolveFromAxes({ feastFamine: -2.0 }, 'a');
    expect(heavy.shape[1]).toBeGreaterThan(0);   // β1: tall
    expect(gaunt.shape[1]).toBeLessThan(0);
    expect(heavy.shape[6]).toBeGreaterThan(0);   // β6: thicc
    expect(heavy.shape[5]).toBeGreaterThan(0);   // β5: portly
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
    // alarm uses ψ0 (weight 1.0), mood also uses ψ0 (weight 0.75)
    const combined = resolveFromAxes({ alarm: 1.0, mood: 1.0 }, 'a');
    const alarmOnly = resolveFromAxes({ alarm: 1.0 }, 'a');
    const moodOnly = resolveFromAxes({ mood: 1.0 }, 'a');
    // ψ0 should be sum of both contributions
    expect(combined.expression[0]).toBeCloseTo(alarmOnly.expression[0] + moodOnly.expression[0]);
  });
});
