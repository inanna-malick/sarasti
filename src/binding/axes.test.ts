import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('has 2 expression axes (tension, valence)', () => {
    expect(EXPR_AXIS_NAMES).toEqual(['tension', 'valence']);
  });

  it('all indices are within ψ0-ψ49', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });

  it('tension and valence have zero ψ overlap', () => {
    const tensionIndices = new Set(EXPR_AXES.tension.map(([idx]) => idx as number));
    const valenceIndices = new Set(EXPR_AXES.valence.map(([idx]) => idx as number));
    for (const idx of tensionIndices) {
      expect(valenceIndices.has(idx)).toBe(false);
    }
  });
});

describe('SHAPE_AXES', () => {
  it('has stature axis', () => {
    expect(SHAPE_AXIS_NAMES).toEqual(['stature']);
  });

  it('all indices are within β0-β49', () => {
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });
});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    expect(target[9]).toBeCloseTo(2.5);    // ψ9: 2.5 × 1.0
    expect(target[21]).toBeCloseTo(2.5);   // ψ21: 2.5 × 1.0
    expect(target[4]).toBeCloseTo(-2.5);   // ψ4: -2.5 × 1.0
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    applyMapping(target, EXPR_AXES.tension, 1.0);
    expect(target[9]).toBeCloseTo(5.0);  // ψ9: 2.5 + 2.5
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.stature, -1.0);
    expect(target[3]).toBeCloseTo(-2.0);  // β3: 2.0 × -1.0
  });
});
