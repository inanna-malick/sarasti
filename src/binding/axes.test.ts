import { describe, it, expect } from 'vitest';
import { EXPR_AXES, SHAPE_AXES, applyMapping, EXPR_AXIS_NAMES, SHAPE_AXIS_NAMES } from './axes';
import { N_SHAPE, N_EXPR } from '../constants';

describe('EXPR_AXES', () => {
  it('has 4 expression axes', () => {
    expect(EXPR_AXIS_NAMES).toEqual(['alarm', 'mood', 'fatigue', 'vigilance']);
  });

  it('all indices are within ψ0-ψ49', () => {
    for (const axis of EXPR_AXIS_NAMES) {
      for (const [idx] of EXPR_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });
});

describe('SHAPE_AXES', () => {
  it('has dominance and feastFamine axes', () => {
    expect(SHAPE_AXIS_NAMES).toEqual(['dominance', 'feastFamine']);
  });

  it('all indices are within β0-β49', () => {
    for (const axis of SHAPE_AXIS_NAMES) {
      for (const [idx] of SHAPE_AXES[axis]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(50);
      }
    }
  });

  it('zero β overlap between dominance and feastFamine', () => {
    const domIndices = new Set(SHAPE_AXES.dominance.map(([idx]) => idx as number));
    const statIndices = new Set(SHAPE_AXES.feastFamine.map(([idx]) => idx as number));
    for (const idx of domIndices) {
      expect(statIndices.has(idx), `β${idx} used by both axes`).toBe(false);
    }
  });
});

describe('applyMapping', () => {
  it('adds weighted values to target', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.alarm, 2.0);
    expect(target[2]).toBeCloseTo(4.0);  // ψ2: 2.0 × 2.0
    expect(target[7]).toBeCloseTo(-4.0); // ψ7: -2.0 × 2.0
    expect(target[0]).toBeCloseTo(2.0);  // ψ0: 1.0 × 2.0
  });

  it('stacks when called multiple times', () => {
    const target = new Float32Array(N_EXPR);
    applyMapping(target, EXPR_AXES.alarm, 1.0);
    applyMapping(target, EXPR_AXES.mood, 1.0);
    // ψ0: alarm 1.0 + mood 0.75 = 1.75
    expect(target[0]).toBeCloseTo(1.75);
  });

  it('handles negative values', () => {
    const target = new Float32Array(N_SHAPE);
    applyMapping(target, SHAPE_AXES.dominance, -2.0);
    expect(target[0]).toBeCloseTo(-5.0);  // β0: 2.5 × -2.0
  });
});
