import { describe, it, expect } from 'vitest';
import { resolveFromAxes } from '../resolve';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('resolveFromAxes (chord axes)', () => {
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

  it('alarm value drives ψ0 (jaw seasoning) and ψ2 (brow up)', () => {
    const alarmed = resolveFromAxes({ alarm: 2.0 }, 'a');
    // alarm: [[0, 1.0], [2, 2.0], [8, 1.5]]
    expect(alarmed.expression[0]).toBeCloseTo(2.0);  // ψ0 × 1.0 × 2.0
    expect(alarmed.expression[2]).toBeCloseTo(4.0);  // ψ2 × 2.0 × 2.0
    expect(alarmed.expression[8]).toBeCloseTo(3.0);  // ψ8 × 1.5 × 2.0
  });

  it('valence value drives ψ9 (cheek puff) and ψ0 (jaw open)', () => {
    const happy = resolveFromAxes({ valence: 2.0 }, 'a');
    const sad = resolveFromAxes({ valence: -2.0 }, 'a');
    // valence: [[0, 1.5], [9, 3.0], [7, 1.5], [8, 0.5]]
    expect(happy.expression[9]).toBeCloseTo(6.0);   // ψ9 × 3.0 × 2.0
    expect(happy.expression[0]).toBeCloseTo(3.0);   // ψ0 × 1.5 × 2.0
    expect(sad.expression[9]).toBeCloseTo(-6.0);
    expect(sad.expression[0]).toBeCloseTo(-3.0);
  });

  it('dominance drives β3 (jaw width)', () => {
    const chad = resolveFromAxes({ dominance: 2.0 }, 'a');
    const soyboi = resolveFromAxes({ dominance: -2.0 }, 'a');
    expect(chad.shape[3]).toBeGreaterThan(0);
    expect(soyboi.shape[3]).toBeLessThan(0);
  });

  it('stature drives β1 (face length)', () => {
    const heavy = resolveFromAxes({ stature: 2.0 }, 'a');
    const gaunt = resolveFromAxes({ stature: -2.0 }, 'a');
    expect(heavy.shape[1]).toBeGreaterThan(0);
    expect(gaunt.shape[1]).toBeLessThan(0);
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
    // alarm uses ψ2 (weight 2.0), arousal also uses ψ2 (weight 3.0)
    const combined = resolveFromAxes({ alarm: 1.0, arousal: 1.0 }, 'a');
    const alarmOnly = resolveFromAxes({ alarm: 1.0 }, 'a');
    const arousalOnly = resolveFromAxes({ arousal: 1.0 }, 'a');
    // ψ2 should be sum of both contributions
    expect(combined.expression[2]).toBeCloseTo(alarmOnly.expression[2] + arousalOnly.expression[2]);
  });
});
