import { describe, it, expect } from 'vitest';
import { resolveFromAxes } from '../resolve';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('resolveFromAxes (2-axis circumplex)', () => {
  it('empty values → near-zero output with identity noise', () => {
    const result = resolveFromAxes({}, 'test-id');
    expect(result.expression.length).toBe(N_EXPR);
    expect(result.shape.length).toBe(N_SHAPE);

    // Expression should be all zeros
    for (let i = 0; i < 10; i++) {
      expect(result.expression[i]).toBe(0);
    }

    // Shape has identity noise on β11-β19
    let noiseSum = 0;
    for (let i = 11; i < 20; i++) noiseSum += Math.abs(result.shape[i]);
    expect(noiseSum).toBeGreaterThan(0);
  });

  it('tension value drives ψ2 (brow up), ψ0 (jaw), ψ8 (nose wrinkle)', () => {
    const tense = resolveFromAxes({ tension: 2.0 }, 'a');
    // tension: [[2, 2.5], [0, 1.0], [8, 1.5], [7, -1.5], [5, 0.8], [4, -0.5]]
    expect(tense.expression[2]).toBeCloseTo(5.0);   // ψ2 × 2.5 × 2.0
    expect(tense.expression[0]).toBeCloseTo(2.0);   // ψ0 × 1.0 × 2.0
    expect(tense.expression[8]).toBeCloseTo(3.0);   // ψ8 × 1.5 × 2.0
    expect(tense.expression[7]).toBeCloseTo(-3.0);  // ψ7 × -1.5 × 2.0
    expect(tense.expression[5]).toBeCloseTo(1.6);   // ψ5 × 0.8 × 2.0
    expect(tense.expression[4]).toBeCloseTo(-1.0);  // ψ4 × -0.5 × 2.0
  });

  it('mood value drives ψ9 (cheek lift), ψ4 neg (corners wide), ψ5 light', () => {
    const happy = resolveFromAxes({ mood: 2.0 }, 'a');
    const sad = resolveFromAxes({ mood: -2.0 }, 'a');
    // mood: [[9, 2.5], [4, -2.0], [7, 1.5], [5, 0.5], [0, 0.3], [8, 0.5]]
    expect(happy.expression[9]).toBeCloseTo(5.0);   // ψ9 × 2.5 × 2.0 (cheek lift — primary)
    expect(happy.expression[4]).toBeCloseTo(-4.0);  // ψ4 × -2.0 × 2.0 (corners wide)
    expect(happy.expression[5]).toBeCloseTo(1.0);   // ψ5 × 0.5 × 2.0 (light upper lip)
    expect(happy.expression[0]).toBeCloseTo(0.6);   // ψ0 × 0.3 × 2.0 (minimal jaw)
    expect(sad.expression[9]).toBeCloseTo(-5.0);
    expect(sad.expression[0]).toBeCloseTo(-0.6);
  });

  it('dominance drives β3 (jaw width) + new β13, β48', () => {
    const chad = resolveFromAxes({ dominance: 2.0 }, 'a');
    const soyboi = resolveFromAxes({ dominance: -2.0 }, 'a');
    expect(chad.shape[3]).toBeGreaterThan(0);
    expect(soyboi.shape[3]).toBeLessThan(0);
    expect(chad.shape[13]).toBeGreaterThan(0);  // new mid-freq
    expect(chad.shape[48]).toBeGreaterThan(0);  // new high-freq
  });

  it('stature drives β1 (face length) + new β15, β49', () => {
    const heavy = resolveFromAxes({ stature: 2.0 }, 'a');
    const gaunt = resolveFromAxes({ stature: -2.0 }, 'a');
    expect(heavy.shape[1]).toBeGreaterThan(0);
    expect(gaunt.shape[1]).toBeLessThan(0);
    expect(heavy.shape[15]).toBeGreaterThan(0);  // new mid-freq
    expect(heavy.shape[49]).toBeGreaterThan(0);  // new high-freq
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

  it('flush and fatigue pass through', () => {
    const result = resolveFromAxes({ flush: 0.7, fatigue: -0.3 }, 'a');
    expect(result.flush).toBeCloseTo(0.7);
    expect(result.fatigue).toBeCloseTo(-0.3);
  });

  it('different datumIds get different identity noise', () => {
    const a = resolveFromAxes({}, 'ticker-A');
    const b = resolveFromAxes({}, 'ticker-B');
    let diff = 0;
    for (let i = 11; i < 20; i++) diff += Math.abs(a.shape[i] - b.shape[i]);
    expect(diff).toBeGreaterThan(0.01);
  });

  it('multiple axes combine additively on shared components', () => {
    // tension uses ψ0 (weight 1.0), mood also uses ψ0 (weight 1.0)
    const combined = resolveFromAxes({ tension: 1.0, mood: 1.0 }, 'a');
    const tensionOnly = resolveFromAxes({ tension: 1.0 }, 'a');
    const moodOnly = resolveFromAxes({ mood: 1.0 }, 'a');
    // ψ0 should be sum of both contributions
    expect(combined.expression[0]).toBeCloseTo(tensionOnly.expression[0] + moodOnly.expression[0]);
  });
});
