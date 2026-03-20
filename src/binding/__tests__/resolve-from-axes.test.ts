import { describe, it, expect } from 'vitest';
import { resolveFromAxes } from '../resolve';
import { N_SHAPE, N_EXPR } from '../../constants';

describe('resolveFromAxes (circumplex)', () => {
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

  it('tension value drives upper face ψ components', () => {
    const tense = resolveFromAxes({ tension: 1.0 }, 'a');
    // tension: [[9, 2.5], [21, 2.5], [4, -2.5], ...]
    expect(tense.expression[9]).toBeCloseTo(2.5);    // ψ9 × 2.5 × 1.0
    expect(tense.expression[21]).toBeCloseTo(2.5);   // ψ21 × 2.5 × 1.0
    expect(tense.expression[4]).toBeCloseTo(-2.5);   // ψ4 × -2.5 × 1.0
  });

  it('valence value drives lower face ψ components', () => {
    const good = resolveFromAxes({ valence: 1.0 }, 'a');
    // valence: [[0, 2.0], [7, 2.5], [2, 0.5], ...]
    expect(good.expression[0]).toBeCloseTo(2.0);   // ψ0 × 2.0 × 1.0
    expect(good.expression[7]).toBeCloseTo(2.5);   // ψ7 × 2.5 × 1.0
    expect(good.expression[2]).toBeCloseTo(0.5);   // ψ2 × 0.5 × 1.0
  });

  it('stature drives shape β components', () => {
    const titan = resolveFromAxes({ stature: 1.0 }, 'a');
    const sprite = resolveFromAxes({ stature: -1.0 }, 'a');
    expect(titan.shape[0]).toBeGreaterThan(0);   // β0: neck thickness
    expect(sprite.shape[0]).toBeLessThan(0);
    expect(titan.shape[3]).toBeGreaterThan(0);   // β3: jaw width
    expect(titan.shape[7]).toBeGreaterThan(0);   // β7: mid-face width
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

  it('tension and valence have zero ψ overlap', () => {
    const tensionOnly = resolveFromAxes({ tension: 1.0 }, 'a');
    const valenceOnly = resolveFromAxes({ valence: 1.0 }, 'a');

    // Verify no ψ component is non-zero in both
    for (let i = 0; i < N_EXPR; i++) {
      if (tensionOnly.expression[i] !== 0 && valenceOnly.expression[i] !== 0) {
        throw new Error(`ψ${i} is driven by both tension and valence — zero overlap violated`);
      }
    }
  });
});
