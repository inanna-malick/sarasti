import { describe, it, expect } from 'vitest';
import { resolveFromAxes } from '../resolve';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('resolveFromAxes', () => {
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

  it('joy value drives ψ0 (jaw drop)', () => {
    const joyful = resolveFromAxes({ joy: 2.0 }, 'a');
    const grieving = resolveFromAxes({ joy: -2.0 }, 'a');
    expect(joyful.expression[0]).toBeGreaterThan(0);
    expect(grieving.expression[0]).toBeLessThan(0);
  });

  it('stature drives β0 (global width)', () => {
    const heavy = resolveFromAxes({ stature: 2.0 }, 'a');
    const gaunt = resolveFromAxes({ stature: -2.0 }, 'a');
    expect(heavy.shape[0]).toBeGreaterThan(0);
    expect(gaunt.shape[0]).toBeLessThan(0);
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
    // joy uses ψ0 (weight 2.0), surprise also uses ψ0 (weight 1.5)
    const combined = resolveFromAxes({ joy: 1.0, surprise: 1.0 }, 'a');
    const joyOnly = resolveFromAxes({ joy: 1.0 }, 'a');
    const surpriseOnly = resolveFromAxes({ surprise: 1.0 }, 'a');
    // ψ0 should be sum of both contributions
    expect(combined.expression[0]).toBeCloseTo(joyOnly.expression[0] + surpriseOnly.expression[0]);
  });
});
